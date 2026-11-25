// Administración del catálogo (EP-36, 37, 39, 40, 41, 43 y 46). Los límites son los de los validadores
// de `libros` y `peliculas`; los de las personas los comprueba solo la API (D-22).
import { z } from 'zod';
import { estadoPublicacion, identificador, personaBreve } from './catalogo.ts';

const texto = (maximo: number, nombre: string) =>
  z
    .string(`Escribe ${nombre}`)
    .trim()
    .min(1, `Escribe ${nombre}`)
    .max(maximo, `Admite hasta ${maximo} caracteres`)
    .regex(/^[^\u0000]*$/, 'Tiene caracteres no admitidos');

const entero = (minimo: number, maximo: number) =>
  z
    .number('Escribe un número')
    .int('Debe ser un número entero')
    .min(minimo, `El mínimo es ${minimo}`)
    .max(maximo, `El máximo es ${maximo}`);

/** D-25 y D-31: la dirección `https://` de una imagen ya alojada. Vacía o nula se omite. */
export const urlImagen = z
  .union([
    z.literal(''),
    z
      .string()
      .trim()
      .max(500, 'La dirección admite hasta 500 caracteres')
      .regex(/^https:\/\/\S+$/, 'Debe ser una dirección que empiece por https://'),
  ])
  .nullish()
  .transform((u) => u || undefined);

const sinRepetir = <T>(clave: (x: T) => unknown) => (lista: T[]) => new Set(lista.map(clave)).size === lista.length;

const textos = (maximoElementos: number, largo: number, nombre: string) =>
  z
    .array(texto(largo, nombre))
    .max(maximoElementos, `Son como máximo ${maximoElementos}`)
    .refine(sinRepetir<string>((x) => x), 'No repitas elementos');

export const personaNueva = z.object({ nombre: texto(150, 'el nombre'), foto_url: urlImagen });

export const personasConsulta = z.object({
  q: z.string('Escribe qué buscar').trim().min(1, 'Escribe qué buscar').max(200),
});

export const respuestaPersonas = z.object({ personas: z.array(personaBreve) });
export const respuestaPersonaCreada = z.object({ persona_id: z.guid() });

export const edicionNueva = z.object({
  isbn: z
    .union([z.literal(''), z.string().trim().regex(/^[0-9]{13}$/, 'El ISBN son 13 dígitos, sin guiones')])
    .nullish()
    .transform((i) => i || undefined),
  paginas: entero(1, 10000),
  editorial: texto(100, 'la editorial'),
  idioma: texto(40, 'el idioma'),
  anio: entero(1, 2100),
});

export const plataformaNueva = z.object({ nombre: texto(100, 'el nombre de la plataforma') });

const fichaNueva = {
  titulo: texto(200, 'el título'),
  sinopsis: texto(3000, 'la sinopsis'),
  portada_url: urlImagen,
  generos: textos(5, 40, 'el género').refine((g) => g.length > 0, 'Agrega al menos un género'),
};

const personas = (mensaje: string) =>
  z
    .array(identificador)
    .min(1, mensaje)
    .max(20, 'Son como máximo 20')
    .refine(sinRepetir<string>((x) => x), 'No repitas personas');

export const libroNuevo = z.object({
  ...fichaNueva,
  anio_publicacion_original: entero(-3000, 2100),
  ediciones: z
    .array(edicionNueva)
    .max(50, 'Son como máximo 50 ediciones')
    // D-08: el índice único no detecta un ISBN repetido dentro del mismo libro.
    .refine((e) => sinRepetir<string>((x) => x)(e.flatMap((x) => x.isbn ?? [])), 'Hay un ISBN repetido')
    .default([]),
  autores: personas('Indica al menos un autor'),
});

export const actorNuevo = z.object({
  persona_id: identificador,
  personaje: texto(150, 'el personaje'),
  orden: entero(1, 100000),
});

export const peliculaNueva = z.object({
  ...fichaNueva,
  anio_estreno: entero(1888, 2100),
  duracion_min: entero(1, 1000),
  plataformas: z
    .array(plataformaNueva)
    .max(30, 'Son como máximo 30 plataformas')
    .refine(sinRepetir<{ nombre: string }>((p) => p.nombre), 'Hay una plataforma repetida')
    .default([]),
  datos_tecnicos: z.object({
    idioma_original: texto(40, 'el idioma original'),
    paises: textos(10, 60, 'el país').refine((p) => p.length > 0, 'Agrega al menos un país'),
    productoras: textos(20, 100, 'la productora').optional(),
    clasificacion: z
      .union([z.literal(''), texto(20, 'la clasificación')])
      .nullish()
      .transform((c) => c || undefined),
  }),
  libro_id: identificador,
  directores: personas('Indica al menos un director'),
  reparto: z
    .array(actorNuevo)
    .min(1, 'Indica al menos una persona del reparto')
    .max(300, 'El reparto admite hasta 300 personas')
    .refine(sinRepetir<{ persona_id: string }>((a) => a.persona_id), 'Cada persona va una sola vez en el reparto')
    .refine(sinRepetir<{ orden: number }>((a) => a.orden), 'No repitas el orden'),
});

export const obraPublicacion = z.object({ obra_id: z.guid(), estado_publicacion: estadoPublicacion });

/** `libro` solo viene si la obra es una película: su libro de origen y cómo quedó. */
export const respuestaAlta = obraPublicacion.extend({ libro: obraPublicacion.optional() });

export const respuestaEdicion = z.object({ edicion_id: z.guid() });

export type PersonaNueva = z.infer<typeof personaNueva>;
export type LibroNuevo = z.infer<typeof libroNuevo>;
export type PeliculaNueva = z.infer<typeof peliculaNueva>;
export type EdicionNueva = z.infer<typeof edicionNueva>;
export type RespuestaAlta = z.infer<typeof respuestaAlta>;
