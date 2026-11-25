// Borra del catálogo lo que crean las pruebas de administración: obras cuyo título empieza por
// `ZzPrueba` y personas cuyo nombre empieza igual. Se llama antes y después, por si una corrida se
// cortó. No toca nada de la semilla.
import { mongoDb } from '../src/bases/mongo.ts';
import { escribirGrafo } from '../src/bases/neo4j.ts';
import { pool } from '../src/bases/postgres.ts';

export const MARCA = 'ZzPrueba';

export async function limpiarCatalogoDePrueba(): Promise<void> {
  const ids: string[] = [];
  for (const nombre of ['libros', 'peliculas']) {
    const coleccion = mongoDb.collection<{ _id: string; titulo: string }>(nombre);
    const filtro = { titulo: { $regex: `^${MARCA}` } };
    ids.push(...(await coleccion.find(filtro, { projection: { _id: 1 } }).toArray()).map((f) => f._id));
    await coleccion.deleteMany(filtro);
  }
  await pool.query('DELETE FROM obra_resumen WHERE obra_id = ANY($1::uuid[])', [ids]);
  await escribirGrafo('MATCH (o) WHERE o.obra_id IN $ids DETACH DELETE o', { ids });
  await escribirGrafo('MATCH (p:Persona) WHERE p.nombre STARTS WITH $marca DETACH DELETE p', { marca: MARCA });
}
