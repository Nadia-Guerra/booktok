// Dirección de la API. Es configurable porque el túnel cambia en cada arranque (D-62).
import * as SecureStore from 'expo-secure-store';

const CLAVE = 'dlbp.url_api';
const INICIAL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Perdona lo habitual al copiar y pegar: espacios, barras, la ruta de la API o el `https://` que falta. */
export function limpiarUrl(url: string): string {
  const limpia = url.replace(/\s+/g, '').replace(/\/+$/, '').replace(/\/api\/v1(\/salud)?$/, '');
  if (!limpia) return '';
  return /^https?:\/\//i.test(limpia) ? limpia : `https://${limpia}`;
}

export async function leerUrlApi(): Promise<string> {
  return (await SecureStore.getItemAsync(CLAVE)) ?? limpiarUrl(INICIAL);
}

export async function guardarUrlApi(url: string): Promise<string> {
  const limpia = limpiarUrl(url);
  await SecureStore.setItemAsync(CLAVE, limpia);
  return limpia;
}
