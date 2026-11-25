// Etapa 2 (EP-02 a EP-06) por HTTP. Necesita PostgreSQL con la semilla.
// Crea usuarios de prueba y, al terminar, borra solo los que creó (con sus sesiones y eventos).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { cuerpoError, perfilPropio, respuestaRegistro, respuestaSesion } from '@dlbp/shared';
import { crearApp } from '../src/app.ts';
import { cerrarPostgres, pool } from '../src/bases/postgres.ts';

let servidor: Server;
let base: string;
const creados: string[] = [];

const correoNuevo = () => `prueba-${randomUUID()}@ejemplo.test`;
const CLAVE = `clave-${randomUUID()}`;

before(async () => {
  servidor = crearApp().listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/api/v1`;
});

after(async () => {
  servidor.close();
  // Las sesiones caen por la cascada; los eventos hay que borrarlos aparte.
  await pool.query(`DELETE FROM sync_outbox WHERE payload->>'usuario_id' = ANY($1)`, [creados]);
  await pool.query('DELETE FROM usuario WHERE usuario_id = ANY($1::uuid[])', [creados]);
  await cerrarPostgres();
});

function pedir(metodo: string, ruta: string, cuerpo?: unknown, token?: string) {
  const headers: Record<string, string> = {};
  if (cuerpo !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  return fetch(base + ruta, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
}

async function error(res: Response, estado: number) {
  assert.equal(res.status, estado);
  return cuerpoError.parse(await res.json()).error;
}

async function registrar(datos: Record<string, unknown> = {}) {
  const entrada = { correo: correoNuevo(), password: CLAVE, nombre: 'Persona de prueba', ...datos };
  const res = await pedir('POST', '/auth/registro', entrada);
  assert.equal(res.status, 201);
  const { usuario_id } = respuestaRegistro.parse(await res.json());
  creados.push(usuario_id);
  return { usuario_id, correo: String(entrada.correo), password: String(entrada.password) };
}

async function entrar(correo: string, password = CLAVE) {
  const res = await pedir('POST', '/auth/sesion', { correo, password });
  assert.equal(res.status, 201);
  return respuestaSesion.parse(await res.json());
}

const contar = async (sql: string, valor: string) => Number((await pool.query(sql, [valor])).rows[0].n);

test('EP-02: registra un lector, normaliza el correo y deja el evento usuario_creado', async () => {
  const correo = correoNuevo();
  const { usuario_id } = await registrar({ correo: `  ${correo.toUpperCase()}  ` });
  assert.match(usuario_id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

  const fila = (await pool.query('SELECT correo, rol, password_hash FROM usuario WHERE usuario_id = $1', [usuario_id]))
    .rows[0];
  assert.equal(fila.correo, correo);
  assert.equal(fila.rol, 'lector');
  assert.match(fila.password_hash, /^\$2b\$10\$/);
  const eventos = await contar(
    `SELECT count(*) AS n FROM sync_outbox WHERE tipo_evento = 'usuario_creado' AND payload->>'usuario_id' = $1`,
    usuario_id,
  );
  assert.equal(eventos, 1);
});

test('EP-02: un correo ya registrado da 409 y no deja usuario ni evento', async () => {
  const { correo } = await registrar();
  const antes = await contar(`SELECT count(*) AS n FROM sync_outbox WHERE tipo_evento = $1`, 'usuario_creado');
  const e = await error(
    await pedir('POST', '/auth/registro', { correo: correo.toUpperCase(), password: CLAVE, nombre: 'Otra' }),
    409,
  );
  assert.equal(e.codigo, 'conflicto');
  assert.equal(await contar('SELECT count(*) AS n FROM usuario WHERE correo = $1', correo), 1);
  assert.equal(await contar(`SELECT count(*) AS n FROM sync_outbox WHERE tipo_evento = $1`, 'usuario_creado'), antes);
});

test('EP-02: la entrada inválida da 400 y dice qué campo falla', async () => {
  const e = await error(
    await pedir('POST', '/auth/registro', { correo: 'no-es-correo', password: '1234567', nombre: '   ' }),
    400,
  );
  assert.deepEqual(Object.keys(e.campos ?? {}).sort(), ['correo', 'nombre', 'password']);
  const sinCuerpo = await error(await pedir('POST', '/auth/registro'), 400);
  assert.equal(sinCuerpo.codigo, 'entrada_invalida');
  const largos = await error(
    await pedir('POST', '/auth/registro', { correo: correoNuevo(), password: CLAVE, nombre: 'a'.repeat(101) }),
    400,
  );
  assert.deepEqual(Object.keys(largos.campos ?? {}), ['nombre']);
  await error(
    await pedir('POST', '/auth/registro', { correo: correoNuevo(), password: CLAVE, nombre: 'a\u0000b' }),
    400,
  );
});

test('EP-03: entrega un token y en la base solo queda su SHA-256, con 30 días de vigencia', async () => {
  const { usuario_id, correo } = await registrar();
  const sesion = await entrar(correo.toUpperCase());
  assert.equal(sesion.usuario.usuario_id, usuario_id);
  assert.equal(Buffer.from(sesion.token, 'base64url').length, 32);
  assert.ok(!('password_hash' in sesion.usuario));

  const filas = (
    await pool.query(
      `SELECT token_hash, extract(epoch FROM expira_en - creado_en) AS segundos FROM sesion WHERE usuario_id = $1`,
      [usuario_id],
    )
  ).rows;
  assert.equal(filas.length, 1);
  assert.match(filas[0].token_hash, /^[0-9a-f]{64}$/);
  assert.notEqual(filas[0].token_hash, sesion.token);
  assert.equal(Number(filas[0].segundos), 30 * 24 * 3600);
});

test('EP-03: contraseña mala y correo inexistente responden exactamente lo mismo', async () => {
  const { correo } = await registrar();
  const mala = await pedir('POST', '/auth/sesion', { correo, password: 'otra-distinta' });
  const inexistente = await pedir('POST', '/auth/sesion', { correo: correoNuevo(), password: CLAVE });
  assert.equal(mala.status, 401);
  assert.equal(inexistente.status, 401);
  assert.deepEqual(await mala.json(), await inexistente.json());
});

test('EP-03: un usuario de la semilla (hash $2a$) puede entrar', async () => {
  // La contraseña de prueba solo vive en este README: se lee de ahí y no se copia.
  const readme = readFileSync(new URL('../../db/semilla/README.md', import.meta.url), 'utf8');
  const clave = readme.split('## Usuarios de prueba')[1]?.match(/```\r?\n(.+?)\r?\n```/)?.[1];
  assert.ok(clave, 'no se encontró la contraseña de prueba en db/semilla/README.md');
  const sesion = await entrar('ana@ejemplo.test', clave);
  assert.equal(sesion.usuario.rol, 'lector');
  assert.equal((await pedir('DELETE', '/auth/sesion', undefined, sesion.token)).status, 204);
});

test('EP-05: devuelve el perfil propio; sin token o con uno falso da 401', async () => {
  const { usuario_id, correo } = await registrar({ nombre: 'Nombre Propio' });
  const { token } = await entrar(correo);
  const res = await pedir('GET', '/me', undefined, token);
  assert.equal(res.status, 200);
  assert.deepEqual(perfilPropio.strict().parse(await res.json()), {
    usuario_id,
    correo,
    nombre: 'Nombre Propio',
    biografia: null,
    rol: 'lector',
  });
  await error(await pedir('GET', '/me'), 401);
  await error(await pedir('GET', '/me', undefined, 'token-inventado'), 401);
  const sinEsquema = await fetch(`${base}/me`, { headers: { authorization: token } });
  await error(sinEsquema, 401);
});

test('EP-05: el rol se lee en cada petición y una sesión vencida no sirve', async () => {
  const { usuario_id, correo } = await registrar();
  const { token } = await entrar(correo);

  await pool.query(`UPDATE usuario SET rol = 'admin' WHERE usuario_id = $1`, [usuario_id]);
  assert.equal(((await (await pedir('GET', '/me', undefined, token)).json()) as { rol: string }).rol, 'admin');

  await pool.query(
    `UPDATE sesion SET creado_en = now() - interval '31 days', expira_en = now() - interval '1 day'
     WHERE usuario_id = $1`,
    [usuario_id],
  );
  await error(await pedir('GET', '/me', undefined, token), 401);
});

test('EP-06: cambia solo lo enviado, borra la biografía y no deja cambiar el rol', async () => {
  const { correo } = await registrar({ nombre: 'Antes' });
  const { token } = await entrar(correo);
  const cambiar = async (cuerpo: unknown) => {
    const res = await pedir('PATCH', '/me', cuerpo, token);
    assert.equal(res.status, 200);
    return perfilPropio.parse(await res.json());
  };

  let perfil = await cambiar({ biografia: "Leo y veo '; DROP TABLE usuario; --" });
  assert.equal(perfil.nombre, 'Antes');
  assert.equal(perfil.biografia, "Leo y veo '; DROP TABLE usuario; --");

  perfil = await cambiar({ nombre: 'Después', rol: 'admin', correo: 'otro@ejemplo.test' });
  assert.equal(perfil.nombre, 'Después');
  assert.equal(perfil.biografia, "Leo y veo '; DROP TABLE usuario; --");
  assert.equal(perfil.rol, 'lector');
  assert.equal(perfil.correo, correo);

  assert.equal((await cambiar({ biografia: '' })).biografia, null);
  await error(await pedir('PATCH', '/me', {}, token), 400);
  await error(await pedir('PATCH', '/me', { rol: 'admin' }, token), 400);
  await error(await pedir('PATCH', '/me', { nombre: null }, token), 400);
  await error(await pedir('PATCH', '/me', { biografia: 'a'.repeat(501) }, token), 400);
  await error(await pedir('PATCH', '/me', { nombre: 'Sin sesión' }), 401);
});

test('EP-04: cierra solo esa sesión; las demás siguen valiendo', async () => {
  const { correo } = await registrar();
  const una = await entrar(correo);
  const otra = await entrar(correo);

  const res = await pedir('DELETE', '/auth/sesion', undefined, una.token);
  assert.equal(res.status, 204);
  await error(await pedir('GET', '/me', undefined, una.token), 401);
  await error(await pedir('DELETE', '/auth/sesion', undefined, una.token), 401);
  assert.equal((await pedir('GET', '/me', undefined, otra.token)).status, 200);
});
