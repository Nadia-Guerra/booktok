import {
  comparativaCambios,
  comparativaEntrada,
  comparativasConsulta,
  identificador,
  moderacionEntrada,
} from '@dlbp/shared';
import { Router } from 'express';
import { z } from 'zod';
import * as comparativas from '../servicios/comparativas.ts';
import { exigirAdmin, exigirSesion, sesionDe, sesionOpcional, sesionSiHay } from './sesion.ts';

export const rutasComparativas = Router();

const parametros = z.object({ comparativa_id: identificador });

// EP-23
rutasComparativas.get('/comparativas', sesionOpcional, async (req, res) => {
  res.json(await comparativas.listar(comparativasConsulta.parse(req.query), sesionSiHay(res)));
});

// EP-25
rutasComparativas.post('/comparativas', exigirSesion, async (req, res) => {
  res.status(201).json(await comparativas.crear(sesionDe(res), comparativaEntrada.parse(req.body ?? {})));
});

// EP-26
rutasComparativas.put('/comparativas/:comparativa_id', exigirSesion, async (req, res) => {
  const { comparativa_id } = parametros.parse(req.params);
  const cambios = comparativaCambios.parse(req.body ?? {});
  res.json(await comparativas.editar(sesionDe(res), comparativa_id, cambios));
});

// EP-27
rutasComparativas.patch('/comparativas/:comparativa_id', exigirAdmin, async (req, res) => {
  const { comparativa_id } = parametros.parse(req.params);
  const { oculta } = moderacionEntrada.parse(req.body ?? {});
  res.json(await comparativas.moderar(comparativa_id, oculta));
});

// EP-28
rutasComparativas.delete('/comparativas/:comparativa_id', exigirSesion, async (req, res) => {
  const { comparativa_id } = parametros.parse(req.params);
  await comparativas.eliminar(sesionDe(res), comparativa_id);
  res.status(204).end();
});
