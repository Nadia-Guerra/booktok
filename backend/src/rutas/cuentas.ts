import { perfilCambios, registroEntrada, sesionEntrada } from '@dlbp/shared';
import { Router } from 'express';
import * as cuentas from '../servicios/cuentas.ts';
import { exigirSesion, sesionDe } from './sesion.ts';

export const rutasCuentas = Router();

// EP-02
rutasCuentas.post('/auth/registro', async (req, res) => {
  res.status(201).json(await cuentas.registrar(registroEntrada.parse(req.body ?? {})));
});

// EP-03
rutasCuentas.post('/auth/sesion', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(201).json(await cuentas.iniciarSesion(sesionEntrada.parse(req.body ?? {})));
});

// EP-04
rutasCuentas.delete('/auth/sesion', exigirSesion, async (_req, res) => {
  await cuentas.cerrarSesion(sesionDe(res));
  res.status(204).end();
});

// EP-05
rutasCuentas.get('/me', exigirSesion, async (_req, res) => {
  res.json(await cuentas.verPerfil(sesionDe(res).usuarioId));
});

// EP-06
rutasCuentas.patch('/me', exigirSesion, async (req, res) => {
  const cambios = perfilCambios.parse(req.body ?? {});
  res.json(await cuentas.editarPerfil(sesionDe(res).usuarioId, cambios));
});
