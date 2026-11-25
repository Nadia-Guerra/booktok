// Conexión a PostgreSQL. Solo la usan los repositorios relacionales.
import pg from 'pg';
import { config } from '../config.ts';

export const pool = new pg.Pool({
  ...config.postgres,
  max: 10, // D-36: el servidor admite 20 conexiones
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30_000,
  // Las columnas son TIMESTAMP sin zona y se guardan en UTC.
  options: '-c timezone=UTC',
});

// Sin este oyente, un corte de la base con conexiones ociosas tumba el proceso.
pool.on('error', (e) => console.error('PostgreSQL: conexión ociosa perdida:', e.message));

export function cerrarPostgres(): Promise<void> {
  return pool.end();
}
