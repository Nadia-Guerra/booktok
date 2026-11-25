import { identificador, seguirEntrada } from '@dlbp/shared';
import { Router } from 'express';
import { z } from 'zod';
import * as social from '../servicios/social.ts';
import { exigirSesion, sesionDe } from './sesion.ts';

export const rutasSocial = Router();

const parametrosUsuario = z.object({ usuario_id: identificador });

// EP-19
rutasSocial.post('/me/seguidos', exigirSesion, async (req, res) => {
  const { usuario_id } = seguirEntrada.parse(req.body ?? {});
  res.status(201).json(await social.seguir(sesionDe(res), usuario_id));
});

// EP-20: 204 aunque no lo siguiera.
rutasSocial.delete('/me/seguidos/:usuario_id', exigirSesion, async (req, res) => {
  const { usuario_id } = parametrosUsuario.parse(req.params);
  await social.dejarDeSeguir(sesionDe(res), usuario_id);
  res.status(204).end();
});

// EP-21
rutasSocial.get('/me/seguimientos', exigirSesion, async (_req, res) => {
  res.json(await social.miRed(sesionDe(res)));
});

// EP-22
rutasSocial.get('/usuarios/:usuario_id', exigirSesion, async (req, res) => {
  const { usuario_id } = parametrosUsuario.parse(req.params);
  res.json(await social.verUsuario(sesionDe(res), usuario_id));
});
