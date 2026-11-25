// Conexión a Neo4j. Solo la usan los repositorios de grafo.
// El driver conecta al primer uso, así que la API arranca aunque Neo4j aún no responda.
import { readFileSync } from 'node:fs';
import neo4j from 'neo4j-driver';
import { config } from '../config.ts';

export const driver = neo4j.driver(config.neo4j.uri, neo4j.auth.basic(config.neo4j.user, config.neo4j.password), {
  maxConnectionPoolSize: 10,
  connectionTimeout: 5000,
  connectionAcquisitionTimeout: 6000,
  maxTransactionRetryTime: 5000,
  disableLosslessIntegers: true, // los enteros del grafo (orden, conteos) son pequeños
});

/**
 * Texto de una consulta de `db/grafo/consultas` (CG-nn). Es la única copia del Cypher: se lee de
 * ahí y no se reescribe. Se llama al cargar el módulo, así que un archivo que falte se nota al arrancar.
 */
export function consultaCypher(id: `CG-${string}`): string {
  return readFileSync(new URL(`../../../db/grafo/consultas/${id}.cypher`, import.meta.url), 'utf8');
}

/** Ejecuta una consulta de lectura y devuelve cada fila como un objeto. */
export async function leerGrafo<Fila>(consulta: string, parametros: Record<string, unknown>): Promise<Fila[]> {
  const sesion = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const resultado = await sesion.executeRead((tx) => tx.run(consulta, parametros));
    return resultado.records.map((r) => r.toObject() as Fila);
  } finally {
    await sesion.close();
  }
}

export function cerrarNeo4j(): Promise<void> {
  return driver.close();
}
