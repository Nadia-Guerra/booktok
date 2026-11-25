// El worker (O19; documento 04, secciones 4 y 9) contra las tres bases.
//
// Necesita la API detenida: su worker se llevaría los eventos de estas pruebas (D-04).
//   docker compose stop api
// Escribe solo con lectores de prueba, que borra al terminar. Los eventos que ya estuvieran
// pendientes se aplican antes de empezar, como haría la API al arrancar.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { setTimeout as dormir } from 'node:timers/promises';
import { cerrarMongo, mongoDb } from '../src/bases/mongo.ts';
import { cerrarNeo4j, leerGrafo } from '../src/bases/neo4j.ts';
import { cerrarPostgres, enTransaccion, anotarEvento, pool } from '../src/bases/postgres.ts';
import { marcarEstado } from '../src/repositorios/relacional/resenas.ts';
import { dejarDeSeguir, seguir } from '../src/repositorios/relacional/social.ts';
import { aplicarEvento, crearWorker, procesarLote } from '../src/servicios/sincronizacion.ts';
import { levantarApi } from './ayudas.ts';

const LIBRO = 'b1000000-0000-4000-8000-000000000001';
const PELICULA = 'f1000000-0000-4000-8000-000000000001';

let api: Awaited<ReturnType<typeof levantarApi>>;

before(async () => {
  const puerto = process.env.API_PORT ?? '3000';
  const encendida = await fetch(`http://127.0.0.1:${puerto}/api/v1/salud`, { signal: AbortSignal.timeout(2000) }).then(
    () => true,
    () => false,
  );
  assert.equal(encendida, false, `Hay una API en el puerto ${puerto}: detenla (docker compose stop api)`);
  api = await levantarApi();
  await vaciar();
});

after(async () => {
  await api.borrarLectores();
  api.cerrar();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
});

type Lector = Awaited<ReturnType<typeof api.crearLector>>;

async function vaciar() {
  let resultado = await procesarLote();
  while (resultado === 'lleno') resultado = await procesarLote();
  assert.equal(resultado, 'vacio');
}

/** Estado en la bandeja de los eventos de un lector, en orden. */
const bandejaDe = async (usuarioId: string) =>
  (
    await pool.query(
      `SELECT tipo_evento, estado, intentos, error FROM sync_outbox
       WHERE payload->>'usuario_id' = $1 OR payload->>'seguidor_id' = $1 ORDER BY evento_id`,
      [usuarioId],
    )
  ).rows as { tipo_evento: string; estado: string; intentos: number; error: string | null }[];

const contar = async (consulta: string, parametros: Record<string, unknown>) =>
  (await leerGrafo<{ n: number }>(consulta, parametros))[0]!.n;

const nodos = (id: string) => contar('MATCH (u:Usuario {usuario_id: $id}) RETURN count(u) AS n', { id });

const sigue = (a: Lector, b: Lector) =>
  contar('MATCH (:Usuario {usuario_id: $a})-[r:sigue]->(:Usuario {usuario_id: $b}) RETURN count(r) AS n', {
    a: a.usuario_id,
    b: b.usuario_id,
  });

const leyo = (l: Lector, obra: string) =>
  contar('MATCH (:Usuario {usuario_id: $u})-[r:leyó]->({obra_id: $obra}) RETURN count(r) AS n', {
    u: l.usuario_id,
    obra,
  });

async function esperarQue(condicion: () => Promise<boolean>, que: string) {
  const limite = Date.now() + 30_000;
  while (!(await condicion())) {
    assert.ok(Date.now() < limite, `no ocurrió: ${que}`);
    await dormir(100);
  }
}

const errorDeRed = () => Object.assign(new Error('sin conexión'), { code: 'ServiceUnavailable' });

test('los eventos llegan al grafo, repetirlos no duplica y se pueden deshacer', async () => {
  const a = await api.crearLector();
  const b = await api.crearLector();
  await seguir(a.usuario_id, b.usuario_id);
  await marcarEstado(a.usuario_id, LIBRO, 'terminada');
  await marcarEstado(a.usuario_id, PELICULA, 'terminada');
  await vaciar();

  const fotografia = async () => [
    await nodos(a.usuario_id),
    await nodos(b.usuario_id),
    await sigue(a, b),
    await leyo(a, LIBRO),
    await leyo(a, PELICULA), // D-16: las películas no se guardan
  ];
  assert.deepEqual(await fotografia(), [1, 1, 1, 1, 0]);
  assert.ok((await bandejaDe(a.usuario_id)).every((e) => e.estado === 'procesado'));

  await pool.query(
    `UPDATE sync_outbox SET estado = 'pendiente' WHERE payload->>'usuario_id' = $1 OR payload->>'seguidor_id' = $1`,
    [a.usuario_id],
  );
  await vaciar();
  assert.deepEqual(await fotografia(), [1, 1, 1, 1, 0]);

  await dejarDeSeguir(a.usuario_id, b.usuario_id);
  await marcarEstado(a.usuario_id, LIBRO, 'pendiente');
  await vaciar();
  assert.deepEqual(await fotografia(), [1, 1, 0, 0, 0]);
});

test('si la base destino no responde, el evento espera sin gastar intentos', async () => {
  const a = await api.crearLector();

  for (let i = 0; i < 7; i++) {
    const resultado = await procesarLote({ aplicar: () => Promise.reject(errorDeRed()) });
    assert.equal(resultado, 'reintentar');
  }
  assert.deepEqual(
    (await bandejaDe(a.usuario_id)).map((e) => [e.estado, e.intentos]),
    [['pendiente', 0]],
  );
  await vaciar();
  assert.equal(await nodos(a.usuario_id), 1);
});

test('un evento defectuoso frena a los siguientes hasta quedar fallido al quinto intento', async () => {
  const a = await api.crearLector();
  const b = await api.crearLector();
  await vaciar();
  await enTransaccion((c) =>
    anotarEvento(c, 'obra_leida', { usuario_id: a.usuario_id, obra_id: randomUUID() }),
  );
  await seguir(a.usuario_id, b.usuario_id);

  const porEstado = async () => (await bandejaDe(a.usuario_id)).slice(1).map((e) => [e.estado, e.intentos]);

  for (let intento = 1; intento <= 4; intento++) {
    assert.equal(await procesarLote(), 'reintentar');
    assert.deepEqual(await porEstado(), [
      ['pendiente', intento],
      ['pendiente', 0],
    ]);
  }
  assert.equal(await procesarLote(), 'vacio');
  assert.deepEqual(await porEstado(), [
    ['fallido', 5],
    ['procesado', 0],
  ]);
  assert.match((await bandejaDe(a.usuario_id))[1]!.error!, /La obra del evento no existe/);
  assert.equal(await sigue(a, b), 1);
});

test('si falta un nodo: es un fallo solo mientras PostgreSQL tenga el dato', async () => {
  const a = await api.crearLector();
  const b = await api.crearLector();
  // Sin su `usuario_creado`, `b` no llega al grafo.
  await pool.query(`DELETE FROM sync_outbox WHERE payload->>'usuario_id' = $1`, [b.usuario_id]);

  await seguir(a.usuario_id, b.usuario_id);
  assert.equal(await procesarLote(), 'reintentar');
  assert.equal((await bandejaDe(a.usuario_id)).at(-1)!.intentos, 1);

  // Al dejar de seguirlo, el evento pendiente deja de importar.
  await dejarDeSeguir(a.usuario_id, b.usuario_id);
  await vaciar();
  assert.ok((await bandejaDe(a.usuario_id)).every((e) => e.estado === 'procesado'));
});

test('eliminar un usuario borra su nodo y sus comparativas', async () => {
  const a = await api.crearLector();
  await vaciar();
  const comparativas = mongoDb.collection<{ _id: string }>('resenas_comparativas');
  const ahora = new Date();
  await comparativas.insertOne({
    _id: randomUUID(),
    usuario_id: a.usuario_id,
    libro_id: LIBRO,
    pelicula_id: PELICULA,
    veredicto: { preferencia: 'empate' },
    aspectos: [{ nombre: 'Historia' }],
    oculta: false,
    creado_en: ahora,
    actualizado_en: ahora,
  } as { _id: string });

  // Lo que hará O4 cuando exista EP-07: evento y borrado en una transacción.
  await enTransaccion(async (c) => {
    await anotarEvento(c, 'usuario_eliminado', { usuario_id: a.usuario_id });
    await c.query('DELETE FROM usuario WHERE usuario_id = $1', [a.usuario_id]);
  });
  await vaciar();

  assert.equal(await nodos(a.usuario_id), 0);
  assert.equal(await comparativas.countDocuments({ usuario_id: a.usuario_id }), 0);
});

test('el worker vacía lo pendiente al arrancar y atiende los avisos de la API sin esperar', async () => {
  const a = await api.crearLector();
  const b = await api.crearLector();
  const worker = crearWorker({ intervaloMs: 600_000 }); // sin sondeo: solo arranque y avisos
  worker.iniciar();
  try {
    await esperarQue(async () => (await nodos(b.usuario_id)) === 1, 'vaciado al arrancar');

    const res = await api.pedir('POST', '/me/seguidos', { cuerpo: { usuario_id: b.usuario_id }, token: a.token });
    assert.equal(res.status, 201);
    await esperarQue(async () => (await sigue(a, b)) === 1, 'seguimiento en el grafo tras el aviso');

    await api.pedir('PUT', `/me/estados/${LIBRO}`, { cuerpo: { estado: 'terminada' }, token: a.token });
    await esperarQue(async () => (await leyo(a, LIBRO)) === 1, 'lectura en el grafo tras el aviso');
  } finally {
    await worker.detener();
  }
});

test('el worker nunca aplica dos eventos a la vez ni repite uno', async () => {
  let aLaVez = 0;
  let maximo = 0;
  const orden: bigint[] = [];
  const worker = crearWorker({
    intervaloMs: 600_000,
    async aplicar(evento) {
      maximo = Math.max(maximo, ++aLaVez);
      orden.push(BigInt(evento.eventoId));
      await dormir(30);
      await aplicarEvento(evento);
      aLaVez--;
    },
  });
  worker.iniciar();
  try {
    // Cada registro avisa al worker mientras este todavía trabaja con los anteriores.
    const lectores = await Promise.all([1, 2, 3, 4, 5].map(() => api.crearLector()));
    await esperarQue(
      async () => (await Promise.all(lectores.map((l) => nodos(l.usuario_id)))).every((n) => n === 1),
      'todos los usuarios en el grafo',
    );
  } finally {
    await worker.detener();
  }
  assert.equal(maximo, 1);
  assert.equal(new Set(orden).size, orden.length, 'un evento se aplicó dos veces');
});

test('tras una caída de la base, el worker espera y sigue donde iba', async () => {
  const a = await api.crearLector();
  let caidas = 3;
  const worker = crearWorker({
    intervaloMs: 600_000,
    pausaInicialMs: 20,
    aplicar: (evento) => (caidas-- > 0 ? Promise.reject(errorDeRed()) : aplicarEvento(evento)),
  });
  worker.iniciar();
  try {
    await esperarQue(async () => (await nodos(a.usuario_id)) === 1, 'el nodo tras volver la base');
  } finally {
    await worker.detener();
  }
  assert.deepEqual(
    (await bandejaDe(a.usuario_id)).map((e) => [e.estado, e.intentos]),
    [['procesado', 0]],
  );
});

test('al apagar termina el evento en curso y no toma otro', async () => {
  const lectores = [await api.crearLector(), await api.crearLector()];
  let empezado: () => void;
  const enMarcha = new Promise<void>((ok) => (empezado = ok));
  const worker = crearWorker({
    async aplicar(evento) {
      empezado();
      await dormir(300);
      await aplicarEvento(evento);
    },
  });
  worker.iniciar();
  await enMarcha;
  await worker.detener();

  const estados = await Promise.all(lectores.map(async (l) => (await bandejaDe(l.usuario_id))[0]!.estado));
  assert.deepEqual(estados, ['procesado', 'pendiente']);
  await vaciar();
});
