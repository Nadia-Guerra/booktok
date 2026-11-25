// Etapa 4 (EP-10, 11, 13, 14 y 15) por HTTP. Escribe solo con lectores de prueba, que borra al
// terminar; después comprueba que los promedios de la semilla quedaron como estaban.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import {
  respuestaEstado,
  respuestaEstados,
  respuestaPublicacion,
  respuestaResenas,
} from '@dlbp/shared';
import { cerrarMongo } from '../src/bases/mongo.ts';
import { cerrarNeo4j } from '../src/bases/neo4j.ts';
import { cerrarPostgres, pool } from '../src/bases/postgres.ts';
import { publicarOEditar } from '../src/repositorios/relacional/resenas.ts';
import { esperarError, levantarApi } from './ayudas.ts';

const libro = (n: number) => `b1000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const pelicula = (n: number) => `f1000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ANA = 'c1000000-0000-4000-8000-000000000002';

let api: Awaited<ReturnType<typeof levantarApi>>;
let admin: string;
let promediosAntes: string;

const fotoDePromedios = async () =>
  JSON.stringify((await pool.query('SELECT obra_id, promedio, total_resenas FROM obra_resumen ORDER BY 1')).rows);

before(async () => {
  promediosAntes = await fotoDePromedios();
  api = await levantarApi();
  admin = await api.entrarComo('admin');
});

after(async () => {
  await api.borrarLectores();
  await api.salir(admin);
  api.cerrar();
  const promediosDespues = await fotoDePromedios();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
  assert.equal(promediosDespues, promediosAntes, 'los promedios no volvieron a su valor');
});

type Lector = Awaited<ReturnType<typeof api.crearLector>>;

const publicar = (l: Lector, obra: string, cuerpo: unknown) =>
  api.pedir('PUT', `/obras/${obra}/resena`, { cuerpo, token: l.token });

async function publicarBien(l: Lector, obra: string, cuerpo: unknown, estado = 201) {
  const res = await publicar(l, obra, cuerpo);
  assert.equal(res.status, estado);
  return respuestaPublicacion.parse(await res.json());
}

async function marcar(l: Lector, obra: string, estado: string) {
  const res = await api.pedir('PUT', `/me/estados/${obra}`, { cuerpo: { estado }, token: l.token });
  assert.equal(res.status, 200);
  return respuestaEstado.parse(await res.json());
}

async function listar(consulta: string, token?: string) {
  const res = await api.pedir('GET', `/resenas?${consulta}`, { token });
  assert.equal(res.status, 200);
  return respuestaResenas.parse(await res.json());
}

/** Eventos de lectura que dejó un usuario, en orden. */
const eventos = async (usuarioId: string): Promise<string[]> =>
  (
    await pool.query(
      `SELECT tipo_evento FROM sync_outbox
       WHERE payload->>'usuario_id' = $1 AND tipo_evento <> 'usuario_creado' ORDER BY evento_id`,
      [usuarioId],
    )
  ).rows.map((f) => f.tipo_evento);

const resumenDe = async (obra: string) => {
  const f = (await pool.query('SELECT promedio, total_resenas FROM obra_resumen WHERE obra_id = $1', [obra])).rows[0];
  return { promedio: f.promedio === null ? null : Number(f.promedio), total_resenas: f.total_resenas as number };
};

const estadoDe = async (usuarioId: string, obra: string) =>
  (await pool.query('SELECT estado FROM estado_obra WHERE usuario_id = $1 AND obra_id = $2', [usuarioId, obra]))
    .rows[0]?.estado;

test('EP-11: publicar deja reseña, estado terminada, evento y promedio recalculado', async () => {
  const lector = await api.crearLector();
  const antes = await resumenDe(libro(1));

  const r = await publicarBien(lector, libro(1), { calificacion: 1, texto: '  Mi reseña  ' });
  assert.equal(r.total_resenas, antes.total_resenas + 1);
  assert.deepEqual({ promedio: r.promedio, total_resenas: r.total_resenas }, await resumenDe(libro(1)));
  assert.equal(await estadoDe(lector.usuario_id, libro(1)), 'terminada');
  assert.deepEqual(await eventos(lector.usuario_id), ['obra_leida']);

  const guardada = (await pool.query('SELECT texto FROM resena WHERE resena_id = $1', [r.resena_id])).rows[0];
  assert.equal(guardada.texto, 'Mi reseña');
});

test('EP-11: repetir edita la misma reseña, sin otro evento; sin texto lo borra', async () => {
  const lector = await api.crearLector();
  const primera = await publicarBien(lector, libro(2), { calificacion: 1, texto: 'Mala' });
  const segunda = await publicarBien(lector, libro(2), { calificacion: 5 }, 200);

  assert.equal(segunda.resena_id, primera.resena_id);
  assert.equal(segunda.total_resenas, primera.total_resenas);
  assert.ok(segunda.promedio! > primera.promedio! || primera.total_resenas === 1);
  assert.deepEqual(await eventos(lector.usuario_id), ['obra_leida']);
  const fila = (await pool.query('SELECT texto, calificacion FROM resena WHERE usuario_id = $1', [lector.usuario_id]))
    .rows;
  assert.deepEqual(fila, [{ texto: null, calificacion: 5 }]);
});

test('EP-11: reseñar una obra ya terminada no repite el evento', async () => {
  const lector = await api.crearLector();
  await marcar(lector, libro(3), 'terminada');
  await publicarBien(lector, libro(3), { calificacion: 4 });
  assert.deepEqual(await eventos(lector.usuario_id), ['obra_leida']);
});

test('EP-11: entrada inválida 400, borrador o inexistente 404 y sin sesión 401, sin dejar rastro', async () => {
  const lector = await api.crearLector();
  for (const cuerpo of [
    {},
    { calificacion: 0 },
    { calificacion: 6 },
    { calificacion: 3.5 },
    { calificacion: '5' },
    { calificacion: 4, texto: 'a'.repeat(3001) },
  ]) {
    await esperarError(await publicar(lector, libro(1), cuerpo), 400);
  }
  await esperarError(await publicar(lector, libro(11), { calificacion: 5 }), 404);
  await esperarError(await publicar(lector, randomUUID(), { calificacion: 5 }), 404);
  await esperarError(await api.pedir('PUT', `/obras/${libro(1)}/resena`, { cuerpo: { calificacion: 5 } }), 401);
  assert.deepEqual(await eventos(lector.usuario_id), []);
  await publicarBien(lector, libro(1), { calificacion: 5, texto: 'a'.repeat(3000) });
});

test('O7: si la transacción falla a medias no queda reseña, estado ni evento', async () => {
  const lector = await api.crearLector();
  // Obra que no está en obra_resumen: la llave foránea rechaza la reseña.
  await assert.rejects(
    publicarOEditar({
      usuarioId: lector.usuario_id,
      obraId: randomUUID(),
      resenaIdNueva: randomUUID(),
      calificacion: 5,
      texto: null,
    }),
    { code: '23503' },
  );
  assert.deepEqual(await eventos(lector.usuario_id), []);
  const filas = await pool.query('SELECT 1 FROM estado_obra WHERE usuario_id = $1', [lector.usuario_id]);
  assert.equal(filas.rowCount, 0);
});

test('EP-11: peticiones simultáneas no duplican reseñas ni descuadran el promedio', async () => {
  const uno = await api.crearLector();
  const respuestas = await Promise.all([1, 2, 3, 4].map((c) => publicar(uno, libro(4), { calificacion: c })));
  assert.deepEqual(respuestas.map((r) => r.status).sort(), [200, 200, 200, 201]);
  assert.deepEqual(await eventos(uno.usuario_id), ['obra_leida']);

  const varios = await Promise.all([1, 2, 3, 4, 5].map(() => api.crearLector()));
  await Promise.all(varios.map((l, i) => publicarBien(l, libro(4), { calificacion: i + 1 })));
  const real = (
    await pool.query(
      'SELECT count(*)::int AS total, round(avg(calificacion), 2) AS promedio FROM resena WHERE obra_id = $1 AND NOT oculta',
      [libro(4)],
    )
  ).rows[0];
  assert.deepEqual(await resumenDe(libro(4)), { promedio: Number(real.promedio), total_resenas: real.total });
});

test('EP-14: los eventos salen solo al entrar o salir de terminada', async () => {
  const lector = await api.crearLector();
  for (const estado of ['pendiente', 'en_curso', 'terminada', 'terminada', 'pendiente', 'en_curso', 'terminada']) {
    assert.equal((await marcar(lector, pelicula(1), estado)).estado, estado);
  }
  assert.deepEqual(await eventos(lector.usuario_id), ['obra_leida', 'obra_no_leida', 'obra_leida']);
});

test('EP-14: marcas simultáneas dejan eventos coherentes con el estado final', async () => {
  for (let vuelta = 0; vuelta < 3; vuelta++) {
    const lector = await api.crearLector();
    await Promise.all(['terminada', 'pendiente', 'terminada', 'en_curso'].map((e) => marcar(lector, libro(5), e)));
    const final = await estadoDe(lector.usuario_id, libro(5));
    const ultimo = (await eventos(lector.usuario_id)).at(-1);
    assert.equal(ultimo === 'obra_leida', final === 'terminada', `estado ${final}, último evento ${ultimo}`);
  }
});

test('EP-14: estado desconocido 400 y obra en borrador 404', async () => {
  const lector = await api.crearLector();
  const intento = (obra: string, estado: string) =>
    api.pedir('PUT', `/me/estados/${obra}`, { cuerpo: { estado }, token: lector.token });
  await esperarError(await intento(libro(1), 'abandonada'), 400);
  await esperarError(await intento(pelicula(12), 'pendiente'), 404);
  await esperarError(await api.pedir('PUT', `/me/estados/${libro(1)}`, { cuerpo: { estado: 'pendiente' } }), 401);
});

test('EP-15: lista mis obras con su título, filtra por estado y pagina', async () => {
  const lector = await api.crearLector();
  await marcar(lector, libro(1), 'pendiente');
  await marcar(lector, pelicula(1), 'terminada');
  await marcar(lector, libro(5), 'pendiente');

  const pedir = async (consulta: string) => {
    const res = await api.pedir('GET', `/me/estados${consulta}`, { token: lector.token });
    assert.equal(res.status, 200);
    return respuestaEstados.parse(await res.json());
  };
  const todas = await pedir('');
  assert.deepEqual(
    todas.estados.map((e) => e.obra.obra_id),
    [libro(5), pelicula(1), libro(1)],
  );
  assert.equal(todas.siguiente, null);
  assert.deepEqual(
    (await pedir('?estado=pendiente')).estados.map((e) => e.obra.titulo),
    ['Parque Jurásico', 'Dune'],
  );

  const primera = await pedir('?limite=2');
  const segunda = await pedir(`?limite=2&cursor=${primera.siguiente}`);
  assert.deepEqual(
    [...primera.estados, ...segunda.estados].map((e) => e.obra.obra_id),
    [libro(5), pelicula(1), libro(1)],
  );
  assert.equal(segunda.siguiente, null);
});

test('EP-10: recientes primero, con autor y obra; el cursor no salta ni repite', async () => {
  const [a, b] = [await api.crearLector('Autora A'), await api.crearLector('Autor B')];
  const ra = await publicarBien(a, libro(6), { calificacion: 3, texto: 'de A' });
  const rb = await publicarBien(b, libro(6), { calificacion: 4, texto: 'de B' });
  // Fechas casi iguales (un microsegundo): un cursor de milisegundos las confundiría.
  await pool.query(`UPDATE resena SET creado_en = '2030-01-01 00:00:00.000001+00' WHERE resena_id = $1`, [
    ra.resena_id,
  ]);
  await pool.query(`UPDATE resena SET creado_en = '2030-01-01 00:00:00.000002+00' WHERE resena_id = $1`, [
    rb.resena_id,
  ]);

  const todas = await listar(`obra_id=${libro(6)}`);
  assert.deepEqual(
    todas.resenas.slice(0, 2).map((r) => r.autor.nombre),
    ['Autor B', 'Autora A'],
  );
  assert.equal(todas.resenas[0]?.obra.titulo, 'El Hobbit');

  const recorridas: string[] = [];
  let cursor: string | null = '';
  while (cursor !== null) {
    const pagina: Awaited<ReturnType<typeof listar>> = await listar(
      `obra_id=${libro(6)}&limite=1${cursor && `&cursor=${cursor}`}`,
    );
    recorridas.push(...pagina.resenas.map((r) => r.resena_id));
    cursor = pagina.siguiente;
  }
  assert.deepEqual(
    recorridas,
    todas.resenas.map((r) => r.resena_id),
  );
});

test('EP-10: las ocultas solo las ve el administrador y no cuentan en el promedio', async () => {
  const lector = await api.crearLector();
  const antes = await resumenDe(libro(7));
  const r = await publicarBien(lector, libro(7), { calificacion: 1 });
  await pool.query('UPDATE resena SET oculta = true WHERE resena_id = $1', [r.resena_id]);
  assert.deepEqual(await resumenDe(libro(7)), antes);

  const ids = async (token?: string) => (await listar(`obra_id=${libro(7)}`, token)).resenas.map((x) => x.resena_id);
  assert.ok(!(await ids()).includes(r.resena_id));
  assert.ok(!(await ids(lector.token)).includes(r.resena_id));
  assert.ok((await ids(admin)).includes(r.resena_id));
});

test('EP-10: el historial de otra persona exige sesión y seguirla', async () => {
  const lector = await api.crearLector();
  const consulta = `usuario_id=${ANA}`;
  await esperarError(await api.pedir('GET', `/resenas?${consulta}`), 401);
  await esperarError(await api.pedir('GET', `/resenas?${consulta}`, { token: lector.token }), 403);

  await pool.query('INSERT INTO seguimiento (seguidor_id, seguido_id) VALUES ($1, $2)', [lector.usuario_id, ANA]);
  const deAna = await listar(consulta, lector.token);
  assert.ok(deAna.resenas.length > 0);
  assert.ok(deAna.resenas.every((r) => r.autor.usuario_id === ANA && !r.oculta));
  assert.ok((await listar(consulta, admin)).resenas.some((r) => r.oculta));

  // Las propias se ven sin seguirse.
  assert.deepEqual((await listar(`usuario_id=${lector.usuario_id}`, lector.token)).resenas, []);
  await esperarError(await api.pedir('GET', `/resenas?usuario_id=${randomUUID()}`, { token: lector.token }), 404);
});

test('EP-10: filtros inválidos 400 y borrador 404', async () => {
  for (const consulta of [
    '',
    `obra_id=${libro(1)}&usuario_id=${ANA}`,
    'obra_id=no-es-un-id',
    `obra_id=${libro(1)}&limite=0`,
    `obra_id=${libro(1)}&limite=51`,
    `obra_id=${libro(1)}&cursor=basura`,
    `obra_id=${libro(1)}&cursor=${Buffer.from('["2026-13-45T00:00:00Z","x"]').toString('base64url')}`,
  ]) {
    await esperarError(await api.pedir('GET', `/resenas?${consulta}`), 400);
  }
  await esperarError(await api.pedir('GET', `/resenas?obra_id=${libro(11)}`), 404);
});

test('EP-13: borra el autor o el administrador; el estado no cambia y el promedio sí', async () => {
  const [autor, otro] = [await api.crearLector(), await api.crearLector()];
  const antes = await resumenDe(libro(8));
  const propia = await publicarBien(autor, libro(8), { calificacion: 1 });
  const borrar = (id: string, token?: string) => api.pedir('DELETE', `/resenas/${id}`, { token });

  await esperarError(await borrar(propia.resena_id), 401);
  await esperarError(await borrar(propia.resena_id, otro.token), 404);
  assert.equal((await borrar(propia.resena_id, autor.token)).status, 204);
  await esperarError(await borrar(propia.resena_id, autor.token), 404);
  assert.deepEqual(await resumenDe(libro(8)), antes);
  assert.equal(await estadoDe(autor.usuario_id, libro(8)), 'terminada');
  assert.deepEqual(await eventos(autor.usuario_id), ['obra_leida']);

  const ajena = await publicarBien(otro, libro(8), { calificacion: 2 });
  assert.equal((await borrar(ajena.resena_id, admin)).status, 204);
  assert.deepEqual(await resumenDe(libro(8)), antes);
});
