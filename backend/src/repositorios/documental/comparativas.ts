// Reseñas comparativas en MongoDB (AP-18 a AP-28). Cada escritura toca un solo documento.
// Los documentos no llevan campos nulos: el validador no los admite, así que lo vacío se omite.
import type { ComparativaCambios } from '@dlbp/shared';
import type { Filter } from 'mongodb';
import { mongoDb } from '../../bases/mongo.ts';
import type { Cursor } from '../../paginacion.ts';

export interface Documento extends ComparativaCambios {
  _id: string;
  usuario_id: string;
  libro_id: string;
  pelicula_id: string;
  oculta: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

const comparativas = mongoDb.collection<Documento>('resenas_comparativas');

const CLAVE_DUPLICADA = 11000;

/** AP-18. El índice IX-04 impide una segunda del mismo usuario sobre la misma pareja (RN-05). */
export async function crear(documento: Documento): Promise<'creada' | 'duplicada'> {
  try {
    await comparativas.insertOne(documento);
    return 'creada';
  } catch (e) {
    if ((e as { code?: unknown }).code === CLAVE_DUPLICADA) return 'duplicada';
    throw e;
  }
}

/** Quién mira: el administrador ve todas; los demás, las visibles y las suyas. */
export interface Mirada {
  usuarioId?: string | undefined;
  admin: boolean;
}

export interface Filtro {
  libro_id?: string | undefined;
  pelicula_id?: string | undefined;
  usuario_id?: string | undefined;
}

/** AP-19, AP-21 y AP-23, según el filtro: las recientes primero. */
export function listar(filtro: Filtro, mirada: Mirada, limite: number, desde?: Cursor): Promise<Documento[]> {
  const condiciones: Filter<Documento>[] = Object.entries(filtro)
    .filter(([, valor]) => valor !== undefined)
    .map(([campo, valor]) => ({ [campo]: valor }));

  if (!mirada.admin) {
    const propias = mirada.usuarioId ? [{ usuario_id: mirada.usuarioId }] : [];
    condiciones.push({ $or: [{ oculta: false }, ...propias] });
  }
  if (desde) {
    const fecha = new Date(desde.fecha);
    condiciones.push({ $or: [{ creado_en: { $lt: fecha } }, { creado_en: fecha, _id: { $lt: desde.id } }] });
  }

  return comparativas
    .find(condiciones.length ? { $and: condiciones } : {})
    .sort({ creado_en: -1, _id: -1 })
    .limit(limite)
    .toArray();
}

/** AP-24: solo la del propio autor (RN-10). Devuelve cómo quedó, o nulo si no es suya. */
export function editar(id: string, usuarioId: string, cambios: ComparativaCambios): Promise<Documento | null> {
  return comparativas.findOneAndUpdate(
    { _id: id, usuario_id: usuarioId },
    { $set: { veredicto: cambios.veredicto, aspectos: cambios.aspectos, actualizado_en: new Date() } },
    { returnDocument: 'after' },
  );
}

/** AP-25 (el autor) o AP-27 (con `autorId` nulo, el administrador). */
export async function eliminar(id: string, autorId: string | null): Promise<boolean> {
  const r = await comparativas.deleteOne(autorId === null ? { _id: id } : { _id: id, usuario_id: autorId });
  return r.deletedCount === 1;
}

/** AP-26: no cambia `actualizado_en`, que solo registra las ediciones del autor. */
export async function ocultar(id: string, oculta: boolean): Promise<boolean> {
  const r = await comparativas.updateOne({ _id: id }, { $set: { oculta } });
  return r.matchedCount === 1;
}

/** AP-28: borra las comparativas de un usuario. Repetirlo no falla. */
export async function eliminarDeUsuario(usuarioId: string): Promise<void> {
  await comparativas.deleteMany({ usuario_id: usuarioId });
}
