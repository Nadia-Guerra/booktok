export type Color =
  | 'fondo'
  | 'superficie'
  | 'suave'
  | 'primario'
  | 'primario-fuerte'
  | 'sobre-primario'
  | 'texto'
  | 'texto-suave'
  | 'borde'
  | 'peligro'
  | 'exito'
  | 'estrella'
  | 'portada-1'
  | 'portada-2'
  | 'portada-3'
  | 'portada-4';

export const colores: Record<Color, string>;

export const fuentes: Record<'regular' | 'media' | 'semi' | 'negrita', string>;
