// Etapa 6 (EP-16, EP-17, EP-18 y EP-08 por persona) por HTTP, contra los escenarios de la semilla
// (db/semilla/README.md). Lo único que escribe es con un lector de prueba, que borra al terminar.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { respuestaAutores, respuestaBusqueda, respuestaCaminos, respuestaRecomendaciones } from '@dlbp/shared';
import { cerrarMongo } from '../src/bases/mongo.ts';
import { cerrarNeo4j } from '../src/bases/neo4j.ts';
import { cerrarPostgres } from '../src/bases/postgres.ts';
import { procesarLote } from '../src/servicios/sincronizacion.ts';
import { esperarError, levantarApi } from './ayudas.ts';

const id = (prefijo: string, n: number) => `${prefijo}000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const persona = (n: number) => id('a1', n);
const libro = (n: number) => id('b1', n);
const pelicula = (n: number) => id('f1', n);
const PEDRO = id('c1', 5);

const [HERBERT, GIBSON, VILLENEUVE, JACKSON, CHALAMET] = [1, 10, 11, 14, 17].map(persona) as [
  string,
  string,
  string,
  string,
  string,
];

let api: Awaited<ReturnType<typeof levantarApi>>;
const tokens: Record<string, string> = {};

before(async () => {
  api = await levantarApi();
  for (const nombre of ['admin', 'ana', 'luis', 'marta', 'pedro', 'sofia']) {
    tokens[nombre] = await api.entrarComo(nombre);
  }
});

after(async () => {
  await api.borrarLectores();
  for (const token of Object.values(tokens)) await api.salir(token);
  api.cerrar();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
});

async function buscar(q: string, token?: string) {
  const res = await api.pedir('GET', `/obras?por=persona&q=${encodeURIComponent(q)}`, { token });
  assert.equal(res.status, 200, q);
  return respuestaBusqueda.parse(await res.json()).obras;
}

async function caminos(origen: string, destino: string, token = tokens.ana!) {
  const res = await api.pedir('GET', `/exploracion/caminos?origen=${origen}&destino=${destino}`, { token });
  assert.equal(res.status, 200);
  return respuestaCaminos.parse(await res.json()).caminos;
}

async function autores(director: string) {
  const res = await api.pedir('GET', `/personas/${director}/autores-relacionados`, { token: tokens.ana! });
  assert.equal(res.status, 200);
  return respuestaAutores.parse(await res.json()).autores;
}

async function recomendaciones(token: string) {
  const res = await api.pedir('GET', '/me/recomendaciones', { token });
  assert.equal(res.status, 200);
  return respuestaRecomendaciones.parse(await res.json());
}

const porque = (r: Awaited<ReturnType<typeof recomendaciones>>) =>
  r.libros.map((l) => [l.obra.obra_id, l.motivos.map((m) => [m.libro_partida.obra_id, m.director.nombre])]);

test('EP-08 por persona: sin tildes ni mayúsculas, con quién es y qué hizo', async () => {
  const dirigidas = await buscar('villeneuve');
  assert.equal(dirigidas.length, 3);
  assert.ok(dirigidas.every((o) => o.vinculo === 'dirigida_por' && o.persona?.persona_id === VILLENEUVE));

  const actuadas = await buscar('TIMOTHEE');
  assert.deepEqual(
    actuadas.map((o) => o.vinculo),
    ['actuó_en', 'actuó_en'],
  );

  // Branagh dirigió y actuó en la misma película: una fila por vínculo.
  const branagh = await buscar('branagh');
  assert.deepEqual([...new Set(branagh.map((o) => o.vinculo))].sort(), ['actuó_en', 'dirigida_por']);
});

test('EP-08 por persona: la sintaxis de Lucene no llega a Neo4j (D-41)', async () => {
  for (const q of ['***', '((', '"', '\\', 'a:b', 'NOT', 'villeneuve AND (', 'x~ || y^2 / [z TO']) {
    await buscar(q);
  }
  assert.deepEqual(await buscar('***'), []);
  assert.equal((await buscar('villeneuve*)')).length, 3);
});

test('EP-08 por persona: los borradores solo los ve el administrador', async () => {
  assert.deepEqual(await buscar('gibson'), []);
  assert.ok((await buscar('gibson', tokens.admin)).length > 0);
});

test('EP-16: todos los caminos más cortos, con títulos', async () => {
  const dos = await caminos(HERBERT, CHALAMET);
  assert.equal(dos.length, 2);
  for (const c of dos) {
    assert.deepEqual(c.relaciones, ['escribió', 'adaptado_a', 'actuó_en']);
    assert.deepEqual(
      c.nodos.map((n) => n.tipo),
      ['persona', 'libro', 'pelicula', 'persona'],
    );
    const obra = c.nodos[1]!;
    assert.ok(obra.tipo === 'libro' && obra.titulo === 'Dune');
  }

  const entreLibros = await caminos(libro(1), libro(4));
  assert.deepEqual(
    entreLibros.map((c) => c.relaciones.length),
    [4, 4],
  );
});

test('EP-16: sin conexión es una lista vacía; un camino por un borrador no se muestra (D-56)', async () => {
  assert.deepEqual(await caminos(GIBSON, HERBERT), []);
  assert.deepEqual(await caminos(randomUUID(), HERBERT), []);
  assert.deepEqual(await caminos(GIBSON, libro(11)), []);
  assert.equal((await caminos(GIBSON, libro(11), tokens.admin)).length, 1);
});

test('EP-16: exige sesión, dos ids distintos y bien escritos (D-49)', async () => {
  const ruta = '/exploracion/caminos';
  await esperarError(await api.pedir('GET', `${ruta}?origen=${HERBERT}&destino=${CHALAMET}`), 401);
  for (const consulta of [
    `?origen=${HERBERT}&destino=${HERBERT.toUpperCase()}`,
    `?origen=${HERBERT}`,
    `?origen=x&destino=${HERBERT}`,
    '',
  ]) {
    await esperarError(await api.pedir('GET', ruta + consulta, { token: tokens.ana! }), 400);
  }
});

test('EP-17: los autores que adaptó un director, con el libro y la película', async () => {
  const deVilleneuve = await autores(VILLENEUVE);
  assert.deepEqual(
    deVilleneuve.map((a) => [a.nombre, a.obras.length]),
    [
      ['Frank Herbert', 2],
      ['Ted Chiang', 1],
    ],
  );
  assert.ok(deVilleneuve[0]!.obras.every((o) => o.libro.titulo === 'Dune' && o.pelicula.tipo === 'pelicula'));

  assert.deepEqual(
    (await autores(JACKSON)).map((a) => a.obras.length),
    [2],
  );
  assert.deepEqual(await autores(CHALAMET), []);
  await esperarError(await api.pedir('GET', `/personas/${VILLENEUVE}/autores-relacionados`), 401);
});

test('EP-18: Ana y Marta reciben libros por el director de los que les gustaron (RF-26)', async () => {
  const ana = await recomendaciones(tokens.ana!);
  // Primero el que viene de Dune (calificado con 5) y luego el de El marciano (4).
  assert.deepEqual(porque(ana), [
    [libro(4), [[libro(1), 'Denis Villeneuve']]],
    [libro(2), [[libro(3), 'Ridley Scott']]],
  ]);
  assert.equal(ana.peliculas.length, 3);

  const marta = await recomendaciones(tokens.marta!);
  assert.deepEqual(marta.libros.map((l) => l.obra.obra_id).sort(), [libro(4), libro(9)]);
});

test('EP-18: Sofía recibe películas por lo que leyeron quienes sigue (RF-27)', async () => {
  const { peliculas } = await recomendaciones(tokens.sofia!);
  assert.equal(peliculas.length, 7);
  assert.deepEqual(
    peliculas.map((p) => p.seguidos),
    [2, 2, 2, 1, 1, 1, 1],
  );
  const dune = peliculas.find((p) => p.obra.obra_id === pelicula(1))!; // ya la vio y sale igual (D-20)
  assert.equal(dune.libro.obra_id, libro(1));
});

test('EP-18: sin nada que recomendar, las listas van vacías', async () => {
  assert.deepEqual(await recomendaciones(tokens.pedro!), { libros: [], peliculas: [] });
  assert.deepEqual((await recomendaciones(tokens.luis!)).libros, []);
  await esperarError(await api.pedir('GET', '/me/recomendaciones'), 401);
});

test('caso integrado: reseñar y seguir cambia las recomendaciones cuando el worker sincroniza', async () => {
  const lector = await api.crearLector();
  const { token } = lector;
  const sincronizar = async () => assert.equal(await procesarLote(), 'vacio');
  assert.deepEqual(await recomendaciones(token), { libros: [], peliculas: [] });

  assert.equal((await api.pedir('PUT', `/obras/${libro(1)}/resena`, { token, cuerpo: { calificacion: 5 } })).status, 201);
  assert.equal((await api.pedir('POST', '/me/seguidos', { token, cuerpo: { usuario_id: PEDRO } })).status, 201);
  await sincronizar();

  const antes = await recomendaciones(token);
  assert.deepEqual(porque(antes), [[libro(4), [[libro(1), 'Denis Villeneuve']]]]);
  assert.equal(antes.peliculas.length, 3);

  // Al leer el libro recomendado, deja de recomendarse; al dejar de seguir, se van las películas.
  await api.pedir('PUT', `/me/estados/${libro(4)}`, { token, cuerpo: { estado: 'terminada' } });
  await api.pedir('DELETE', `/me/seguidos/${PEDRO}`, { token });
  await sincronizar();
  assert.deepEqual(await recomendaciones(token), { libros: [], peliculas: [] });
});
