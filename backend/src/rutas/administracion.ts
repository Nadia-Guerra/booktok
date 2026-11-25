// Rutas del administrador. Todas pasan por `exigirAdmin`: 401 sin sesión y 403 a un lector (RN-09).
import {
  edicionNueva,
  identificador,
  libroNuevo,
  peliculaNueva,
  personaNueva,
  personasConsulta,
  plataformaNueva,
} from '@dlbp/shared';
import { Router } from 'express';
import { z } from 'zod';
import * as administracion from '../servicios/administracion.ts';
import { exigirAdmin } from './sesion.ts';

export const rutasAdministracion = Router();

const parametrosObra = z.object({ obra_id: identificador });

// EP-36
rutasAdministracion.get('/admin/personas', exigirAdmin, async (req, res) => {
  const { q } = personasConsulta.parse(req.query);
  res.json({ personas: await administracion.buscarPersonas(q) });
});

// EP-37
rutasAdministracion.post('/admin/personas', exigirAdmin, async (req, res) => {
  res.status(201).json(await administracion.crearPersona(personaNueva.parse(req.body ?? {})));
});

// EP-39
rutasAdministracion.post('/admin/libros', exigirAdmin, async (req, res) => {
  res.status(201).json(await administracion.crearLibro(libroNuevo.parse(req.body ?? {})));
});

// EP-40
rutasAdministracion.post('/admin/peliculas', exigirAdmin, async (req, res) => {
  res.status(201).json(await administracion.crearPelicula(peliculaNueva.parse(req.body ?? {})));
});

// EP-41
rutasAdministracion.post('/admin/obras/:obra_id/publicacion', exigirAdmin, async (req, res) => {
  const { obra_id } = parametrosObra.parse(req.params);
  res.json(await administracion.completarPublicacion(obra_id));
});

// EP-43
rutasAdministracion.post('/admin/libros/:obra_id/ediciones', exigirAdmin, async (req, res) => {
  const { obra_id } = parametrosObra.parse(req.params);
  res.status(201).json(await administracion.agregarEdicion(obra_id, edicionNueva.parse(req.body ?? {})));
});

// EP-46
rutasAdministracion.post('/admin/peliculas/:obra_id/plataformas', exigirAdmin, async (req, res) => {
  const { obra_id } = parametrosObra.parse(req.params);
  const { nombre } = plataformaNueva.parse(req.body ?? {});
  res.status(201).json(await administracion.agregarPlataforma(obra_id, nombre));
});
