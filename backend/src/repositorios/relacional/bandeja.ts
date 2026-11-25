// La bandeja de salida `sync_outbox` vista por el worker (O19).
import { pool, type TipoEvento } from '../../bases/postgres.ts';

export interface Evento {
  eventoId: string; // BIGINT: `pg` lo entrega como texto
  tipo: TipoEvento;
  payload: Record<string, string>;
}

/** Los pendientes en orden de `evento_id` (usa el índice parcial I6). */
export async function pendientes(limite: number): Promise<Evento[]> {
  const r = await pool.query(
    `SELECT evento_id, tipo_evento, payload FROM sync_outbox
     WHERE estado = 'pendiente'
     ORDER BY evento_id
     LIMIT $1`,
    [limite],
  );
  return r.rows.map((f) => ({ eventoId: f.evento_id, tipo: f.tipo_evento, payload: f.payload }));
}

export async function marcarProcesado(eventoId: string): Promise<void> {
  await pool.query(`UPDATE sync_outbox SET estado = 'procesado', procesado_en = now() WHERE evento_id = $1`, [
    eventoId,
  ]);
}

/** Suma un intento y, al llegar al máximo, lo deja `fallido`. Devuelve si quedó así. */
export async function anotarFallo(eventoId: string, error: string, maximo: number): Promise<boolean> {
  const r = await pool.query(
    `UPDATE sync_outbox
     SET intentos = intentos + 1,
         error    = $2,
         estado   = CASE WHEN intentos + 1 >= $3 THEN 'fallido'::estado_evento ELSE estado END
     WHERE evento_id = $1
     RETURNING estado`,
    [eventoId, error.slice(0, 500), maximo],
  );
  return r.rows[0]?.estado !== 'pendiente';
}
