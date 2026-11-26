// De lo que se escribe en un campo a lo que espera la API.

/** Vacío es "sin dato"; lo que no sea un número lo rechaza el esquema. */
export const aNumero = (texto: string): number | undefined => (texto.trim() === '' ? undefined : Number(texto));

/** "drama, aventura" → ['drama', 'aventura'] */
export const aLista = (texto: string): string[] =>
  texto
    .split(',')
    .map((parte) => parte.trim())
    .filter(Boolean);

/** Perdona lo habitual al copiar una dirección: espacios, barras, la ruta de la API o el `https://`. */
export function limpiarUrl(url: string): string {
  const limpia = url.replace(/\s+/g, '').replace(/\/+$/, '').replace(/\/api\/v1(\/salud)?$/, '');
  if (!limpia) return '';
  return /^https?:\/\//i.test(limpia) ? limpia : `https://${limpia}`;
}
