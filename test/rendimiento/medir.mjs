// Evaluacion basica de rendimiento (entregable 8): tiempos de los flujos principales por HTTP.
//
// Necesita las tres bases y la API levantadas, con la semilla cargada. No usa dependencias.
//   node test/rendimiento/medir.mjs          50 llamadas por flujo, despues de 5 de calentamiento
//   node test/rendimiento/medir.mjs --frio   solo la primera y la segunda llamada al grafo
//
// Escribe unicamente con un lector de prueba que registra al empezar y elimina al terminar.
// Variables opcionales: API_URL (por defecto http://127.0.0.1:3000) y REPETICIONES.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import os from 'node:os';

const BASE = `${process.env.API_URL ?? 'http://127.0.0.1:3000'}/api/v1`;
const REPETICIONES = Number(process.env.REPETICIONES ?? 50);
const CALENTAMIENTO = 5;
const FRIO = process.argv.includes('--frio');

// Identificadores fijos de la semilla (db/semilla/README.md).
const DUNE_LIBRO = 'b1000000-0000-4000-8000-000000000001';
const DUNE_PELICULA = 'f1000000-0000-4000-8000-000000000001';
const HERBERT = 'a1000000-0000-4000-8000-000000000001';
const VILLENEUVE = 'a1000000-0000-4000-8000-000000000011';
const CHALAMET = 'a1000000-0000-4000-8000-000000000017';

/** La clave de prueba solo vive en el README de la semilla: se lee de ahi y no se imprime. */
function claveSemilla() {
  const readme = readFileSync(new URL('../../db/semilla/README.md', import.meta.url), 'utf8');
  const clave = readme.split('## Usuarios de prueba')[1]?.match(/```\r?\n(.+?)\r?\n```/)?.[1];
  if (!clave) throw new Error('no se encontro la clave de prueba en db/semilla/README.md');
  return clave;
}

async function pedir(metodo, ruta, { cuerpo, token, esperado = 200 } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const body = cuerpo === undefined ? undefined : JSON.stringify(cuerpo);
  const inicio = performance.now();
  const res = await fetch(BASE + ruta, { method: metodo, headers, body, signal: AbortSignal.timeout(60_000) });
  const texto = await res.text();
  const ms = performance.now() - inicio;
  // Una respuesta que no es la esperada no se mide: invalida la corrida.
  if (res.status !== esperado) throw new Error(`${metodo} ${ruta}: respondio ${res.status}, se esperaba ${esperado}`);
  return { ms, datos: texto ? JSON.parse(texto) : null };
}

const entrar = async (credenciales) =>
  (await pedir('POST', '/auth/sesion', { cuerpo: credenciales, esperado: 201 })).datos.token;

const salir = (token) => pedir('DELETE', '/auth/sesion', { token, esperado: 204 });

/** Exige que la consulta traiga algo: medir una respuesta vacia no diria nada. */
function conResultados(respuesta, campo) {
  if (!respuesta.datos[campo]?.length) throw new Error(`la respuesta no trae "${campo}": revisa la semilla`);
  return respuesta.ms;
}

function resumen(tiempos) {
  const ordenados = [...tiempos].sort((a, b) => a - b);
  // Percentil por rango mas cercano.
  const percentil = (p) => ordenados[Math.ceil((p / 100) * ordenados.length) - 1];
  return { min: ordenados[0], mediana: percentil(50), p95: percentil(95), max: ordenados.at(-1) };
}

const ms = (n) => `${n.toFixed(0)} ms`;

async function main() {
  const salud = (await pedir('GET', '/salud')).datos;
  if (salud.estado !== 'ok') throw new Error('la API no tiene las tres bases disponibles');

  const clave = claveSemilla();
  const ana = await entrar({ correo: 'ana@ejemplo.test', password: clave });
  const sofia = await entrar({ correo: 'sofia@ejemplo.test', password: clave });

  const recomendacionesLibros = async () =>
    conResultados(await pedir('GET', '/me/recomendaciones', { token: ana }), 'libros');
  const recomendacionesPeliculas = async () =>
    conResultados(await pedir('GET', '/me/recomendaciones', { token: sofia }), 'peliculas');
  const caminos = async () =>
    conResultados(
      await pedir('GET', `/exploracion/caminos?origen=${HERBERT}&destino=${CHALAMET}`, { token: ana }),
      'caminos',
    );
  const autores = async () =>
    conResultados(await pedir('GET', `/personas/${VILLENEUVE}/autores-relacionados`, { token: ana }), 'autores');
  const porPersona = async () => conResultados(await pedir('GET', '/obras?por=persona&q=villeneuve'), 'obras');

  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(`Equipo: ${os.type()} ${os.release()}, ${os.cpus()[0].model.trim()} (${os.cpus().length} hilos)`);
  console.log(
    `Memoria: ${(os.totalmem() / 2 ** 30).toFixed(1)} GB, libre al empezar ${(os.freemem() / 2 ** 30).toFixed(1)} GB`,
  );
  console.log(`Node ${process.version}. Llamadas a ${BASE}, una a la vez.`);

  if (FRIO) {
    console.log('\nPrimera llamada al grafo y la siguiente (ejecutar justo despues de reiniciar Neo4j)\n');
    console.log('| Flujo | Primera | Segunda |\n|---|---|---|');
    for (const [nombre, medir] of [
      ['Recomendaciones de libros (EP-18)', recomendacionesLibros],
      ['Caminos entre dos personas (EP-16)', caminos],
      ['Autores de un director (EP-17)', autores],
      ['Buscar por persona (EP-08)', porPersona],
    ]) {
      console.log(`| ${nombre} | ${ms(await medir())} | ${ms(await medir())} |`);
    }
    await salir(ana);
    await salir(sofia);
    return;
  }

  const credenciales = { correo: `prueba-${randomUUID()}@ejemplo.test`, password: `clave-${randomUUID()}` };
  await pedir('POST', '/auth/registro', { cuerpo: { ...credenciales, nombre: 'Lector de rendimiento' }, esperado: 201 });
  const lector = await entrar(credenciales);

  // [nombre, objetivo del p95 en ms, funcion que devuelve lo que tardo una llamada]
  const flujos = [
    ['Salud (EP-01)', 1000, async () => (await pedir('GET', '/salud')).ms],
    [
      'Iniciar sesion (EP-03)',
      1000,
      async () => {
        const sesion = await pedir('POST', '/auth/sesion', { cuerpo: credenciales, esperado: 201 });
        await salir(sesion.datos.token); // sin medir
        return sesion.ms;
      },
    ],
    ['Buscar por titulo (EP-08)', 1000, async () => conResultados(await pedir('GET', '/obras?q=dune'), 'obras')],
    ['Buscar por persona (EP-08)', 2000, porPersona],
    ['Ficha de libro (EP-09)', 1000, async () => (await pedir('GET', `/obras/${DUNE_LIBRO}`)).ms],
    ['Ficha de pelicula (EP-09)', 1000, async () => (await pedir('GET', `/obras/${DUNE_PELICULA}`)).ms],
    [
      'Resenas de una obra (EP-10)',
      1000,
      async () => conResultados(await pedir('GET', `/resenas?obra_id=${DUNE_LIBRO}`), 'resenas'),
    ],
    [
      'Publicar una resena (EP-11)',
      1000,
      async () => {
        const publicada = await pedir('PUT', `/obras/${DUNE_LIBRO}/resena`, {
          token: lector,
          cuerpo: { calificacion: 4, texto: 'Resena de la medicion de rendimiento.' },
          esperado: 201,
        });
        // Se borra sin medir, para que la siguiente vuelva a ser una publicacion nueva.
        await pedir('DELETE', `/resenas/${publicada.datos.resena_id}`, { token: lector, esperado: 204 });
        return publicada.ms;
      },
    ],
    ['Recomendaciones de libros (EP-18)', 2000, recomendacionesLibros],
    ['Recomendaciones de peliculas (EP-18)', 2000, recomendacionesPeliculas],
    ['Caminos entre dos personas (EP-16)', 2000, caminos],
    ['Autores de un director (EP-17)', 2000, autores],
  ];

  let incumplidos = 0;
  try {
    console.log(`\n${REPETICIONES} llamadas por flujo, despues de ${CALENTAMIENTO} de calentamiento\n`);
    console.log('| Flujo | Minimo | Mediana | p95 | Maximo | Objetivo p95 | Cumple |');
    console.log('|---|---|---|---|---|---|---|');
    for (const [nombre, objetivo, medir] of flujos) {
      for (let i = 0; i < CALENTAMIENTO; i++) await medir();
      const tiempos = [];
      for (let i = 0; i < REPETICIONES; i++) tiempos.push(await medir());
      const r = resumen(tiempos);
      const cumple = r.p95 <= objetivo;
      if (!cumple) incumplidos++;
      console.log(
        `| ${nombre} | ${ms(r.min)} | ${ms(r.mediana)} | ${ms(r.p95)} | ${ms(r.max)} | ${ms(objetivo)} | ${cumple ? 'si' : 'NO'} |`,
      );
    }
    console.log(`\nFlujos que no cumplen su objetivo: ${incumplidos} de ${flujos.length}`);
  } finally {
    await pedir('DELETE', '/me', { token: lector, esperado: 204 }); // borra al lector de prueba
    await salir(ana);
    await salir(sofia);
  }
}

await main();
