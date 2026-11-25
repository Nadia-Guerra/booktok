import { pool } from '../../bases/postgres.ts';

export async function ping(): Promise<void> {
  await pool.query('SELECT 1');
}
