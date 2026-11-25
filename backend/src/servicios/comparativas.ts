// Reseñas comparativas (RF-16 a RF-18; RN-05, RN-06, RN-10).
import { randomUUID } from 'node:crypto';
import type {
  Comparativa,
  ComparativaCambios,
  ComparativaEntrada,
  ComparativasConsulta,
  RespuestaComparativaCreada,
  RespuestaComparativas,
} from '@dlbp/shared';
import { ErrorApi } from '../errores.ts';
import { leerCursor, paginar } from '../paginacion.ts';
import * as documental from '../repositorios/documental/comparativas.ts';
import * as obras from '../repositorios/documental/obras.ts';
import * as grafo from '../repositorios/grafo/obras.ts';
import * as cuentas from '../repositorios/relacional/cuentas.ts';
import type { SesionActual } from './cuentas.ts';
import { exigirAccesoAlHistorial } from './resenas.ts';

const noExiste = () => new ErrorApi('no_encontrado', 'La comparativa no existe');

/** Quita los campos sin valor: el driver los guardaría como nulos y el validador los rechaza. */
function limpiar(cambios: ComparativaCambios): ComparativaCambios {
  return JSON.parse(JSON.stringify({ veredicto: cambios.veredicto, aspectos: cambios.aspectos }));
}

/** Completa con el autor (relacional) y las obras (AP-04). Omite lo que no se puede mostrar. */
async function completar(documentos: documental.Documento[], sesion?: SesionActual): Promise<Comparativa[]> {
  const [nombres, breves] = await Promise.all([
    cuentas.nombresDe([...new Set(documentos.map((d) => d.usuario_id))]),
    obras.obrasBreves([...new Set(documentos.flatMap((d) => [d.libro_id, d.pelicula_id]))], sesion?.rol === 'admin'),
  ]);
  const porId = new Map(breves.map((o) => [o.obra_id, o]));

  return documentos.flatMap((d) => {
    const nombre = nombres.get(d.usuario_id); // sin él, la cuenta se eliminó y el worker aún no limpia
    const libro = porId.get(d.libro_id);
    const pelicula = porId.get(d.pelicula_id);
    if (nombre === undefined || !libro || !pelicula) return [];
    return {
      comparativa_id: d._id,
      libro,
      pelicula,
      autor: { usuario_id: d.usuario_id, nombre },
      veredicto: d.veredicto,
      aspectos: d.aspectos,
      oculta: d.oculta,
      creado_en: d.creado_en.toISOString(),
      actualizado_en: d.actualizado_en.toISOString(),
    };
  });
}

export async function listar(consulta: ComparativasConsulta, sesion?: SesionActual): Promise<RespuestaComparativas> {
  const { limite, cursor, ...filtro } = consulta;
  // Las de una adaptación son públicas; el historial de una persona, no (D-54).
  if (filtro.libro_id === undefined) await exigirAccesoAlHistorial(filtro.usuario_id!, sesion);

  const documentos = await documental.listar(
    filtro,
    { usuarioId: sesion?.usuarioId, admin: sesion?.rol === 'admin' },
    limite + 1,
    leerCursor(cursor),
  );
  const { pagina, siguiente } = paginar(documentos, limite, (d) => ({ fecha: d.creado_en.toISOString(), id: d._id }));
  return { comparativas: await completar(pagina, sesion), siguiente };
}

/** Comprueba las obras (AP-05) y la adaptación (CG-10) antes de guardar. Si el grafo no responde, no guarda. */
export async function crear(sesion: SesionActual, entrada: ComparativaEntrada): Promise<RespuestaComparativaCreada> {
  const [libro, pelicula] = await Promise.all([
    obras.libroPorId(entrada.libro_id),
    obras.peliculaPorId(entrada.pelicula_id),
  ]);
  // Una obra en borrador no se compara, tampoco por el administrador (D-56).
  if (libro?.estado_publicacion !== 'publicada') throw new ErrorApi('no_encontrado', 'El libro no existe');
  if (pelicula?.estado_publicacion !== 'publicada') throw new ErrorApi('no_encontrado', 'La película no existe');
  if (!(await grafo.estanUnidas(entrada.libro_id, entrada.pelicula_id))) {
    throw new ErrorApi('conflicto', 'Esa película no es una adaptación de ese libro'); // RN-06
  }

  const ahora = new Date();
  const comparativaId = randomUUID();
  const resultado = await documental.crear({
    _id: comparativaId,
    usuario_id: sesion.usuarioId,
    libro_id: entrada.libro_id,
    pelicula_id: entrada.pelicula_id,
    ...limpiar(entrada),
    oculta: false,
    creado_en: ahora,
    actualizado_en: ahora,
  });
  if (resultado === 'duplicada') throw new ErrorApi('conflicto', 'Ya comparaste este libro con esta película');
  return { comparativa_id: comparativaId };
}

export async function editar(sesion: SesionActual, id: string, cambios: ComparativaCambios): Promise<Comparativa> {
  const documento = await documental.editar(id, sesion.usuarioId, limpiar(cambios));
  const [resultado] = documento ? await completar([documento], sesion) : [];
  if (!resultado) throw noExiste();
  return resultado;
}

export async function moderar(id: string, oculta: boolean) {
  if (!(await documental.ocultar(id, oculta))) throw noExiste();
  return { comparativa_id: id, oculta };
}

/** El autor borra la suya; el administrador, cualquiera (RN-10, RF-18). */
export async function eliminar(sesion: SesionActual, id: string): Promise<void> {
  const autor = sesion.rol === 'admin' ? null : sesion.usuarioId;
  if (!(await documental.eliminar(id, autor))) throw noExiste();
}
