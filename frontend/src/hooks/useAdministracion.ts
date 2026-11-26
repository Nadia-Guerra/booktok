// Alta y mantenimiento del catálogo.
import type { EdicionNueva, LibroNuevo, PeliculaNueva, PersonaNueva, RespuestaAlta } from '@dlbp/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  agregarEdicion,
  agregarPlataforma,
  buscarPersonas,
  crearLibro,
  crearPelicula,
  crearPersona,
  publicarObra,
} from '../api/administracion';
import { claves } from '../core/claves';
import { ErrorApi } from '../core/http/errores';
import { useInvalidar } from './useInvalidar';

export function useBuscarPersonas(texto: string) {
  return useQuery({
    queryKey: [claves.personas, texto],
    queryFn: () => buscarPersonas(texto),
    enabled: texto !== '',
  });
}

export function useCrearPersona() {
  const refrescar = useInvalidar(claves.personas);
  return async (datos: PersonaNueva) => {
    const { persona_id } = await crearPersona(datos);
    await refrescar();
    return { persona_id, nombre: datos.nombre, foto_url: datos.foto_url ?? null };
  };
}

const useRefrescarCatalogo = () => useInvalidar(claves.ficha, claves.busqueda);

export type AltaHecha = { obraId: string; aviso?: string };

/**
 * D-58: un alta a medias responde 503 con el id de la obra, que queda en borrador. No se repite:
 * se lleva a su ficha para completarla. Sin respuesta, no se sabe si se guardó.
 */
function useAlta<D>(crear: (datos: D) => Promise<RespuestaAlta>) {
  const refrescar = useRefrescarCatalogo();
  return async (datos: D): Promise<AltaHecha> => {
    try {
      const { obra_id } = await crear(datos);
      await refrescar();
      return { obraId: obra_id };
    } catch (error) {
      if (!(error instanceof ErrorApi)) throw error;
      if (error.obraId) return { obraId: error.obraId, aviso: error.message };
      if (error.codigo === 'sin_conexion') {
        throw new ErrorApi('sin_conexion', 'No hubo respuesta. Busca la obra antes de repetir: puede estar creada.');
      }
      throw error;
    }
  };
}

export const useCrearLibro = () => useAlta<LibroNuevo>(crearLibro);
export const useCrearPelicula = () => useAlta<PeliculaNueva>(crearPelicula);

export function usePublicarObra() {
  const refrescar = useRefrescarCatalogo();
  return useMutation({ mutationFn: publicarObra, onSuccess: refrescar });
}

export function useAgregarEdicion(libroId: string) {
  const refrescar = useRefrescarCatalogo();
  return async (datos: EdicionNueva) => {
    await agregarEdicion(libroId, datos);
    await refrescar();
  };
}

export function useAgregarPlataforma(peliculaId: string) {
  const refrescar = useRefrescarCatalogo();
  return async ({ nombre }: { nombre: string }) => {
    await agregarPlataforma(peliculaId, nombre);
    await refrescar();
  };
}
