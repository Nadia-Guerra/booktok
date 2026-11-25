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
  /** Refleja un perfil recién editado. */
  actualizar: (usuario: PerfilPropio) => void;
  reintentar: () => void;
};

const Contexto = createContext<Sesion | null>(null);

const CLAVE_PERFIL = ['yo'] as const;

/** Lo que ya está en pantalla se vuelve a pedir: la respuesta cambia según quién pregunta. */
const sinPerfil = { predicate: (q: { queryKey: readonly unknown[] }) => q.queryKey[0] !== CLAVE_PERFIL[0] };

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const consultas = useQueryClient();
  // `undefined` mientras se lee del almacenamiento.
  const [token, setToken] = useState<string | null | undefined>(undefined);

  const olvidar = useCallback(async () => {
    configurarSesion(null, () => {});
    setToken(null);
    await borrarToken();
    // Nada de una cuenta puede verse en la siguiente.
    consultas.removeQueries({ queryKey: CLAVE_PERFIL });
    await consultas.resetQueries(sinPerfil);
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
      configurarSesion(nuevo, () => void olvidar());
      consultas.setQueryData(CLAVE_PERFIL, usuario);
      setToken(nuevo);
      void consultas.resetQueries(sinPerfil);
    },
    [consultas, olvidar],
  );

  const actualizar = useCallback(
    (usuario: PerfilPropio) => consultas.setQueryData(CLAVE_PERFIL, usuario),
    [consultas],
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
      actualizar,
      reintentar: () => void perfil.refetch(),
    };
  }, [token, perfil, iniciar, olvidar, actualizar]);

  return <Contexto.Provider value={sesion}>{children}</Contexto.Provider>;
}

export function useSesion(): Sesion {
  const sesion = useContext(Contexto);
  if (!sesion) throw new Error('useSesion necesita ProveedorSesion');
  return sesion;
}
