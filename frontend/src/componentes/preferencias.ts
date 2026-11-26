import type { Comparativa } from '@dlbp/shared';

type Preferencia = Comparativa['veredicto']['preferencia'];

export const PREFERENCIAS = [
  { valor: 'libro', titulo: 'El libro' },
  { valor: 'empate', titulo: 'Empate' },
  { valor: 'pelicula', titulo: 'La película' },
] as const satisfies readonly { valor: Preferencia; titulo: string }[];

export const VEREDICTOS: Record<Preferencia, string> = {
  libro: 'Prefiere el libro',
  pelicula: 'Prefiere la película',
  empate: 'Empate',
};
