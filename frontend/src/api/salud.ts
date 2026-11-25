// EP-01
import { respuestaSalud } from '@dlbp/shared';
import { pedir } from '../core/http/cliente';

export const verSalud = () => pedir({ ruta: '/salud' }, respuestaSalud);
