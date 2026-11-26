import type { EstadoLectura } from '@dlbp/shared';

export const ESTADOS_DE_LECTURA = [
  { valor: 'pendiente', titulo: 'Pendiente' },
  { valor: 'en_curso', titulo: 'En curso' },
  { valor: 'terminada', titulo: 'Terminada' },
] as const satisfies readonly { valor: EstadoLectura; titulo: string }[];

export const NOMBRE_ESTADO = Object.fromEntries(ESTADOS_DE_LECTURA.map((e) => [e.valor, e.titulo])) as Record<
  EstadoLectura,
  string
>;
