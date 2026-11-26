import { useQuery } from '@tanstack/react-query';
import { buscarObras, verFicha, type BuscarPor } from '../api/catalogo';
import { claves } from '../core/claves';

/** No busca hasta que haya un texto enviado. */
export function useBusqueda(texto: string, por: BuscarPor) {
  return useQuery({
    queryKey: [claves.busqueda, por, texto],
    queryFn: () => buscarObras(texto, por),
    enabled: texto !== '',
  });
}

export function useFicha(obraId: string) {
  return useQuery({ queryKey: [claves.ficha, obraId], queryFn: () => verFicha(obraId) });
}
