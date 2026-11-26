// Lo que PostgreSQL dice que debe haber en el grafo, para la reconciliación (RNF-03).
import { pool } from '../../bases/postgres.ts';
import type { Par } from '../../servicios/reconciliacion.ts';

export async function seguimientos(): Promise<Par[]> {
  const r = await pool.query('SELECT seguidor_id AS origen, seguido_id AS destino FROM seguimiento');
  return r.rows;
}

/** Solo los libros: el grafo no guarda las películas terminadas (D-16). */
export async function librosTerminados(): Promise<Par[]> {
  const r = await pool.query(
    `SELECT e.usuario_id AS origen, e.obra_id AS destino
     FROM estado_obra e JOIN obra_resumen o ON o.obra_id = e.obra_id
     WHERE e.estado = 'terminada' AND o.tipo = 'libro'`,
  );
  return r.rows;
}

/** Eventos que el worker aún no aplicó o que ya no reintentará. */
export async function eventosSinAplicar(): Promise<{ pendientes: number; fallidos: number }> {
  const r = await pool.query(
    `SELECT count(*) FILTER (WHERE estado = 'pendiente')::int AS pendientes,
            count(*) FILTER (WHERE estado = 'fallido')::int AS fallidos
     FROM sync_outbox`,
  );
  return r.rows[0];
}
