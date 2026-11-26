// De lo que hay en los campos de un formulario al cuerpo que espera la API. La validación es la de
// `shared/`; aquí solo se convierte. Sin nada de React Native, para poder probarlo con Node.
import { comparativaCambios, edicionNueva, libroNuevo, peliculaNueva, type Comparativa } from '@dlbp/shared';
import { z } from 'zod';
import { aLista, aNumero } from './texto';

export type ValoresObra = { titulo: string; sinopsis: string; portada_url: string; generos: string };

export const OBRA_VACIA: ValoresObra = { titulo: '', sinopsis: '', portada_url: '', generos: '' };

type ConId = { persona_id: string };

export type ValoresLibro<P extends ConId = ConId> = ValoresObra & { anio_publicacion_original: string; autores: P[] };

export const esquemaLibro = z.preprocess((valores) => {
  const v = valores as ValoresLibro;
  return {
    ...v,
    generos: aLista(v.generos),
    anio_publicacion_original: aNumero(v.anio_publicacion_original),
    autores: v.autores.map((p) => p.persona_id),
  };
}, libroNuevo);

export type ValoresPelicula<P extends ConId = ConId> = ValoresObra & {
  anio_estreno: string;
  duracion_min: string;
  idioma_original: string;
  paises: string;
  productoras: string;
  clasificacion: string;
  plataformas: string;
  libro_id: string;
  directores: P[];
  actores: P[];
  /** Personaje de cada actor, por su id. */
  personajes: Record<string, string>;
};

export const esquemaPelicula = z.preprocess((valores) => {
  const { idioma_original, paises, productoras, clasificacion, actores, personajes, ...v } = valores as ValoresPelicula;
  return {
    ...v,
    generos: aLista(v.generos),
    anio_estreno: aNumero(v.anio_estreno),
    duracion_min: aNumero(v.duracion_min),
    plataformas: aLista(v.plataformas).map((nombre) => ({ nombre })),
    datos_tecnicos: {
      idioma_original,
      paises: aLista(paises),
      ...(productoras.trim() && { productoras: aLista(productoras) }),
      clasificacion,
    },
    directores: v.directores.map((p) => p.persona_id),
    // El orden del reparto es el orden en que se agregaron.
    reparto: actores.map((p, i) => ({
      persona_id: p.persona_id,
      personaje: personajes[p.persona_id] ?? '',
      orden: i + 1,
    })),
  };
}, peliculaNueva);

export type ValoresEdicion = { isbn: string; paginas: string; editorial: string; idioma: string; anio: string };

export const esquemaEdicion = z.preprocess((valores) => {
  const v = valores as ValoresEdicion;
  return { ...v, paginas: aNumero(v.paginas), anio: aNumero(v.anio) };
}, edicionNueva);

// `puntuacion` en 0 es "sin puntuar": la puntuación es opcional.
export type Aspecto = { nombre: string; puntuacion: number; comentario: string };

export type ValoresComparativa = {
  veredicto: { preferencia: Comparativa['veredicto']['preferencia'] | null; comentario: string };
  aspectos: Aspecto[];
};

export const esquemaComparativa = z.preprocess((valores) => {
  const v = valores as ValoresComparativa;
  return { ...v, aspectos: v.aspectos.map((a) => ({ ...a, puntuacion: a.puntuacion || undefined })) };
}, comparativaCambios);
