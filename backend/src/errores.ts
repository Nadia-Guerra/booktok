// Un solo manejador de errores: nunca devuelve trazas ni mensajes crudos de un motor.
import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { CodigoError, CuerpoError } from '@dlbp/shared';
import { MongoNetworkError, MongoServerSelectionError } from 'mongodb';
import neo4j from 'neo4j-driver';
import { ZodError } from 'zod';

const ESTADOS: Record<CodigoError, number> = {
  entrada_invalida: 400,
  sin_sesion: 401,
  sin_permiso: 403,
  no_encontrado: 404,
  conflicto: 409,
  demasiado_grande: 413,
  error_interno: 500,
  base_no_disponible: 503,
};

/** Error esperado de la aplicación: los servicios y las rutas lanzan este. */
export class ErrorApi extends Error {
  readonly codigo: CodigoError;
  readonly campos: Record<string, string> | undefined;

  constructor(codigo: CodigoError, mensaje: string, campos?: Record<string, string>) {
    super(mensaje);
    this.codigo = codigo;
    this.campos = campos;
  }
}

// Códigos de red de Node y de PostgreSQL que significan "la base no está disponible ahora".
const RED = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']);
const PG_NO_DISPONIBLE = new Set(['57P01', '57P02', '57P03', '53300']);

function baseNoDisponible(e: unknown): boolean {
  if (e instanceof MongoNetworkError || e instanceof MongoServerSelectionError) return true;
  if (typeof e !== 'object' || e === null) return false;
  const { code, message } = e as { code?: unknown; message?: unknown };
  if (code === neo4j.error.SERVICE_UNAVAILABLE || code === neo4j.error.SESSION_EXPIRED) return true;
  if (typeof code === 'string' && (RED.has(code) || PG_NO_DISPONIBLE.has(code) || code.startsWith('08'))) return true;
  // `pg` no pone código cuando agota el tiempo de conexión.
  return typeof message === 'string' && /connection (timeout|terminated)|timeout exceeded when trying to connect/i.test(message);
}

/**
 * Para el worker (documento 04, 9.5): ¿falló la base destino y no el evento? Además de la red, cuenta
 * Neo4j arrancando, sin conexiones libres, rechazando las credenciales o tan lento que vence la
 * transacción (la primera consulta tras arrancar puede tardar mucho).
 */
export function destinoNoDisponible(e: unknown): boolean {
  if (baseNoDisponible(e)) return true;
  const { code, message } = (e ?? {}) as { code?: unknown; message?: unknown };
  const delServidor = /^Neo\.(TransientError\.|ClientError\.Security\.|ClientError\.Transaction\.TransactionTimedOut)/;
  if (typeof code === 'string' && delServidor.test(code)) return true;
  return typeof message === 'string' && message.startsWith('Connection acquisition timed out');
}

function aErrorApi(e: unknown): ErrorApi {
  if (e instanceof ErrorApi) return e;
  if (e instanceof ZodError) {
    const campos: Record<string, string> = {};
    for (const i of e.issues) campos[i.path.join('.') || 'cuerpo'] ??= i.message;
    return new ErrorApi('entrada_invalida', 'Revisa los datos enviados', campos);
  }
  // Errores de express.json(): JSON mal formado o cuerpo demasiado grande.
  const tipo = (e as { type?: unknown } | null)?.type;
  if (tipo === 'entity.parse.failed') return new ErrorApi('entrada_invalida', 'El cuerpo no es un JSON válido');
  if (tipo === 'entity.too.large') return new ErrorApi('demasiado_grande', 'El cuerpo es demasiado grande');
  if (baseNoDisponible(e)) return new ErrorApi('base_no_disponible', 'Una base no responde. Intenta de nuevo en un momento');
  return new ErrorApi('error_interno', 'Ocurrió un error inesperado');
}

export const rutaNoEncontrada: RequestHandler = () => {
  throw new ErrorApi('no_encontrado', 'La ruta no existe');
};

export const manejadorDeErrores: ErrorRequestHandler = (e, req, res, next) => {
  if (res.headersSent) return next(e);
  const error = aErrorApi(e);
  if (error.codigo === 'error_interno' || error.codigo === 'base_no_disponible') {
    // Solo el nombre, el código y la pila: el mensaje de un motor puede llevar datos del usuario.
    const { name, code, stack } = e as { name?: string; code?: unknown; stack?: string };
    const pila = stack?.split('\n').filter((l) => l.trimStart().startsWith('at ')).slice(0, 5).join('\n') ?? '';
    console.error(`${req.method} ${req.path} -> ${error.codigo} (${name ?? 'error'} ${String(code ?? '')})\n${pila}`);
  }
  const cuerpo: CuerpoError = {
    error: { codigo: error.codigo, mensaje: error.message, ...(error.campos && { campos: error.campos }) },
  };
  res.status(ESTADOS[error.codigo]).json(cuerpo);
};
