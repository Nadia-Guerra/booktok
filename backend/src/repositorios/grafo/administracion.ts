// Personas y relaciones del catálogo (CG-02, CG-11, CG-13, CG-14, CG-15 y CG-20).
import type { PersonaBreve } from '@dlbp/shared';
import neo4j from 'neo4j-driver';
import { consultaCypher, escribirGrafo, leerGrafo, transaccionGrafo } from '../../bases/neo4j.ts';
import { textoLucene } from './descubrimiento.ts';

const CG02 = consultaCypher('CG-02');
const CG11_LIBRO = consultaCypher('CG-11-libro');
const CG11_PELICULA = consultaCypher('CG-11-pelicula');
const CG13 = consultaCypher('CG-13');
const CG14_ESCRIBIO = consultaCypher('CG-14-escribio');
const CG14_DIRIGIO = consultaCypher('CG-14-dirigio');
const CG14_ACTUO = consultaCypher('CG-14-actuo');
const CG15_BLOQUEO = consultaCypher('CG-15-bloqueo');
const CG15 = consultaCypher('CG-15');
const CG04 = consultaCypher('CG-04');
const CG20 = consultaCypher('CG-20');

// Consulta propia, sin id de catálogo: ningún CG comprueba que las personas existan antes de un alta.
const PERSONAS_QUE_EXISTEN = 'MATCH (p:Persona) WHERE p.persona_id IN $ids RETURN p.persona_id AS persona_id';

/** CG-02: para reutilizar una persona antes de registrar otra (D-15). */
export async function buscarPersonas(texto: string, limite: number): Promise<PersonaBreve[]> {
  const consulta = textoLucene(texto);
  if (!consulta) return [];
  return (await leerGrafo<PersonaBreve>(CG02, { texto: consulta })).slice(0, limite);
}

/** CG-13. */
export async function crearPersona(personaId: string, nombre: string, fotoUrl: string | null): Promise<void> {
  await escribirGrafo(CG13, { persona_id: personaId, nombre, foto_url: fotoUrl });
}

/** Cuáles de esos ids no son de una persona registrada. */
export async function personasQueFaltan(ids: string[]): Promise<string[]> {
  const filas = await leerGrafo<{ persona_id: string }>(PERSONAS_QUE_EXISTEN, { ids });
  const hay = new Set(filas.map((f) => f.persona_id));
  return ids.filter((id) => !hay.has(id));
}

/** CG-11 y CG-14 (escribió): el nodo del libro y sus autores, en una transacción. Repetible. */
export function crearLibro(libroId: string, autores: string[]): Promise<void> {
  return transaccionGrafo(async (tx) => {
    await tx.run(CG11_LIBRO, { obra_id: libroId });
    for (const persona_id of autores) await tx.run(CG14_ESCRIBIO, { persona_id, obra_id: libroId });
  });
}

/** CG-11 (película). */
export async function crearNodoPelicula(peliculaId: string): Promise<void> {
  await escribirGrafo(CG11_PELICULA, { obra_id: peliculaId });
}

export interface Actor {
  persona_id: string;
  personaje: string;
  orden: number;
}

/**
 * Las relaciones de una película, en una transacción. La adaptación sigue el protocolo de D-23 y D-42:
 * bloquear la película, comprobar que no tiene libro y solo entonces crearla (RN-07).
 */
export function relacionarPelicula(
  peliculaId: string,
  libroId: string,
  directores: string[],
  reparto: Actor[],
): Promise<void> {
  return transaccionGrafo(async (tx) => {
    await tx.run(CG15_BLOQUEO, { pelicula_id: peliculaId });
    const previo = await tx.run(CG04, { pelicula_id: peliculaId });
    if (previo.records.length === 0) await tx.run(CG15, { libro_id: libroId, pelicula_id: peliculaId });
    for (const persona_id of directores) await tx.run(CG14_DIRIGIO, { persona_id, obra_id: peliculaId });
    for (const { persona_id, personaje, orden } of reparto) {
      // Sin `neo4j.int`, el driver manda el número como decimal y `orden` quedaría como 1.0.
      await tx.run(CG14_ACTUO, { persona_id, obra_id: peliculaId, personaje, orden: neo4j.int(orden) });
    }
  });
}

export interface ActorDelGrafo extends PersonaBreve {
  personaje: string;
  orden: number;
}

/** CG-20: el reparto, para copiarlo a la ficha y comprobar el mínimo. */
export function repartoDe(peliculaId: string): Promise<ActorDelGrafo[]> {
  return leerGrafo<ActorDelGrafo>(CG20, { pelicula_id: peliculaId });
}
