// Seguir y ver a otro usuario (EP-19, EP-20 y EP-22).
import { z } from 'zod';
import { identificador } from './catalogo.ts';

export const seguirEntrada = z.object({ usuario_id: identificador });

export const respuestaSeguir = z.object({ usuario_id: z.guid() });

export const listaBreve = z.object({ lista_id: z.guid(), nombre: z.string() });

/** `listas` solo viene si la sesión lo sigue o es su propio perfil (D-54). */
export const perfilDeOtro = z.object({
  usuario_id: z.guid(),
  nombre: z.string(),
  biografia: z.string().nullable(),
  lo_sigo: z.boolean(),
  listas: z.array(listaBreve).optional(),
});

export type SeguirEntrada = z.infer<typeof seguirEntrada>;
export type RespuestaSeguir = z.infer<typeof respuestaSeguir>;
export type ListaBreve = z.infer<typeof listaBreve>;
export type PerfilDeOtro = z.infer<typeof perfilDeOtro>;

export const usuarioBreve = z.object({ usuario_id: z.guid(), nombre: z.string() });

/** EP-21: a quién sigo y quién me sigue, lo más reciente primero. */
export const redPropia = z.object({ seguidos: z.array(usuarioBreve), seguidores: z.array(usuarioBreve) });

export type UsuarioBreve = z.infer<typeof usuarioBreve>;
export type RedPropia = z.infer<typeof redPropia>;
