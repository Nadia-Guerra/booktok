// Lo que el relacional aporta a las recomendaciones (O18).
import { pool } from '../../bases/postgres.ts';

/**
 * O18: libros que "le gustaron" (RN-11): terminados, con 4 o más y reseña no oculta. Los mejor
 * calificados y más recientes primero.
 */
export async function librosQueLeGustaron(usuarioId: string, limite: number): Promise<string[]> {
  const r = await pool.query(
    `SELECT e.obra_id
     FROM estado_obra e
     JOIN resena r        ON r.usuario_id = e.usuario_id AND r.obra_id = e.obra_id
     JOIN obra_resumen o  ON o.obra_id = e.obra_id
     WHERE e.usuario_id = $1
       AND e.estado = 'terminada'
       AND o.tipo = 'libro'
       AND r.calificacion >= 4
       AND r.oculta = false
     ORDER BY r.calificacion DESC, r.actualizado_en DESC
     LIMIT $2`,
    [usuarioId, limite],
  );
  return r.rows.map((f) => f.obra_id);
}
