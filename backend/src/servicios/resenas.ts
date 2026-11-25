// Reseñas y estados (RF-12 a RF-15, RF-18; D-54 a D-57).
import { randomUUID } from 'node:crypto';
import type {
  EstadoLectura,
  EstadosConsulta,
  ResenaEntrada,
  ResenasConsulta,
  RespuestaEstado,
  RespuestaEstados,
  RespuestaPublicacion,
  RespuestaResenaOculta,
  RespuestaResenas,
} from '@dlbp/shared';
import { ErrorApi } from '../errores.ts';
import { leerCursor, paginar } from '../paginacion.ts';
import * as documental from '../repositorios/documental/obras.ts';
import * as cuentas from '../repositorios/relacional/cuentas.ts';
import * as relacional from '../repositorios/relacional/resenas.ts';
import * as social from '../repositorios/relacional/social.ts';
import type { SesionActual } from './cuentas.ts';
import { avisarCambios } from './sincronizacion.ts';

const noExisteLaObra = () => new ErrorApi('no_encontrado', 'La obra no existe');

/** Una obra en borrador no se reseña ni se marca, tampoco por el administrador (D-56). */
async function exigirPublicada(obraId: string) {
  if (!(await documental.estaPublicada(obraId))) throw noExisteLaObra();
}

export async function publicar(
  sesion: SesionActual,
  obraId: string,
  entrada: ResenaEntrada,
): Promise<RespuestaPublicacion & { creada: boolean }> {
  await exigirPublicada(obraId);
  const publicada = await relacional.publicarOEditar({
    usuarioId: sesion.usuarioId,
    obraId,
    resenaIdNueva: randomUUID(),
    ...entrada,
  });
  avisarCambios();
  return publicada;
}

/** Ocultar o volver a mostrar (RF-18). La ruta ya comprobó que es el administrador. */
export async function moderar(resenaId: string, oculta: boolean): Promise<RespuestaResenaOculta> {
  const resumen = await relacional.ocultar(resenaId, oculta);
  if (!resumen) throw new ErrorApi('no_encontrado', 'La reseña no existe');
  return { resena_id: resenaId, oculta, ...resumen };
}

/** El autor borra la suya; el administrador, cualquiera (RN-09, RN-10). */
export async function eliminar(sesion: SesionActual, resenaId: string): Promise<void> {
  const autor = sesion.rol === 'admin' ? null : sesion.usuarioId;
  if (!(await relacional.eliminar(resenaId, autor))) throw new ErrorApi('no_encontrado', 'La reseña no existe');
}

export async function marcarEstado(
  sesion: SesionActual,
  obraId: string,
  estado: EstadoLectura,
): Promise<RespuestaEstado> {
  await exigirPublicada(obraId);
  const cuando = await relacional.marcarEstado(sesion.usuarioId, obraId, estado);
  avisarCambios();
  return { obra_id: obraId, estado, actualizado_en: cuando.toISOString() };
}

/** El historial de otro usuario solo lo ven sus seguidores y el administrador (D-54). */
export async function exigirAccesoAlHistorial(usuarioId: string, sesion?: SesionActual) {
  if (!sesion) throw new ErrorApi('sin_sesion', 'Inicia sesión para continuar');
  if (!(await cuentas.buscarPerfil(usuarioId))) throw new ErrorApi('no_encontrado', 'El usuario no existe');
  if (sesion.rol === 'admin' || sesion.usuarioId === usuarioId) return;
  if (!(await social.sigue(sesion.usuarioId, usuarioId))) {
    throw new ErrorApi('sin_permiso', 'Sigue a esta persona para ver sus reseñas');
  }
}

export async function listar(consulta: ResenasConsulta, sesion?: SesionActual): Promise<RespuestaResenas> {
  const admin = sesion?.rol === 'admin';
  const desde = leerCursor(consulta.cursor);
  let filtro: { obraId: string } | { usuarioId: string };
  if (consulta.obra_id !== undefined) {
    const [obra] = await documental.obrasBreves([consulta.obra_id], admin);
    if (!obra) throw noExisteLaObra();
    filtro = { obraId: consulta.obra_id };
  } else {
    await exigirAccesoAlHistorial(consulta.usuario_id!, sesion);
    filtro = { usuarioId: consulta.usuario_id! };
  }

  // El administrador ve también las ocultas (D-55).
  const filas = await relacional.listar(filtro, admin, consulta.limite + 1, desde);
  const { pagina, siguiente } = paginar(filas, consulta.limite, (f) => ({ fecha: f.marca, id: f.resena_id }));
  const obras = new Map(
    (await documental.obrasBreves([...new Set(pagina.map((f) => f.obra_id))], admin)).map((o) => [o.obra_id, o]),
  );

  return {
    resenas: pagina.flatMap((f) => {
      const obra = obras.get(f.obra_id);
      if (!obra) return [];
      return {
        resena_id: f.resena_id,
        calificacion: f.calificacion,
        texto: f.texto,
        oculta: f.oculta,
        creado_en: f.creado_en.toISOString(),
        actualizado_en: f.actualizado_en.toISOString(),
        autor: { usuario_id: f.usuario_id, nombre: f.nombre },
        obra,
      };
    }),
    siguiente,
  };
}

export async function misEstados(sesion: SesionActual, consulta: EstadosConsulta): Promise<RespuestaEstados> {
  const filas = await relacional.listarEstados(
    sesion.usuarioId,
    consulta.estado,
    consulta.limite + 1,
    leerCursor(consulta.cursor),
  );
  const { pagina, siguiente } = paginar(filas, consulta.limite, (f) => ({ fecha: f.marca, id: f.obra_id }));
  const obras = new Map(
    (await documental.obrasBreves(pagina.map((f) => f.obra_id), sesion.rol === 'admin')).map((o) => [o.obra_id, o]),
  );
  return {
    estados: pagina.flatMap((f) => {
      const obra = obras.get(f.obra_id);
      return obra ? { obra, estado: f.estado, actualizado_en: f.actualizado_en.toISOString() } : [];
    }),
    siguiente,
  };
}
