// Listas (EP-29 a EP-35).
import { z } from 'zod';
import { identificador, obraBreve } from './catalogo.ts';

export const nombreLista = z
  .string('Ponle nombre a la lista')
  .trim()
  .min(1, 'Ponle nombre a la lista')
  .max(100, 'El nombre admite hasta 100 caracteres')
  .regex(/^[^\u0000]*$/, 'El nombre tiene caracteres no admitidos');

export const listaNueva = z.object({ nombre: nombreLista });

/** `obra_ids` es el orden nuevo y debe traer exactamente las obras que ya están. */
export const listaCambios = z
  .object({
    nombre: nombreLista.optional(),
    obra_ids: z.array(identificador).optional(),
  })
  .refine((c) => c.nombre !== undefined || c.obra_ids !== undefined, { message: 'Envía nombre u obra_ids' });

export const elementoNuevo = z.object({ obra_id: identificador });

export const respuestaListaCreada = z.object({ lista_id: z.guid() });

export const respuestaElemento = z.object({ lista_id: z.guid(), obra_id: z.guid() });

export const misListas = z.object({
  listas: z.array(z.object({ lista_id: z.guid(), nombre: z.string(), total_obras: z.number().int() })),
});

export const detalleLista = z.object({
  lista_id: z.guid(),
  nombre: z.string(),
  propietario: z.object({ usuario_id: z.guid(), nombre: z.string() }),
  obras: z.array(obraBreve),
});

export type ListaNueva = z.infer<typeof listaNueva>;
export type ListaCambios = z.infer<typeof listaCambios>;
export type RespuestaListaCreada = z.infer<typeof respuestaListaCreada>;
export type MisListas = z.infer<typeof misListas>;
export type DetalleLista = z.infer<typeof detalleLista>;
