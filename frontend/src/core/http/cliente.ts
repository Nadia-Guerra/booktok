// Único punto que habla con la API: dirección, token, tiempo límite, errores y validación.
import { cuerpoError } from '@dlbp/shared';
import type { z } from 'zod';
import { leerUrlApi } from '../config/urlApi';
import { ErrorApi } from './errores';

const TIEMPO_LIMITE_MS = 20_000;

let token: string | null = null;
let alExpirar: () => void = () => {};

/** Lo llama la sesión: el resto de la app no maneja el token. */
export function configurarSesion(nuevoToken: string | null, alPerderSesion: () => void): void {
  token = nuevoToken;
  alExpirar = alPerderSesion;
}

export type Peticion = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Ruta sin el prefijo `/api/v1`. */
  ruta: string;
  consulta?: Record<string, string | number | undefined>;
  cuerpo?: unknown;
};

function armarUrl(base: string, ruta: string, consulta: Peticion['consulta']): string {
  const parametros = Object.entries(consulta ?? {})
    .filter(([, valor]) => valor !== undefined && valor !== '')
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(String(valor))}`);
  return `${base}/api/v1${ruta}${parametros.length ? `?${parametros.join('&')}` : ''}`;
}

async function enviar({ metodo = 'GET', ruta, consulta, cuerpo }: Peticion): Promise<unknown> {
  const base = await leerUrlApi();
  if (!base) throw new ErrorApi('sin_configurar', 'Falta la dirección de la API');

  const tokenUsado = token;
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS);
  let res: Response;
  let datos: unknown;
  try {
    res = await fetch(armarUrl(base, ruta, consulta), {
      method: metodo,
      signal: control.signal,
      headers: {
        Accept: 'application/json',
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(tokenUsado && { Authorization: `Bearer ${tokenUsado}` }),
      },
      ...(cuerpo !== undefined && { body: JSON.stringify(cuerpo) }),
    });
    datos = res.status === 204 ? null : await res.json().catch(() => null);
  } catch {
    // Con la dirección a la vista se nota si es la de un túnel anterior o está mal escrita.
    throw new ErrorApi('sin_conexion', `No se pudo llegar a ${base}. Revisa la dirección y la conexión.`);
  } finally {
    clearTimeout(reloj);
  }

  if (res.ok) return datos;

  // Un 401 al iniciar sesión (sin token) es una contraseña mala, no una sesión vencida.
  if (res.status === 401 && tokenUsado && tokenUsado === token) alExpirar();

  const error = cuerpoError.safeParse(datos);
  if (!error.success) {
    throw new ErrorApi('respuesta_invalida', `La API respondió ${res.status}`, { estado: res.status });
  }
  const { codigo, mensaje, campos, obra_id } = error.data.error;
  throw new ErrorApi(codigo, mensaje, {
    estado: res.status,
    ...(campos && { campos }),
    ...(obra_id && { obraId: obra_id }),
  });
}

/** Petición con respuesta: se valida con el esquema compartido antes de usarla. */
export async function pedir<E extends z.ZodType>(peticion: Peticion, esquema: E): Promise<z.infer<E>> {
  const resultado = esquema.safeParse(await enviar(peticion));
  if (!resultado.success) {
    throw new ErrorApi('respuesta_invalida', 'La API respondió algo que la app no entiende');
  }
  return resultado.data;
}

/** Petición sin respuesta que leer (204 o cuerpo que no interesa). */
export async function ejecutar(peticion: Peticion): Promise<void> {
  await enviar(peticion);
}
