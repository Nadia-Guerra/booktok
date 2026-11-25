// Estado de la conexión con la API y las tres bases, y cambio de dirección.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { verSalud } from '../api/salud';
import { guardarUrlApi, leerUrlApi } from '../core/config/urlApi';

export function useSalud() {
  return useQuery({ queryKey: ['salud'], queryFn: verSalud, retry: false });
}

export function useUrlApi() {
  return useQuery({ queryKey: ['urlApi'], queryFn: leerUrlApi, staleTime: Infinity });
}

export function useCambiarUrlApi() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: guardarUrlApi,
    // Todo lo guardado venía de la dirección anterior.
    onSuccess: () => consultas.resetQueries(),
  });
}
