import { busquedaConsulta, identificador } from '@dlbp/shared';
import { Router } from 'express';
import { z } from 'zod';
import * as catalogo from '../servicios/catalogo.ts';
import { sesionOpcional, sesionSiHay } from './sesion.ts';

export const rutasCatalogo = Router();

const parametrosObra = z.object({ obra_id: identificador });

// EP-08
rutasCatalogo.get('/obras', sesionOpcional, async (req, res) => {
  const { q, por } = busquedaConsulta.parse(req.query);
  const buscar = por === 'persona' ? catalogo.buscarPorPersona : catalogo.buscarPorTitulo;
  res.json({ obras: await buscar(q, sesionSiHay(res)) });
});

// EP-09
rutasCatalogo.get('/obras/:obra_id', sesionOpcional, async (req, res) => {
  const { obra_id } = parametrosObra.parse(req.params);
  res.json(await catalogo.verFicha(obra_id, sesionSiHay(res)));
});
