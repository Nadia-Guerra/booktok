import { elementoNuevo, identificador, listaCambios, listaNueva } from '@dlbp/shared';
import { Router } from 'express';
import { z } from 'zod';
import * as listas from '../servicios/listas.ts';
import { exigirSesion, sesionDe } from './sesion.ts';

export const rutasListas = Router();

const parametrosLista = z.object({ lista_id: identificador });
const parametrosElemento = z.object({ lista_id: identificador, obra_id: identificador });

// EP-29
rutasListas.get('/me/listas', exigirSesion, async (_req, res) => {
  res.json(await listas.mias(sesionDe(res)));
});

// EP-30
rutasListas.post('/me/listas', exigirSesion, async (req, res) => {
  const { nombre } = listaNueva.parse(req.body ?? {});
  res.status(201).json(await listas.crear(sesionDe(res), nombre));
});

// EP-31
rutasListas.get('/listas/:lista_id', exigirSesion, async (req, res) => {
  const { lista_id } = parametrosLista.parse(req.params);
  res.json(await listas.ver(sesionDe(res), lista_id));
});

// EP-32
rutasListas.patch('/listas/:lista_id', exigirSesion, async (req, res) => {
  const { lista_id } = parametrosLista.parse(req.params);
  const cambios = listaCambios.parse(req.body ?? {});
  res.json(await listas.cambiar(sesionDe(res), lista_id, cambios));
});

// EP-33
rutasListas.delete('/listas/:lista_id', exigirSesion, async (req, res) => {
  const { lista_id } = parametrosLista.parse(req.params);
  await listas.eliminar(sesionDe(res), lista_id);
  res.status(204).end();
});

// EP-34
rutasListas.post('/listas/:lista_id/obras', exigirSesion, async (req, res) => {
  const { lista_id } = parametrosLista.parse(req.params);
  const { obra_id } = elementoNuevo.parse(req.body ?? {});
  res.status(201).json(await listas.agregar(sesionDe(res), lista_id, obra_id));
});

// EP-35: 204 aunque la obra no estuviera.
rutasListas.delete('/listas/:lista_id/obras/:obra_id', exigirSesion, async (req, res) => {
  const { lista_id, obra_id } = parametrosElemento.parse(req.params);
  await listas.quitar(sesionDe(res), lista_id, obra_id);
  res.status(204).end();
});
