// Administración del catálogo (RF-08 a RF-11). El alta toca las tres bases sin transacción común, en
// el orden de D-24: ficha en borrador, `obra_resumen`, nodo, relaciones, copia del reparto,
// comprobación del mínimo y publicación. Todos los pasos se pueden repetir.
import { randomUUID } from 'node:crypto';
import type {
  EdicionNueva,
  LibroNuevo,
  PeliculaNueva,
  PersonaBreve,
  PersonaNueva,
  RespuestaAlta,
  TipoObra,
} from '@dlbp/shared';
import { ErrorApi } from '../errores.ts';
import * as documental from '../repositorios/documental/administracion.ts';
import * as grafo from '../repositorios/grafo/administracion.ts';
import * as relaciones from '../repositorios/grafo/obras.ts';
import * as relacional from '../repositorios/relacional/obras.ts';

const MAXIMO_PERSONAS = 20;

export async function buscarPersonas(texto: string): Promise<PersonaBreve[]> {
  return grafo.buscarPersonas(texto, MAXIMO_PERSONAS);
}

export async function crearPersona(datos: PersonaNueva): Promise<{ persona_id: string }> {
  const personaId = randomUUID();
  await grafo.crearPersona(personaId, datos.nombre, datos.foto_url ?? null);
  return { persona_id: personaId };
}

async function exigirPersonas(ids: string[]) {
  const faltan = await grafo.personasQueFaltan([...new Set(ids)]);
  if (faltan.length) throw new ErrorApi('no_encontrado', `No existe la persona ${faltan.join(', ')}`);
}

/**
 * D-58: con la ficha ya creada, cualquier fallo se responde como 503 con su `obra_id`. La obra queda
 * en borrador y se completa con EP-41; repetir el alta crearía otra.
 */
async function completandoAlta<T>(obraId: string, pasos: () => Promise<T>): Promise<T> {
  try {
    return await pasos();
  } catch (e) {
    const { name, code } = (e ?? {}) as { name?: string; code?: unknown };
    console.error(`Alta incompleta de ${obraId}: ${name ?? 'error'} ${String(code ?? '')}`);
    throw new ErrorApi(
      'base_no_disponible',
      'La obra quedó como borrador. No repitas el alta: completa su publicación',
      undefined,
      obraId,
    );
  }
}

/** El libro queda en borrador hasta que tenga su primera adaptación (D-24). */
export async function crearLibro(datos: LibroNuevo): Promise<RespuestaAlta> {
  await exigirPersonas(datos.autores);
  const obraId = randomUUID();
  const { autores, ediciones, portada_url, ...ficha } = datos;
  const creado = await documental.crearLibro({
    _id: obraId,
    ...ficha,
    ...(portada_url && { portada_url }),
    // Sin campos vacíos: el validador no admite nulos.
    ediciones: ediciones.map(({ isbn, ...e }) => ({ edicion_id: randomUUID(), ...(isbn && { isbn }), ...e })),
    estado_publicacion: 'borrador',
  });
  if (creado === 'isbn_repetido') throw new ErrorApi('conflicto', 'Otro libro ya tiene ese ISBN');

  return completandoAlta(obraId, async () => {
    await relacional.registrar(obraId, 'libro');
    await grafo.crearLibro(obraId, autores);
    return { obra_id: obraId, estado_publicacion: 'borrador' as const };
  });
}

export async function crearPelicula(datos: PeliculaNueva): Promise<RespuestaAlta> {
  const { libro_id, directores, reparto, portada_url, datos_tecnicos, ...ficha } = datos;
  if ((await documental.estadoDeObra(libro_id))?.tipo !== 'libro') {
    throw new ErrorApi('no_encontrado', 'El libro no existe');
  }
  await exigirPersonas([...directores, ...reparto.map((a) => a.persona_id)]);

  const obraId = randomUUID();
  const { productoras, clasificacion, ...tecnicos } = datos_tecnicos;
  await documental.crearPelicula({
    _id: obraId,
    ...ficha,
    ...(portada_url && { portada_url }),
    datos_tecnicos: { ...tecnicos, ...(productoras && { productoras }), ...(clasificacion && { clasificacion }) },
    reparto: [], // se copia desde el grafo
    estado_publicacion: 'borrador',
  });

  return completandoAlta(obraId, async () => {
    await relacional.registrar(obraId, 'pelicula');
    await grafo.crearNodoPelicula(obraId);
    await grafo.relacionarPelicula(obraId, libro_id, directores, reparto);
    const resultado = await publicarPelicula(obraId);
    if (resultado.faltan.length) throw new Error(`falta: ${resultado.faltan.join(', ')}`);
    return { obra_id: obraId, estado_publicacion: 'publicada' as const, libro: resultado.libro! };
  });
}

/** Copia el reparto del grafo a la ficha. Devuelve cuántas personas tiene. */
async function copiarReparto(peliculaId: string): Promise<number> {
  const reparto = await grafo.repartoDe(peliculaId);
  await documental.copiarReparto(
    peliculaId,
    reparto.map(({ foto_url, ...actor }) => ({ ...actor, ...(foto_url && { foto_url }) })),
  );
  return reparto.length;
}

/** Publica un libro si tiene al menos un autor y una adaptación (D-24). Devuelve lo que le falta. */
async function publicarLibro(libroId: string): Promise<string[]> {
  const [autores, adaptaciones] = await Promise.all([
    relaciones.autoresODirectores(libroId),
    relaciones.adaptacionesDe(libroId),
  ]);
  const faltan = [...(autores.length ? [] : ['autor']), ...(adaptaciones.length ? [] : ['adaptación'])];
  if (!faltan.length) await documental.publicar('libro', libroId);
  return faltan;
}

/**
 * Publica una película si tiene libro de origen, director y reparto copiado. Antes publica su libro,
 * si ya puede: lo que la película necesita es la relación, no que el libro esté publicado (D-24).
 */
async function publicarPelicula(peliculaId: string) {
  const [libroId, directores, personas] = await Promise.all([
    relaciones.libroDe(peliculaId),
    relaciones.autoresODirectores(peliculaId),
    copiarReparto(peliculaId),
  ]);
  const faltan = [
    ...(libroId ? [] : ['libro de origen']),
    ...(directores.length ? [] : ['director']),
    ...(personas ? [] : ['reparto']),
  ];
  if (faltan.length) return { faltan };

  await publicarLibro(libroId!);
  await documental.publicar('pelicula', peliculaId);
  const libro = await documental.estadoDeObra(libroId!);
  return {
    faltan,
    libro: { obra_id: libroId!, estado_publicacion: libro?.estado ?? ('borrador' as const) },
  };
}

/** EP-41: completa un alta interrumpida. No inventa relaciones: si faltan, dice cuáles (409). */
export async function completarPublicacion(obraId: string): Promise<RespuestaAlta> {
  const obra = await documental.estadoDeObra(obraId);
  if (!obra) throw new ErrorApi('no_encontrado', 'La obra no existe');
  const { tipo } = obra;

  await relacional.registrar(obraId, tipo);
  await asegurarNodo(tipo, obraId);

  const resultado =
    tipo === 'libro' ? { faltan: await publicarLibro(obraId), libro: undefined } : await publicarPelicula(obraId);
  if (resultado.faltan.length && obra.estado !== 'publicada') {
    throw new ErrorApi('conflicto', `Todavía no se puede publicar. Falta: ${resultado.faltan.join(', ')}`);
  }
  return {
    obra_id: obraId,
    estado_publicacion: 'publicada',
    ...(resultado.libro && { libro: resultado.libro }),
  };
}

function asegurarNodo(tipo: TipoObra, obraId: string): Promise<void> {
  return tipo === 'libro' ? grafo.crearLibro(obraId, []) : grafo.crearNodoPelicula(obraId);
}

/** EP-43. */
export async function agregarEdicion(libroId: string, datos: EdicionNueva): Promise<{ edicion_id: string }> {
  const edicionId = randomUUID();
  const { isbn, ...resto } = datos;
  const resultado = await documental.agregarEdicion(libroId, {
    edicion_id: edicionId,
    ...(isbn && { isbn }),
    ...resto,
  });
  if (resultado === 'no_existe') throw new ErrorApi('no_encontrado', 'El libro no existe');
  if (resultado === 'repetido') throw new ErrorApi('conflicto', 'Ese ISBN ya está registrado');
  if (resultado === 'lleno') throw new ErrorApi('conflicto', 'Un libro admite 50 ediciones');
  return { edicion_id: edicionId };
}

/** EP-46. */
export async function agregarPlataforma(peliculaId: string, nombre: string): Promise<{ nombre: string }> {
  const resultado = await documental.agregarPlataforma(peliculaId, nombre);
  if (resultado === 'no_existe') throw new ErrorApi('no_encontrado', 'La película no existe');
  if (resultado === 'repetido') throw new ErrorApi('conflicto', 'La película ya tiene esa plataforma');
  if (resultado === 'lleno') throw new ErrorApi('conflicto', 'Una película admite 30 plataformas');
  return { nombre };
}
