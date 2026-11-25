// Configuración leída de variables de entorno (.env en la máquina, `environment` en el Compose).
// Los mensajes de error nombran la variable que falta, nunca su valor.
import { z } from 'zod';

const puerto = z.coerce.number().int().min(1).max(65535);

const entorno = z.object({
  API_PORT: puerto.default(3000),
  POSTGRES_HOST: z.string().default('127.0.0.1'),
  POSTGRES_PORT: puerto.optional(),
  POSTGRES_HOST_PORT: puerto.default(5433),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  MONGO_HOST: z.string().default('127.0.0.1'),
  MONGO_PORT: puerto.optional(),
  MONGO_HOST_PORT: puerto.default(27017),
  MONGO_USER: z.string().min(1),
  MONGO_PASSWORD: z.string().min(1),
  MONGO_DB: z.string().min(1),
  NEO4J_URI: z.string().optional(),
  NEO4J_BOLT_HOST_PORT: puerto.default(7687),
  NEO4J_USER: z.string().min(1),
  NEO4J_PASSWORD: z.string().min(1),
});

function leerConfig() {
  const r = entorno.safeParse(process.env);
  if (!r.success) {
    const variables = r.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Configuración incompleta o inválida: ${variables} (ver .env.example)`);
  }
  const e = r.data;
  return {
    puerto: e.API_PORT,
    postgres: {
      host: e.POSTGRES_HOST,
      port: e.POSTGRES_PORT ?? e.POSTGRES_HOST_PORT,
      user: e.POSTGRES_USER,
      password: e.POSTGRES_PASSWORD,
      database: e.POSTGRES_DB,
    },
    mongo: {
      url: `mongodb://${e.MONGO_HOST}:${e.MONGO_PORT ?? e.MONGO_HOST_PORT}`,
      user: e.MONGO_USER,
      password: e.MONGO_PASSWORD,
      database: e.MONGO_DB,
    },
    neo4j: {
      uri: e.NEO4J_URI ?? `bolt://127.0.0.1:${e.NEO4J_BOLT_HOST_PORT}`,
      user: e.NEO4J_USER,
      password: e.NEO4J_PASSWORD,
    },
  };
}

export const config = leerConfig();
