// Listas propias y de las personas que sigo.
import type { ListaCambios, ListaNueva } from '@dlbp/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  agregarALista,
  cambiarLista,
  crearLista,
  eliminarLista,
  quitarDeLista,
  verLista,
  verMisListas,
} from '../api/listas';
import { claves } from '../core/claves';
import { useInvalidar } from './useInvalidar';

export function useMisListas() {
  return useQuery({ queryKey: [claves.misListas], queryFn: verMisListas });
}

export function useLista(listaId: string) {
  return useQuery({ queryKey: [claves.lista, listaId], queryFn: () => verLista(listaId) });
}

export function useCrearLista() {
  const refrescar = useInvalidar(claves.misListas, claves.usuario);
  return async (datos: ListaNueva) => {
    await crearLista(datos);
    await refrescar();
  };
}

/** Renombrar, reordenar, quitar obras y borrar una lista propia. */
export function useEditarLista(listaId: string) {
  const refrescar = useInvalidar(claves.misListas, claves.usuario, claves.lista);
  const refrescarIndice = useInvalidar(claves.misListas, claves.usuario);
  const cambiar = useMutation({
    mutationFn: (cambios: ListaCambios) => cambiarLista(listaId, cambios),
    onSuccess: refrescar,
  });
  const quitar = useMutation({ mutationFn: (obraId: string) => quitarDeLista(listaId, obraId), onSuccess: refrescar });
  // La lista ya no existe: se actualiza el índice sin volver a pedirla.
  const eliminar = useMutation({ mutationFn: () => eliminarLista(listaId), onSuccess: refrescarIndice });
  return { cambiar, quitar, eliminar };
}

export function useAgregarALista(obraId: string) {
  const refrescar = useInvalidar(claves.misListas, claves.lista);
  return useMutation({ mutationFn: (listaId: string) => agregarALista(listaId, obraId), onSuccess: refrescar });
}
