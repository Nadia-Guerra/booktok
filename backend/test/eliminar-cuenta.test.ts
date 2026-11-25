// EP-07 (RF-04): la cuenta desaparece de las tres bases. Como usa el worker, necesita la API detenida.
// Solo borra lectores creados aquí.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { respuestaComparativas } from '@dlbp/shared';
import { cerrarMongo, mongoDb } from '../src/bases/mongo.ts';
import { cerrarNeo4j, leerGrafo } from '../src/bases/neo4j.ts';
import { cerrarPostgres, pool } from '../src/bases/postgres.ts';
import { procesarLote } from '../src/servicios/sincronizacion.ts';
import { esperarError, levantarApi } from './ayudas.ts';

const libro = (n: number) => `b1000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const PELICULA = 'f1000000-0000-4000-8000-000000000001';

let api: Awaited<ReturnType<typeof levantarApi>>;
let promediosAntes: string;

const fotoDePromedios = async () =>
  JSON.stringify((await pool.query('SELECT obra_id, promedio, total_resenas FROM obra_resumen ORDER BY 1')).rows);

before(async () => {
  promediosAntes = await fotoDePromedios();
  api = await levantarApi();
});

after(async () => {
  await api.borrarLectores();
  api.cerrar();
  await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
});

type Lector = Awaited<ReturnType<typeof api.crearLector>>;

const eliminar = (l: Lector) => api.pedir('DELETE', '/me', { token: l.token });

const filasDe = async (id: string) =>
  (
    await pool.query(
      `SELECT (SELECT count(*) FROM usuario WHERE usuario_id = $1)::int AS usuario,
              (SELECT count(*) FROM resena WHERE usuario_id = $1)::int AS resenas,
              (SELECT count(*) FROM estado_obra WHERE usuario_id = $1)::int AS estados,
              (SELECT count(*) FROM seguimiento WHERE seguidor_id = $1 OR seguido_id = $1)::int AS seguimientos,
              (SELECT count(*) FROM sesion WHERE usuario_id = $1)::int AS sesiones`,
      [id],
    )
  ).rows[0];

const comparativasDe = (id: string) => mongoDb.collection('resenas_comparativas').countDocuments({ usuario_id: id });

const nodos = async (id: string) =>
  (await leerGrafo<{ n: number }>('MATCH (u:Usuario {usuario_id: $id}) RETURN count(u) AS n', { id }))[0]!.n;

async function sincronizar() {
  let resultado = await procesarLote();
  while (resultado === 'lleno') resultado = await procesarLote();
  assert.equal(resultado, 'vacio');
}

test('eliminar la cuenta la borra en las tres bases y recalcula los promedios', async () => {
  const lector = await api.crearLector();
  const otro = await api.crearLector();
  const { token } = lector;
  await api.pedir('PUT', `/obras/${libro(1)}/resena`, { token, cuerpo: { calificacion: 1 } });
  await api.pedir('POST', '/me/seguidos', { token, cuerpo: { usuario_id: otro.usuario_id } });
  await api.pedir('POST', '/me/seguidos', { token: otro.token, cuerpo: { usuario_id: lector.usuario_id } });
  const creada = await api.pedir('POST', '/comparativas', {
    token,
    cuerpo: {
      libro_id: libro(1),
      pelicula_id: PELICULA,
      veredicto: { preferencia: 'libro' },
      aspectos: [{ nombre: 'Ritmo' }],
    },
  });
  assert.equal(creada.status, 201);
  await sincronizar();
  assert.deepEqual([await nodos(lector.usuario_id), await comparativasDe(lector.usuario_id)], [1, 1]);

  assert.equal((await eliminar(lector)).status, 204);

  // PostgreSQL queda limpio al responder; el token ya no sirve.
  assert.deepEqual(await filasDe(lector.usuario_id), {
    usuario: 0,
    resenas: 0,
    estados: 0,
    seguimientos: 0,
    sesiones: 0,
  });
  assert.equal(await fotoDePromedios(), promediosAntes);
  await esperarError(await api.pedir('GET', '/me', { token }), 401);

  // Antes de que el worker limpie las copias, la API ya no muestra su comparativa.
  const res = await api.pedir('GET', `/comparativas?libro_id=${libro(1)}&pelicula_id=${PELICULA}`);
  const lista = respuestaComparativas.parse(await res.json()).comparativas;
  assert.ok(lista.every((c) => c.autor.usuario_id !== lector.usuario_id));

  await sincronizar();
  assert.deepEqual([await nodos(lector.usuario_id), await comparativasDe(lector.usuario_id)], [0, 0]);
  assert.equal(await nodos(otro.usuario_id), 1);
});

test('la cuenta de administrador no se elimina, y sin sesión tampoco nada', async () => {
  const admin = await api.entrarComo('admin');
  await esperarError(await api.pedir('DELETE', '/me', { token: admin }), 403);
  assert.equal((await api.pedir('GET', '/me', { token: admin })).status, 200);
  await api.salir(admin);
  await esperarError(await api.pedir('DELETE', '/me'), 401);
});

test('varias cuentas con reseñas de las mismas obras se eliminan a la vez sin fallar', async () => {
  const obras = [libro(1), libro(2), libro(3), libro(4)];
  for (let ronda = 0; ronda < 3; ronda++) {
    const lectores: Lector[] = [];
    for (let i = 0; i < 6; i++) {
      const lector = await api.crearLector();
      // Cada uno en otro orden, para que los borrados bloqueen las obras en órdenes cruzados (D-38).
      const orden = i % 2 ? [...obras].reverse() : [...obras.slice(i % 4), ...obras.slice(0, i % 4)];
      for (const obra of orden) {
        await api.pedir('PUT', `/obras/${obra}/resena`, { token: lector.token, cuerpo: { calificacion: 1 + (i % 5) } });
      }
      lectores.push(lector);
    }

    const respuestas = await Promise.all(lectores.map(eliminar));
    assert.deepEqual(
      respuestas.map((r) => r.status),
      lectores.map(() => 204),
    );
    assert.equal(await fotoDePromedios(), promediosAntes);
  }
  await sincronizar();
});
