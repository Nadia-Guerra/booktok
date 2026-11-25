// Etapas 9 y 10 (EP-36, 37, 39, 40, 41, 43 y 46) por HTTP. Crea obras y personas marcadas con
// `ZzPrueba` en las tres bases y las borra al terminar.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { cuerpoError, ficha, respuestaAlta, respuestaBusqueda, respuestaPersonas } from '@dlbp/shared';
import { cerrarMongo, mongoDb } from '../src/bases/mongo.ts';
import { cerrarNeo4j, leerGrafo } from '../src/bases/neo4j.ts';
import { cerrarPostgres, pool } from '../src/bases/postgres.ts';
import * as documental from '../src/repositorios/documental/administracion.ts';
import { esperarError, levantarApi } from './ayudas.ts';
import { limpiarCatalogoDePrueba, MARCA } from './catalogo-de-prueba.ts';

const DUNE = 'b1000000-0000-4000-8000-000000000001';

let api: Awaited<ReturnType<typeof levantarApi>>;
let admin: string;

before(async () => {
  await limpiarCatalogoDePrueba();
  api = await levantarApi();
  admin = await api.entrarComo('admin');
});

after(async () => {
  await api.borrarLectores(); // primero: sus reseñas impiden borrar la obra
  await limpiarCatalogoDePrueba();
  await api.salir(admin);
  api.cerrar();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
});

const como = (token: string) => (metodo: string, ruta: string, cuerpo?: unknown) =>
  api.pedir(metodo, ruta, { token, cuerpo });
const pedir = (metodo: string, ruta: string, cuerpo?: unknown) => como(admin)(metodo, ruta, cuerpo);

async function persona(nombre: string, foto_url?: string): Promise<string> {
  const res = await pedir('POST', '/admin/personas', { nombre: `${MARCA} ${nombre}`, foto_url });
  assert.equal(res.status, 201);
  return ((await res.json()) as { persona_id: string }).persona_id;
}

const datosDeLibro = (autores: string[], cambios: Record<string, unknown> = {}) => ({
  titulo: `${MARCA} libro ${randomUUID()}`,
  sinopsis: 'Libro creado por una prueba.',
  generos: ['Ensayo'],
  anio_publicacion_original: 2001,
  autores,
  ...cambios,
});

const datosDePelicula = (
  libro_id: string,
  director: string,
  actor: string,
  cambios: Record<string, unknown> = {},
) => ({
  titulo: `${MARCA} película ${randomUUID()}`,
  sinopsis: 'Película creada por una prueba.',
  generos: ['Drama'],
  anio_estreno: 2020,
  duracion_min: 90,
  datos_tecnicos: { idioma_original: 'Español', paises: ['México'], clasificacion: '' },
  libro_id,
  directores: [director],
  reparto: [{ persona_id: actor, personaje: 'Protagonista', orden: 1 }],
  ...cambios,
});

async function alta(ruta: string, cuerpo: unknown) {
  const res = await pedir('POST', ruta, cuerpo);
  assert.equal(res.status, 201, JSON.stringify(await res.clone().json()));
  return respuestaAlta.parse(await res.json());
}

async function verFicha(obraId: string, token?: string) {
  const res = await api.pedir('GET', `/obras/${obraId}`, { token });
  assert.equal(res.status, 200);
  return ficha.parse(await res.json());
}

const cuantasFichas = async () =>
  (await mongoDb.collection('libros').countDocuments()) + (await mongoDb.collection('peliculas').countDocuments());

const publicar = (obraId: string) => pedir('POST', `/admin/obras/${obraId}/publicacion`);

test('las rutas de administración: 401 sin sesión y 403 a un lector (RN-09)', async () => {
  const lector = await api.crearLector();
  for (const [metodo, ruta] of [
    ['GET', '/admin/personas?q=a'],
    ['POST', '/admin/personas'],
    ['POST', '/admin/libros'],
    ['POST', '/admin/peliculas'],
    ['POST', `/admin/obras/${DUNE}/publicacion`],
    ['POST', `/admin/libros/${DUNE}/ediciones`],
    ['POST', `/admin/peliculas/${DUNE}/plataformas`],
  ] as const) {
    await esperarError(await api.pedir(metodo, ruta), 401);
    await esperarError(await como(lector.token)(metodo, ruta, metodo === 'POST' ? {} : undefined), 403);
  }
});

test('EP-37 y EP-36: registrar una persona y volver a encontrarla', async () => {
  const conFoto = await persona('Quetzalli Foto', 'https://ejemplo.test/foto.jpg');
  const sinFoto = await persona('Quetzalli Sola', '');
  const res = await pedir('GET', '/admin/personas?q=quetzalli*)');
  const { personas } = respuestaPersonas.parse(await res.json());
  assert.deepEqual(
    personas.map((p) => [p.persona_id, p.foto_url]),
    [
      [conFoto, 'https://ejemplo.test/foto.jpg'],
      [sinFoto, null],
    ],
  );
  for (const cuerpo of [{ nombre: '' }, { nombre: 'x'.repeat(151) }, { nombre: 'a', foto_url: 'http://x.test/a' }]) {
    await esperarError(await pedir('POST', '/admin/personas', cuerpo), 400);
  }
  await esperarError(await pedir('GET', '/admin/personas'), 400);
});

test('EP-39: el libro queda en borrador, oculto, con sus autores y sin ediciones vacías', async () => {
  const autor = await persona('Autora');
  const edicion = { paginas: 100, editorial: 'Prueba', idioma: 'Español', anio: 2001, isbn: '' };
  const creado = await alta('/admin/libros', datosDeLibro([autor], { ediciones: [edicion] }));
  assert.equal(creado.estado_publicacion, 'borrador');

  await esperarError(await api.pedir('GET', `/obras/${creado.obra_id}`), 404);
  const suya = await verFicha(creado.obra_id, admin);
  assert.ok(suya.tipo === 'libro');
  assert.deepEqual([suya.autores.map((a) => a.persona_id), suya.ediciones[0]!.isbn], [[autor], null]);
  const { rows } = await pool.query('SELECT tipo, total_resenas FROM obra_resumen WHERE obra_id = $1', [creado.obra_id]);
  assert.deepEqual(rows, [{ tipo: 'libro', total_resenas: 0 }]);
});

test('EP-39: lo que no puede crearse no deja rastro', async () => {
  const autor = await persona('Autor');
  const antes = await cuantasFichas();
  const deDune = (await mongoDb.collection('libros').findOne({ _id: DUNE as never }))!.ediciones as { isbn?: string }[];
  const isbn = deDune.find((e) => e.isbn)!.isbn!;
  const edicion = { isbn, paginas: 1, editorial: 'x', idioma: 'x', anio: 2000 };

  await esperarError(await pedir('POST', '/admin/libros', datosDeLibro([randomUUID()])), 404);
  await esperarError(await pedir('POST', '/admin/libros', datosDeLibro([autor], { ediciones: [edicion] })), 409);
  for (const cambios of [
    { autores: [] },
    { autores: [autor, autor] },
    { generos: [] },
    { generos: ['a', 'a'] },
    { titulo: 'x'.repeat(201) },
    { anio_publicacion_original: 1.5 },
    { portada_url: 'ftp://x' },
    { ediciones: [edicion, edicion] },
    { ediciones: [{ ...edicion, isbn: '123' }] },
  ]) {
    await esperarError(await pedir('POST', '/admin/libros', datosDeLibro([autor], cambios)), 400);
  }
  assert.equal(await cuantasFichas(), antes);
});

test('EP-40: la primera película publica el libro y luego se publica, con el reparto copiado', async () => {
  const autor = await persona('Autora');
  const director = await persona('Directora');
  const conFoto = await persona('Actriz', 'https://ejemplo.test/actriz.jpg');
  const sinFoto = await persona('Actor');
  const libro = await alta('/admin/libros', datosDeLibro([autor]));

  const reparto = [
    { persona_id: sinFoto, personaje: 'Segundo', orden: 2 },
    { persona_id: conFoto, personaje: 'Primera', orden: 1 },
  ];
  const pelicula = await alta('/admin/peliculas', datosDePelicula(libro.obra_id, director, conFoto, { reparto }));
  assert.deepEqual(
    [pelicula.estado_publicacion, pelicula.libro],
    ['publicada', { obra_id: libro.obra_id, estado_publicacion: 'publicada' }],
  );

  const vista = await verFicha(pelicula.obra_id); // sin sesión: ya es pública
  assert.ok(vista.tipo === 'pelicula');
  assert.deepEqual(
    vista.reparto.map((a) => [a.personaje, a.orden, a.foto_url]),
    [
      ['Primera', 1, 'https://ejemplo.test/actriz.jpg'],
      ['Segundo', 2, null],
    ],
  );
  assert.deepEqual(
    [vista.libro_origen?.obra_id, vista.directores.map((d) => d.persona_id), vista.datos_tecnicos.clasificacion],
    [libro.obra_id, [director], null],
  );
  const delLibro = await verFicha(libro.obra_id);
  assert.ok(delLibro.tipo === 'libro' && delLibro.adaptaciones[0]?.obra_id === pelicula.obra_id);

  // El orden se guarda como entero, igual que en la semilla.
  const tipos = await leerGrafo<{ t: string }>(
    'MATCH (:Persona)-[r:`actuó_en`]->(:`Película` {obra_id: $id}) RETURN DISTINCT valueType(r.orden) AS t',
    { id: pelicula.obra_id },
  );
  assert.deepEqual(tipos, [{ t: 'INTEGER NOT NULL' }]);

  const porPersona = await api.pedir('GET', `/obras?por=persona&q=${MARCA}`);
  assert.ok(respuestaBusqueda.parse(await porPersona.json()).obras.length > 0);

  // Una obra recién publicada se puede reseñar.
  const lector = await api.crearLector();
  const resena = await como(lector.token)('PUT', `/obras/${pelicula.obra_id}/resena`, { calificacion: 4 });
  assert.equal(resena.status, 201);

  // Una segunda adaptación del mismo libro es otra vez EP-40.
  await alta('/admin/peliculas', datosDePelicula(libro.obra_id, director, sinFoto));
  const dos = await verFicha(libro.obra_id);
  assert.ok(dos.tipo === 'libro' && dos.adaptaciones.length === 2);
});

test('EP-40: sin libro, sin las personas o con el reparto mal armado no se crea nada', async () => {
  const director = await persona('Director');
  const actor = await persona('Actor');
  const antes = await cuantasFichas();
  const base = (cambios: Record<string, unknown> = {}) => datosDePelicula(DUNE, director, actor, cambios);
  const uno = { persona_id: actor, personaje: 'a', orden: 1 };

  await esperarError(await pedir('POST', '/admin/peliculas', base({ libro_id: randomUUID() })), 404);
  await esperarError(
    await pedir('POST', '/admin/peliculas', base({ libro_id: 'f1000000-0000-4000-8000-000000000001' })),
    404,
  );
  await esperarError(await pedir('POST', '/admin/peliculas', base({ directores: [randomUUID()] })), 404);
  for (const cambios of [
    { directores: [] },
    { reparto: [] },
    { reparto: [uno, { ...uno, orden: 2 }] },
    { reparto: [uno, { persona_id: director, personaje: 'b', orden: 1 }] },
    { reparto: [{ ...uno, orden: 0 }] },
    { plataformas: [{ nombre: 'A' }, { nombre: 'A' }] },
    { datos_tecnicos: { idioma_original: 'Español', paises: [] } },
  ]) {
    await esperarError(await pedir('POST', '/admin/peliculas', base(cambios)), 400);
  }
  assert.equal(await cuantasFichas(), antes);
});

test('D-58: un alta que falla a medias responde 503 con el id y deja un borrador (EP-41 dice qué falta)', async () => {
  const director = await persona('Director');
  const actor = await persona('Actor');
  // Un libro con ficha pero sin nodo en el grafo: la adaptación no se puede crear.
  const libroId = randomUUID();
  await documental.crearLibro({
    _id: libroId,
    titulo: `${MARCA} libro sin nodo`,
    sinopsis: 'x',
    generos: ['x'],
    anio_publicacion_original: 2000,
    ediciones: [],
    estado_publicacion: 'borrador',
  });

  const res = await pedir('POST', '/admin/peliculas', datosDePelicula(libroId, director, actor));
  assert.equal(res.status, 503);
  const { error } = cuerpoError.parse(await res.json());
  assert.ok(error.obra_id);
  await esperarError(await api.pedir('GET', `/obras/${error.obra_id}`), 404);

  const intento = await esperarError(await publicar(error.obra_id), 409);
  assert.match(intento.mensaje, /Falta: libro de origen$/);
});

test('EP-41: completa un alta interrumpida, y dice qué falta cuando no puede', async () => {
  const autor = await persona('Autora');
  const soloLibro = await alta('/admin/libros', datosDeLibro([autor]));
  assert.match((await esperarError(await publicar(soloLibro.obra_id), 409)).mensaje, /Falta: adaptación$/);
  await esperarError(await publicar(randomUUID()), 404);

  // Una película que se quedó antes de publicar: se simula devolviéndola a borrador, sin la copia
  // del reparto y sin su fila en el relacional.
  const director = await persona('Director');
  const actor = await persona('Actor');
  const pelicula = await alta('/admin/peliculas', datosDePelicula(soloLibro.obra_id, director, actor));
  const peliculas = mongoDb.collection<{ _id: string }>('peliculas');
  await peliculas.updateOne({ _id: pelicula.obra_id }, { $set: { estado_publicacion: 'borrador', reparto: [] } });
  await mongoDb
    .collection<{ _id: string }>('libros')
    .updateOne({ _id: soloLibro.obra_id }, { $set: { estado_publicacion: 'borrador' } });
  await pool.query('DELETE FROM obra_resumen WHERE obra_id = $1', [pelicula.obra_id]);

  const res = await publicar(pelicula.obra_id);
  assert.equal(res.status, 200);
  assert.deepEqual(respuestaAlta.parse(await res.json()), {
    obra_id: pelicula.obra_id,
    estado_publicacion: 'publicada',
    libro: { obra_id: soloLibro.obra_id, estado_publicacion: 'publicada' },
  });
  const vista = await verFicha(pelicula.obra_id);
  assert.ok(vista.tipo === 'pelicula' && vista.reparto.length === 1);
  assert.equal((await publicar(pelicula.obra_id)).status, 200); // repetirlo no cambia nada
});

test('EP-43: agregar ediciones, sin repetir ISBN ni dentro del libro ni entre libros (D-08)', async () => {
  const autor = await persona('Autor');
  const a = await alta('/admin/libros', datosDeLibro([autor]));
  const b = await alta('/admin/libros', datosDeLibro([autor]));
  const edicion = { paginas: 300, editorial: 'Prueba', idioma: 'Español', anio: 2020 };
  const isbn = `999${String(Date.now()).slice(-10)}`;
  const agregar = (libro: string, cuerpo: unknown) => pedir('POST', `/admin/libros/${libro}/ediciones`, cuerpo);

  assert.equal((await agregar(a.obra_id, { ...edicion, isbn })).status, 201);
  assert.equal((await agregar(a.obra_id, edicion)).status, 201); // sin ISBN
  assert.equal((await agregar(a.obra_id, edicion)).status, 201); // otra sin ISBN
  await esperarError(await agregar(a.obra_id, { ...edicion, isbn }), 409);
  await esperarError(await agregar(b.obra_id, { ...edicion, isbn }), 409);
  await esperarError(await agregar(randomUUID(), edicion), 404);
  for (const mala of [{ ...edicion, paginas: 0 }, { ...edicion, editorial: '' }, { ...edicion, anio: '2020' }]) {
    await esperarError(await agregar(a.obra_id, mala), 400);
  }
  const vista = await verFicha(a.obra_id, admin);
  assert.ok(vista.tipo === 'libro');
  assert.deepEqual(
    vista.ediciones.map((e) => e.isbn),
    [isbn, null, null],
  );
});

test('EP-46: agregar plataformas, sin repetir y hasta 30', async () => {
  const autor = await persona('Autor');
  const director = await persona('Director');
  const actor = await persona('Actor');
  const libro = await alta('/admin/libros', datosDeLibro([autor]));
  const pelicula = await alta('/admin/peliculas', datosDePelicula(libro.obra_id, director, actor));
  const agregar = (obra: string, nombre: unknown) => pedir('POST', `/admin/peliculas/${obra}/plataformas`, { nombre });

  assert.equal((await agregar(pelicula.obra_id, ' Cine ')).status, 201);
  await esperarError(await agregar(pelicula.obra_id, 'Cine'), 409);
  await esperarError(await agregar(pelicula.obra_id, ''), 400);
  await esperarError(await agregar(libro.obra_id, 'Cine'), 404); // no es una película
  for (let i = 2; i <= 30; i++) assert.equal((await agregar(pelicula.obra_id, `P${i}`)).status, 201);
  assert.match((await esperarError(await agregar(pelicula.obra_id, 'Una más'), 409)).mensaje, /30/);
});
