// Unitarias de la lógica de la API que no necesita bases: cursor, clasificación de errores y
// saneado de la búsqueda por persona.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { destinoNoDisponible, ErrorApi } from '../../src/errores.ts';
import { leerCursor, paginar } from '../../src/paginacion.ts';

// El módulo del grafo lee la configuración al cargarse. Aquí no se conecta a nada (el driver conecta
// al primer uso), así que bastan valores de relleno y no hace falta un `.env`.
for (const variable of ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'MONGO_USER', 'MONGO_PASSWORD', 'MONGO_DB']) {
  process.env[variable] ??= 'sin-uso';
}
for (const variable of ['NEO4J_USER', 'NEO4J_PASSWORD']) process.env[variable] ??= 'sin-uso';

const { textoLucene } = await import('../../src/repositorios/grafo/descubrimiento.ts');

const fila = (n: number) => ({
  fecha: `2026-11-0${n}T10:00:00.123456Z`,
  id: `abcdef00-0000-4000-8000-00000000000${n}`,
});

test('paginación: con una fila de más hay cursor, y el cursor devuelve fecha e id exactos', () => {
  const { pagina, siguiente } = paginar([fila(3), fila(2), fila(1)], 2, (f) => f);
  assert.deepEqual(pagina, [fila(3), fila(2)]);
  assert.ok(siguiente);
  assert.deepEqual(leerCursor(siguiente), fila(2)); // conserva los microsegundos
});

test('paginación: sin más filas no hay cursor', () => {
  assert.equal(paginar([fila(2), fila(1)], 2, (f) => f).siguiente, null);
  assert.equal(paginar([] as ReturnType<typeof fila>[], 2, (f) => f).siguiente, null);
  assert.equal(leerCursor(undefined), undefined);
});

test('paginación: un cursor alterado es una entrada inválida', () => {
  const falso = Buffer.from(JSON.stringify(['ayer', '1'])).toString('base64url');
  for (const cursor of ['no-es-un-cursor', falso]) {
    assert.throws(
      () => leerCursor(cursor),
      (e) => e instanceof ErrorApi && e.codigo === 'entrada_invalida',
    );
  }
});

test('errores: distingue una base caída de un fallo de la propia petición', () => {
  const error = (code: string, message = 'x') => Object.assign(new Error(message), { code });
  for (const caida of [
    error('ECONNREFUSED'),
    error('57P01'), // PostgreSQL apagándose
    error('ServiceUnavailable'), // Neo4j
    new Error('Connection terminated unexpectedly'),
    new Error('Connection acquisition timed out'),
  ]) {
    assert.equal(destinoNoDisponible(caida), true, `${caida.message} debería ser una base caída`);
  }
  for (const otro of [error('23505'), error('Neo.ClientError.Statement.SyntaxError'), new Error('otra cosa'), null]) {
    assert.equal(destinoNoDisponible(otro), false);
  }
});

test('búsqueda por persona: quita la sintaxis de Lucene (D-41)', () => {
  assert.equal(textoLucene('Villeneuve'), 'villeneuve');
  assert.equal(textoLucene('a:b*'), 'a b');
  assert.equal(textoLucene('NOT'), 'not'); // en minúsculas deja de ser un operador
  assert.equal(textoLucene('+-&|!(){}[]^"~*?:\\/<>='), '');
});
