// Escenario de reconciliación (RNF-03): se descuadra el grafo a propósito, se detecta y se corrige.
//
// Necesita la API detenida, como las pruebas de sincronización: su worker se llevaría los eventos.
//   docker compose stop api
// Solo descuadra relaciones de lectores de prueba, que borra al terminar.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { cerrarMongo } from '../src/bases/mongo.ts';
import { cerrarNeo4j } from '../src/bases/neo4j.ts';
import { cerrarPostgres } from '../src/bases/postgres.ts';
import * as grafo from '../src/repositorios/grafo/sincronizacion.ts';
import { relaciones } from '../src/repositorios/grafo/reconciliacion.ts';
import { marcarEstado } from '../src/repositorios/relacional/resenas.ts';
import { seguir, sigue } from '../src/repositorios/relacional/social.ts';
import { reconciliar, type Diferencias, type Par } from '../src/servicios/reconciliacion.ts';
import { procesarLote } from '../src/servicios/sincronizacion.ts';
import { levantarApi } from './ayudas.ts';

const LIBRO = 'b1000000-0000-4000-8000-000000000001';

let api: Awaited<ReturnType<typeof levantarApi>>;
let a: string;
let b: string;

before(async () => {
  const puerto = process.env.API_PORT ?? '3000';
  const encendida = await fetch(`http://127.0.0.1:${puerto}/api/v1/salud`, { signal: AbortSignal.timeout(2000) }).then(
    () => true,
    () => false,
  );
  assert.equal(encendida, false, `Hay una API en el puerto ${puerto}: detenla (docker compose stop api)`);
  api = await levantarApi();
  a = (await api.crearLector()).usuario_id;
  b = (await api.crearLector()).usuario_id;
  await seguir(a, b);
  await marcarEstado(a, LIBRO, 'terminada');
  await vaciar(); // las dos relaciones llegan al grafo
});

after(async () => {
  await api.borrarLectores();
  api.cerrar();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
});

async function vaciar() {
  let resultado = await procesarLote();
  while (resultado === 'lleno') resultado = await procesarLote();
  assert.equal(resultado, 'vacio');
}

/** Las diferencias que tocan a los lectores de esta prueba. */
const mias = (d: Diferencias) => {
  const propia = (p: Par) => p.origen === a || p.origen === b;
  return { faltan: d.faltan.filter(propia), sobran: d.sobran.filter(propia) };
};

const hayEnGrafo = async (tipo: 'sigue' | 'leyo', origen: string, destino: string) =>
  (await relaciones())[tipo].some((p) => p.origen === origen && p.destino === destino);

test('detecta lo que falta y lo que sobra en el grafo, sin tocar nada', async () => {
  // Se descuadra la copia: se pierden dos relaciones y aparece una que nadie creó.
  await grafo.eliminarSeguimiento(a, b);
  await grafo.eliminarLectura(a, LIBRO);
  await grafo.crearSeguimiento(b, a);

  const { antes, despues } = await reconciliar({ aplicar: false });

  assert.deepEqual(mias(antes.sigue), { faltan: [{ origen: a, destino: b }], sobran: [{ origen: b, destino: a }] });
  assert.deepEqual(mias(antes.leyo), { faltan: [{ origen: a, destino: LIBRO }], sobran: [] });
  assert.equal(despues, undefined);
  assert.equal(await hayEnGrafo('sigue', a, b), false);
  assert.equal(await hayEnGrafo('sigue', b, a), true);
});

test('corrige solo el grafo, y repetirlo no encuentra nada', async () => {
  const { despues } = await reconciliar({ aplicar: true });

  assert.ok(despues);
  assert.deepEqual(mias(despues.sigue), { faltan: [], sobran: [] });
  assert.deepEqual(mias(despues.leyo), { faltan: [], sobran: [] });
  assert.equal(await hayEnGrafo('sigue', a, b), true);
  assert.equal(await hayEnGrafo('leyo', a, LIBRO), true);
  assert.equal(await hayEnGrafo('sigue', b, a), false);
  // La fuente no cambió.
  assert.equal(await sigue(a, b), true);
  assert.equal(await sigue(b, a), false);

  const otra = await reconciliar({ aplicar: false });
  assert.deepEqual(mias(otra.antes.sigue), { faltan: [], sobran: [] });
});

test('con eventos pendientes informa pero no corrige', async () => {
  await seguir(b, a); // queda el evento sin aplicar

  const { omitida, despues, antes } = await reconciliar({ aplicar: true });

  assert.equal(omitida, 'eventos_pendientes');
  assert.equal(despues, undefined);
  assert.ok(antes.eventos.pendientes > 0);
  assert.equal(await hayEnGrafo('sigue', b, a), false);

  await vaciar(); // el worker lo copia y ya no hay diferencia
  assert.equal(await hayEnGrafo('sigue', b, a), true);
});
