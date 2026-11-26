// EP-36, 37, 39, 40, 41, 43 y 46. La API comprueba que quien llama sea administrador.
import {
  obraPublicacion,
  plataformaNueva,
  respuestaAlta,
  respuestaEdicion,
  respuestaPersonaCreada,
  respuestaPersonas,
  type EdicionNueva,
  type LibroNuevo,
  type PeliculaNueva,
  type PersonaNueva,
} from '@dlbp/shared';
import { pedir } from '../core/http/cliente';

const id = encodeURIComponent;

export const buscarPersonas = (q: string) => pedir({ ruta: '/admin/personas', consulta: { q } }, respuestaPersonas);

export const crearPersona = (cuerpo: PersonaNueva) =>
  pedir({ metodo: 'POST', ruta: '/admin/personas', cuerpo }, respuestaPersonaCreada);

export const crearLibro = (cuerpo: LibroNuevo) =>
  pedir({ metodo: 'POST', ruta: '/admin/libros', cuerpo }, respuestaAlta);

export const crearPelicula = (cuerpo: PeliculaNueva) =>
  pedir({ metodo: 'POST', ruta: '/admin/peliculas', cuerpo }, respuestaAlta);

export const publicarObra = (obraId: string) =>
  pedir({ metodo: 'POST', ruta: `/admin/obras/${id(obraId)}/publicacion` }, obraPublicacion);

export const agregarEdicion = (libroId: string, cuerpo: EdicionNueva) =>
  pedir({ metodo: 'POST', ruta: `/admin/libros/${id(libroId)}/ediciones`, cuerpo }, respuestaEdicion);

export const agregarPlataforma = (peliculaId: string, nombre: string) =>
  pedir({ metodo: 'POST', ruta: `/admin/peliculas/${id(peliculaId)}/plataformas`, cuerpo: { nombre } }, plataformaNueva);
