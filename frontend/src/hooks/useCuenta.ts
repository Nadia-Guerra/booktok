// Entrar, registrarse, salir y editar la cuenta.
import type { PerfilCambios, RegistroEntrada, SesionEntrada } from '@dlbp/shared';
import { useMutation } from '@tanstack/react-query';
import { cerrarSesion, editarPerfil, eliminarCuenta, iniciarSesion, registrar } from '../api/cuentas';
import { useSesion } from '../core/sesion/ContextoSesion';

export function useEntrar() {
  const { iniciar } = useSesion();
  return async (datos: SesionEntrada) => iniciar(await iniciarSesion(datos));
}

/** El registro no abre sesión: se inicia justo después con los mismos datos. */
export function useRegistrarse() {
  const entrar = useEntrar();
  return async (datos: RegistroEntrada) => {
    await registrar(datos);
    await entrar({ correo: datos.correo, password: datos.password });
  };
}

export function useGuardarPerfil() {
  const { actualizar } = useSesion();
  return async (cambios: PerfilCambios) => actualizar(await editarPerfil(cambios));
}

export function useSalir() {
  const { olvidar } = useSesion();
  // Se olvida en el teléfono aunque la API no conteste: el token vence solo (D-35).
  return useMutation({ mutationFn: cerrarSesion, onSettled: () => olvidar() });
}

export function useEliminarCuenta() {
  const { olvidar } = useSesion();
  return useMutation({ mutationFn: eliminarCuenta, onSuccess: () => olvidar() });
}
