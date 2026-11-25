// Catálogo en lectura (EP-08 y EP-09).
import { z } from 'zod';

/** Id de una obra o persona: se normaliza a minúsculas antes de validar (D-11, D-40). */
export const identificador = z.string().toLowerCase().pipe(z.guid('El identificador no es válido'));

export const tipoObra = z.enum(['libro', 'pelicula']);
export const estadoLectura = z.enum(['pendiente', 'en_curso', 'terminada']);
export const estadoPublicacion = z.enum(['borrador', 'publicada']);

export const busquedaConsulta = z.object({
  q: z.string('Escribe qué buscar').trim().min(1, 'Escribe qué buscar').max(200, 'La búsqueda es demasiado larga'),
  // La búsqueda por persona llega con el grafo en la etapa de descubrimiento.
  por: z.literal('titulo', 'Por ahora solo se busca por título').default('titulo'),
});

/** Datos de presentación de una obra (AP-03, AP-04). */
export const obraBreve = z.object({
  obra_id: z.guid(),
  tipo: tipoObra,
  titulo: z.string(),
  anio: z.number().int(),
  portada_url: z.string().nullable(),
});

export const respuestaBusqueda = z.object({ obras: z.array(obraBreve) });

export const edicion = z.object({
  edicion_id: z.guid(),
  isbn: z.string().nullable(),
  paginas: z.number().int(),
  editorial: z.string(),
  idioma: z.string(),
  anio: z.number().int(),
});

export const personaBreve = z.object({
  persona_id: z.guid(),
  nombre: z.string(),
  foto_url: z.string().nullable(),
});

export const actorReparto = personaBreve.extend({
  personaje: z.string(),
  orden: z.number().int(),
});

export const miResena = z.object({
  resena_id: z.guid(),
  calificacion: z.number().int().min(1).max(5),
  texto: z.string().nullable(),
  oculta: z.boolean(),
  creado_en: z.iso.datetime(),
  actualizado_en: z.iso.datetime(),
});

const fichaComun = {
  obra_id: z.guid(),
  titulo: z.string(),
  sinopsis: z.string(),
  portada_url: z.string().nullable(),
  generos: z.array(z.string()),
  estado_publicacion: estadoPublicacion,
  promedio: z.number().nullable(),
  total_resenas: z.number().int(),
  // Solo con sesión.
  mi_estado: estadoLectura.nullable().optional(),
  mi_resena: miResena.nullable().optional(),
};

export const fichaLibro = z.object({
  ...fichaComun,
  tipo: z.literal('libro'),
  anio_publicacion_original: z.number().int(),
  ediciones: z.array(edicion),
  autores: z.array(personaBreve),
  adaptaciones: z.array(obraBreve),
});

export const fichaPelicula = z.object({
  ...fichaComun,
  tipo: z.literal('pelicula'),
  anio_estreno: z.number().int(),
  duracion_min: z.number().int(),
  plataformas: z.array(z.object({ nombre: z.string() })),
  datos_tecnicos: z.object({
    idioma_original: z.string(),
    paises: z.array(z.string()),
    productoras: z.array(z.string()),
    clasificacion: z.string().nullable(),
  }),
  reparto: z.array(actorReparto),
  directores: z.array(personaBreve),
  libro_origen: obraBreve.nullable(),
});

export const ficha = z.discriminatedUnion('tipo', [fichaLibro, fichaPelicula]);

export type TipoObra = z.infer<typeof tipoObra>;
export type EstadoLectura = z.infer<typeof estadoLectura>;
export type EstadoPublicacion = z.infer<typeof estadoPublicacion>;
export type ObraBreve = z.infer<typeof obraBreve>;
export type RespuestaBusqueda = z.infer<typeof respuestaBusqueda>;
export type Edicion = z.infer<typeof edicion>;
export type PersonaBreve = z.infer<typeof personaBreve>;
export type ActorReparto = z.infer<typeof actorReparto>;
export type MiResena = z.infer<typeof miResena>;
export type FichaLibro = z.infer<typeof fichaLibro>;
export type FichaPelicula = z.infer<typeof fichaPelicula>;
export type Ficha = z.infer<typeof ficha>;
