// Seguimiento y lo que se ve de otro usuario en PostgreSQL (O15, O16 y las lecturas de O17).
import type { RedPropia } from '@dlbp/shared';
import { anotarEvento, enTransaccion, pool } from '../../bases/postgres.ts';

export async function sigue(seguidorId: string, seguidoId: string): Promise<boolean> {
  const r = await pool.query('SELECT 1 FROM seguimiento WHERE seguidor_id = $1 AND seguido_id = $2', [
    seguidorId,
    seguidoId,
  ]);
  return r.rowCount === 1;
}

/**
 * O15: seguimiento y evento en la misma transacción. La fila queda bloqueada hasta confirmar, así
 * que los eventos de una misma pareja salen en el orden en que ocurrieron (documento 04, 4.4).
 */
export async function seguir(seguidorId: string, seguidoId: string): Promise<'seguido' | 'ya_lo_sigue' | 'no_existe'> {
  try {
    await enTransaccion(async (cliente) => {
      await cliente.query('INSERT INTO seguimiento (seguidor_id, seguido_id) VALUES ($1, $2)', [seguidorId, seguidoId]);
      await anotarEvento(cliente, 'seguimiento_creado', { seguidor_id: seguidorId, seguido_id: seguidoId });
    });
    return 'seguido';
  } catch (e) {
    const { constraint } = e as { constraint?: string };
    if (constraint === 'pk_seguimiento') return 'ya_lo_sigue';
    if (constraint === 'fk_seguimiento_seguido') return 'no_existe';
    throw e;
  }
}

/** O16: si no se borró ninguna fila, no hay evento. Devuelve si lo seguía. */
export function dejarDeSeguir(seguidorId: string, seguidoId: string): Promise<boolean> {
  return enTransaccion(async (cliente) => {
    const r = await cliente.query('DELETE FROM seguimiento WHERE seguidor_id = $1 AND seguido_id = $2', [
      seguidorId,
      seguidoId,
    ]);
    if (r.rowCount !== 1) return false;
    await anotarEvento(cliente, 'seguimiento_eliminado', { seguidor_id: seguidorId, seguido_id: seguidoId });
    return true;
  });
}

/** O17: nombre y biografía, que cualquiera con sesión puede ver (D-54). */
export async function perfilBasico(
  usuarioId: string,
): Promise<{ usuario_id: string; nombre: string; biografia: string | null } | undefined> {
  const r = await pool.query('SELECT usuario_id, nombre, biografia FROM usuario WHERE usuario_id = $1', [usuarioId]);
  return r.rows[0];
}

/** O17: listas de un usuario, las recientes primero. */
export async function listasDe(usuarioId: string): Promise<{ lista_id: string; nombre: string }[]> {
  const r = await pool.query(
    'SELECT lista_id, nombre FROM lista WHERE usuario_id = $1 ORDER BY creado_en DESC, lista_id',
    [usuarioId],
  );
  return r.rows;
}

/** O17: a quién sigue un usuario y quién lo sigue, lo más reciente primero. */
export async function red(usuarioId: string): Promise<RedPropia> {
  const consulta = (propia: string, otra: string) =>
    pool.query(
      `SELECT u.usuario_id, u.nombre
       FROM seguimiento s
       JOIN usuario u ON u.usuario_id = s.${otra}
       WHERE s.${propia} = $1
       ORDER BY s.creado_en DESC, u.usuario_id`,
      [usuarioId],
    );
  // Los nombres de columna son textos fijos de aquí, nunca de la petición.
  const [seguidos, seguidores] = await Promise.all([
    consulta('seguidor_id', 'seguido_id'),
    consulta('seguido_id', 'seguidor_id'),
  ]);
  return { seguidos: seguidos.rows, seguidores: seguidores.rows };
}
