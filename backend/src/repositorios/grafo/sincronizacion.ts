// Escrituras del grafo que nacen de un evento (CG-16 a CG-19). Todas se pueden repetir sin efecto.
// Las de crear una relación devuelven `false` si no encontraron alguno de sus dos nodos.
import { consultaCypher, escribirGrafo } from '../../bases/neo4j.ts';

const CG16 = consultaCypher('CG-16');
const CG17 = consultaCypher('CG-17');
const CG18_CREAR = consultaCypher('CG-18-crear');
const CG18_ELIMINAR = consultaCypher('CG-18-eliminar');
const CG19_CREAR = consultaCypher('CG-19-crear');
const CG19_ELIMINAR = consultaCypher('CG-19-eliminar');

export async function crearUsuario(usuarioId: string): Promise<void> {
  await escribirGrafo(CG16, { usuario_id: usuarioId });
}

export async function eliminarUsuario(usuarioId: string): Promise<void> {
  await escribirGrafo(CG17, { usuario_id: usuarioId });
}

export async function crearSeguimiento(seguidorId: string, seguidoId: string): Promise<boolean> {
  const filas = await escribirGrafo(CG18_CREAR, { seguidor_id: seguidorId, seguido_id: seguidoId });
  return filas.length > 0;
}

export async function eliminarSeguimiento(seguidorId: string, seguidoId: string): Promise<void> {
  await escribirGrafo(CG18_ELIMINAR, { seguidor_id: seguidorId, seguido_id: seguidoId });
}

export async function crearLectura(usuarioId: string, libroId: string): Promise<boolean> {
  const filas = await escribirGrafo(CG19_CREAR, { usuario_id: usuarioId, obra_id: libroId });
  return filas.length > 0;
}

export async function eliminarLectura(usuarioId: string, libroId: string): Promise<void> {
  await escribirGrafo(CG19_ELIMINAR, { usuario_id: usuarioId, obra_id: libroId });
}
