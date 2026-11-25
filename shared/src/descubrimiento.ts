// Exploración y recomendaciones (EP-16, EP-17 y EP-18).
import { z } from 'zod';
import { identificador, obraBreve, personaBreve, tipoObra } from './catalogo.ts';

/** `origen` y `destino`: el id de una persona o de una obra. */
export const caminosConsulta = z.object({ origen: identificador, destino: identificador });

const nodoPersona = personaBreve.extend({ tipo: z.literal('persona') });
const nodoObra = obraBreve.extend({ tipo: tipoObra });

export const nodoDeCamino = z.discriminatedUnion('tipo', [nodoPersona, nodoObra]);

export const relacionDeCamino = z.enum(['escribió', 'adaptado_a', 'dirigida_por', 'actuó_en']);

/** `relaciones[i]` une `nodos[i]` con `nodos[i + 1]`. */
export const camino = z.object({
  nodos: z.array(nodoDeCamino),
  relaciones: z.array(relacionDeCamino),
});

export const respuestaCaminos = z.object({ caminos: z.array(camino) });

export const autorRelacionado = personaBreve.extend({
  obras: z.array(z.object({ libro: obraBreve, pelicula: obraBreve })),
});

export const respuestaAutores = z.object({ autores: z.array(autorRelacionado) });

export const libroRecomendado = z.object({
  obra: obraBreve,
  // Por qué sale: cada libro que te gustó y el director que lo une con este.
  motivos: z.array(z.object({ libro_partida: obraBreve, director: personaBreve })),
});

export const peliculaRecomendada = z.object({
  obra: obraBreve,
  libro: obraBreve,
  seguidos: z.number().int().min(1),
});

export const respuestaRecomendaciones = z.object({
  libros: z.array(libroRecomendado),
  peliculas: z.array(peliculaRecomendada),
});

export type CaminosConsulta = z.infer<typeof caminosConsulta>;
export type NodoDeCamino = z.infer<typeof nodoDeCamino>;
export type RelacionDeCamino = z.infer<typeof relacionDeCamino>;
export type Camino = z.infer<typeof camino>;
export type RespuestaCaminos = z.infer<typeof respuestaCaminos>;
export type AutorRelacionado = z.infer<typeof autorRelacionado>;
export type RespuestaAutores = z.infer<typeof respuestaAutores>;
export type LibroRecomendado = z.infer<typeof libroRecomendado>;
export type PeliculaRecomendada = z.infer<typeof peliculaRecomendada>;
export type RespuestaRecomendaciones = z.infer<typeof respuestaRecomendaciones>;
