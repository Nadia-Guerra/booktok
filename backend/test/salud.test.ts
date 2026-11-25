// Pruebas de la etapa 1. Necesitan las tres bases levantadas. Solo leen.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { cuerpoError, respuestaSalud } from '@dlbp/shared';
import { Router } from 'express';
import { crearApp } from '../src/app.ts';
import { cerrarMongo } from '../src/bases/mongo.ts';
import { cerrarNeo4j } from '../src/bases/neo4j.ts';
import { cerrarPostgres } from '../src/bases/postgres.ts';
import { rutasSalud } from '../src/rutas/salud.ts';

// Rutas solo de prueba, para comprobar el manejador de errores.
const rutasDePrueba = Router();
rutasDePrueba.get('/prueba/fallo', async () => {
  throw new Error('detalle interno que no debe salir');
});
rutasDePrueba.get('/prueba/base-caida', async () => {
  throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
});
rutasDePrueba.post('/prueba/eco', (req, res) => {
  res.json(req.body);
});

let servidor: Server;
let base: string;

before(async () => {
  servidor = crearApp([rutasSalud, rutasDePrueba]).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/api/v1`;
});

after(async () => {
  servidor.close();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
});

async function error(res: Response) {
  return cuerpoError.parse(await res.json()).error;
}

test('EP-01: responde 200 con las tres bases arriba', async () => {
  const res = await fetch(`${base}/salud`);
  assert.equal(res.status, 200);
  assert.deepEqual(respuestaSalud.parse(await res.json()), {
    estado: 'ok',
    api: 'ok',
    bases: { postgres: 'ok', mongo: 'ok', neo4j: 'ok' },
  });
});

test('una ruta que no existe da 404 con el formato de error', async () => {
  const res = await fetch(`${base}/no-existe`);
  assert.equal(res.status, 404);
  assert.equal((await error(res)).codigo, 'no_encontrado');
});

test('un error inesperado da 500 sin detalles internos', async () => {
  const res = await fetch(`${base}/prueba/fallo`);
  assert.equal(res.status, 500);
  const cuerpo = await res.text();
  assert.doesNotMatch(cuerpo, /detalle interno|at /);
  assert.equal(JSON.parse(cuerpo).error.codigo, 'error_interno');
});

test('una base caída da 503', async () => {
  const res = await fetch(`${base}/prueba/base-caida`);
  assert.equal(res.status, 503);
  assert.equal((await error(res)).codigo, 'base_no_disponible');
});

test('un JSON mal formado da 400', async () => {
  const res = await fetch(`${base}/prueba/eco`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"a":',
  });
  assert.equal(res.status, 400);
  assert.equal((await error(res)).codigo, 'entrada_invalida');
});
