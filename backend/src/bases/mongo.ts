// Conexión a MongoDB. Solo la usan los repositorios documentales.
// El driver conecta al primer uso, así que la API arranca aunque MongoDB aún no responda.
import { MongoClient } from 'mongodb';
import { config } from '../config.ts';

const cliente = new MongoClient(config.mongo.url, {
  auth: { username: config.mongo.user, password: config.mongo.password },
  authSource: 'admin',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 3000,
});

export const mongoDb = cliente.db(config.mongo.database);

export function cerrarMongo(): Promise<void> {
  return cliente.close();
}
