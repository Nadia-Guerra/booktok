// Escrituras del catálogo en MongoDB (AP-07 a AP-09, AP-11, AP-14 y AP-17).
// Sin transacciones: cada una toca un solo documento y se puede repetir.
import type { EstadoPublicacion, TipoObra } from '@dlbp/shared';
import { mongoDb } from '../../bases/mongo.ts';
import type { Libro, Pelicula } from './obras.ts';

type Fechas = { creado_en: Date; actualizado_en: Date };
const libros = mongoDb.collection<Libro & Fechas>('libros');
const peliculas = mongoDb.collection<Pelicula & Fechas>('peliculas');
const coleccion = (tipo: TipoObra) => (tipo === 'libro' ? libros : peliculas) as typeof libros;

const CLAVE_DUPLICADA = 11000;

/** AP-07. `isbn_repetido`: otro libro ya lo tiene (índice IX-03). */
export async function crearLibro(libro: Libro): Promise<'creado' | 'isbn_repetido'> {
  const ahora = new Date();
  try {
    await libros.insertOne({ ...libro, creado_en: ahora, actualizado_en: ahora });
    return 'creado';
  } catch (e) {
    if ((e as { code?: unknown }).code === CLAVE_DUPLICADA) return 'isbn_repetido';
    throw e;
  }
}

/** AP-08. */
export async function crearPelicula(pelicula: Pelicula): Promise<void> {
  const ahora = new Date();
  await peliculas.insertOne({ ...pelicula, creado_en: ahora, actualizado_en: ahora });
}

/** La ficha de una obra de cualquier tipo, con su estado (AP-05). */
export async function estadoDeObra(obraId: string): Promise<{ tipo: TipoObra; estado: EstadoPublicacion } | undefined> {
  for (const tipo of ['libro', 'pelicula'] as const) {
    const ficha = await coleccion(tipo).findOne({ _id: obraId }, { projection: { estado_publicacion: 1 } });
    if (ficha) return { tipo, estado: ficha.estado_publicacion };
  }
  return undefined;
}

/** AP-09: de borrador a publicada. Repetirlo no cambia nada. */
export async function publicar(tipo: TipoObra, obraId: string): Promise<void> {
  await coleccion(tipo).updateOne(
    { _id: obraId, estado_publicacion: 'borrador' },
    { $set: { estado_publicacion: 'publicada', actualizado_en: new Date() } },
  );
}

/** AP-17: reemplaza la copia del reparto. Un actor sin foto no lleva el campo (D-27). */
export async function copiarReparto(peliculaId: string, reparto: Pelicula['reparto']): Promise<void> {
  await peliculas.updateOne({ _id: peliculaId }, { $set: { reparto, actualizado_en: new Date() } });
}

export type ResultadoAgregado = 'agregado' | 'no_existe' | 'repetido' | 'lleno';

/** AP-11. El filtro rechaza un ISBN que el libro ya tiene; el índice IX-03, el de otro libro. */
export async function agregarEdicion(libroId: string, edicion: Libro['ediciones'][number]): Promise<ResultadoAgregado> {
  try {
    const r = await libros.updateOne(
      {
        _id: libroId,
        'ediciones.49': { $exists: false }, // máximo 50
        ...(edicion.isbn !== undefined && { 'ediciones.isbn': { $ne: edicion.isbn } }),
      },
      { $push: { ediciones: edicion }, $set: { actualizado_en: new Date() } },
    );
    if (r.matchedCount === 1) return 'agregado';
  } catch (e) {
    if ((e as { code?: unknown }).code === CLAVE_DUPLICADA) return 'repetido';
    throw e;
  }
  const ficha = await libros.findOne({ _id: libroId }, { projection: { ediciones: 1 } });
  if (!ficha) return 'no_existe';
  return ficha.ediciones.length >= 50 ? 'lleno' : 'repetido';
}

/** AP-14. El filtro rechaza un nombre que la película ya tiene (D-08). */
export async function agregarPlataforma(peliculaId: string, nombre: string): Promise<ResultadoAgregado> {
  const r = await peliculas.updateOne(
    { _id: peliculaId, 'plataformas.29': { $exists: false }, 'plataformas.nombre': { $ne: nombre } },
    { $push: { plataformas: { nombre } }, $set: { actualizado_en: new Date() } },
  );
  if (r.matchedCount === 1) return 'agregado';
  const ficha = await peliculas.findOne({ _id: peliculaId }, { projection: { plataformas: 1 } });
  if (!ficha) return 'no_existe';
  return ficha.plataformas.some((p) => p.nombre === nombre) ? 'repetido' : 'lleno';
}
