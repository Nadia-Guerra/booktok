import { useQuery } from '@tanstack/react-query';
import { buscarObras, verFicha, type BuscarPor } from '../api/catalogo';

/** No busca hasta que haya un texto enviado. */
export function useBusqueda(texto: string, por: BuscarPor) {
  return useQuery({
    queryKey: ['busqueda', por, texto],
    queryFn: () => buscarObras(texto, por),
    enabled: texto !== '',
  });
}

export function useFicha(obraId: string) {
  return useQuery({ queryKey: ['ficha', obraId], queryFn: () => verFicha(obraId) });
}
