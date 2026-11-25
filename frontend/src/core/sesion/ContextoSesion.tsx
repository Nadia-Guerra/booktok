// Quién usa la app: visitante, o una cuenta con su perfil y su rol.
import type { PerfilPropio, RespuestaSesion } from '@dlbp/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { verPerfil } from '../../api/cuentas';
import { configurarSesion } from '../http/cliente';
import { borrarToken, guardarToken, leerToken } from './almacen';

type Sesion = {
  /** `sin_verificar`: hay token, pero la API no respondió. */
  estado: 'cargando' | 'visitante' | 'autenticado' | 'sin_verificar';
  usuario: PerfilPropio | null;
  esAdmin: boolean;
  iniciar: (respuesta: RespuestaSesion) => Promise<void>;
  /** Olvida la sesión en el teléfono. */
  olvidar: () => Promise<void>;
  reintentar: () => void;
};

const Contexto = createContext<Sesion | null>(null);

const CLAVE_PERFIL = ['yo'] as const;

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const consultas = useQueryClient();
  // `undefined` mientras se lee del almacenamiento.
  const [token, setToken] = useState<string | null | undefined>(undefined);

  const olvidar = useCallback(async () => {
    configurarSesion(null, () => {});
    setToken(null);
    await borrarToken();
    consultas.clear(); // nada de una cuenta puede verse en la siguiente
  }, [consultas]);

  useEffect(() => {
    void leerToken().then((guardado) => {
      configurarSesion(guardado, () => void olvidar());
      setToken(guardado);
    });
  }, [olvidar]);

  const perfil = useQuery({ queryKey: CLAVE_PERFIL, queryFn: verPerfil, enabled: !!token });

  const iniciar = useCallback(
    async ({ token: nuevo, usuario }: RespuestaSesion) => {
      await guardarToken(nuevo);
      consultas.clear();
      configurarSesion(nuevo, () => void olvidar());
      consultas.setQueryData(CLAVE_PERFIL, usuario);
      setToken(nuevo);
    },
    [consultas, olvidar],
  );

  const sesion = useMemo<Sesion>(() => {
    const usuario = (token && perfil.data) || null;
    const estado =
      token === undefined ? 'cargando'
      : token === null ? 'visitante'
      : usuario ? 'autenticado'
      : perfil.isError ? 'sin_verificar'
      : 'cargando';
    return {
      estado,
      usuario,
      esAdmin: usuario?.rol === 'admin',
      iniciar,
      olvidar,
      reintentar: () => void perfil.refetch(),
    };
  }, [token, perfil, iniciar, olvidar]);

  return <Contexto.Provider value={sesion}>{children}</Contexto.Provider>;
}

export function useSesion(): Sesion {
  const sesion = useContext(Contexto);
  if (!sesion) throw new Error('useSesion necesita ProveedorSesion');
  return sesion;
}
