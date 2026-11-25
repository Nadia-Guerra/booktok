// Etapa 5 (EP-19, EP-20 y EP-22) por HTTP. Escribe solo con lectores de prueba, que borra al terminar.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { perfilDeOtro, respuestaSeguir } from '@dlbp/shared';
import { cerrarMongo } from '../src/bases/mongo.ts';
import { cerrarNeo4j } from '../src/bases/neo4j.ts';
import { cerrarPostgres, pool } from '../src/bases/postgres.ts';
import { esperarError, levantarApi } from './ayudas.ts';

const ANA = 'c1000000-0000-4000-8000-000000000002';

let api: Awaited<ReturnType<typeof levantarApi>>;

before(async () => {
  api = await levantarApi();
});

after(async () => {
  await api.borrarLectores();
  api.cerrar();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
});

type Lector = Awaited<ReturnType<typeof api.crearLector>>;

const seguir = (l: Lector, usuarioId: unknown) =>
  api.pedir('POST', '/me/seguidos', { cuerpo: { usuario_id: usuarioId }, token: l.token });

const dejar = (l: Lector, usuarioId: string) => api.pedir('DELETE', `/me/seguidos/${usuarioId}`, { token: l.token });

const ver = (l: Lector, usuarioId: string) => api.pedir('GET', `/usuarios/${usuarioId}`, { token: l.token });

const eventos = async (seguidorId: string): Promise<string[]> =>
  (
    await pool.query(
      `SELECT tipo_evento FROM sync_outbox WHERE payload->>'seguidor_id' = $1 ORDER BY evento_id`,
      [seguidorId],
    )
  ).rows.map((f) => f.tipo_evento);

test('las tres rutas exigen sesión', async () => {
  await esperarError(await api.pedir('POST', '/me/seguidos', { cuerpo: { usuario_id: ANA } }), 401);
  await esperarError(await api.pedir('DELETE', `/me/seguidos/${ANA}`), 401);
  await esperarError(await api.pedir('GET', `/usuarios/${ANA}`), 401);
});

test('seguir: 201, y repetirlo da 409 sin un segundo evento', async () => {
  const a = await api.crearLector();
  const b = await api.crearLector();

  const res = await seguir(a, b.usuario_id.toUpperCase()); // D-11: se normaliza al entrar
  assert.equal(res.status, 201);
  assert.equal(respuestaSeguir.parse(await res.json()).usuario_id, b.usuario_id);

  await esperarError(await seguir(a, b.usuario_id), 409);
  assert.deepEqual(await eventos(a.usuario_id), ['seguimiento_creado']);
});

test('seguir: no a uno mismo, ni a quien no existe, ni con un id mal escrito', async () => {
  const a = await api.crearLector();
  await esperarError(await seguir(a, a.usuario_id), 400);
  await esperarError(await seguir(a, randomUUID()), 404);
  await esperarError(await seguir(a, 'no-es-un-id'), 400);
  await esperarError(await seguir(a, undefined), 400);
  assert.deepEqual(await eventos(a.usuario_id), []);
});

test('dejar de seguir: 204 siempre, con evento solo si lo seguía', async () => {
  const a = await api.crearLector();
  const b = await api.crearLector();

  assert.equal((await dejar(a, b.usuario_id)).status, 204);
  assert.deepEqual(await eventos(a.usuario_id), []);

  assert.equal((await seguir(a, b.usuario_id)).status, 201);
  assert.equal((await dejar(a, b.usuario_id)).status, 204);
  assert.equal((await dejar(a, b.usuario_id)).status, 204);
  assert.deepEqual(await eventos(a.usuario_id), ['seguimiento_creado', 'seguimiento_eliminado']);
});

test('perfil de otro: lo básico para cualquiera, las listas solo al seguirlo (D-54)', async () => {
  const a = await api.crearLector();

  const antes = await (await ver(a, ANA)).json();
  assert.deepEqual(Object.keys(antes as object).sort(), ['biografia', 'lo_sigo', 'nombre', 'usuario_id']);
  assert.equal(perfilDeOtro.parse(antes).lo_sigo, false);
  await esperarError(await api.pedir('GET', `/resenas?usuario_id=${ANA}`, { token: a.token }), 403);

  assert.equal((await seguir(a, ANA)).status, 201);
  const despues = perfilDeOtro.parse(await (await ver(a, ANA)).json());
  assert.equal(despues.lo_sigo, true);
  assert.deepEqual(
    despues.listas?.map((l) => l.nombre),
    ['Por ver este año'],
  );
  assert.equal((await api.pedir('GET', `/resenas?usuario_id=${ANA}`, { token: a.token })).status, 200);

  assert.equal((await dejar(a, ANA)).status, 204);
  assert.equal(perfilDeOtro.parse(await (await ver(a, ANA)).json()).listas, undefined);
});

test('perfil propio y perfil inexistente', async () => {
  const a = await api.crearLector('Soy yo');
  const propio = perfilDeOtro.parse(await (await ver(a, a.usuario_id)).json());
  assert.deepEqual([propio.nombre, propio.lo_sigo, propio.listas], ['Soy yo', false, []]);
  await esperarError(await ver(a, randomUUID()), 404);
});
