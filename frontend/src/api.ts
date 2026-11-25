// Llamadas a la API. La dirección es configurable: el túnel cambia en cada arranque (D-62).
import { cuerpoError, respuestaSalud, type RespuestaSalud } from '@dlbp/shared';
import * as SecureStore from 'expo-secure-store';

const CLAVE_URL = 'dlbp.url_api';
const URL_INICIAL = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function leerUrlApi(): Promise<string> {
  return (await SecureStore.getItemAsync(CLAVE_URL)) ?? URL_INICIAL;
}

export async function guardarUrlApi(url: string): Promise<string> {
  const limpia = url.trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  await SecureStore.setItemAsync(CLAVE_URL, limpia);
  return limpia;
}

async function pedir(base: string, ruta: string): Promise<unknown> {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), 15_000);
  try {
    const res = await fetch(`${base}/api/v1${ruta}`, { signal: control.signal });
    const cuerpo: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const e = cuerpoError.safeParse(cuerpo);
      throw new Error(e.success ? e.data.error.mensaje : `La API respondió ${res.status}`);
    }
    return cuerpo;
  } finally {
    clearTimeout(reloj);
  }
}

export async function pedirSalud(base: string): Promise<RespuestaSalud> {
  const r = respuestaSalud.safeParse(await pedir(base, '/salud'));
  if (!r.success) throw new Error('Esa dirección responde, pero no es la API');
  return r.data;
}
