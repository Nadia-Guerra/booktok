import { caminosConsulta, identificador } from '@dlbp/shared';
import { Router } from 'express';
import { z } from 'zod';
import * as descubrimiento from '../servicios/descubrimiento.ts';
import { exigirSesion, sesionDe } from './sesion.ts';

export const rutasDescubrimiento = Router();

const parametrosPersona = z.object({ persona_id: identificador });

// EP-16
rutasDescubrimiento.get('/exploracion/caminos', exigirSesion, async (req, res) => {
  const { origen, destino } = caminosConsulta.parse(req.query);
  res.json(await descubrimiento.caminos(sesionDe(res), origen, destino));
});

// EP-17
rutasDescubrimiento.get('/personas/:persona_id/autores-relacionados', exigirSesion, async (req, res) => {
  const { persona_id } = parametrosPersona.parse(req.params);
  res.json(await descubrimiento.autoresRelacionados(sesionDe(res), persona_id));
});

// EP-18
rutasDescubrimiento.get('/me/recomendaciones', exigirSesion, async (_req, res) => {
  res.json(await descubrimiento.recomendaciones(sesionDe(res)));
});
