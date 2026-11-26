// EP-29 a EP-35
import {
  detalleLista,
  misListas,
  respuestaElemento,
  respuestaListaCreada,
  type ListaCambios,
  type ListaNueva,
} from '@dlbp/shared';
import { ejecutar, pedir } from '../core/http/cliente';

const ruta = (listaId: string) => `/listas/${encodeURIComponent(listaId)}`;

export const verMisListas = () => pedir({ ruta: '/me/listas' }, misListas);

export const crearLista = (cuerpo: ListaNueva) =>
  pedir({ metodo: 'POST', ruta: '/me/listas', cuerpo }, respuestaListaCreada);

export const verLista = (listaId: string) => pedir({ ruta: ruta(listaId) }, detalleLista);

export const cambiarLista = (listaId: string, cuerpo: ListaCambios) =>
  pedir({ metodo: 'PATCH', ruta: ruta(listaId), cuerpo }, detalleLista);

export const eliminarLista = (listaId: string) => ejecutar({ metodo: 'DELETE', ruta: ruta(listaId) });

export const agregarALista = (listaId: string, obraId: string) =>
  pedir({ metodo: 'POST', ruta: `${ruta(listaId)}/obras`, cuerpo: { obra_id: obraId } }, respuestaElemento);

export const quitarDeLista = (listaId: string, obraId: string) =>
  ejecutar({ metodo: 'DELETE', ruta: `${ruta(listaId)}/obras/${encodeURIComponent(obraId)}` });
