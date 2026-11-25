import { z } from 'zod';

export const codigoError = z.enum([
  'entrada_invalida', // 400
  'sin_sesion', // 401
  'sin_permiso', // 403
  'no_encontrado', // 404
  'conflicto', // 409
  'demasiado_grande', // 413
  'error_interno', // 500
  'base_no_disponible', // 503
]);

export const cuerpoError = z.object({
  error: z.object({
    codigo: codigoError,
    mensaje: z.string(),
    campos: z.record(z.string(), z.string()).optional(),
    // D-58: solo en un alta que quedó a medias, para completarla sin repetirla.
    obra_id: z.guid().optional(),
  }),
});

export type CodigoError = z.infer<typeof codigoError>;
export type CuerpoError = z.infer<typeof cuerpoError>;
