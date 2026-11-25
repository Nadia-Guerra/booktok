// Etapa 7 (EP-12, EP-23 y EP-25 a EP-28) por HTTP. Escribe solo con lectores de prueba, que borra al
// terminar; las comparativas de la semilla solo se leen.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import {
  respuestaComparativaCreada,
  respuestaComparativas,
  respuestaPublicacion,
  respuestaResenaOculta,
} from '@dlbp/shared';
import { cerrarMongo, mongoDb } from '../src/bases/mongo.ts';
import { cerrarNeo4j } from '../src/bases/neo4j.ts';
import { cerrarPostgres, pool } from '../src/bases/postgres.ts';
import { esperarError, levantarApi } from './ayudas.ts';

const libro = (n: number) => `b1000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const pelicula = (n: number) => `f1000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const DE_DUNE = `libro_id=${libro(1)}&pelicula_id=${pelicula(1)}`;
const DE_EXPIACION = `libro_id=${libro(9)}&pelicula_id=${pelicula(10)}`; // la de la semilla está oculta
const ELENA = 'c1000000-0000-4000-8000-000000000008';

let api: Awaited<ReturnType<typeof levantarApi>>;
let admin: string;
let elena: string;
let promediosAntes: string;

const fotoDePromedios = async () =>
  JSON.stringify((await pool.query('SELECT obra_id, promedio, total_resenas FROM obra_resumen ORDER BY 1')).rows);

before(async () => {
  promediosAntes = await fotoDePromedios();
  api = await levantarApi();
  admin = await api.entrarComo('admin');
  elena = await api.entrarComo('elena');
});

after(async () => {
  await api.borrarLectores();
  await api.salir(admin);
  await api.salir(elena);
  api.cerrar();
  const promediosDespues = await fotoDePromedios();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
  assert.equal(promediosDespues, promediosAntes, 'los promedios no volvieron a su valor');
});

type Lector = Awaited<ReturnType<typeof api.crearLector>>;

async function listar(consulta: string, token?: string) {
  const res = await api.pedir('GET', `/comparativas?${consulta}`, { token });
  assert.equal(res.status, 200, consulta);
  return respuestaComparativas.parse(await res.json());
}

const entrada = (cambios: Record<string, unknown> = {}) => ({
  libro_id: libro(1),
  pelicula_id: pelicula(1),
  veredicto: { preferencia: 'empate', comentario: '' },
  aspectos: [{ nombre: ' Ritmo ', puntuacion: null }],
  ...cambios,
});

const crear = (l: Lector, cuerpo: unknown) => api.pedir('POST', '/comparativas', { token: l.token, cuerpo });

async function crearBien(l: Lector, cuerpo: unknown = entrada()) {
  const res = await crear(l, cuerpo);
  assert.equal(res.status, 201);
  return respuestaComparativaCreada.parse(await res.json()).comparativa_id;
}

const delLector = async (l: Lector) => (await listar(`usuario_id=${l.usuario_id}`, l.token)).comparativas;

test('EP-23: las de una adaptación son públicas, con autor y obras, las recientes primero', async () => {
  const { comparativas } = await listar(DE_DUNE);
  assert.deepEqual(
    comparativas.map((c) => c.autor.nombre.split(' ')[0]),
    ['Marta', 'Ana'],
  );
  assert.ok(comparativas.every((c) => c.libro.titulo === 'Dune' && c.pelicula.tipo === 'pelicula' && !c.oculta));

  const primera = await listar(`${DE_DUNE}&limite=1`);
  const segunda = await listar(`${DE_DUNE}&limite=1&cursor=${primera.siguiente}`);
  assert.deepEqual(
    [...primera.comparativas, ...segunda.comparativas].map((c) => c.comparativa_id),
    comparativas.map((c) => c.comparativa_id),
  );
  assert.equal(segunda.siguiente, null);
});

test('EP-23: una oculta la ven su autor y el administrador, nadie más', async () => {
  assert.equal((await listar(DE_EXPIACION)).comparativas.length, 0);
  const lector = await api.crearLector();
  assert.equal((await listar(DE_EXPIACION, lector.token)).comparativas.length, 0);
  assert.equal((await listar(DE_EXPIACION, elena)).comparativas.length, 1);
  assert.equal((await listar(DE_EXPIACION, admin)).comparativas.length, 1);
});

test('EP-23: el historial de otra persona pide seguirla (D-54); la consulta, una forma válida', async () => {
  const lector = await api.crearLector();
  const ruta = `/comparativas?usuario_id=${ELENA}`;
  await esperarError(await api.pedir('GET', ruta), 401);
  await esperarError(await api.pedir('GET', ruta, { token: lector.token }), 403);
  await api.pedir('POST', '/me/seguidos', { token: lector.token, cuerpo: { usuario_id: ELENA } });
  assert.equal((await listar(`usuario_id=${ELENA}`, lector.token)).comparativas.length, 0); // la suya está oculta
  assert.equal((await listar(`${DE_EXPIACION}&usuario_id=${ELENA}`, elena)).comparativas.length, 1);

  for (const consulta of ['', `?libro_id=${libro(1)}`, `?pelicula_id=${pelicula(1)}&usuario_id=${ELENA}`]) {
    await esperarError(await api.pedir('GET', `/comparativas${consulta}`), 400);
  }
});

test('EP-25: crea la comparativa sin guardar campos vacíos, y una sola por pareja (RN-05)', async () => {
  const lector = await api.crearLector();
  const id = await crearBien(lector);

  const guardada = (await mongoDb.collection<{ _id: string }>('resenas_comparativas').findOne({ _id: id })) as Record<
    string,
    unknown
  >;
  assert.deepEqual(guardada.veredicto, { preferencia: 'empate' });
  assert.deepEqual(guardada.aspectos, [{ nombre: 'Ritmo' }]);

  await esperarError(await crear(lector, entrada()), 409);
  assert.equal((await delLector(lector)).length, 1);
});

test('EP-25: solo sobre una adaptación real, con obras publicadas (RN-06, D-56)', async () => {
  const lector = await api.crearLector();
  await esperarError(await crear(lector, entrada({ pelicula_id: pelicula(3) })), 409); // otra historia
  await esperarError(await crear(lector, entrada({ libro_id: pelicula(1) })), 404);
  await esperarError(await crear(lector, entrada({ pelicula_id: libro(1) })), 404);
  await esperarError(await crear(lector, entrada({ libro_id: libro(11), pelicula_id: pelicula(12) })), 404);
  await esperarError(await crear(lector, entrada({ libro_id: randomUUID() })), 404);
  await esperarError(await api.pedir('POST', '/comparativas', { cuerpo: entrada() }), 401);
  assert.equal((await delLector(lector)).length, 0);
});

test('EP-25: valida veredicto y aspectos', async () => {
  const lector = await api.crearLector();
  const malas = [
    { aspectos: [] },
    { aspectos: Array.from({ length: 11 }, (_, i) => ({ nombre: `a${i}` })) },
    { aspectos: [{ nombre: '  ' }] },
    { aspectos: [{ nombre: 'Final', puntuacion: 6 }] },
    { aspectos: [{ nombre: 'Final', puntuacion: 2.5 }] },
    { aspectos: [{ nombre: 'x'.repeat(61) }] },
    { veredicto: { preferencia: 'ninguno' } },
    { veredicto: undefined },
  ];
  for (const cambios of malas) await esperarError(await crear(lector, entrada(cambios)), 400);

  const diez = Array.from({ length: 10 }, (_, i) => ({ nombre: `a${i}`, puntuacion: 5, comentario: 'x'.repeat(1000) }));
  await crearBien(lector, entrada({ aspectos: diez }));
});

test('EP-26: solo la edita su autor, ni siquiera el administrador (RN-10)', async () => {
  const autor = await api.crearLector();
  const otro = await api.crearLector();
  const id = await crearBien(autor);
  const cambios = { veredicto: { preferencia: 'libro' }, aspectos: [{ nombre: 'Final', puntuacion: 3 }] };
  const editar = (token: string) => api.pedir('PUT', `/comparativas/${id}`, { token, cuerpo: cambios });

  await esperarError(await editar(otro.token), 404);
  await esperarError(await editar(admin), 404);

  const res = await editar(autor.token);
  assert.equal(res.status, 200);
  const [guardada] = await delLector(autor);
  assert.deepEqual(guardada!.veredicto, cambios.veredicto);
  assert.deepEqual(guardada!.aspectos, cambios.aspectos);
  assert.ok(guardada!.actualizado_en > guardada!.creado_en);
});

test('EP-27: el administrador la oculta y la vuelve a mostrar sin cambiar su fecha', async () => {
  const autor = await api.crearLector();
  const id = await crearBien(autor);
  const fecha = (await delLector(autor))[0]!.actualizado_en;
  const moderar = (token: string, oculta: unknown, cual = id) =>
    api.pedir('PATCH', `/comparativas/${cual}`, { token, cuerpo: { oculta } });
  const publica = async () => (await listar(DE_DUNE)).comparativas.some((c) => c.comparativa_id === id);

  await esperarError(await moderar(autor.token, true), 403);
  await esperarError(await moderar(admin, 'true'), 400);
  await esperarError(await moderar(admin, true, randomUUID()), 404);

  assert.equal((await moderar(admin, true)).status, 200);
  assert.equal(await publica(), false);
  const [suya] = await delLector(autor);
  assert.deepEqual([suya!.oculta, suya!.actualizado_en], [true, fecha]);

  assert.equal((await moderar(admin, false)).status, 200);
  assert.equal(await publica(), true);
});

test('EP-28: la borra su autor o el administrador', async () => {
  const autor = await api.crearLector();
  const otro = await api.crearLector();
  const borrar = (id: string, token: string) => api.pedir('DELETE', `/comparativas/${id}`, { token });

  const propia = await crearBien(autor);
  await esperarError(await borrar(propia, otro.token), 404);
  assert.equal((await borrar(propia, autor.token)).status, 204);
  await esperarError(await borrar(propia, autor.token), 404);

  const ajena = await crearBien(autor);
  assert.equal((await borrar(ajena, admin)).status, 204);
  assert.equal((await delLector(autor)).length, 0);
});

test('EP-12: ocultar una reseña la saca del promedio y mostrarla la devuelve', async () => {
  const lector = await api.crearLector();
  const publicada = respuestaPublicacion.parse(
    await (await api.pedir('PUT', `/obras/${libro(1)}/resena`, { token: lector.token, cuerpo: { calificacion: 1 } })).json(),
  );
  const moderar = (token: string, oculta: boolean) =>
    api.pedir('PATCH', `/resenas/${publicada.resena_id}`, { token, cuerpo: { oculta } });

  await esperarError(await moderar(lector.token, true), 403);

  const oculta = respuestaResenaOculta.parse(await (await moderar(admin, true)).json());
  assert.equal(oculta.total_resenas, publicada.total_resenas - 1);
  assert.ok(oculta.promedio! > publicada.promedio!);

  const visible = respuestaResenaOculta.parse(await (await moderar(admin, false)).json());
  assert.deepEqual([visible.total_resenas, visible.promedio], [publicada.total_resenas, publicada.promedio]);

  await esperarError(
    await api.pedir('PATCH', `/resenas/${randomUUID()}`, { token: admin, cuerpo: { oculta: true } }),
    404,
  );
});
