// Lo que el grafo tiene como copia de PostgreSQL (CG-23).
import { consultaCypher, leerGrafo } from '../../bases/neo4j.ts';
import type { Par } from '../../servicios/reconciliacion.ts';

const CG23 = consultaCypher('CG-23');

export async function relaciones(): Promise<{ sigue: Par[]; leyo: Par[] }> {
  const filas = await leerGrafo<{ usuario_id: string; sigue: string[]; leyo: string[] }>(CG23, {});
  const pares = (campo: 'sigue' | 'leyo') =>
    filas.flatMap((f) => f[campo].map((destino) => ({ origen: f.usuario_id, destino })));
  return { sigue: pares('sigue'), leyo: pares('leyo') };
}
