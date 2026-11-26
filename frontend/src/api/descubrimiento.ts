// EP-16 a EP-18: las consultas de grafos.
import { respuestaAutores, respuestaCaminos, respuestaRecomendaciones } from '@dlbp/shared';
import { pedir } from '../core/http/cliente';

export const verCaminos = (origen: string, destino: string) =>
  pedir({ ruta: '/exploracion/caminos', consulta: { origen, destino } }, respuestaCaminos);

export const verAutoresRelacionados = (directorId: string) =>
  pedir({ ruta: `/personas/${encodeURIComponent(directorId)}/autores-relacionados` }, respuestaAutores);

export const verRecomendaciones = () => pedir({ ruta: '/me/recomendaciones' }, respuestaRecomendaciones);
