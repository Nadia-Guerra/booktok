// Listas en PostgreSQL (O12, O13, O14 y las lecturas de O17).
// Todo lo que cambia los elementos bloquea antes la fila de la lista: así dos peticiones a la vez no
// repiten una posición. Es `FOR NO KEY UPDATE` para no chocar con las llaves foráneas (como en D-38).
import type { PoolClient } from 'pg';
import { enTransaccion, pool } from '../../bases/postgres.ts';

export async function propias(usuarioId: string) {
  const r = await pool.query(
    `SELECT l.lista_id, l.nombre, count(e.obra_id)::int AS total_obras
     FROM lista l
     LEFT JOIN elemento_lista e ON e.lista_id = l.lista_id
     WHERE l.usuario_id = $1
     GROUP BY l.lista_id
     ORDER BY l.creado_en DESC, l.lista_id`,
    [usuarioId],
  );
  return r.rows as { lista_id: string; nombre: string; total_obras: number }[];
}

export async function buscar(listaId: string) {
  const r = await pool.query(
    `SELECT l.nombre, l.usuario_id, u.nombre AS propietario
     FROM lista l
     JOIN usuario u ON u.usuario_id = l.usuario_id
     WHERE l.lista_id = $1`,
    [listaId],
  );
  return r.rows[0] as { nombre: string; usuario_id: string; propietario: string } | undefined;
}

/** Las obras de una lista, en su orden. */
export async function obrasDe(listaId: string): Promise<string[]> {
  const r = await pool.query('SELECT obra_id FROM elemento_lista WHERE lista_id = $1 ORDER BY posicion, agregado_en', [
    listaId,
  ]);
  return r.rows.map((f) => f.obra_id);
}

/** O12: crear. */
export async function crear(listaId: string, usuarioId: string, nombre: string): Promise<void> {
  await pool.query('INSERT INTO lista (lista_id, usuario_id, nombre) VALUES ($1, $2, $3)', [listaId, usuarioId, nombre]);
}

/** O12: eliminar la propia; la cascada quita sus elementos. */
export async function eliminar(listaId: string, usuarioId: string): Promise<boolean> {
  const r = await pool.query('DELETE FROM lista WHERE lista_id = $1 AND usuario_id = $2', [listaId, usuarioId]);
  return r.rowCount === 1;
}

/** Bloquea la lista hasta terminar la transacción. Devuelve si existe y es de ese usuario (RN-10). */
async function bloquear(cliente: PoolClient, listaId: string, usuarioId: string): Promise<boolean> {
  const r = await cliente.query(
    'SELECT 1 FROM lista WHERE lista_id = $1 AND usuario_id = $2 FOR NO KEY UPDATE',
    [listaId, usuarioId],
  );
  return r.rowCount === 1;
}

/** O12 (renombrar) y O14 (reordenar) en una transacción: o se aplican los dos o ninguno. */
export function cambiar(
  listaId: string,
  usuarioId: string,
  cambios: { nombre?: string | undefined; obraIds?: string[] | undefined },
): Promise<'cambiada' | 'no_existe' | 'orden_incompleto'> {
  const { nombre, obraIds } = cambios;
  return enTransaccion(async (cliente) => {
    if (!(await bloquear(cliente, listaId, usuarioId))) return 'no_existe';
    if (obraIds) {
      const actuales = await cliente.query('SELECT obra_id FROM elemento_lista WHERE lista_id = $1', [listaId]);
      const pedidas = new Set(obraIds);
      const coinciden =
        pedidas.size === obraIds.length &&
        pedidas.size === actuales.rows.length &&
        actuales.rows.every((f) => pedidas.has(f.obra_id));
      if (!coinciden) return 'orden_incompleto';
      await cliente.query(
        `UPDATE elemento_lista e SET posicion = o.n
         FROM unnest($2::uuid[]) WITH ORDINALITY AS o(obra_id, n)
         WHERE e.lista_id = $1 AND e.obra_id = o.obra_id`,
        [listaId, obraIds],
      );
    }
    if (nombre !== undefined) {
      await cliente.query('UPDATE lista SET nombre = $2 WHERE lista_id = $1', [listaId, nombre]);
    }
    return 'cambiada';
  });
}

/** O13: agrega al final. */
export async function agregar(
  listaId: string,
  usuarioId: string,
  obraId: string,
): Promise<'agregada' | 'no_existe' | 'ya_esta'> {
  try {
    return await enTransaccion(async (cliente) => {
      if (!(await bloquear(cliente, listaId, usuarioId))) return 'no_existe';
      await cliente.query(
        `INSERT INTO elemento_lista (lista_id, obra_id, posicion)
         SELECT $1, $2, COALESCE(max(posicion), 0) + 1 FROM elemento_lista WHERE lista_id = $1`,
        [listaId, obraId],
      );
      return 'agregada';
    });
  } catch (e) {
    if ((e as { constraint?: string }).constraint === 'pk_elemento_lista') return 'ya_esta'; // RN-04
    throw e;
  }
}

/** O13: quita sin renumerar las demás. Devuelve si la lista existe y es del usuario. */
export function quitar(listaId: string, usuarioId: string, obraId: string): Promise<boolean> {
  return enTransaccion(async (cliente) => {
    if (!(await bloquear(cliente, listaId, usuarioId))) return false;
    await cliente.query('DELETE FROM elemento_lista WHERE lista_id = $1 AND obra_id = $2', [listaId, obraId]);
    return true;
  });
}
