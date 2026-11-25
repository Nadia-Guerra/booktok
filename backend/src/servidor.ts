// Punto de entrada: un solo proceso (D-29). El worker de sincronización se arrancará aquí (etapa 5).
import { crearApp } from './app.ts';
import { cerrarMongo } from './bases/mongo.ts';
import { cerrarNeo4j } from './bases/neo4j.ts';
import { cerrarPostgres } from './bases/postgres.ts';
import { config } from './config.ts';

const servidor = crearApp().listen(config.puerto, (error) => {
  if (error) throw error;
  console.log(`API escuchando en el puerto ${config.puerto}`);
});

let apagando = false;
async function apagar(senal: string) {
  if (apagando) return;
  apagando = true;
  console.log(`${senal}: apagando`);
  setTimeout(() => process.exit(1), 8000).unref(); // por si una petición no termina
  servidor.close(async () => {
    await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
    process.exit(0);
  });
}

process.on('SIGINT', () => void apagar('SIGINT'));
process.on('SIGTERM', () => void apagar('SIGTERM'));
