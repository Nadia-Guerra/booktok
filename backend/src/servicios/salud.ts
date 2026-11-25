// Estado de la API y de cada base (EP-01).
import type { EstadoBase, RespuestaSalud } from '@dlbp/shared';
import * as relacional from '../repositorios/relacional/salud.ts';
import * as documental from '../repositorios/documental/salud.ts';
import * as grafo from '../repositorios/grafo/salud.ts';

// Holgado: la primera conexión a Neo4j tras un rato sin uso puede tardar varios segundos.
const ESPERA_MAXIMA_MS = 6000;

async function comprobar(ping: () => Promise<void>): Promise<EstadoBase> {
  let reloj: NodeJS.Timeout | undefined;
  const limite = new Promise<never>((_, rechazar) => {
    reloj = setTimeout(() => rechazar(new Error('tiempo agotado')), ESPERA_MAXIMA_MS);
  });
  try {
    await Promise.race([ping(), limite]);
    return 'ok';
  } catch {
    return 'caida';
  } finally {
    clearTimeout(reloj);
  }
}

export async function estadoDeSalud(): Promise<RespuestaSalud> {
  const [postgres, mongo, neo4j] = await Promise.all([
    comprobar(relacional.ping),
    comprobar(documental.ping),
    comprobar(grafo.ping),
  ]);
  const todas = [postgres, mongo, neo4j].every((e) => e === 'ok');
  return { estado: todas ? 'ok' : 'degradado', api: 'ok', bases: { postgres, mongo, neo4j } };
}
