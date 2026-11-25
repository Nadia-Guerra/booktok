// EP-05
import { perfilPropio } from '@dlbp/shared';
import { pedir } from '../core/http/cliente';

export const verPerfil = () => pedir({ ruta: '/me' }, perfilPropio);
