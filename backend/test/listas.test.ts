// Etapa 8 (EP-21 y EP-29 a EP-35) por HTTP. Escribe solo con lectores de prueba, que borra al
// terminar (la cascada quita sus listas); las de la semilla solo se leen.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { detalleLista, misListas, redPropia, respuestaListaCreada } from '@dlbp/shared';
import { cerrarMongo } from '../src/bases/mongo.ts';
import { cerrarNeo4j } from '../src/bases/neo4j.ts';
import { cerrarPostgres, pool } from '../src/bases/postgres.ts';
import { esperarError, levantarApi } from './ayudas.ts';

const libro = (n: number) => `b1000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const pelicula = (n: number) => `f1000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ANA = 'c1000000-0000-4000-8000-000000000002';
const LISTA_DE_ANA = '11000000-0000-4000-8000-000000000001';

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

async function crear(l: Lector, nombre = 'Para el verano') {
  const res = await api.pedir('POST', '/me/listas', { token: l.token, cuerpo: { nombre } });
  assert.equal(res.status, 201);
  return respuestaListaCreada.parse(await res.json()).lista_id;
}

const agregar = (l: Lector, lista: string, obra: string) =>
  api.pedir('POST', `/listas/${lista}/obras`, { token: l.token, cuerpo: { obra_id: obra } });

const quitar = (l: Lector, lista: string, obra: string) =>
  api.pedir('DELETE', `/listas/${lista}/obras/${obra}`, { token: l.token });

const cambiar = (l: Lector, lista: string, cuerpo: unknown) =>
  api.pedir('PATCH', `/listas/${lista}`, { token: l.token, cuerpo });

async function ver(l: { token: string }, lista: string) {
  const res = await api.pedir('GET', `/listas/${lista}`, { token: l.token });
  assert.equal(res.status, 200);
  return detalleLista.parse(await res.json());
}

const orden = async (l: Lector, lista: string) => (await ver(l, lista)).obras.map((o) => o.obra_id);

async function mias(l: Lector) {
  const res = await api.pedir('GET', '/me/listas', { token: l.token });
  assert.equal(res.status, 200);
  return misListas.parse(await res.json()).listas;
}

test('todas las rutas de listas exigen sesión', async () => {
  const id = LISTA_DE_ANA;
  for (const [metodo, ruta] of [
    ['GET', '/me/listas'],
    ['POST', '/me/listas'],
    ['GET', `/listas/${id}`],
    ['PATCH', `/listas/${id}`],
    ['DELETE', `/listas/${id}`],
    ['POST', `/listas/${id}/obras`],
    ['DELETE', `/listas/${id}/obras/${libro(1)}`],
    ['GET', '/me/seguimientos'],
  ] as const) {
    await esperarError(await api.pedir(metodo, ruta), 401);
  }
});

test('EP-30 y EP-29: crear listas, con nombres repetidos y validados', async () => {
  const lector = await api.crearLector();
  const primera = await crear(lector, '  Favoritas  ');
  const segunda = await crear(lector, 'Favoritas');
  assert.notEqual(primera, segunda);
  assert.deepEqual(
    (await mias(lector)).map((l) => [l.lista_id, l.nombre, l.total_obras]),
    [
      [segunda, 'Favoritas', 0],
      [primera, 'Favoritas', 0],
    ],
  );
  for (const nombre of [undefined, '   ', 'x'.repeat(101), 5]) {
    await esperarError(await api.pedir('POST', '/me/listas', { token: lector.token, cuerpo: { nombre } }), 400);
  }
});

test('EP-34 y EP-31: las obras quedan en orden, sin repetirse (RN-04) y sin borradores (D-56)', async () => {
  const lector = await api.crearLector();
  const lista = await crear(lector);
  for (const obra of [pelicula(3), libro(1), libro(4)]) assert.equal((await agregar(lector, lista, obra)).status, 201);

  await esperarError(await agregar(lector, lista, libro(1)), 409);
  await esperarError(await agregar(lector, lista, libro(11)), 404); // borrador
  await esperarError(await agregar(lector, lista, randomUUID()), 404);
  await esperarError(await agregar(lector, randomUUID(), libro(2)), 404);

  const detalle = await ver(lector, lista);
  assert.deepEqual(
    detalle.obras.map((o) => o.obra_id),
    [pelicula(3), libro(1), libro(4)],
  );
  assert.equal(detalle.obras[1]!.titulo, 'Dune');
  assert.equal(detalle.propietario.usuario_id, lector.usuario_id);
  assert.equal((await mias(lector))[0]!.total_obras, 3);
});

test('EP-34: agregar muchas obras a la vez no repite posiciones', async () => {
  const lector = await api.crearLector();
  const lista = await crear(lector);
  const obras = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(libro);
  const respuestas = await Promise.all(obras.map((obra) => agregar(lector, lista, obra)));
  assert.ok(respuestas.every((r) => r.status === 201));
  const { rows } = await pool.query('SELECT posicion FROM elemento_lista WHERE lista_id = $1 ORDER BY 1', [lista]);
  assert.deepEqual(
    rows.map((f) => f.posicion),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
});

test('EP-32: renombrar y reordenar; si el orden no cuadra, no cambia nada', async () => {
  const lector = await api.crearLector();
  const lista = await crear(lector);
  const [a, b, c] = [libro(1), libro(2), pelicula(1)];
  for (const obra of [a, b, c]) await agregar(lector, lista, obra);

  for (const obra_ids of [[a, b], [a, b, c, libro(3)], [a, a, b], [a, b, libro(3)], []]) {
    await esperarError(await cambiar(lector, lista, { nombre: 'No debe quedar', obra_ids }), 400);
  }
  assert.deepEqual(await orden(lector, lista), [a, b, c]);
  assert.equal((await ver(lector, lista)).nombre, 'Para el verano');

  const res = await cambiar(lector, lista, { nombre: 'Nuevo', obra_ids: [c, a, b] });
  assert.equal(res.status, 200);
  const nueva = detalleLista.parse(await res.json());
  assert.deepEqual([nueva.nombre, nueva.obras.map((o) => o.obra_id)], ['Nuevo', [c, a, b]]);

  assert.equal((await cambiar(lector, lista, { nombre: 'Solo el nombre' })).status, 200);
  assert.deepEqual(await orden(lector, lista), [c, a, b]);
  await esperarError(await cambiar(lector, lista, {}), 400);
});

test('EP-35: quitar no desordena las demás, y repetirlo no falla', async () => {
  const lector = await api.crearLector();
  const lista = await crear(lector);
  for (const obra of [libro(1), libro(2), libro(3)]) await agregar(lector, lista, obra);

  assert.equal((await quitar(lector, lista, libro(2))).status, 204);
  assert.equal((await quitar(lector, lista, libro(2))).status, 204);
  await agregar(lector, lista, libro(2));
  assert.deepEqual(await orden(lector, lista), [libro(1), libro(3), libro(2)]);
});

test('listas ajenas: se ven al seguir a su dueño y nadie más las cambia (D-54, RN-10)', async () => {
  const dueno = await api.crearLector('Dueña');
  const otro = await api.crearLector();
  const lista = await crear(dueno);
  await agregar(dueno, lista, libro(1));
  const mirar = () => api.pedir('GET', `/listas/${lista}`, { token: otro.token });

  await esperarError(await mirar(), 403);
  await api.pedir('POST', '/me/seguidos', { token: otro.token, cuerpo: { usuario_id: dueno.usuario_id } });
  assert.equal((await ver(otro, lista)).propietario.nombre, 'Dueña');

  await esperarError(await cambiar(otro, lista, { nombre: 'Mía' }), 404);
  await esperarError(await agregar(otro, lista, libro(2)), 404);
  await esperarError(await quitar(otro, lista, libro(1)), 404);
  await esperarError(await api.pedir('DELETE', `/listas/${lista}`, { token: otro.token }), 404);
  assert.deepEqual(await orden(dueno, lista), [libro(1)]);

  await api.pedir('POST', '/me/seguidos', { token: otro.token, cuerpo: { usuario_id: ANA } });
  assert.deepEqual(
    (await ver(otro, LISTA_DE_ANA)).obras.map((o) => o.obra_id),
    [libro(4), pelicula(5), libro(2)],
  );
});

test('EP-33: al eliminar la lista se van sus elementos', async () => {
  const lector = await api.crearLector();
  const lista = await crear(lector);
  await agregar(lector, lista, libro(1));
  const eliminar = () => api.pedir('DELETE', `/listas/${lista}`, { token: lector.token });

  assert.equal((await eliminar()).status, 204);
  await esperarError(await eliminar(), 404);
  await esperarError(await api.pedir('GET', `/listas/${lista}`, { token: lector.token }), 404);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM elemento_lista WHERE lista_id = $1', [lista]);
  assert.equal(rows[0].n, 0);
});

test('EP-21: a quién sigo y quién me sigue', async () => {
  const a = await api.crearLector('Una');
  const b = await api.crearLector('Dos');
  await api.pedir('POST', '/me/seguidos', { token: a.token, cuerpo: { usuario_id: b.usuario_id } });
  const red = async (l: Lector) =>
    redPropia.parse(await (await api.pedir('GET', '/me/seguimientos', { token: l.token })).json());

  assert.deepEqual(await red(a), { seguidos: [{ usuario_id: b.usuario_id, nombre: 'Dos' }], seguidores: [] });
  assert.deepEqual(await red(b), { seguidos: [], seguidores: [{ usuario_id: a.usuario_id, nombre: 'Una' }] });

  const sofia = await api.entrarComo('sofia');
  const suya = redPropia.parse(await (await api.pedir('GET', '/me/seguimientos', { token: sofia })).json());
  assert.deepEqual(suya.seguidos.map((u) => u.nombre.split(' ')[0]).sort(), ['Ana', 'Diego', 'Pedro']);
  await api.salir(sofia);
});
