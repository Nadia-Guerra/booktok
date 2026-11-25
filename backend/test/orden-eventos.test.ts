// Prueba de concurrencia del orden de los eventos (documento 04, 4.4): con muchas operaciones a la
// vez sobre el mismo dato, el orden de `evento_id` es el orden en que se confirmaron. Si no lo fuera,
// el worker dejaría en el grafo lo contrario de lo que dice PostgreSQL.
//
// La prueba: los eventos de una misma pareja deben alternar (crear, borrar, crear...) y el último
// debe coincidir con lo que quedó guardado.
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { after, before, test } from 'node:test';
import { cerrarMongo } from '../src/bases/mongo.ts';
import { cerrarNeo4j } from '../src/bases/neo4j.ts';
import { cerrarPostgres, pool } from '../src/bases/postgres.ts';
import { marcarEstado } from '../src/repositorios/relacional/resenas.ts';
import { dejarDeSeguir, seguir, sigue } from '../src/repositorios/relacional/social.ts';
import { levantarApi } from './ayudas.ts';

const DUNE = 'b1000000-0000-4000-8000-000000000001';
const RONDAS = 40;
const A_LA_VEZ = 10; // el tamaño del grupo de conexiones (D-36)

let api: Awaited<ReturnType<typeof levantarApi>>;

before(async () => {
  api = await levantarApi();
});

after(async () => {
  await api.borrarLectores();
  api.cerrar();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
});

const tipos = async (filtro: Record<string, string>): Promise<string[]> =>
  (
    await pool.query(
      `SELECT tipo_evento FROM sync_outbox
       WHERE payload @> $1 AND tipo_evento <> 'usuario_creado' ORDER BY evento_id`,
      [filtro],
    )
  ).rows.map((f) => f.tipo_evento);

/** Comprueba que los eventos alternan empezando por `alta`. */
function exigirAlternancia(lista: string[], alta: string, baja: string) {
  lista.forEach((tipo, i) => assert.equal(tipo, i % 2 === 0 ? alta : baja, `evento ${i} de ${lista.length}`));
}

test('seguir y dejar de seguir a la vez: los eventos quedan en el orden de los cambios', async () => {
  const a = await api.crearLector();
  const b = await api.crearLector();

  for (let ronda = 0; ronda < RONDAS; ronda++) {
    await Promise.all(
      Array.from({ length: A_LA_VEZ }, () =>
        randomInt(2) ? seguir(a.usuario_id, b.usuario_id) : dejarDeSeguir(a.usuario_id, b.usuario_id),
      ),
    );
  }

  const lista = await tipos({ seguidor_id: a.usuario_id, seguido_id: b.usuario_id });
  assert.ok(lista.length > RONDAS / 2, `pocos cambios para probar algo: ${lista.length}`);
  exigirAlternancia(lista, 'seguimiento_creado', 'seguimiento_eliminado');
  assert.equal(lista.at(-1) === 'seguimiento_creado', await sigue(a.usuario_id, b.usuario_id));
});

test('marcar y desmarcar terminada a la vez: los eventos quedan en el orden de los cambios', async () => {
  const lector = await api.crearLector();

  for (let ronda = 0; ronda < RONDAS; ronda++) {
    await Promise.all(
      Array.from({ length: A_LA_VEZ }, () =>
        marcarEstado(lector.usuario_id, DUNE, randomInt(2) ? 'terminada' : 'pendiente'),
      ),
    );
  }

  const lista = await tipos({ usuario_id: lector.usuario_id, obra_id: DUNE });
  assert.ok(lista.length > RONDAS / 2, `pocos cambios para probar algo: ${lista.length}`);
  exigirAlternancia(lista, 'obra_leida', 'obra_no_leida');
  const final = await pool.query('SELECT estado FROM estado_obra WHERE usuario_id = $1 AND obra_id = $2', [
    lector.usuario_id,
    DUNE,
  ]);
  assert.equal(lista.at(-1) === 'obra_leida', final.rows[0].estado === 'terminada');
});
