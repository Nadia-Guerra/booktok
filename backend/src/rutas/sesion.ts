// Middleware de sesión: lee `Authorization: Bearer <token>` y pregunta el rol en cada petición (O22).
import type { RequestHandler, Response } from 'express';
import { ErrorApi } from '../errores.ts';
import { validarSesion, type SesionActual } from '../servicios/cuentas.ts';

/** Corta con 401 si no hay una sesión vigente. */
export const exigirSesion: RequestHandler = async (req, res, next) => {
  const [esquema, token] = req.headers.authorization?.split(' ') ?? [];
  const sesion = esquema?.toLowerCase() === 'bearer' && token ? await validarSesion(token) : undefined;
  if (!sesion) throw new ErrorApi('sin_sesion', 'Inicia sesión para continuar');
  res.locals.sesion = sesion;
  next();
};

/** La sesión que dejó `exigirSesion`. */
export function sesionDe(res: Response): SesionActual {
  return res.locals.sesion as SesionActual;
}
