// Seguimiento en PostgreSQL.
import { pool } from '../../bases/postgres.ts';

export async function sigue(seguidorId: string, seguidoId: string): Promise<boolean> {
  const r = await pool.query('SELECT 1 FROM seguimiento WHERE seguidor_id = $1 AND seguido_id = $2', [
    seguidorId,
    seguidoId,
  ]);
  return r.rowCount === 1;
}
