// Cuentas y sesión (EP-02 a EP-06). Los límites son los de las columnas de `usuario` y D-57.
import { z } from 'zod';

// PostgreSQL no admite el carácter nulo en un texto.
const SIN_NULOS = /^[^\u0000]*$/;

export const correo = z
  .string()
  .trim()
  .toLowerCase() // D-03
  .pipe(z.email('Escribe un correo válido').max(254, 'El correo admite hasta 254 caracteres'));

export const nombreUsuario = z
  .string()
  .trim()
  .min(1, 'Escribe un nombre')
  .max(100, 'El nombre admite hasta 100 caracteres')
  .regex(SIN_NULOS, 'El nombre tiene caracteres no admitidos');

/** Una biografía vacía o nula la borra. */
export const biografia = z
  .string()
  .trim()
  .max(500, 'La biografía admite hasta 500 caracteres')
  .regex(SIN_NULOS, 'La biografía tiene caracteres no admitidos')
  .nullable()
  .transform((v) => (v === '' ? null : v));

export const registroEntrada = z.object({
  correo,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'), // D-57
  nombre: nombreUsuario,
});

// Al iniciar sesión no se repiten las reglas de la contraseña: solo se compara.
export const sesionEntrada = z.object({
  correo,
  password: z.string().min(1, 'Escribe la contraseña'),
});

export const perfilCambios = z
  .object({
    nombre: nombreUsuario.optional(),
    biografia: biografia.optional(),
  })
  .refine((c) => c.nombre !== undefined || c.biografia !== undefined, {
    message: 'Envía al menos nombre o biografia',
  });

export const rolUsuario = z.enum(['lector', 'admin']);

export const perfilPropio = z.object({
  usuario_id: z.uuid(),
  correo: z.string(),
  nombre: z.string(),
  biografia: z.string().nullable(),
  rol: rolUsuario,
});

export const respuestaRegistro = z.object({ usuario_id: z.uuid() });

export const respuestaSesion = z.object({
  token: z.string(),
  expira_en: z.iso.datetime(),
  usuario: perfilPropio,
});

export type RegistroEntrada = z.infer<typeof registroEntrada>;
export type SesionEntrada = z.infer<typeof sesionEntrada>;
export type PerfilCambios = z.infer<typeof perfilCambios>;
export type RolUsuario = z.infer<typeof rolUsuario>;
export type PerfilPropio = z.infer<typeof perfilPropio>;
export type RespuestaRegistro = z.infer<typeof respuestaRegistro>;
export type RespuestaSesion = z.infer<typeof respuestaSesion>;
