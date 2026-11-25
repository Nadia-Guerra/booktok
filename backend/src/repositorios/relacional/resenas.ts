// Reseñas y estados de lectura en PostgreSQL (O7, O8, O9, O10, O11 y las lecturas de O17).
// El promedio de cada obra lo calcula el trigger (RN-08): aquí nunca se escribe.
import type { EstadoLectura } from '@dlbp/shared';
import type { PoolClient } from 'pg';
import { anotarEvento, enTransaccion, pool } from '../../bases/postgres.ts';
import type { Cursor } from '../../paginacion.ts';

// Fecha en UTC con microsegundos, para el cursor.
const marca = (columna: string) => `to_char(${columna} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

/** Guarda el estado y devuelve el anterior, con la fila bloqueada hasta terminar la transacción. */
async function fijarEstado(cliente: PoolClient, usuarioId: string, obraId: string, estado: EstadoLectura) {
  const clave = [usuarioId, obraId];
  // Primero se intenta crear: así dos marcas simultáneas de una obra sin estado no leen ambas "ninguno".
  const nueva = await cliente.query(
    `INSERT INTO estado_obra (usuario_id, obra_id, estado) VALUES ($1, $2, $3)
     ON CONFLICT (usuario_id, obra_id) DO NOTHING
     RETURNING actualizado_en`,
    [...clave, estado],
  );
  if (nueva.rows[0]) return { anterior: undefined, actualizadoEn: nueva.rows[0].actualizado_en as Date };

  const previa = await cliente.query(
    'SELECT estado FROM estado_obra WHERE usuario_id = $1 AND obra_id = $2 FOR UPDATE',
    clave,
  );
  const cambiada = await cliente.query(
    `UPDATE estado_obra SET estado = $3, actualizado_en = now()
     WHERE usuario_id = $1 AND obra_id = $2
     RETURNING actualizado_en`,
    [...clave, estado],
  );
  return {
    anterior: previa.rows[0].estado as EstadoLectura,
    actualizadoEn: cambiada.rows[0].actualizado_en as Date,
  };
}

/** Eventos según cómo cambió el estado (O7 y O11). */
async function anotarLectura(
  cliente: PoolClient,
  usuarioId: string,
  obraId: string,
  anterior: EstadoLectura | undefined,
  nuevo: EstadoLectura,
) {
  const payload = { usuario_id: usuarioId, obra_id: obraId };
  if (nuevo === 'terminada' && anterior !== 'terminada') await anotarEvento(cliente, 'obra_leida', payload);
  if (nuevo !== 'terminada' && anterior === 'terminada') await anotarEvento(cliente, 'obra_no_leida', payload);
}

export interface Publicacion {
  usuarioId: string;
  obraId: string;
  resenaIdNueva: string;
  calificacion: number;
  texto: string | null;
}

/**
 * Publica la reseña (O7: reseña, estado `terminada` y evento) o, si el usuario ya tiene una de esa
 * obra, la edita (O8). Todo en una transacción.
 */
export async function publicarOEditar(p: Publicacion) {
  const intentar = () =>
    enTransaccion(async (cliente) => {
      const propia = await cliente.query(
        'SELECT resena_id FROM resena WHERE usuario_id = $1 AND obra_id = $2 FOR UPDATE',
        [p.usuarioId, p.obraId],
      );
      const resenaId: string = propia.rows[0]?.resena_id ?? p.resenaIdNueva;
      const creada = !propia.rows[0];

      if (creada) {
        await cliente.query(
          'INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion, texto) VALUES ($1, $2, $3, $4, $5)',
          [resenaId, p.usuarioId, p.obraId, p.calificacion, p.texto],
        );
        const { anterior } = await fijarEstado(cliente, p.usuarioId, p.obraId, 'terminada');
        await anotarLectura(cliente, p.usuarioId, p.obraId, anterior, 'terminada');
      } else {
        await cliente.query(
          'UPDATE resena SET calificacion = $3, texto = $4, actualizado_en = now() WHERE resena_id = $1 AND usuario_id = $2',
          [resenaId, p.usuarioId, p.calificacion, p.texto],
        );
      }

      const obra = await cliente.query('SELECT promedio, total_resenas FROM obra_resumen WHERE obra_id = $1', [
        p.obraId,
      ]);
      const { promedio, total_resenas } = obra.rows[0];
      return {
        creada,
        resena_id: resenaId,
        promedio: promedio === null ? null : Number(promedio),
        total_resenas: total_resenas as number,
      };
    });

  try {
    return await intentar();
  } catch (e) {
    // Otra petición del mismo usuario publicó a la vez: ahora ya existe y se edita.
    if ((e as { constraint?: string }).constraint === 'uq_resena_usuario_obra') return intentar();
    throw e;
  }
}

/** O9 (el autor) u O10 (con `autorId` nulo, el administrador). El estado de la obra no cambia. */
export async function eliminar(resenaId: string, autorId: string | null): Promise<boolean> {
  const r = await pool.query('DELETE FROM resena WHERE resena_id = $1 AND ($2::uuid IS NULL OR usuario_id = $2)', [
    resenaId,
    autorId,
  ]);
  return r.rowCount === 1;
}

/** O11: estado y evento en la misma transacción. Devuelve cuándo quedó guardado. */
export function marcarEstado(usuarioId: string, obraId: string, estado: EstadoLectura): Promise<Date> {
  return enTransaccion(async (cliente) => {
    const { anterior, actualizadoEn } = await fijarEstado(cliente, usuarioId, obraId, estado);
    await anotarLectura(cliente, usuarioId, obraId, anterior, estado);
    return actualizadoEn;
  });
}

export interface FilaResena {
  resena_id: string;
  obra_id: string;
  usuario_id: string;
  nombre: string;
  calificacion: number;
  texto: string | null;
  oculta: boolean;
  creado_en: Date;
  actualizado_en: Date;
  marca: string;
}

/** O17: reseñas de una obra o de un usuario, las recientes primero. */
export async function listar(
  filtro: { obraId: string } | { usuarioId: string },
  incluirOcultas: boolean,
  limite: number,
  desde?: Cursor,
): Promise<FilaResena[]> {
  // La columna sale de dos textos fijos, nunca de la petición.
  const [columna, valor] = 'obraId' in filtro ? ['obra_id', filtro.obraId] : ['usuario_id', filtro.usuarioId];
  const r = await pool.query(
    `SELECT r.resena_id, r.obra_id, r.usuario_id, u.nombre, r.calificacion, r.texto, r.oculta,
            r.creado_en, r.actualizado_en, ${marca('r.creado_en')} AS marca
     FROM resena r
     JOIN usuario u ON u.usuario_id = r.usuario_id
     WHERE r.${columna} = $1
       AND ($2 OR NOT r.oculta)
       AND ($3::timestamptz IS NULL OR (r.creado_en, r.resena_id) < ($3, $4::uuid))
     ORDER BY r.creado_en DESC, r.resena_id DESC
     LIMIT $5`,
    [valor, incluirOcultas, desde?.fecha ?? null, desde?.id ?? null, limite],
  );
  return r.rows;
}

export interface FilaEstado {
  obra_id: string;
  estado: EstadoLectura;
  actualizado_en: Date;
  marca: string;
}

/** O17: obras de un usuario, todas o las de un estado, las cambiadas más recientemente primero. */
export async function listarEstados(
  usuarioId: string,
  estado: EstadoLectura | undefined,
  limite: number,
  desde?: Cursor,
): Promise<FilaEstado[]> {
  const r = await pool.query(
    `SELECT obra_id, estado, actualizado_en, ${marca('actualizado_en')} AS marca
     FROM estado_obra
     WHERE usuario_id = $1
       AND ($2::estado_lectura IS NULL OR estado = $2)
       AND ($3::timestamptz IS NULL OR (actualizado_en, obra_id) < ($3, $4::uuid))
     ORDER BY actualizado_en DESC, obra_id DESC
     LIMIT $5`,
    [usuarioId, estado ?? null, desde?.fecha ?? null, desde?.id ?? null, limite],
  );
  return r.rows;
}
