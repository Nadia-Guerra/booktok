// Relaciones de una obra en el grafo (CG-03, CG-04, CG-05, CG-10).
import type { PersonaBreve } from '@dlbp/shared';
import { consultaCypher, leerGrafo } from '../../bases/neo4j.ts';

const CG03 = consultaCypher('CG-03');
const CG04 = consultaCypher('CG-04');
const CG05 = consultaCypher('CG-05');
const CG10 = consultaCypher('CG-10');

/** CG-03: ids de las películas que adaptan un libro. */
export async function adaptacionesDe(libroId: string): Promise<string[]> {
  const filas = await leerGrafo<{ obra_id: string }>(CG03, { libro_id: libroId });
  return filas.map((f) => f.obra_id);
}

/** CG-04: id del libro de origen de una película, si ya lo tiene. */
export async function libroDe(peliculaId: string): Promise<string | undefined> {
  const filas = await leerGrafo<{ obra_id: string }>(CG04, { pelicula_id: peliculaId });
  return filas[0]?.obra_id;
}

/** CG-05: autores de un libro o directores de una película. */
export function autoresODirectores(obraId: string): Promise<PersonaBreve[]> {
  return leerGrafo<PersonaBreve>(CG05, { obra_id: obraId });
}

/** CG-10: si la película adapta ese libro (RN-06). */
export async function estanUnidas(libroId: string, peliculaId: string): Promise<boolean> {
  const filas = await leerGrafo<{ unidas: boolean }>(CG10, { libro_id: libroId, pelicula_id: peliculaId });
  return filas[0]?.unidas === true;
}
