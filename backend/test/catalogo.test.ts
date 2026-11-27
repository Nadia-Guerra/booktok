// Etapa 3 (EP-08 y EP-09) por HTTP, sobre la semilla. Solo lee; las sesiones que abre las cierra.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { ficha, respuestaBusqueda, type Ficha } from '@dlbp/shared';
import { cerrarMongo } from '../src/bases/mongo.ts';
import { cerrarNeo4j } from '../src/bases/neo4j.ts';
import { cerrarPostgres, pool } from '../src/bases/postgres.ts';
import { esperarError, levantarApi } from './ayudas.ts';

const libro = (n: number) => `b1000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const pelicula = (n: number) => `f1000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ANA = 'c1000000-0000-4000-8000-000000000002';

let api: Awaited<ReturnType<typeof levantarApi>>;
let ana: string;
let admin: string;

before(async () => {
  api = await levantarApi();
  ana = await api.entrarComo('ana');
  admin = await api.entrarComo('admin');
});

after(async () => {
  await Promise.all([api.salir(ana), api.salir(admin)]);
  api.cerrar();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
});

async function buscar(q: string, token?: string) {
  const res = await api.pedir('GET', `/obras?q=${encodeURIComponent(q)}`, { token });
  assert.equal(res.status, 200);
  return respuestaBusqueda.parse(await res.json()).obras;
}

const resumen = (obras: { tipo: string; titulo: string }[]) => obras.map((o) => `${o.tipo}: ${o.titulo}`).sort();

/** Pide una ficha y comprueba que cumple el esquema sin campos de más. */
async function verFicha(id: string, token?: string): Promise<Ficha> {
  const res = await api.pedir('GET', `/obras/${id}`, { token });
  assert.equal(res.status, 200);
  const cuerpo = (await res.json()) as Record<string, unknown>;
  const f = ficha.parse(cuerpo);
  assert.deepEqual(Object.keys(cuerpo).sort(), Object.keys(f).sort());
  return f;
}

const soloLibro = (f: Ficha) => {
  assert.equal(f.tipo, 'libro');
  return f as Extract<Ficha, { tipo: 'libro' }>;
};
const soloPelicula = (f: Ficha) => {
  assert.equal(f.tipo, 'pelicula');
  return f as Extract<Ficha, { tipo: 'pelicula' }>;
};

test('EP-08: busca en libros y películas sin distinguir mayúsculas ni tildes', async () => {
  const dune = ['libro: Dune', 'pelicula: Dune', 'pelicula: Dune: Parte dos'];
  assert.deepEqual(resumen(await buscar('DUNE')), dune);
  assert.deepEqual(resumen(await buscar('jurasico')), ['libro: Parque Jurásico', 'pelicula: Parque Jurásico']);
  // La coincidencia con más palabras va primero.
  assert.equal((await buscar('dune parte dos'))[0]?.titulo, 'Dune: Parte dos');
});

test('EP-08: solo palabras completas; la sintaxis de búsqueda no excluye ni fuerza frases', async () => {
  assert.deepEqual(await buscar('dun'), []);
  assert.deepEqual(await buscar('"-'), []);
  assert.equal((await buscar('-dune')).length, 3);
  assert.equal((await buscar('"dune')).length, 3);
});

test('EP-08: los borradores solo salen para el administrador', async () => {
  assert.deepEqual(await buscar('neuromante'), []);
  assert.deepEqual(await buscar('neuromante', ana), []);
  assert.deepEqual(resumen(await buscar('neuromante', admin)), ['libro: Neuromante', 'pelicula: Neuromante']);
});

test('EP-08: la entrada inválida da 400', async () => {
  for (const consulta of ['', '?q=', '?q=%20%20', '?q=a&q=b', '?q[$ne]=1', '?q=dune&por=editorial']) {
    const e = await esperarError(await api.pedir('GET', `/obras${consulta}`), 400);
    assert.equal(e.codigo, 'entrada_invalida', consulta);
  }
});

test('EP-09: la ficha de un libro une las tres bases', async () => {
  const f = soloLibro(await verFicha(libro(1)));
  assert.equal(f.titulo, 'Dune');
  assert.deepEqual(
    f.autores.map((a) => a.nombre),
    ['Frank Herbert'],
  );
  assert.deepEqual(
    f.adaptaciones.map((a) => a.titulo),
    ['Dune', 'Dune: Parte dos'],
  );
  assert.equal(f.ediciones.length, 2);
  assert.ok(!('mi_estado' in f) && !('mi_resena' in f), 'sin sesión no hay datos propios');

  const fila = (await pool.query('SELECT promedio, total_resenas FROM obra_resumen WHERE obra_id = $1', [libro(1)]))
    .rows[0];
  assert.equal(f.total_resenas, fila.total_resenas);
  assert.equal(f.promedio, fila.promedio === null ? null : Number(fila.promedio));
});

test('EP-09: la ficha de una película trae reparto, directores y libro de origen', async () => {
  const f = soloPelicula(await verFicha(pelicula(1).toUpperCase()));
  assert.equal(f.obra_id, pelicula(1));
  assert.equal(f.libro_origen?.obra_id, libro(1));
  assert.deepEqual(
    f.directores.map((d) => d.nombre),
    ['Denis Villeneuve'],
  );
  assert.ok(f.reparto.length > 0);
  assert.deepEqual(
    f.reparto.map((a) => a.orden),
    f.reparto.map((a) => a.orden).toSorted((a, b) => a - b),
  );
  assert.equal(f.plataformas.length, 2);
});

test('EP-09: una película sin portada ni plataformas se devuelve con nulos y listas vacías', async () => {
  // Neuromante: la ficha en borrador es la única película de la semilla sin imagen, y la ve el administrador.
  const f = soloPelicula(await verFicha(pelicula(12), admin));
  assert.equal(f.portada_url, null);
  assert.deepEqual(f.plataformas, []);
});

test('EP-09: con sesión llegan mi estado y mi reseña, aunque esté oculta', async () => {
  const propias = (
    await pool.query(
      `SELECT r.obra_id, r.resena_id, r.calificacion, r.oculta, e.estado
       FROM resena r LEFT JOIN estado_obra e USING (usuario_id, obra_id)
       WHERE r.usuario_id = $1`,
      [ANA],
    )
  ).rows;
  const oculta = propias.find((r) => r.oculta);
  const visible = propias.find((r) => !r.oculta);
  assert.ok(oculta && visible, 'la semilla debe darle a Ana una reseña visible y otra oculta');

  for (const esperada of [visible, oculta]) {
    const f = await verFicha(esperada.obra_id, ana);
    assert.equal(f.mi_estado, esperada.estado);
    assert.equal(f.mi_resena?.resena_id, esperada.resena_id);
    assert.equal(f.mi_resena?.calificacion, esperada.calificacion);
    assert.equal(f.mi_resena?.oculta, esperada.oculta);
  }

  const sinActividad = await verFicha(libro(1), admin);
  assert.equal(sinActividad.mi_estado, null);
  assert.equal(sinActividad.mi_resena, null);
});

test('EP-09: un borrador da 404 salvo al administrador', async () => {
  for (const id of [libro(11), pelicula(12)]) {
    await esperarError(await api.pedir('GET', `/obras/${id}`), 404);
    await esperarError(await api.pedir('GET', `/obras/${id}`, { token: ana }), 404);
    assert.equal((await verFicha(id, admin)).estado_publicacion, 'borrador');
  }
});

test('EP-09: id inexistente 404, id mal formado 400 y token que no vale 401', async () => {
  await esperarError(await api.pedir('GET', '/obras/99999999-9999-4999-8999-999999999999'), 404);
  await esperarError(await api.pedir('GET', '/obras/no-es-un-id'), 400);
  await esperarError(await api.pedir('GET', `/obras/${libro(1)}`, { token: 'inventado' }), 401);
  await esperarError(await api.pedir('GET', '/obras?q=dune', { token: 'inventado' }), 401);
});
