// Fichas de libros y películas en MongoDB (AP-01 a AP-04).
// Los filtros solo reciben textos ya validados con Zod, así que no pueden colarse operadores.
import type { Edicion, EstadoPublicacion, ObraBreve, TipoObra } from '@dlbp/shared';
import { mongoDb } from '../../bases/mongo.ts';

interface FichaBase {
  _id: string;
  titulo: string;
  sinopsis: string;
  portada_url?: string;
  generos: string[];
  estado_publicacion: EstadoPublicacion;
}

export interface Libro extends FichaBase {
  anio_publicacion_original: number;
  ediciones: (Omit<Edicion, 'isbn'> & { isbn?: string })[];
}

export interface Pelicula extends FichaBase {
  anio_estreno: number;
  duracion_min: number;
  plataformas: { nombre: string }[];
  datos_tecnicos: { idioma_original: string; paises: string[]; productoras?: string[]; clasificacion?: string };
  reparto: { persona_id: string; nombre: string; personaje: string; orden: number; foto_url?: string }[];
}

const libros = mongoDb.collection<Libro>('libros');
const peliculas = mongoDb.collection<Pelicula>('peliculas');

/** AP-01. */
export function libroPorId(id: string): Promise<Libro | null> {
  return libros.findOne({ _id: id });
}

/** AP-02. */
export function peliculaPorId(id: string): Promise<Pelicula | null> {
  return peliculas.findOne({ _id: id });
}

interface FilaBreve {
  _id: string;
  titulo: string;
  anio: number;
  portada_url?: string;
  puntos?: number;
}

const COLECCIONES: { tipo: TipoObra; nombre: string; campoAnio: string }[] = [
  { tipo: 'libro', nombre: 'libros', campoAnio: '$anio_publicacion_original' },
  { tipo: 'pelicula', nombre: 'peliculas', campoAnio: '$anio_estreno' },
];

const breve = (tipo: TipoObra, f: FilaBreve): ObraBreve => ({
  obra_id: f._id,
  tipo,
  titulo: f.titulo,
  anio: f.anio,
  portada_url: f.portada_url ?? null,
});

const soloPublicadas = (incluirBorradores: boolean) =>
  incluirBorradores ? {} : { estado_publicacion: 'publicada' as const };

/** AP-03: obras cuyo título contiene alguna palabra buscada, las que más coinciden primero. */
export async function buscarPorTitulo(texto: string, incluirBorradores: boolean, limite: number): Promise<ObraBreve[]> {
  const porColeccion = await Promise.all(
    COLECCIONES.map(async ({ tipo, nombre, campoAnio }) => {
      const filas = await mongoDb
        .collection(nombre)
        .aggregate<FilaBreve>([
          { $match: { $text: { $search: texto }, ...soloPublicadas(incluirBorradores) } },
          { $project: { titulo: 1, portada_url: 1, anio: campoAnio, puntos: { $meta: 'textScore' } } },
          { $sort: { puntos: -1, titulo: 1 } },
          { $limit: limite },
        ])
        .toArray();
      return filas.map((f) => ({ puntos: f.puntos ?? 0, obra: breve(tipo, f) }));
    }),
  );
  return porColeccion
    .flat()
    .sort((a, b) => b.puntos - a.puntos || a.obra.titulo.localeCompare(b.obra.titulo, 'es') || a.obra.anio - b.obra.anio)
    .slice(0, limite)
    .map((r) => r.obra);
}

/** AP-04: datos de presentación de varias obras, en el orden pedido. Omite las que no se pueden ver. */
export async function obrasBreves(ids: string[], incluirBorradores: boolean): Promise<ObraBreve[]> {
  if (ids.length === 0) return [];
  const porColeccion = await Promise.all(
    COLECCIONES.map(async ({ tipo, nombre, campoAnio }) => {
      const filas = await mongoDb
        .collection<{ _id: string }>(nombre)
        .aggregate<FilaBreve>([
          { $match: { _id: { $in: ids }, ...soloPublicadas(incluirBorradores) } },
          { $project: { titulo: 1, portada_url: 1, anio: campoAnio } },
        ])
        .toArray();
      return filas.map((f) => breve(tipo, f));
    }),
  );
  const porId = new Map(porColeccion.flat().map((o) => [o.obra_id, o]));
  return ids.flatMap((id) => porId.get(id) ?? []);
}
