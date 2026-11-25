// Punto de entrada: un solo proceso (D-29), con la API y el worker de sincronización.
// Nunca deben correr dos a la vez contra las mismas bases (D-04).
import { crearApp } from './app.ts';
import { cerrarMongo } from './bases/mongo.ts';
import { cerrarNeo4j } from './bases/neo4j.ts';
import { cerrarPostgres } from './bases/postgres.ts';
import { config } from './config.ts';
import { crearWorker } from './servicios/sincronizacion.ts';

const worker = crearWorker();

const servidor = crearApp().listen(config.puerto, (error) => {
  if (error) throw error; // por ejemplo, el puerto ocupado: así no arranca un segundo worker
  console.log(`API escuchando en el puerto ${config.puerto}`);
  worker.iniciar();
});

let apagando = false;
async function apagar(senal: string) {
  if (apagando) return;
  apagando = true;
  console.log(`${senal}: apagando`);
  setTimeout(() => process.exit(1), 8000).unref(); // por si una petición no termina
  const workerDetenido = worker.detener();
  servidor.close(async () => {
    await Promise.allSettled([workerDetenido]);
    await Promise.allSettled([cerrarPostgres(), cerrarMongo(), cerrarNeo4j()]);
    process.exit(0);
  });
}

process.on('SIGINT', () => void apagar('SIGINT'));
process.on('SIGTERM', () => void apagar('SIGTERM'));
