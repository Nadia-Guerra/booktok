// Dirección de la API. Es configurable porque el túnel cambia en cada arranque (D-62).
import * as SecureStore from 'expo-secure-store';
import { limpiarUrl } from '../texto';

const CLAVE = 'dlbp.url_api';
const INICIAL = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function leerUrlApi(): Promise<string> {
  return (await SecureStore.getItemAsync(CLAVE)) ?? limpiarUrl(INICIAL);
}

export async function guardarUrlApi(url: string): Promise<string> {
  const limpia = limpiarUrl(url);
  await SecureStore.setItemAsync(CLAVE, limpia);
  return limpia;
}
