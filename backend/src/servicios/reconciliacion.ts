// Reconciliación (RNF-03; documento 04, sección 8; fuente de verdad, sección 6), versión reducida:
// punto 1 (`seguimiento` contra `sigue`) y punto 2 (libros terminados contra `leyó`), e informa los
// eventos sin aplicar (punto 7). Compara la fuente con la copia y corrige solo la copia, el grafo.
// Se lanza a mano y no mientras se usa la aplicación (documento 04, 9.6).
import * as copia from '../repositorios/grafo/reconciliacion.ts';
import * as grafo from '../repositorios/grafo/sincronizacion.ts';
import * as fuente from '../repositorios/relacional/reconciliacion.ts';

/** Una relación: quién la tiene y hacia qué apunta (usuario u obra). */
export interface Par {
  origen: string;
  destino: string;
}

export interface Diferencias {
  enFuente: number;
  faltan: Par[]; // están en PostgreSQL y no en el grafo
  sobran: Par[]; // están en el grafo y no en PostgreSQL
}

export interface Revision {
  sigue: Diferencias;
  leyo: Diferencias;
  eventos: { pendientes: number; fallidos: number };
}

export interface Resultado {
  antes: Revision;
  despues?: Revision; // solo si se corrigió
  omitida?: 'eventos_pendientes';
}

const clave = (p: Par) => `${p.origen}|${p.destino}`;

function comparar(enFuente: Par[], enCopia: Par[]): Diferencias {
  const deFuente = new Set(enFuente.map(clave));
  const deCopia = new Set(enCopia.map(clave));
  return {
    enFuente: enFuente.length,
    faltan: enFuente.filter((p) => !deCopia.has(clave(p))),
    sobran: enCopia.filter((p) => !deFuente.has(clave(p))),
  };
}

export const hayDiferencias = (r: Revision) =>
  [r.sigue, r.leyo].some((d) => d.faltan.length > 0 || d.sobran.length > 0);

async function revisar(): Promise<Revision> {
  // El grafo se lee primero: lo que esté en la copia ya se confirmó antes en PostgreSQL, así que
  // una relación creada mientras tanto nunca aparece como sobrante.
  const enGrafo = await copia.relaciones();
  const [seguimientos, libros, eventos] = await Promise.all([
    fuente.seguimientos(),
    fuente.librosTerminados(),
    fuente.eventosSinAplicar(),
  ]);
  return { sigue: comparar(seguimientos, enGrafo.sigue), leyo: comparar(libros, enGrafo.leyo), eventos };
}

/** Las mismas escrituras idempotentes del worker (CG-18 y CG-19). */
async function corregir({ sigue, leyo }: Revision): Promise<void> {
  for (const p of sigue.faltan) await grafo.crearSeguimiento(p.origen, p.destino);
  for (const p of sigue.sobran) await grafo.eliminarSeguimiento(p.origen, p.destino);
  for (const p of leyo.faltan) await grafo.crearLectura(p.origen, p.destino);
  for (const p of leyo.sobran) await grafo.eliminarLectura(p.origen, p.destino);
}

/**
 * Sin `aplicar` solo informa. Con eventos pendientes no corrige: las diferencias pueden ser cambios
 * que el worker todavía no ha copiado. Lo que quede en `despues` no se pudo corregir (por ejemplo,
 * porque falta el nodo de un usuario).
 */
export async function reconciliar({ aplicar }: { aplicar: boolean }): Promise<Resultado> {
  const antes = await revisar();
  if (!aplicar || !hayDiferencias(antes)) return { antes };
  if (antes.eventos.pendientes > 0) return { antes, omitida: 'eventos_pendientes' };
  await corregir(antes);
  return { antes, despues: await revisar() };
}
