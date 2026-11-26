// Marca como atrasado todo lo guardado bajo unas claves, después de cambiar algo.
import { useQueryClient } from '@tanstack/react-query';

export function useInvalidar(...claves: string[]) {
  const consultas = useQueryClient();
  return () => Promise.all(claves.map((clave) => consultas.invalidateQueries({ queryKey: [clave] })));
}
