// EP-19 a EP-22
import { perfilDeOtro, redPropia, respuestaSeguir } from '@dlbp/shared';
import { ejecutar, pedir } from '../core/http/cliente';

const id = encodeURIComponent;

export const seguir = (usuarioId: string) =>
  pedir({ metodo: 'POST', ruta: '/me/seguidos', cuerpo: { usuario_id: usuarioId } }, respuestaSeguir);

export const dejarDeSeguir = (usuarioId: string) =>
  ejecutar({ metodo: 'DELETE', ruta: `/me/seguidos/${id(usuarioId)}` });

export const verMiRed = () => pedir({ ruta: '/me/seguimientos' }, redPropia);

export const verUsuario = (usuarioId: string) => pedir({ ruta: `/usuarios/${id(usuarioId)}` }, perfilDeOtro);
