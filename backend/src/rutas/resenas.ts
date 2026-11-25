import { estadoEntrada, estadosConsulta, identificador, resenaEntrada, resenasConsulta } from '@dlbp/shared';
import { Router } from 'express';
import { z } from 'zod';
import * as resenas from '../servicios/resenas.ts';
import { exigirSesion, sesionDe, sesionOpcional, sesionSiHay } from './sesion.ts';

export const rutasResenas = Router();

const parametrosObra = z.object({ obra_id: identificador });
const parametrosResena = z.object({ resena_id: identificador });

// EP-10
rutasResenas.get('/resenas', sesionOpcional, async (req, res) => {
  res.json(await resenas.listar(resenasConsulta.parse(req.query), sesionSiHay(res)));
});

// EP-11: 201 al publicar, 200 al editar la propia.
rutasResenas.put('/obras/:obra_id/resena', exigirSesion, async (req, res) => {
  const { obra_id } = parametrosObra.parse(req.params);
  const entrada = resenaEntrada.parse(req.body ?? {});
  const { creada, ...cuerpo } = await resenas.publicar(sesionDe(res), obra_id, entrada);
  res.status(creada ? 201 : 200).json(cuerpo);
});

// EP-13
rutasResenas.delete('/resenas/:resena_id', exigirSesion, async (req, res) => {
  const { resena_id } = parametrosResena.parse(req.params);
  await resenas.eliminar(sesionDe(res), resena_id);
  res.status(204).end();
});

// EP-14
rutasResenas.put('/me/estados/:obra_id', exigirSesion, async (req, res) => {
  const { obra_id } = parametrosObra.parse(req.params);
  const { estado } = estadoEntrada.parse(req.body ?? {});
  res.json(await resenas.marcarEstado(sesionDe(res), obra_id, estado));
});

// EP-15
rutasResenas.get('/me/estados', exigirSesion, async (req, res) => {
  res.json(await resenas.misEstados(sesionDe(res), estadosConsulta.parse(req.query)));
});
