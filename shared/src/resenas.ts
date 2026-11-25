// Reseñas y estados de lectura (EP-10, EP-11, EP-13, EP-14 y EP-15).
import { z } from 'zod';
import { estadoLectura, identificador, miResena, obraBreve } from './catalogo.ts';

export const resenaEntrada = z.object({
  calificacion: z
    .number('La calificación es un número del 1 al 5')
    .int('La calificación es un número entero')
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5'),
  // Se envía siempre el texto completo: si falta o va vacío, la reseña queda sin texto.
  texto: z
    .string()
    .trim()
    .max(3000, 'La reseña admite hasta 3000 caracteres') // D-57
    .regex(/^[^\u0000]*$/, 'La reseña tiene caracteres no admitidos')
    .nullish()
    .transform((t) => t || null),
});

export const estadoEntrada = z.object({ estado: estadoLectura });

/** Páginas de 20 con cursor por fecha (D-57). El cursor es opaco: se devuelve tal cual. */
export const paginacion = z.object({
  limite: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(200).optional(),
});

export const resenasConsulta = paginacion
  .extend({
    obra_id: identificador.optional(),
    usuario_id: identificador.optional(),
  })
  .refine((c) => (c.obra_id === undefined) !== (c.usuario_id === undefined), {
    message: 'Indica obra_id o usuario_id, uno de los dos',
  });

export const estadosConsulta = paginacion.extend({ estado: estadoLectura.optional() });

export const respuestaPublicacion = z.object({
  resena_id: z.guid(),
  promedio: z.number().nullable(),
  total_resenas: z.number().int(),
});

export const resenaEnLista = miResena.extend({
  autor: z.object({ usuario_id: z.guid(), nombre: z.string() }),
  obra: obraBreve,
});

export const respuestaResenas = z.object({
  resenas: z.array(resenaEnLista),
  siguiente: z.string().nullable(),
});

export const respuestaEstado = z.object({
  obra_id: z.guid(),
  estado: estadoLectura,
  actualizado_en: z.iso.datetime(),
});

export const respuestaEstados = z.object({
  estados: z.array(z.object({ obra: obraBreve, estado: estadoLectura, actualizado_en: z.iso.datetime() })),
  siguiente: z.string().nullable(),
});

export type ResenaEntrada = z.infer<typeof resenaEntrada>;
export type ResenasConsulta = z.infer<typeof resenasConsulta>;
export type EstadosConsulta = z.infer<typeof estadosConsulta>;
export type RespuestaPublicacion = z.infer<typeof respuestaPublicacion>;
export type ResenaEnLista = z.infer<typeof resenaEnLista>;
export type RespuestaResenas = z.infer<typeof respuestaResenas>;
export type RespuestaEstado = z.infer<typeof respuestaEstado>;
export type RespuestaEstados = z.infer<typeof respuestaEstados>;
