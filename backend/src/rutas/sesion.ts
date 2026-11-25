// Middleware de sesión: lee `Authorization: Bearer <token>` y pregunta el rol en cada petición (O22).
import type { Request, RequestHandler, Response } from 'express';
import { ErrorApi } from '../errores.ts';
import { validarSesion, type SesionActual } from '../servicios/cuentas.ts';

async function sesionDeLaCabecera(req: Request): Promise<SesionActual> {
  const [esquema, token] = req.headers.authorization?.split(' ') ?? [];
  const sesion = esquema?.toLowerCase() === 'bearer' && token ? await validarSesion(token) : undefined;
  if (!sesion) throw new ErrorApi('sin_sesion', 'Inicia sesión para continuar');
  return sesion;
}

/** Corta con 401 si no hay una sesión vigente. */
export const exigirSesion: RequestHandler = async (req, res, next) => {
  res.locals.sesion = await sesionDeLaCabecera(req);
  next();
};

/** 401 sin sesión y 403 si no es el administrador (RN-09). El rol se lee en cada petición (O22). */
export const exigirAdmin: RequestHandler = async (req, res, next) => {
  const sesion = await sesionDeLaCabecera(req);
  if (sesion.rol !== 'admin') throw new ErrorApi('sin_permiso', 'Solo el administrador puede hacer esto');
  res.locals.sesion = sesion;
  next();
};

/**
 * Para las rutas públicas cuya respuesta cambia según quién pide. Sin cabecera se atiende como
 * visitante; con un token que ya no vale responde 401, para que la app sepa que debe volver a entrar.
 */
export const sesionOpcional: RequestHandler = async (req, res, next) => {
  if (req.headers.authorization !== undefined) res.locals.sesion = await sesionDeLaCabecera(req);
  next();
};

/** La sesión que dejó `exigirSesion`. */
export function sesionDe(res: Response): SesionActual {
  return res.locals.sesion as SesionActual;
}

/** La sesión que pudo dejar `sesionOpcional`. */
export function sesionSiHay(res: Response): SesionActual | undefined {
  return res.locals.sesion as SesionActual | undefined;
}
