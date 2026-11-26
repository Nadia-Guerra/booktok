// EP-10 a EP-15
import {
  respuestaEstado,
  respuestaEstados,
  respuestaPublicacion,
  respuestaResenaOculta,
  respuestaResenas,
  type EstadoLectura,
  type ResenaEntrada,
} from '@dlbp/shared';
import { ejecutar, pedir } from '../core/http/cliente';

const id = encodeURIComponent;

export type FiltroResenas = { obra_id: string } | { usuario_id: string };

export const listarResenas = (filtro: FiltroResenas, cursor?: string) =>
  pedir({ ruta: '/resenas', consulta: { ...filtro, cursor } }, respuestaResenas);

export const publicarResena = (obraId: string, cuerpo: ResenaEntrada) =>
  pedir({ metodo: 'PUT', ruta: `/obras/${id(obraId)}/resena`, cuerpo }, respuestaPublicacion);

export const eliminarResena = (resenaId: string) => ejecutar({ metodo: 'DELETE', ruta: `/resenas/${id(resenaId)}` });

// EP-12: solo el administrador.
export const ocultarResena = (resenaId: string, oculta: boolean) =>
  pedir({ metodo: 'PATCH', ruta: `/resenas/${id(resenaId)}`, cuerpo: { oculta } }, respuestaResenaOculta);

export const marcarEstado =(obraId: string, estado: EstadoLectura) =>
  pedir({ metodo: 'PUT', ruta: `/me/estados/${id(obraId)}`, cuerpo: { estado } }, respuestaEstado);

export const verMisEstados = (estado?: EstadoLectura, cursor?: string) =>
  pedir({ ruta: '/me/estados', consulta: { estado, cursor } }, respuestaEstados);
