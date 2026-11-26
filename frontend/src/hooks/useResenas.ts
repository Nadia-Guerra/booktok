// Reseñas y estados de lectura.
import type { EstadoLectura, ResenaEntrada } from '@dlbp/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  eliminarResena,
  listarResenas,
  marcarEstado,
  ocultarResena,
  publicarResena,
  verMisEstados,
  type FiltroResenas,
} from '../api/resenas';
import { claves } from '../core/claves';
import { usePaginado } from './usePaginado';

export function useResenas(filtro: FiltroResenas) {
  return usePaginado({
    clave: [claves.resenas, filtro],
    pedirPagina: (cursor) => listarResenas(filtro, cursor),
    elementos: (p) => p.resenas,
  });
}

export function useMisEstados(estado?: EstadoLectura) {
  return usePaginado({
    clave: [claves.misEstados, estado ?? 'todos'],
    pedirPagina: (cursor) => verMisEstados(estado, cursor),
    elementos: (p) => p.estados,
  });
}

/** Lo que cambia al reseñar o marcar: la ficha, las reseñas, mis obras y las recomendaciones. */
function useRefrescarActividad() {
  const consultas = useQueryClient();
  return () =>
    Promise.all(
      [claves.ficha, claves.resenas, claves.misEstados, claves.recomendaciones].map((clave) =>
        consultas.invalidateQueries({ queryKey: [clave] }),
      ),
    );
}

/** Publica la reseña o edita la propia (EP-11). La obra queda como terminada. */
export function usePublicarResena(obraId: string) {
  const refrescar = useRefrescarActividad();
  return async (entrada: ResenaEntrada) => {
    await publicarResena(obraId, entrada);
    await refrescar();
  };
}

export function useEliminarResena() {
  const refrescar = useRefrescarActividad();
  return useMutation({ mutationFn: eliminarResena, onSuccess: refrescar });
}

/** Moderación (RF-18): ocultar o volver a mostrar recalcula el promedio. */
export function useOcultarResena() {
  const refrescar = useRefrescarActividad();
  return useMutation({
    mutationFn: ({ id, oculta }: { id: string; oculta: boolean }) => ocultarResena(id, oculta),
    onSuccess: refrescar,
  });
}

export function useMarcarEstado(obraId: string) {
  const refrescar = useRefrescarActividad();
  return useMutation({ mutationFn: (estado: EstadoLectura) => marcarEstado(obraId, estado), onSuccess: refrescar });
}
