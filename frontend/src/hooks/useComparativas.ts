// Reseñas comparativas libro contra película.
import type { ComparativaCambios } from '@dlbp/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  crearComparativa,
  editarComparativa,
  eliminarComparativa,
  listarComparativas,
  ocultarComparativa,
  type FiltroComparativas,
} from '../api/comparativas';
import { claves } from '../core/claves';
import { useSesion } from '../core/sesion/ContextoSesion';
import { useInvalidar } from './useInvalidar';
import { usePaginado } from './usePaginado';

export type Pareja = { libroId: string; peliculaId: string };

export function useComparativas(filtro: FiltroComparativas) {
  return usePaginado({
    clave: [claves.comparativas, filtro],
    pedirPagina: (cursor) => listarComparativas(filtro, cursor),
    elementos: (p) => p.comparativas,
  });
}

/** Mi comparativa de una adaptación: `null` si todavía no la escribí. Solo hay una (RN-05). */
export function useMiComparativa({ libroId, peliculaId }: Pareja) {
  const { usuario } = useSesion();
  return useQuery({
    queryKey: [claves.comparativas, 'mia', usuario?.usuario_id, libroId, peliculaId],
    enabled: !!usuario,
    queryFn: async () => {
      const { comparativas } = await listarComparativas({
        libro_id: libroId,
        pelicula_id: peliculaId,
        usuario_id: usuario!.usuario_id,
      });
      return comparativas[0] ?? null;
    },
  });
}

/** Crea o, si ya existe, edita la mía (EP-25 o EP-26). */
export function useGuardarComparativa({ libroId, peliculaId }: Pareja, comparativaId: string | undefined) {
  const refrescar = useInvalidar(claves.comparativas);
  return async (datos: ComparativaCambios) => {
    if (comparativaId) await editarComparativa(comparativaId, datos);
    else await crearComparativa({ ...datos, libro_id: libroId, pelicula_id: peliculaId });
    await refrescar();
  };
}

export function useEliminarComparativa() {
  const refrescar = useInvalidar(claves.comparativas);
  return useMutation({ mutationFn: eliminarComparativa, onSuccess: refrescar });
}

export function useOcultarComparativa() {
  const refrescar = useInvalidar(claves.comparativas);
  return useMutation({
    mutationFn: ({ id, oculta }: { id: string; oculta: boolean }) => ocultarComparativa(id, oculta),
    onSuccess: refrescar,
  });
}
