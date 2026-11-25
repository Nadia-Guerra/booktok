// Caché y reintentos de las lecturas (TanStack Query).
import { QueryClient } from '@tanstack/react-query';
import { ErrorApi } from './http/errores';

export const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Un 4xx no cambia por insistir; una red o una base caídas, sí pueden.
      retry: (intentos, error) => intentos < 1 && error instanceof ErrorApi && error.recuperable,
    },
    mutations: { retry: false },
  },
});
