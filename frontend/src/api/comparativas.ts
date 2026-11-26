// EP-23 y EP-25 a EP-28
import {
  comparativa,
  respuestaComparativaCreada,
  respuestaComparativaOculta,
  respuestaComparativas,
  type ComparativaCambios,
  type ComparativaEntrada,
} from '@dlbp/shared';
import { ejecutar, pedir } from '../core/http/cliente';

const ruta = (comparativaId: string) => `/comparativas/${encodeURIComponent(comparativaId)}`;

export type FiltroComparativas =
  | { libro_id: string; pelicula_id: string; usuario_id?: string }
  | { usuario_id: string };

export const listarComparativas = (filtro: FiltroComparativas, cursor?: string) =>
  pedir({ ruta: '/comparativas', consulta: { ...filtro, cursor } }, respuestaComparativas);

export const crearComparativa = (cuerpo: ComparativaEntrada) =>
  pedir({ metodo: 'POST', ruta: '/comparativas', cuerpo }, respuestaComparativaCreada);

export const editarComparativa = (comparativaId: string, cuerpo: ComparativaCambios) =>
  pedir({ metodo: 'PUT', ruta: ruta(comparativaId), cuerpo }, comparativa);

export const ocultarComparativa = (comparativaId: string, oculta: boolean) =>
  pedir({ metodo: 'PATCH', ruta: ruta(comparativaId), cuerpo: { oculta } }, respuestaComparativaOculta);

export const eliminarComparativa = (comparativaId: string) =>
  ejecutar({ metodo: 'DELETE', ruta: ruta(comparativaId) });
