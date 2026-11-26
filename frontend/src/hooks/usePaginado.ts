// Listados de 20 en 20 con el cursor de la API (D-57). El cursor se devuelve tal cual.
import { useInfiniteQuery } from '@tanstack/react-query';

type Opciones<R, T> = {
  clave: readonly unknown[];
  pedirPagina: (cursor?: string) => Promise<R>;
  elementos: (pagina: R) => T[];
};

export function usePaginado<R extends { siguiente: string | null }, T>({ clave, pedirPagina, elementos }: Opciones<R, T>) {
  const consulta = useInfiniteQuery({
    queryKey: clave,
    queryFn: ({ pageParam }) => pedirPagina(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultima) => ultima.siguiente ?? undefined,
  });
  return {
    elementos: consulta.data?.pages.flatMap(elementos),
    error: consulta.error,
    reintentar: () => void consulta.refetch(),
    hayMas: consulta.hasNextPage,
    cargandoMas: consulta.isFetchingNextPage,
    verMas: () => void consulta.fetchNextPage(),
  };
}

export type Paginado<T> = Omit<ReturnType<typeof usePaginado>, 'elementos'> & { elementos: T[] | undefined };
