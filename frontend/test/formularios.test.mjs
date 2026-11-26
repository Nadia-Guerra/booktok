// Pruebas unitarias de lo que la app hace sin el teléfono: limpiar lo escrito y armar los cuerpos.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { esquemaComparativa, esquemaEdicion, esquemaLibro, esquemaPelicula, OBRA_VACIA } from '../src/core/formularios.ts';
import { aLista, aNumero, limpiarUrl } from '../src/core/texto.ts';

const ID = '11111111-1111-4111-8111-111111111111';
const obra = { titulo: 'Título', sinopsis: 'Sinopsis', portada_url: '', generos: 'drama, aventura' };

const rutasConError = (resultado) => resultado.error?.issues.map((i) => i.path.join('.')) ?? [];

test('la dirección de la API se limpia al pegarla', () => {
  assert.equal(limpiarUrl(' abc.trycloudflare.com '), 'https://abc.trycloudflare.com');
  assert.equal(limpiarUrl('https://abc.trycloudflare.com/api/v1/'), 'https://abc.trycloudflare.com');
  assert.equal(limpiarUrl('https://abc.trycloudflare.com/api/v1/salud'), 'https://abc.trycloudflare.com');
  assert.equal(limpiarUrl('http://192.168.0.2:3000/'), 'http://192.168.0.2:3000');
  assert.equal(limpiarUrl('   '), '');
});

test('números y listas escritos a mano', () => {
  assert.equal(aNumero(''), undefined);
  assert.equal(aNumero('-300'), -300);
  assert.ok(Number.isNaN(aNumero('abc')));
  assert.deepEqual(aLista(' drama ,, aventura, '), ['drama', 'aventura']);
});

test('alta de libro: ids de autores, géneros en lista y sin portada vacía', () => {
  const cuerpo = esquemaLibro.parse({ ...obra, anio_publicacion_original: '1965', autores: [{ persona_id: ID }] });
  assert.deepEqual(cuerpo.generos, ['drama', 'aventura']);
  assert.deepEqual(cuerpo.autores, [ID]);
  assert.equal(cuerpo.anio_publicacion_original, 1965);
  assert.equal(cuerpo.portada_url, undefined);
  assert.deepEqual(cuerpo.ediciones, []);
});

test('alta de película: el reparto toma el orden en que se agregó', () => {
  const otro = '22222222-2222-4222-8222-222222222222';
  const cuerpo = esquemaPelicula.parse({
    ...obra,
    anio_estreno: '2021',
    duracion_min: '155',
    idioma_original: 'inglés',
    paises: 'Estados Unidos, Canadá',
    productoras: '',
    clasificacion: '',
    plataformas: 'Plataforma A, Plataforma B',
    libro_id: ID,
    directores: [{ persona_id: ID }],
    actores: [{ persona_id: otro }, { persona_id: ID }],
    personajes: { [otro]: 'Primero', [ID]: 'Segundo' },
  });
  assert.deepEqual(
    cuerpo.reparto.map((a) => [a.persona_id, a.personaje, a.orden]),
    [[otro, 'Primero', 1], [ID, 'Segundo', 2]],
  );
  assert.deepEqual(cuerpo.plataformas, [{ nombre: 'Plataforma A' }, { nombre: 'Plataforma B' }]);
  assert.equal(cuerpo.datos_tecnicos.productoras, undefined);
});

test('un formulario vacío señala cada campo que falta', () => {
  const resultado = esquemaLibro.safeParse({ ...OBRA_VACIA, anio_publicacion_original: '', autores: [] });
  const rutas = rutasConError(resultado);
  for (const campo of ['titulo', 'sinopsis', 'generos', 'anio_publicacion_original', 'autores']) {
    assert.ok(rutas.includes(campo), `falta el error de ${campo}`);
  }
});

test('edición: el ISBN vacío se omite y uno corto se rechaza', () => {
  const base = { paginas: '200', editorial: 'E', idioma: 'español', anio: '2000' };
  assert.equal(esquemaEdicion.parse({ ...base, isbn: '' }).isbn, undefined);
  assert.deepEqual(rutasConError(esquemaEdicion.safeParse({ ...base, isbn: '123' })), ['isbn']);
});

test('comparativa: sin estrellas no se envía puntuación', () => {
  const cuerpo = esquemaComparativa.parse({
    veredicto: { preferencia: 'libro', comentario: '' },
    aspectos: [{ nombre: 'Historia', puntuacion: 0, comentario: '' }, { nombre: 'Final', puntuacion: 4, comentario: 'Bien' }],
  });
  assert.equal(cuerpo.aspectos[0].puntuacion, undefined);
  assert.equal(cuerpo.aspectos[1].puntuacion, 4);
  assert.equal(cuerpo.veredicto.comentario, undefined);
});

test('comparativa: hay que elegir cuál gustó más', () => {
  const resultado = esquemaComparativa.safeParse({
    veredicto: { preferencia: null, comentario: '' },
    aspectos: [{ nombre: '', puntuacion: 0, comentario: '' }],
  });
  assert.deepEqual(rutasConError(resultado).sort(), ['aspectos.0.nombre', 'veredicto.preferencia']);
});
