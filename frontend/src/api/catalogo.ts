// EP-08 y EP-09
import { ficha, respuestaBusqueda } from '@dlbp/shared';
import { pedir } from '../core/http/cliente';

export type BuscarPor = 'titulo' | 'persona';

export const buscarObras = (q: string, por: BuscarPor) =>
  pedir({ ruta: '/obras', consulta: { q, por } }, respuestaBusqueda);

export const verFicha = (obraId: string) => pedir({ ruta: `/obras/${encodeURIComponent(obraId)}` }, ficha);
