// Exploración y recomendaciones (RF-24 a RF-27). El grafo da los ids; los títulos salen de AP-04.
// Lo que incluya una obra que la sesión no puede ver se descarta entero (D-56).
import type {
  AutorRelacionado,
  Camino,
  LibroRecomendado,
  ObraBreve,
  RelacionDeCamino,
  RespuestaAutores,
  RespuestaCaminos,
  RespuestaRecomendaciones,
} from '@dlbp/shared';
import { ErrorApi } from '../errores.ts';
import * as documental from '../repositorios/documental/obras.ts';
import * as grafo from '../repositorios/grafo/descubrimiento.ts';
import * as relacional from '../repositorios/relacional/descubrimiento.ts';
import type { SesionActual } from './cuentas.ts';

const MAXIMO_PARTIDA = 20; // O18

/** Datos de presentación de las obras visibles, por id. */
async function obrasVisibles(ids: string[], sesion: SesionActual): Promise<Map<string, ObraBreve>> {
  const obras = await documental.obrasBreves([...new Set(ids)], sesion.rol === 'admin');
  return new Map(obras.map((o) => [o.obra_id, o]));
}

export async function caminos(sesion: SesionActual, origen: string, destino: string): Promise<RespuestaCaminos> {
  // D-49: con el mismo id el motor falla, así que se rechaza antes de llamarlo.
  if (origen === destino) throw new ErrorApi('entrada_invalida', 'El origen y el destino deben ser distintos');

  const filas = await grafo.caminosEntre(origen, destino);
  const obras = await obrasVisibles(
    filas.flatMap((f) => f.nodos.filter((n) => n.tipo !== 'Persona').map((n) => n.id)),
    sesion,
  );

  return {
    caminos: filas.flatMap((fila): Camino | [] => {
      const nodos: Camino['nodos'] = [];
      for (const n of fila.nodos) {
        if (n.tipo === 'Persona') {
          nodos.push({ tipo: 'persona', persona_id: n.id, nombre: n.nombre!, foto_url: n.foto_url });
          continue;
        }
        const obra = obras.get(n.id);
        if (!obra) return [];
        nodos.push(obra);
      }
      return { nodos, relaciones: fila.relaciones as RelacionDeCamino[] };
    }),
  };
}

export async function autoresRelacionados(sesion: SesionActual, directorId: string): Promise<RespuestaAutores> {
  const filas = await grafo.autoresDeDirector(directorId);
  const obras = await obrasVisibles(
    filas.flatMap((f) => [f.libro_id, f.pelicula_id]),
    sesion,
  );

  const autores = new Map<string, AutorRelacionado>();
  for (const f of filas) {
    const libro = obras.get(f.libro_id);
    const pelicula = obras.get(f.pelicula_id);
    if (!libro || !pelicula) continue;
    const autor = autores.get(f.persona_id) ?? {
      persona_id: f.persona_id,
      nombre: f.nombre,
      foto_url: f.foto_url,
      obras: [],
    };
    autor.obras.push({ libro, pelicula });
    autores.set(f.persona_id, autor);
  }
  return { autores: [...autores.values()] };
}

/** RF-26: libros a dos saltos de los que le gustaron. Si no le gustó ninguno, no se llama al grafo. */
async function librosPara(sesion: SesionActual): Promise<LibroRecomendado[]> {
  const partida = await relacional.librosQueLeGustaron(sesion.usuarioId, MAXIMO_PARTIDA);
  if (partida.length === 0) return [];
  const filas = await grafo.librosRecomendados(sesion.usuarioId, partida);
  const obras = await obrasVisibles(
    filas.flatMap((f) => [f.obra_id, f.partida_id]),
    sesion,
  );

  // Primero lo que viene de los libros que más le gustaron (el orden de O18).
  const puesto = new Map(partida.map((id, i) => [id, i]));
  filas.sort((a, b) => puesto.get(a.partida_id)! - puesto.get(b.partida_id)!);

  const libros = new Map<string, LibroRecomendado>();
  for (const f of filas) {
    const obra = obras.get(f.obra_id);
    const libroPartida = obras.get(f.partida_id);
    if (!obra || !libroPartida) continue;
    const recomendado = libros.get(f.obra_id) ?? { obra, motivos: [] };
    recomendado.motivos.push({
      libro_partida: libroPartida,
      director: { persona_id: f.persona_id, nombre: f.nombre, foto_url: f.foto_url },
    });
    libros.set(f.obra_id, recomendado);
  }
  return [...libros.values()];
}

/** RF-27: películas de libros que leyeron las personas seguidas, incluidas las ya vistas (D-20). */
async function peliculasPara(sesion: SesionActual) {
  const filas = await grafo.peliculasRecomendadas(sesion.usuarioId);
  const obras = await obrasVisibles(
    filas.flatMap((f) => [f.obra_id, f.libro_id]),
    sesion,
  );
  return filas.flatMap((f) => {
    const obra = obras.get(f.obra_id);
    const libro = obras.get(f.libro_id);
    return obra && libro ? { obra, libro, seguidos: f.seguidos } : [];
  });
}

export async function recomendaciones(sesion: SesionActual): Promise<RespuestaRecomendaciones> {
  const [libros, peliculas] = await Promise.all([librosPara(sesion), peliculasPara(sesion)]);
  return { libros, peliculas };
}
