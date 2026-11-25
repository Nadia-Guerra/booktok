// Cursor de los listados largos (D-57): la fecha del último elemento y su id, para desempatar.
import { z } from 'zod';
import { ErrorApi } from './errores.ts';

// La fecha viaja con microsegundos, como la guarda PostgreSQL: con milisegundos se saltarían filas.
const contenido = z.tuple([z.iso.datetime(), z.guid()]);

export interface Cursor {
  fecha: string;
  id: string;
}

export function leerCursor(cursor: string | undefined): Cursor | undefined {
  if (cursor === undefined) return undefined;
  try {
    const [fecha, id] = contenido.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
    return { fecha, id };
  } catch {
    throw new ErrorApi('entrada_invalida', 'Revisa los datos enviados', { cursor: 'El cursor no es válido' });
  }
}

const escribirCursor = (c: Cursor) => Buffer.from(JSON.stringify([c.fecha, c.id])).toString('base64url');

/**
 * Recibe `limite + 1` filas: la que sobra solo sirve para saber si hay otra página.
 * Devuelve las de esta página y el cursor de la siguiente (nulo si no hay más).
 */
export function paginar<Fila>(filas: Fila[], limite: number, marca: (f: Fila) => Cursor) {
  const pagina = filas.slice(0, limite);
  const ultima = pagina.at(-1);
  return { pagina, siguiente: filas.length > limite && ultima ? escribirCursor(marca(ultima)) : null };
}
