// Conexión a PostgreSQL. Solo la usan los repositorios relacionales.
import pg from 'pg';
import { config } from '../config.ts';

export const pool = new pg.Pool({
  ...config.postgres,
  max: 10, // D-36: el servidor admite 20 conexiones
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30_000,
  options: '-c timezone=UTC',
});

// Sin este oyente, un corte de la base con conexiones ociosas tumba el proceso.
pool.on('error', (e) => console.error('PostgreSQL: conexión ociosa perdida:', e.message));

const REINTENTOS = 3;
const INTERBLOQUEO = '40P01'; // D-38: se puede reintentar la transacción entera

/** Ejecuta `trabajo` en una transacción: confirma si termina bien y revierte si falla. */
export async function enTransaccion<T>(trabajo: (cliente: pg.PoolClient) => Promise<T>): Promise<T> {
  for (let intento = 1; ; intento++) {
    const cliente = await pool.connect();
    let roto: Error | undefined;
    try {
      await cliente.query('BEGIN');
      const resultado = await trabajo(cliente);
      await cliente.query('COMMIT');
      return resultado;
    } catch (e) {
      // Si ni siquiera se puede revertir, la conexión no vuelve al grupo.
      await cliente.query('ROLLBACK').catch((fallo: Error) => {
        roto = fallo;
      });
      if ((e as { code?: string }).code !== INTERBLOQUEO || intento >= REINTENTOS) throw e;
    } finally {
      cliente.release(roto);
    }
  }
}

export type TipoEvento =
  | 'usuario_creado'
  | 'usuario_eliminado'
  | 'seguimiento_creado'
  | 'seguimiento_eliminado'
  | 'obra_leida'
  | 'obra_no_leida';

/** Anota un evento en `sync_outbox` dentro de la transacción que hace el cambio (D-04). */
export async function anotarEvento(cliente: pg.PoolClient, tipo: TipoEvento, payload: Record<string, string>) {
  await cliente.query('INSERT INTO sync_outbox (tipo_evento, payload) VALUES ($1, $2)', [tipo, payload]);
}

export function cerrarPostgres(): Promise<void> {
  return pool.end();
}
