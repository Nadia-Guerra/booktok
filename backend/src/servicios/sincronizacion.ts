// Sincronización: el worker que lleva los eventos de `sync_outbox` a las otras bases (O19; documento
// 04, secciones 4 y 9; D-04, D-29, D-34).
//
// Solo puede haber uno en marcha: aplica los eventos de uno en uno y en orden de `evento_id`. Por eso,
// cuando un evento falla no pasa al siguiente: lo reintenta hasta que sale o queda `fallido`.
import { EventEmitter } from 'node:events';
import { destinoNoDisponible } from '../errores.ts';
import * as comparativas from '../repositorios/documental/comparativas.ts';
import * as grafo from '../repositorios/grafo/sincronizacion.ts';
import * as bandeja from '../repositorios/relacional/bandeja.ts';
import type { Evento } from '../repositorios/relacional/bandeja.ts';
import * as obras from '../repositorios/relacional/obras.ts';
import * as social from '../repositorios/relacional/social.ts';

const LOTE = 50; // 9.2
const MAX_INTENTOS = 5;

const avisos = new EventEmitter();

/** Los servicios lo llaman después de confirmar una transacción que escribió un evento (D-34). */
export function avisarCambios(): void {
  avisos.emit('cambios');
}

function campo(evento: Evento, nombre: string): string {
  const valor = evento.payload[nombre];
  if (!valor) throw new Error(`Al evento le falta ${nombre}`);
  return valor;
}

/**
 * Aplica un evento a su base destino. Repetirlo no cambia nada.
 *
 * Si una relación no se pudo crear porque falta un nodo, solo es un error cuando PostgreSQL todavía
 * tiene el dato; si ya no está, un evento posterior lo deshace y no hay nada que corregir.
 */
export async function aplicarEvento(evento: Evento): Promise<void> {
  switch (evento.tipo) {
    case 'usuario_creado':
      return grafo.crearUsuario(campo(evento, 'usuario_id'));

    case 'usuario_eliminado': {
      const usuarioId = campo(evento, 'usuario_id');
      await comparativas.eliminarDeUsuario(usuarioId);
      return grafo.eliminarUsuario(usuarioId);
    }

    case 'seguimiento_creado': {
      const [seguidor, seguido] = [campo(evento, 'seguidor_id'), campo(evento, 'seguido_id')];
      if (!(await grafo.crearSeguimiento(seguidor, seguido)) && (await social.sigue(seguidor, seguido))) {
        throw new Error('Falta en el grafo el nodo de uno de los dos usuarios');
      }
      return;
    }

    case 'seguimiento_eliminado':
      return grafo.eliminarSeguimiento(campo(evento, 'seguidor_id'), campo(evento, 'seguido_id'));

    case 'obra_leida':
    case 'obra_no_leida': {
      const [usuarioId, obraId] = [campo(evento, 'usuario_id'), campo(evento, 'obra_id')];
      const tipo = await obras.tipoDe(obraId);
      if (!tipo) throw new Error('La obra del evento no existe');
      if (tipo === 'pelicula') return; // D-16: el grafo solo guarda libros leídos
      if (evento.tipo === 'obra_no_leida') return grafo.eliminarLectura(usuarioId, obraId);
      if (!(await grafo.crearLectura(usuarioId, obraId)) && (await obras.estadoDe(usuarioId, obraId)) === 'terminada') {
        throw new Error('Falta en el grafo el nodo del usuario o del libro');
      }
      return;
    }

    default:
      throw new Error(`Tipo de evento desconocido: ${String(evento.tipo)}`);
  }
}

const resumen = (e: unknown) => {
  const { name, code } = (e ?? {}) as { name?: string; code?: unknown };
  return `${name ?? 'error'} ${String(code ?? '')}`.trim();
};

export type ResultadoLote = 'vacio' | 'lleno' | 'reintentar';

export interface OpcionesLote {
  aplicar?: (evento: Evento) => Promise<void>;
  detener?: () => boolean;
  alAvanzar?: () => void;
}

/**
 * Aplica hasta un lote de pendientes. `lleno`: puede quedar más. `reintentar`: se paró en un evento
 * que hay que volver a intentar después de una pausa.
 */
export async function procesarLote(opciones: OpcionesLote = {}): Promise<ResultadoLote> {
  const { aplicar = aplicarEvento, detener = () => false, alAvanzar } = opciones;
  const eventos = await bandeja.pendientes(LOTE);

  for (const evento of eventos) {
    if (detener()) break; // apagado: no se toma otro (9.4)
    try {
      await aplicar(evento);
    } catch (e) {
      if (destinoNoDisponible(e)) {
        console.error(`Sincronización: una base no responde (${resumen(e)})`);
        return 'reintentar'; // sin sumar intentos (9.5)
      }
      const { message } = (e ?? {}) as { message?: string };
      const fallido = await bandeja.anotarFallo(evento.eventoId, `${resumen(e)}: ${message ?? ''}`, MAX_INTENTOS);
      console.error(
        `Sincronización: falló el evento ${evento.eventoId} (${evento.tipo}, ${resumen(e)})` +
          (fallido ? '; queda como fallido' : ''),
      );
      if (!fallido) return 'reintentar';
      continue;
    }
    await bandeja.marcarProcesado(evento.eventoId);
    alAvanzar?.();
  }

  return eventos.length === LOTE ? 'lleno' : 'vacio';
}

export interface OpcionesWorker {
  aplicar?: (evento: Evento) => Promise<void>;
  intervaloMs?: number;
  pausaInicialMs?: number;
  pausaMaximaMs?: number;
}

export function crearWorker(opciones: OpcionesWorker = {}) {
  const { aplicar, intervaloMs = 30_000, pausaInicialMs = 2000, pausaMaximaMs = 30_000 } = opciones;

  let activo = false;
  let enPausa = false;
  let otraVuelta = false;
  let tropiezos = 0;
  let enCurso: Promise<void> | undefined;
  let reloj: NodeJS.Timeout | undefined;

  function programar(ms: number) {
    clearTimeout(reloj);
    reloj = setTimeout(() => {
      enPausa = false;
      despertar();
    }, ms);
  }

  // Nunca dos ciclos a la vez: un aviso durante un ciclo pide otra vuelta. Durante una pausa se
  // ignora, para no insistir contra una base caída.
  function despertar() {
    if (!activo || enPausa) return;
    if (enCurso) {
      otraVuelta = true;
      return;
    }
    clearTimeout(reloj);
    enCurso = vaciar().finally(() => {
      enCurso = undefined;
      if (otraVuelta) despertar(); // el aviso llegó justo cuando el ciclo terminaba
    });
  }

  async function vaciar() {
    let resultado: ResultadoLote;
    do {
      otraVuelta = false;
      try {
        resultado = await procesarLote({ aplicar, detener: () => !activo, alAvanzar: () => (tropiezos = 0) });
      } catch (e) {
        console.error(`Sincronización: no se pudo usar la bandeja (${resumen(e)})`);
        resultado = 'reintentar';
      }
    } while (activo && resultado !== 'reintentar' && (resultado === 'lleno' || otraVuelta));

    if (!activo) return;
    if (resultado === 'reintentar') {
      enPausa = true;
      otraVuelta = false;
      programar(Math.min(pausaMaximaMs, pausaInicialMs * 2 ** tropiezos++)); // 2, 4, 8... hasta 30 s
    } else {
      programar(intervaloMs); // sondeo de respaldo
    }
  }

  return {
    /** Empieza vaciando lo que quedó pendiente (9.3). */
    iniciar() {
      if (activo) return;
      activo = true;
      avisos.on('cambios', despertar);
      despertar();
    },
    /** Espera a que termine el evento en curso y no toma otro (9.4). */
    async detener() {
      activo = false;
      enPausa = false;
      clearTimeout(reloj);
      avisos.off('cambios', despertar);
      await enCurso;
    },
  };
}
