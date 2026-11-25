// Reseñas comparativas y moderación (EP-12 y EP-23, EP-25 a EP-28). Los límites son los del validador
// de `resenas_comparativas`.
import { z } from 'zod';
import { identificador, obraBreve } from './catalogo.ts';
import { paginacion } from './resenas.ts';

const texto = (maximo: number, mensaje: string) => z.string().trim().max(maximo, mensaje);

/** Un comentario vacío, nulo o ausente se omite. */
const comentario = (maximo: number) =>
  texto(maximo, `El comentario admite hasta ${maximo} caracteres`)
    .nullish()
    .transform((t) => t || undefined);

export const preferencia = z.enum(['libro', 'pelicula', 'empate']);

export const veredictoEntrada = z.object({ preferencia, comentario: comentario(2000) });

const puntuacion = z
  .number('La puntuación es un número del 1 al 5')
  .int('La puntuación es un número entero')
  .min(1, 'La puntuación mínima es 1')
  .max(5, 'La puntuación máxima es 5');

export const aspectoEntrada = z.object({
  nombre: texto(60, 'El nombre del aspecto admite hasta 60 caracteres').min(1, 'Ponle nombre al aspecto'),
  puntuacion: puntuacion.nullish().transform((p) => p ?? undefined),
  comentario: comentario(1000),
});

export const comparativaCambios = z.object({
  veredicto: veredictoEntrada,
  aspectos: z.array(aspectoEntrada).min(1, 'Agrega al menos un aspecto').max(10, 'Son como máximo 10 aspectos'),
});

export const comparativaEntrada = comparativaCambios.extend({
  libro_id: identificador,
  pelicula_id: identificador,
});

export const moderacionEntrada = z.object({ oculta: z.boolean('Indica true o false') });

/** Por adaptación (libro y película), por usuario, o los tres. */
export const comparativasConsulta = paginacion
  .extend({
    libro_id: identificador.optional(),
    pelicula_id: identificador.optional(),
    usuario_id: identificador.optional(),
  })
  .refine((c) => (c.libro_id === undefined) === (c.pelicula_id === undefined) && (c.libro_id ?? c.usuario_id), {
    message: 'Indica libro_id y pelicula_id, usuario_id, o los tres',
  });

export const comparativa = z.object({
  comparativa_id: z.guid(),
  libro: obraBreve,
  pelicula: obraBreve,
  autor: z.object({ usuario_id: z.guid(), nombre: z.string() }),
  veredicto: z.object({ preferencia, comentario: z.string().optional() }),
  aspectos: z.array(
    z.object({ nombre: z.string(), puntuacion: z.number().int().optional(), comentario: z.string().optional() }),
  ),
  oculta: z.boolean(),
  creado_en: z.iso.datetime(),
  actualizado_en: z.iso.datetime(),
});

export const respuestaComparativas = z.object({
  comparativas: z.array(comparativa),
  siguiente: z.string().nullable(),
});

export const respuestaComparativaCreada = z.object({ comparativa_id: z.guid() });

export const respuestaComparativaOculta = z.object({ comparativa_id: z.guid(), oculta: z.boolean() });

export const respuestaResenaOculta = z.object({
  resena_id: z.guid(),
  oculta: z.boolean(),
  promedio: z.number().nullable(),
  total_resenas: z.number().int(),
});

export type ComparativaCambios = z.infer<typeof comparativaCambios>;
export type ComparativaEntrada = z.infer<typeof comparativaEntrada>;
export type ComparativasConsulta = z.infer<typeof comparativasConsulta>;
export type Comparativa = z.infer<typeof comparativa>;
export type RespuestaComparativas = z.infer<typeof respuestaComparativas>;
export type RespuestaComparativaCreada = z.infer<typeof respuestaComparativaCreada>;
export type RespuestaResenaOculta = z.infer<typeof respuestaResenaOculta>;
