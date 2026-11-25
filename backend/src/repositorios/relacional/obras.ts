// Lo que el relacional sabe de una obra para su ficha (O17).
import type { EstadoLectura, MiResena, TipoObra } from '@dlbp/shared';
import { pool } from '../../bases/postgres.ts';

/** Promedio y total de reseñas visibles. Los mantiene el trigger (RN-08): aquí solo se leen. */
export async function calificacion(obraId: string): Promise<{ promedio: number | null; total_resenas: number }> {
  const r = await pool.query('SELECT promedio, total_resenas FROM obra_resumen WHERE obra_id = $1', [obraId]);
  const fila = r.rows[0];
  // `pg` entrega NUMERIC como texto para no perder precisión.
  return {
    promedio: fila?.promedio == null ? null : Number(fila.promedio),
    total_resenas: fila?.total_resenas ?? 0,
  };
}

/** El tipo según `obra_resumen`: el worker lo usa para descartar las lecturas de películas (D-16). */
export async function tipoDe(obraId: string): Promise<TipoObra | undefined> {
  const r = await pool.query('SELECT tipo FROM obra_resumen WHERE obra_id = $1', [obraId]);
  return r.rows[0]?.tipo;
}

export async function estadoDe(usuarioId: string, obraId: string): Promise<EstadoLectura | null> {
  const r = await pool.query('SELECT estado FROM estado_obra WHERE usuario_id = $1 AND obra_id = $2', [
    usuarioId,
    obraId,
  ]);
  return r.rows[0]?.estado ?? null;
}

/** La reseña propia, aunque esté oculta: es de quien la pide. */
export async function resenaDe(usuarioId: string, obraId: string): Promise<MiResena | null> {
  const r = await pool.query(
    `SELECT resena_id, calificacion, texto, oculta, creado_en, actualizado_en
     FROM resena WHERE usuario_id = $1 AND obra_id = $2`,
    [usuarioId, obraId],
  );
  const f = r.rows[0];
  return f
    ? { ...f, creado_en: f.creado_en.toISOString(), actualizado_en: f.actualizado_en.toISOString() }
    : null;
}

/** O5: la obra entra al relacional. Repetirlo no hace nada. */
export async function registrar(obraId: string, tipo: TipoObra): Promise<void> {
  await pool.query('INSERT INTO obra_resumen (obra_id, tipo) VALUES ($1, $2) ON CONFLICT (obra_id) DO NOTHING', [
    obraId,
    tipo,
  ]);
}
