# Documental, paso 3: colecciones

Define las colecciones de la base documental (MongoDB) de *Del Libro a la Pantalla*: qué campos tiene cada una, cómo se ve un documento real y qué patrones de acceso la justifican. Aplica las respuestas de `02-relaciones.md` (los `R-nn` citados son de ese archivo) a los patrones de `01-patrones-de-acceso.md` (los `AP-nn`).

Parte de `../matriz-responsabilidades.md` (colecciones `libros`, `peliculas` y `resenas_comparativas`), `../fuente-de-verdad.md` y `../../decisiones_tomadas.md` (D-06 a D-13, D-18 y D-25 a D-27). La validación (campos obligatorios, rangos) está en `04-validacion.md` y los índices en `05-indices.md`.

## 1. Convenciones

| Convención | Significado |
|---|---|
| `_id` | Es el `obra_id` en `libros` y `peliculas`, y el `comparativa_id` en `resenas_comparativas`. Es un UUID generado por la API y es el mismo en las tres bases (RNF-08). Se guarda como texto de 36 caracteres, igual que en las otras bases. Los patrones lo llaman `obra_id` y `comparativa_id` |
| Tipos | `string`, `int`, `bool`, `date` (fecha y hora en UTC), `UUID` (guardado como texto), `[tipo]` para un arreglo y `subdocumento` para un objeto anidado |
| `campo?` | Campo opcional: `isbn` (D-08), `comentario` del veredicto (D-07), `puntuacion` y `comentario` de un aspecto (RF-16), `portada_url` de un libro o una película (D-25), `foto_url` de un elemento del reparto (D-27), y `productoras` y `clasificacion` de los datos técnicos. El resto es obligatorio; las reglas de cada campo están en `04-validacion.md` |
| Tipo de obra | Los patrones que devuelven el "tipo" de una obra (libro o película) lo obtienen de la colección donde está el documento; no es un campo guardado |
| **copia** | Dato cuya fuente de verdad está en otra base. No se edita en el documental: se regenera desde la fuente |

## 2. Tabla de colecciones

| Colección | Campos | Documento de ejemplo | Patrones que la justifican |
|---|---|---|---|
| `libros` | `_id` UUID (el `obra_id`)<br>`titulo` string<br>`sinopsis` string<br>`portada_url?` string<br>`generos` [string]<br>`anio_publicacion_original` int<br>`ediciones` [subdocumento]: `edicion_id` UUID, `isbn?` string, `paginas` int, `editorial` string, `idioma` string, `anio` int<br>`estado_publicacion` string: `borrador` o `publicada`<br>`creado_en` date<br>`actualizado_en` date | Ver 3.1 | **Propios:** AP-01 (ficha completa en una lectura por `_id`), AP-07 (alta en borrador) y AP-11, AP-12, AP-13 (agregar, corregir y quitar ediciones por `edicion_id`).<br>**Compartidos con `peliculas`:** AP-03 (búsqueda por título), AP-04 (datos de varias obras por ids), AP-05 (existencia), AP-09 (publicar), AP-10 (corregir), AP-29 y AP-30 (reconciliación) |
| `peliculas` | `_id` UUID (el `obra_id`)<br>`titulo` string<br>`sinopsis` string<br>`portada_url?` string<br>`generos` [string]<br>`anio_estreno` int<br>`duracion_min` int<br>`plataformas` [subdocumento]: `nombre` string (la identifica)<br>`datos_tecnicos` subdocumento: `idioma_original` string, `paises` [string], `productoras?` [string], `clasificacion?` string<br>`reparto` [subdocumento] (**copia** del grafo): `persona_id` UUID, `nombre` string, `personaje` string, `orden` int, `foto_url?` string<br>`estado_publicacion` string: `borrador` o `publicada`<br>`creado_en` date<br>`actualizado_en` date | Ver 3.2 | **Propios:** AP-02 (ficha completa en una lectura por `_id`), AP-08 (alta en borrador), AP-14, AP-15, AP-16 (plataformas por `nombre`), AP-17 (reemplazar el reparto) y AP-32 (reparto para reconciliar).<br>**Compartidos con `libros`:** AP-03, AP-04, AP-05, AP-09, AP-10, AP-29 y AP-30 |
| `resenas_comparativas` | `_id` UUID (el `comparativa_id`)<br>`usuario_id` UUID (referencia al relacional)<br>`libro_id` UUID (referencia a `libros`)<br>`pelicula_id` UUID (referencia a `peliculas`)<br>`veredicto` subdocumento: `preferencia` string (`libro`, `pelicula` o `empate`), `comentario?` string<br>`aspectos` [subdocumento]: `nombre` string, `puntuacion?` int (1 a 5), `comentario?` string<br>`oculta` bool (falso por defecto)<br>`creado_en` date<br>`actualizado_en` date | Ver 3.3 | AP-18 (publicar: la unicidad usuario, libro y película es RN-05), AP-19 (la de un usuario sobre una pareja), AP-20 (por `_id`), AP-21 (listar las de una adaptación), AP-23 (listar las de un usuario), AP-24 y AP-25 (editar y eliminar las propias), AP-26 y AP-27 (moderar), AP-28 (borrar las de un usuario) y AP-33 (usuarios con comparativas, para detectar huérfanos) |

Los ejemplos van en la sección 3 porque un documento completo no cabe legible dentro de una celda.

## 3. Documentos de ejemplo

Los datos son ficticios y solo ilustran la forma. Los tres ejemplos están relacionados entre sí: la comparativa apunta al libro y a la película por su `_id`.

### 3.1 `libros`

```json
{
  "_id": "6f1d7a52-3c0e-4b8a-9a1e-0b2c4d5e6f01",
  "titulo": "Dune",
  "sinopsis": "En el planeta desértico Arrakis, el joven Paul Atreides se ve arrastrado a una lucha por el control de la especia.",
  "portada_url": "https://almacenamiento.ejemplo.com/portadas/dune-libro.jpg",
  "generos": ["ciencia ficción", "aventura"],
  "anio_publicacion_original": 1965,
  "ediciones": [
    {
      "edicion_id": "2b7e5c10-8a3d-4f19-b6c2-5d0e9a1c7f11",
      "isbn": "9780441172719",
      "paginas": 535,
      "editorial": "Ace",
      "idioma": "inglés",
      "anio": 2005
    },
    {
      "edicion_id": "8d4a1f63-0c2b-47e9-a5d8-3b6c1e9f2a12",
      "paginas": 704,
      "editorial": "Editorial de ejemplo",
      "idioma": "español",
      "anio": 1983
    }
  ],
  "estado_publicacion": "publicada",
  "creado_en": "2026-11-19T10:00:00Z",
  "actualizado_en": "2026-11-19T10:00:00Z"
}
```

`portada_url` es la dirección de la imagen de portada, que vive fuera de la base (D-25); es opcional. La segunda edición no tiene `isbn`, que es opcional (D-08). El promedio de calificación no está en el documento: la API lo adjunta desde `obra_resumen` (R-09). Tampoco están el autor ni las adaptaciones, que viven en el grafo (R-06 y R-08).

### 3.2 `peliculas`

```json
{
  "_id": "9a8c3e17-5b2d-4f60-8e3a-1c7d9b0a2f02",
  "titulo": "Dune",
  "sinopsis": "Paul Atreides viaja a Arrakis para proteger a su familia y a un pueblo del desierto.",
  "portada_url": "https://almacenamiento.ejemplo.com/portadas/dune-pelicula.jpg",
  "generos": ["ciencia ficción", "aventura"],
  "anio_estreno": 2021,
  "duracion_min": 155,
  "plataformas": [
    { "nombre": "Plataforma A" },
    { "nombre": "Plataforma B" }
  ],
  "datos_tecnicos": {
    "idioma_original": "inglés",
    "paises": ["Estados Unidos", "Canadá"],
    "productoras": ["Legendary Pictures", "Warner Bros. Pictures"],
    "clasificacion": "PG-13"
  },
  "reparto": [
    {
      "persona_id": "d1e2f3a4-0001-4b5c-8d6e-7f8a9b0c1d21",
      "nombre": "Timothée Chalamet",
      "personaje": "Paul Atreides",
      "orden": 1,
      "foto_url": "https://almacenamiento.ejemplo.com/personas/d1e2f3a4-0001-4b5c-8d6e-7f8a9b0c1d21.jpg"
    },
    {
      "persona_id": "d1e2f3a4-0002-4b5c-8d6e-7f8a9b0c1d22",
      "nombre": "Rebecca Ferguson",
      "personaje": "Lady Jessica",
      "orden": 2
    }
  ],
  "estado_publicacion": "publicada",
  "creado_en": "2026-11-19T10:05:00Z",
  "actualizado_en": "2026-11-19T10:20:00Z"
}
```

`reparto` es la copia del grafo (`actuó_en` y el nodo `Persona`): AP-17 lo reemplaza completo. `foto_url` es opcional: la segunda actriz del ejemplo no tiene foto y su elemento no lleva el campo (D-27). Cada plataforma es solo su `nombre` (D-26). `portada_url` es la dirección del póster, fuera de la base y opcional (D-25). Al dar de alta una película, `reparto` empieza vacío (`[]`) y `estado_publicacion` en `borrador`; la API lo llena con AP-17 antes de publicar, porque una película publicada tiene al menos una persona en el reparto (D-24).

### 3.3 `resenas_comparativas`

```json
{
  "_id": "e7b19d44-2c6a-4d0f-a1b5-3e8c5f7a9d04",
  "usuario_id": "c4e2b7d9-1a3f-4c58-b6e0-7f9a2d3c4b03",
  "libro_id": "6f1d7a52-3c0e-4b8a-9a1e-0b2c4d5e6f01",
  "pelicula_id": "9a8c3e17-5b2d-4f60-8e3a-1c7d9b0a2f02",
  "veredicto": {
    "preferencia": "libro",
    "comentario": "La película es espectacular, pero el libro da más espacio a la política y a los personajes."
  },
  "aspectos": [
    { "nombre": "Fidelidad", "puntuacion": 4, "comentario": "Respeta la trama principal." },
    { "nombre": "Ritmo", "puntuacion": 3 },
    { "nombre": "Final", "comentario": "La película termina a mitad de la historia." },
    { "nombre": "Ambientación visual", "puntuacion": 5 }
  ],
  "oculta": false,
  "creado_en": "2026-11-19T11:00:00Z",
  "actualizado_en": "2026-11-19T11:00:00Z"
}
```

Muestra que `puntuacion` y `comentario` de un aspecto son opcionales, y que el usuario puede nombrar aspectos nuevos y elegir cuántos poner (RF-16). El usuario aparece solo por su `usuario_id`: su nombre vive en el relacional.

## 4. Qué va dentro del documento y qué va aparte

Resuelve, con las respuestas de `02-relaciones.md`, cada relación en estas colecciones.

| Dato | Decisión | Relación | Por qué |
|---|---|---|---|
| `ediciones` en `libros` | Embebido | R-01 | Se lee con la ficha, casi no cambia, solo es de ese libro y tiene tope natural |
| `generos` | Embebido (arreglo de textos) | R-02 | Es solo texto. El vocabulario permitido lo valida la API, no el esquema |
| `plataformas` en `peliculas` | Embebido, identificadas por `nombre` | R-03, D-08 | Se leen con la ficha y nada fuera de la película las referencia |
| `portada_url` en `libros` y `peliculas` | Campo simple opcional con la URL de la imagen | D-25 | La imagen vive en el almacenamiento en la nube y no en la base. Se lee con la ficha y solo es de esa obra |
| `datos_tecnicos` | Subdocumento embebido | R-04 | Se lee con la ficha. `paises` y `productoras` son listas cortas de texto |
| `reparto` | Embebido como copia del grafo (con la foto de cada actor) | R-05, D-27 | Permite leer la ficha completa en una lectura (RNF-04), con nombre y foto de cada actor. Se regenera desde el grafo si cambia |
| `veredicto` y `aspectos` | Embebidos en la comparativa | R-11, R-12 | Se leen como una unidad y solo cambian cuando el autor edita la comparativa |
| Comparativas | Colección propia, no dentro de libro, película ni usuario | R-13, R-15 | Crecen sin tope y se piden aparte y paginadas |
| `usuario_id`, `libro_id` y `pelicula_id` en la comparativa | Referencia por id | R-14, R-16 | El nombre del usuario y los títulos de las obras se completan al mostrar (AP-21 y AP-04); copiarlos obligaría a sincronizarlos |
| Autor, director, adaptación | No se guardan | R-06, R-07, R-08 | Viven en el grafo (`../fuente-de-verdad.md`, D4 y D5) |
| Promedio y reseñas individuales | No se guardan | R-09, R-10 | Cambian con cada reseña y viven en el relacional (D3) |
| Libros y películas | Dos colecciones separadas, no una sola `obras` | | Sus campos difieren: el libro tiene ediciones y la película, plataformas, datos técnicos y reparto. Una sola colección mezclaría ambos y dejaría campos vacíos |

## 5. Cobertura de los patrones de acceso

Cada uno de los 30 patrones activos de `01-patrones-de-acceso.md` cae en una colección. AP-06, AP-22 y AP-31 están retirados.

| Colección | Patrones | Cantidad |
|---|---|---|
| `libros` (solo) | AP-01, AP-07, AP-11, AP-12, AP-13 | 5 |
| `peliculas` (solo) | AP-02, AP-08, AP-14, AP-15, AP-16, AP-17, AP-32 | 7 |
| `libros` y `peliculas` | AP-03, AP-04, AP-05, AP-09, AP-10, AP-29, AP-30 | 7 |
| `resenas_comparativas` | AP-18, AP-19, AP-20, AP-21, AP-23, AP-24, AP-25, AP-26, AP-27, AP-28, AP-33 | 11 |

## 6. Decisiones confirmadas

| # | Decisión | Alternativas descartadas | Dónde afecta |
|---|---|---|---|
| 1 | El identificador de cada documento es el propio `_id` (el `obra_id` o el `comparativa_id`), un UUID guardado como texto. Así AP-01, AP-02, AP-05 y AP-20 buscan por clave sin índice extra. En `resenas_comparativas`, la unicidad de RN-05 la da un índice único sobre (`usuario_id`, `libro_id`, `pelicula_id`) | `_id` autogenerado con un campo `obra_id` aparte (dos ids por documento y un índice extra); UUID binario (depende de la configuración del controlador y un error genera ids que no coinciden con los de las otras bases); `_id` compuesto en las comparativas (toda operación por id necesitaría los tres valores) | Las tres colecciones |
| 2 | `puntuacion` de un aspecto es un entero de 1 a 5, como las reseñas individuales | — | `resenas_comparativas` |
| 3 | `persona_id` es un UUID generado por la API, guardado como texto. Cada elemento del reparto copia `persona_id`, `nombre`, `personaje` y `orden`, y la `foto_url` de la persona cuando tiene una (D-27). El grafo deberá guardar ese id como propiedad del nodo `Persona` (D-15), con restricción de unicidad para que `MERGE` sea idempotente | El id interno del motor de grafo (no es estable y ata el documental al motor); el `nombre` como clave (homónimos); un id externo (el catálogo es propio); copiar solo el `persona_id` y pedir el nombre al grafo (cada lectura de ficha dependería del grafo y se pierde RNF-04) | `peliculas.reparto` y el modelo del grafo (`../grafo/`) |
| 4 | Las fechas se guardan como fecha y hora en UTC | — | `creado_en` y `actualizado_en` |
| 5 | El orden de `ediciones`, `plataformas` y `aspectos` no tiene significado. El de `reparto` lo da `orden` | — | Las tres colecciones |

**Consecuencia para el grafo.** Cuando se documente el grafo, el nodo `Persona` debe llevar `persona_id` con restricción de unicidad, y el script de reconciliación compara el reparto del documental contra `actuó_en` por ese id. Si cambia la foto de una persona (CG-24), o algún día su nombre, hay que regenerar el reparto de todas sus películas (D-27). Esas películas se localizan en el grafo (CG-25), así que no hace falta un índice sobre `reparto.persona_id`.

## 7. Siguiente paso

La validación de cada colección está en `04-validacion.md` y los índices en `05-indices.md`: búsqueda por título, unicidad (usuario, libro, película) de RN-05 e ISBN único *sparse* (D-08).
