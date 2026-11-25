// Catálogo en lectura (RF-05 a RF-07, RF-23): une la ficha, el promedio y las relaciones del grafo.
// Los borradores solo los ve el administrador (D-24, D-56).
import type { Ficha, ObraBreve, ResultadoBusqueda } from '@dlbp/shared';
import { ErrorApi } from '../errores.ts';
import * as documental from '../repositorios/documental/obras.ts';
import { obrasPorPersona } from '../repositorios/grafo/descubrimiento.ts';
import * as grafo from '../repositorios/grafo/obras.ts';
import * as relacional from '../repositorios/relacional/obras.ts';
import type { SesionActual } from './cuentas.ts';

const MAXIMO_RESULTADOS = 20;

const esAdmin = (sesion?: SesionActual) => sesion?.rol === 'admin';

export function buscarPorTitulo(texto: string, sesion?: SesionActual): Promise<ObraBreve[]> {
  // Las comillas y los guiones son sintaxis de la búsqueda de MongoDB (frase exacta y exclusión).
  const palabras = texto.replace(/["\\-]/g, ' ').trim();
  if (!palabras) return Promise.resolve([]);
  return documental.buscarPorTitulo(palabras, esAdmin(sesion), MAXIMO_RESULTADOS);
}

/** EP-08 por persona: lo que alguien escribió, dirigió o actuó (CG-01), con los datos de AP-04. */
export async function buscarPorPersona(texto: string, sesion?: SesionActual): Promise<ResultadoBusqueda[]> {
  const filas = await obrasPorPersona(texto);
  const obras = await documental.obrasBreves([...new Set(filas.map((f) => f.obra_id))], esAdmin(sesion));
  const porId = new Map(obras.map((o) => [o.obra_id, o]));
  return filas
    .flatMap(({ obra_id, vinculo, persona_id, nombre, foto_url }) => {
      const obra = porId.get(obra_id); // las que no se pueden ver no salen (D-56)
      return obra ? { ...obra, persona: { persona_id, nombre, foto_url }, vinculo } : [];
    })
    .slice(0, MAXIMO_RESULTADOS);
}

export async function verFicha(obraId: string, sesion?: SesionActual): Promise<Ficha> {
  const incluirBorradores = esAdmin(sesion);
  const [libro, pelicula] = await Promise.all([documental.libroPorId(obraId), documental.peliculaPorId(obraId)]);
  const obra = libro ?? pelicula;
  if (!obra || (obra.estado_publicacion !== 'publicada' && !incluirBorradores)) {
    throw new ErrorApi('no_encontrado', 'La obra no existe');
  }

  const [resumen, personas, propio] = await Promise.all([
    relacional.calificacion(obraId),
    grafo.autoresODirectores(obraId),
    sesion
      ? Promise.all([
          relacional.estadoDe(sesion.usuarioId, obraId),
          relacional.resenaDe(sesion.usuarioId, obraId),
        ]).then(([mi_estado, mi_resena]) => ({ mi_estado, mi_resena }))
      : {},
  ]);

  const comun = {
    obra_id: obra._id,
    titulo: obra.titulo,
    sinopsis: obra.sinopsis,
    portada_url: obra.portada_url ?? null,
    generos: obra.generos,
    estado_publicacion: obra.estado_publicacion,
    ...resumen,
    ...propio,
  };

  if (libro) {
    const adaptaciones = await documental.obrasBreves(await grafo.adaptacionesDe(obraId), incluirBorradores);
    return {
      ...comun,
      tipo: 'libro',
      anio_publicacion_original: libro.anio_publicacion_original,
      ediciones: libro.ediciones.map((e) => ({ ...e, isbn: e.isbn ?? null })),
      autores: personas,
      adaptaciones: adaptaciones.sort((a, b) => a.anio - b.anio),
    };
  }

  const peli = pelicula!;
  const origen = await grafo.libroDe(obraId);
  const [libroOrigen] = await documental.obrasBreves(origen ? [origen] : [], incluirBorradores);
  const { productoras, clasificacion, ...tecnicos } = peli.datos_tecnicos;
  return {
    ...comun,
    tipo: 'pelicula',
    anio_estreno: peli.anio_estreno,
    duracion_min: peli.duracion_min,
    plataformas: peli.plataformas,
    datos_tecnicos: { ...tecnicos, productoras: productoras ?? [], clasificacion: clasificacion ?? null },
    // Copia del grafo guardada en la ficha (D-12), para leerla de una vez (RNF-04).
    reparto: peli.reparto
      .map((a) => ({ ...a, foto_url: a.foto_url ?? null }))
      .sort((a, b) => a.orden - b.orden),
    directores: personas,
    libro_origen: libroOrigen ?? null,
  };
}
