import { Router } from 'express';
import { estadoDeSalud } from '../servicios/salud.ts';

export const rutasSalud = Router();

// EP-01
rutasSalud.get('/salud', async (_req, res) => {
  res.json(await estadoDeSalud());
});
