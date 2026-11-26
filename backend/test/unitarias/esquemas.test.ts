// Unitarias de las reglas de entrada que comparten la API y la app (`shared/`). No usan bases ni red.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  busquedaConsulta,
  comparativaEntrada,
  identificador,
  libroNuevo,
  peliculaNueva,
  registroEntrada,
  resenaEntrada,
  resenasConsulta,
  urlImagen,
} from '@dlbp/shared';

const ID = 'abcdef00-0000-4000-8000-000000000001';
const OTRO = 'abcdef00-0000-4000-8000-000000000002';

/** Rutas de los campos que fallan, para comprobar que se señala el campo correcto. */
const fallan = (resultado: { error?: { issues: { path: PropertyKey[] }[] } }) =>
  resultado.error?.issues.map((i) => i.path.join('.')) ?? [];

test('los identificadores entran en minúsculas (D-11, D-40)', () => {
  assert.equal(identificador.parse(ID.toUpperCase()), ID);
  assert.equal(identificador.safeParse('123').success, false);
});

test('el correo se limpia y pasa a minúsculas (D-03)', () => {
  const datos = registroEntrada.parse({ correo: '  Ana@Ejemplo.TEST ', password: '12345678', nombre: ' Ana ' });
  assert.equal(datos.correo, 'ana@ejemplo.test');
  assert.equal(datos.nombre, 'Ana');
});

test('registro: contraseña de 8 o más, correo válido y nombre obligatorio (D-57)', () => {
  const resultado = registroEntrada.safeParse({ correo: 'sin-arroba', password: '1234567', nombre: '   ' });
  assert.deepEqual(fallan(resultado).sort(), ['correo', 'nombre', 'password']);
});

test('la calificación es un entero del 1 al 5', () => {
  for (const calificacion of [1, 5]) assert.equal(resenaEntrada.safeParse({ calificacion }).success, true);
  for (const calificacion of [0, 6, 3.5, '4']) {
    assert.equal(resenaEntrada.safeParse({ calificacion }).success, false, `aceptó ${String(calificacion)}`);
  }
});

test('reseña: el texto vacío queda nulo y no pasa de 3000 caracteres', () => {
  assert.equal(resenaEntrada.parse({ calificacion: 3, texto: '   ' }).texto, null);
  assert.equal(resenaEntrada.safeParse({ calificacion: 3, texto: 'a'.repeat(3001) }).success, false);
});

test('las reseñas se piden por obra o por usuario, no por ambos ni por ninguno', () => {
  assert.equal(resenasConsulta.parse({ obra_id: ID }).limite, 20);
  assert.equal(resenasConsulta.safeParse({}).success, false);
  assert.equal(resenasConsulta.safeParse({ obra_id: ID, usuario_id: OTRO }).success, false);
});

test('las imágenes solo se aceptan por https (D-31)', () => {
  assert.equal(urlImagen.parse('https://ejemplo.test/portada.jpg'), 'https://ejemplo.test/portada.jpg');
  assert.equal(urlImagen.parse(''), undefined);
  for (const direccion of ['http://ejemplo.test/a.jpg', 'ftp://ejemplo.test/a.jpg', `https://${'a'.repeat(500)}`]) {
    assert.equal(urlImagen.safeParse(direccion).success, false, `aceptó ${direccion.slice(0, 30)}`);
  }
});

test('búsqueda: por título si no se dice otra cosa, y con algo que buscar', () => {
  assert.equal(busquedaConsulta.parse({ q: ' dune ' }).por, 'titulo');
  assert.equal(busquedaConsulta.safeParse({ q: '   ' }).success, false);
  // Un operador de MongoDB llega como objeto y no como texto: se rechaza.
  assert.equal(busquedaConsulta.safeParse({ q: { $ne: null } }).success, false);
});

test('libro: no admite dos ediciones con el mismo ISBN (D-08)', () => {
  const edicion = { isbn: '9780000000001', paginas: 100, editorial: 'E', idioma: 'español', anio: 2000 };
  const libro = {
    titulo: 'T',
    sinopsis: 'S',
    generos: ['drama'],
    anio_publicacion_original: 1965,
    autores: [ID],
    ediciones: [edicion, edicion],
  };
  assert.deepEqual(fallan(libroNuevo.safeParse(libro)), ['ediciones']);
  assert.equal(libroNuevo.safeParse({ ...libro, ediciones: [edicion] }).success, true);
});

test('película: ni persona ni orden repetidos en el reparto (D-22)', () => {
  const actor = (persona_id: string, orden: number) => ({ persona_id, personaje: 'P', orden });
  const pelicula = {
    titulo: 'T',
    sinopsis: 'S',
    generos: ['drama'],
    anio_estreno: 2021,
    duracion_min: 100,
    datos_tecnicos: { idioma_original: 'inglés', paises: ['Canadá'] },
    libro_id: ID,
    directores: [ID],
  };
  assert.equal(peliculaNueva.safeParse({ ...pelicula, reparto: [actor(ID, 1), actor(OTRO, 2)] }).success, true);
  assert.equal(peliculaNueva.safeParse({ ...pelicula, reparto: [actor(ID, 1), actor(ID, 2)] }).success, false);
  assert.equal(peliculaNueva.safeParse({ ...pelicula, reparto: [actor(ID, 1), actor(OTRO, 1)] }).success, false);
});

test('comparativa: de 1 a 10 aspectos y preferencia conocida', () => {
  const base = { libro_id: ID, pelicula_id: OTRO, veredicto: { preferencia: 'libro' } };
  const aspectos = (n: number) => Array.from({ length: n }, (_, i) => ({ nombre: `Aspecto ${i}` }));
  assert.equal(comparativaEntrada.safeParse({ ...base, aspectos: aspectos(10) }).success, true);
  assert.equal(comparativaEntrada.safeParse({ ...base, aspectos: aspectos(0) }).success, false);
  assert.equal(comparativaEntrada.safeParse({ ...base, aspectos: aspectos(11) }).success, false);
  assert.equal(
    comparativaEntrada.safeParse({ ...base, veredicto: { preferencia: 'otra' }, aspectos: aspectos(1) }).success,
    false,
  );
});
