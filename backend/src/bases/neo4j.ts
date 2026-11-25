// Conexión a Neo4j. Solo la usan los repositorios de grafo.
// El driver conecta al primer uso, así que la API arranca aunque Neo4j aún no responda.
import neo4j from 'neo4j-driver';
import { config } from '../config.ts';

export const driver = neo4j.driver(config.neo4j.uri, neo4j.auth.basic(config.neo4j.user, config.neo4j.password), {
  maxConnectionPoolSize: 10,
  connectionTimeout: 5000,
  connectionAcquisitionTimeout: 6000,
  maxTransactionRetryTime: 5000,
  disableLosslessIntegers: true, // los enteros del grafo (orden, conteos) son pequeños
});

export function cerrarNeo4j(): Promise<void> {
  return driver.close();
}
