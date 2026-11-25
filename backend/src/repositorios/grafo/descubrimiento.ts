// Lecturas del grafo para buscar y descubrir (CG-01, CG-06 a CG-09).
import type { PersonaBreve, Vinculo } from '@dlbp/shared';
import { consultaCypher, leerGrafo } from '../../bases/neo4j.ts';

const CG01 = consultaCypher('CG-01');
const CG06 = consultaCypher('CG-06');
const CG07 = consultaCypher('CG-07');
const CG08 = consultaCypher('CG-08');
const CG09 = consultaCypher('CG-09');

/**
 * D-41: el texto de CG-01 y CG-02 es sintaxis Lucene. Se quitan sus caracteres especiales y se pasa a
 * minúsculas, para que `AND`, `OR` y `NOT` sean palabras corrientes.
 */
export function textoLucene(texto: string): string {
  return texto
    .replace(/[+\-&|!(){}[\]^"~*?:\\/<>=]/g, ' ')
    .toLowerCase()
    .trim();
}

/** CG-01: una fila por obra, persona y vínculo. */
export async function obrasPorPersona(
  texto: string,
): Promise<(PersonaBreve & { obra_id: string; vinculo: Vinculo })[]> {
  const consulta = textoLucene(texto);
  if (!consulta) return []; // Neo4j falla con una consulta vacía
  return leerGrafo(CG01, { texto: consulta });
}

export interface NodoDeCamino {
  tipo: 'Persona' | 'Libro' | 'Película';
  id: string;
  nombre: string | null;
  foto_url: string | null;
}

/** CG-06: todos los caminos más cortos. El origen y el destino deben ser distintos (D-49). */
export function caminosEntre(
  origenId: string,
  destinoId: string,
): Promise<{ nodos: NodoDeCamino[]; relaciones: string[] }[]> {
  return leerGrafo(CG06, { origen_id: origenId, destino_id: destinoId });
}

/** CG-07: una fila por libro de un autor adaptado por ese director. */
export function autoresDeDirector(
  directorId: string,
): Promise<(PersonaBreve & { libro_id: string; pelicula_id: string })[]> {
  return leerGrafo(CG07, { director_id: directorId });
}

/** CG-08: una fila por (libro recomendado, libro de partida, director). */
export function librosRecomendados(
  usuarioId: string,
  librosPartida: string[],
): Promise<(PersonaBreve & { obra_id: string; partida_id: string })[]> {
  return leerGrafo(CG08, { usuario_id: usuarioId, libros_partida: librosPartida });
}

/** CG-09: una fila por película, las que alcanzan más seguidos primero. */
export function peliculasRecomendadas(
  usuarioId: string,
): Promise<{ obra_id: string; libro_id: string; seguidos: number }[]> {
  return leerGrafo(CG09, { usuario_id: usuarioId });
}
