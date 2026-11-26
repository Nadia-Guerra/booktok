// Seguir a otros y ver sus perfiles.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dejarDeSeguir, seguir, verMiRed, verUsuario } from '../api/social';
import { claves } from '../core/claves';

export function useUsuario(usuarioId: string) {
  return useQuery({ queryKey: [claves.usuario, usuarioId], queryFn: () => verUsuario(usuarioId) });
}

export function useMiRed() {
  return useQuery({ queryKey: [claves.red], queryFn: verMiRed });
}

/** Sigue o deja de seguir. De a quién sigo dependen su perfil, sus reseñas y las recomendaciones. */
export function useSeguir(usuarioId: string) {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: async (loSigo: boolean) => {
      if (loSigo) await dejarDeSeguir(usuarioId);
      else await seguir(usuarioId);
    },
    // También si falla: un "ya lo sigues" significa que la pantalla estaba atrasada.
    onSettled: () =>
      Promise.all(
        [claves.usuario, claves.red, claves.resenas, claves.recomendaciones].map((clave) =>
          consultas.invalidateQueries({ queryKey: [clave] }),
        ),
      ),
  });
}
