// Usuarios y sesiones en PostgreSQL (O1, O2, O3, O17, O22, O23).
import type { PerfilCambios, PerfilPropio, RolUsuario } from '@dlbp/shared';
import { anotarEvento, enTransaccion, pool } from '../../bases/postgres.ts';

const PERFIL = 'usuario_id, correo, nombre, biografia, rol';

export interface UsuarioNuevo {
  usuarioId: string;
  correo: string;
  passwordHash: string;
  nombre: string;
}

/** O1: usuario y evento `usuario_creado` en la misma transacción. */
export async function crearUsuario(u: UsuarioNuevo): Promise<'creado' | 'correo_en_uso'> {
  try {
    await enTransaccion(async (cliente) => {
      await cliente.query(
        'INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES ($1, $2, $3, $4)',
        [u.usuarioId, u.correo, u.passwordHash, u.nombre],
      );
      await anotarEvento(cliente, 'usuario_creado', { usuario_id: u.usuarioId });
    });
    return 'creado';
  } catch (e) {
    const { code, constraint } = e as { code?: string; constraint?: string };
    if (code === '23505' && constraint === 'uq_usuario_correo') return 'correo_en_uso';
    throw e;
  }
}

/** O2, paso 1: el usuario de un correo ya normalizado, con su hash. */
export async function buscarPorCorreo(
  correo: string,
): Promise<(PerfilPropio & { password_hash: string }) | undefined> {
  const r = await pool.query(`SELECT ${PERFIL}, password_hash FROM usuario WHERE correo = $1`, [correo]);
  return r.rows[0];
}

/** O2, paso 2: guarda solo el hash SHA-256 del token (D-35). Devuelve cuándo vence. */
export async function crearSesion(tokenHash: string, usuarioId: string): Promise<Date> {
  const r = await pool.query(
    `INSERT INTO sesion (token_hash, usuario_id, expira_en)
     VALUES ($1, $2, now() + interval '30 days')
     RETURNING expira_en`,
    [tokenHash, usuarioId],
  );
  return r.rows[0].expira_en;
}

/** O22: quién es y qué rol tiene ahora el dueño de una sesión vigente. */
export async function buscarSesion(tokenHash: string): Promise<{ usuario_id: string; rol: RolUsuario } | undefined> {
  const r = await pool.query(
    `SELECT u.usuario_id, u.rol
     FROM sesion s
     JOIN usuario u ON u.usuario_id = s.usuario_id
     WHERE s.token_hash = $1
       AND s.expira_en > now()`,
    [tokenHash],
  );
  return r.rows[0];
}

/** O23: borra solo la sesión de la petición actual. */
export async function borrarSesion(tokenHash: string): Promise<void> {
  await pool.query('DELETE FROM sesion WHERE token_hash = $1', [tokenHash]);
}

/** O17: perfil por clave primaria. */
export async function buscarPerfil(usuarioId: string): Promise<PerfilPropio | undefined> {
  const r = await pool.query(`SELECT ${PERFIL} FROM usuario WHERE usuario_id = $1`, [usuarioId]);
  return r.rows[0];
}

/** O3: cambia solo lo que se envía. `biografia: null` la borra. */
export async function actualizarPerfil(usuarioId: string, c: PerfilCambios): Promise<PerfilPropio | undefined> {
  const r = await pool.query(
    `UPDATE usuario
     SET nombre    = COALESCE($2, nombre),
         biografia = CASE WHEN $3 THEN $4 ELSE biografia END
     WHERE usuario_id = $1
     RETURNING ${PERFIL}`,
    [usuarioId, c.nombre ?? null, c.biografia !== undefined, c.biografia ?? null],
  );
  return r.rows[0];
}
