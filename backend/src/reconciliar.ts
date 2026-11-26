// Comando de reconciliación (RNF-03, D-29). Necesita PostgreSQL y Neo4j levantados.
//
//   npm run reconciliar --workspace backend                  informa las diferencias, sin tocar nada
//   npm run reconciliar --workspace backend -- --corregir    además corrige el grafo
//
// Termina con 0 si todo cuadra, 1 si quedan diferencias y 2 si no pudo revisar.
import { cerrarNeo4j } from './bases/neo4j.ts';
import { cerrarPostgres } from './bases/postgres.ts';
import { hayDiferencias, reconciliar, type Revision } from './servicios/reconciliacion.ts';

const aplicar = process.argv.includes('--corregir');

function informar(titulo: string, revision: Revision): void {
  const { eventos } = revision;
  console.log(`\n${titulo}`);
  console.log(`  Eventos sin aplicar: ${eventos.pendientes} pendientes y ${eventos.fallidos} fallidos`);
  for (const [nombre, d] of [
    ['sigue', revision.sigue],
    ['leyó', revision.leyo],
  ] as const) {
    console.log(`  ${nombre}: ${d.enFuente} en PostgreSQL, faltan ${d.faltan.length} y sobran ${d.sobran.length} en el grafo`);
    for (const p of d.faltan) console.log(`    falta  ${p.origen} -> ${p.destino}`);
    for (const p of d.sobran) console.log(`    sobra  ${p.origen} -> ${p.destino}`);
  }
}

try {
  const { antes, despues, omitida } = await reconciliar({ aplicar });
  console.log(`Reconciliación - ${new Date().toISOString()} - ${aplicar ? 'con corrección' : 'solo informe'}`);
  informar('Estado encontrado', antes);
  if (despues) informar('Después de corregir', despues);

  const final = despues ?? antes;
  if (!hayDiferencias(final)) console.log('\nResultado: el grafo coincide con PostgreSQL.');
  else if (omitida) console.log('\nResultado: no se corrigió porque hay eventos pendientes. Espera al worker y repite.');
  else if (despues) console.log('\nResultado: quedan diferencias que este comando no puede corregir.');
  else console.log('\nResultado: hay diferencias. Para corregirlas, repite con --corregir.');
  process.exitCode = hayDiferencias(final) ? 1 : 0;
} catch (e) {
  // Solo el nombre y el código: el mensaje de un motor puede llevar datos.
  const { name, code } = (e ?? {}) as { name?: string; code?: unknown };
  console.error(`No se pudo revisar (${name ?? 'error'} ${String(code ?? '')}). ¿Están PostgreSQL y Neo4j levantados?`);
  process.exitCode = 2;
} finally {
  await Promise.allSettled([cerrarPostgres(), cerrarNeo4j()]);
}
