// EP-02 a EP-07
import {
  perfilPropio,
  respuestaRegistro,
  respuestaSesion,
  type PerfilCambios,
  type RegistroEntrada,
  type SesionEntrada,
} from '@dlbp/shared';
import { ejecutar, pedir } from '../core/http/cliente';

export const registrar = (cuerpo: RegistroEntrada) =>
  pedir({ metodo: 'POST', ruta: '/auth/registro', cuerpo }, respuestaRegistro);

export const iniciarSesion = (cuerpo: SesionEntrada) =>
  pedir({ metodo: 'POST', ruta: '/auth/sesion', cuerpo }, respuestaSesion);

export const cerrarSesion = () => ejecutar({ metodo: 'DELETE', ruta: '/auth/sesion' });

export const verPerfil = () => pedir({ ruta: '/me' }, perfilPropio);

export const editarPerfil = (cuerpo: PerfilCambios) => pedir({ metodo: 'PATCH', ruta: '/me', cuerpo }, perfilPropio);

export const eliminarCuenta = () => ejecutar({ metodo: 'DELETE', ruta: '/me' });
