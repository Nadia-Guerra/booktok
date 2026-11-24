# Documental, paso 4: validación

Documenta las reglas que la base documental (MongoDB) impone por sí misma sobre `libros`, `peliculas` y `resenas_comparativas`, y las que quedan en la API. Los campos están en `03-colecciones.md`; los índices, incluidas las unicidades, en `05-indices.md`; los patrones de acceso en `01-patrones-de-acceso.md`.

Las reglas de esta página se probaron contra MongoDB 9.0.4 (sección 7). Los límites numéricos y de longitud, y qué campos son obligatorios, están confirmados por el equipo (sección 6).

## 1. Resumen: qué regla impone qué mecanismo

| Regla | Mecanismo | Sección |
|---|---|---|
| Campos obligatorios, tipos y rangos de cada documento | Validador `$jsonSchema` de la colección | 3 |
| Sin campos desconocidos, tampoco dentro de ediciones, plataformas, reparto y aspectos | `additionalProperties: false` del validador | 4 |
| Ids en formato UUID canónico (minúsculas) | `pattern` del validador | 2 |
| `estado_publicacion` solo `borrador` o `publicada` | `enum` del validador | 3 |
| Puntuación de un aspecto de 1 a 5 (D-13) | Rango del validador | 3 |
| RN-05 una comparativa por usuario y pareja libro–película | Índice único (`05-indices.md`, IX-04) | |
| ISBN único entre libros (D-08) | Índice único *sparse* (`05-indices.md`, IX-03) | |
| ISBN, plataforma o aspecto repetido dentro del mismo documento | API, con actualización condicional | 5 |
| Que el usuario, el libro, la película y la relación `adaptado_a` existan antes de crear una comparativa (RN-06) | API | 5 |
| RN-09 y RN-10 permisos por rol y propiedad | API | 5 |
| Atomicidad de cada escritura sobre un documento (RNF-01) | MongoDB: toda escritura sobre un documento es atómica, también las de arreglos anidados | |

## 2. Convenciones de validación

| Convención | Regla |
|---|---|
| UUID | Texto en minúsculas con el formato `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`. La API genera los UUID en minúsculas. Como los ids se comparan como texto entre bases, una mayúscula los volvería distintos (mismo criterio que el correo en minúsculas, D-03) |
| ISBN | Solo 13 dígitos, sin guiones ni espacios (`^[0-9]{13}$`). La API normaliza (quita guiones, convierte ISBN-10 a ISBN-13) y comprueba el dígito de control; el esquema solo exige el formato |
| Enteros | `int` o `long`. El cliente debe enviar enteros; un valor decimal como `4.0` se rechaza |
| Textos | Longitud mínima 1 en todos los textos obligatorios y en los opcionales, de modo que un texto vacío nunca se guarda: si no hay valor, el campo se omite |
| URL de portada (`portada_url`, D-25) | Debe empezar por `https://` y no tener espacios (`^https://\S+$`). La API comprueba que sea una dirección bien formada; el esquema solo exige el formato. La imagen no se guarda en la base |
| Fechas | Tipo fecha (`date`) de MongoDB, en UTC (D-13) |

## 3. Reglas por colección

Los valores de longitud y rango están en la sección 6.

### 3.1 `libros`

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `_id` | texto | Sí | UUID |
| `titulo` | texto | Sí | 1 a 200 caracteres |
| `sinopsis` | texto | Sí | 1 a 3000 caracteres |
| `portada_url` | texto | No | Hasta 500 caracteres, empieza por `https://` (D-25) |
| `generos` | arreglo de texto | Sí | De 1 a 5 elementos, sin repetidos, cada uno de 1 a 40 caracteres. El vocabulario permitido lo valida la API |
| `anio_publicacion_original` | entero | Sí | De -3000 a 2100 (los negativos son años a. C.) |
| `ediciones` | arreglo | Sí | Hasta 50 elementos; puede estar vacío |
| `ediciones[].edicion_id` | texto | Sí | UUID |
| `ediciones[].isbn` | texto | No | 13 dígitos |
| `ediciones[].paginas` | entero | Sí | De 1 a 10000 |
| `ediciones[].editorial` | texto | Sí | 1 a 100 caracteres |
| `ediciones[].idioma` | texto | Sí | 1 a 40 caracteres |
| `ediciones[].anio` | entero | Sí | De 1 a 2100 |
| `estado_publicacion` | texto | Sí | `borrador` o `publicada` |
| `creado_en` | fecha | Sí | |
| `actualizado_en` | fecha | Sí | |

### 3.2 `peliculas`

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `_id` | texto | Sí | UUID |
| `titulo` | texto | Sí | 1 a 200 caracteres |
| `sinopsis` | texto | Sí | 1 a 3000 caracteres |
| `portada_url` | texto | No | Hasta 500 caracteres, empieza por `https://` (D-25) |
| `generos` | arreglo de texto | Sí | De 1 a 5 elementos, sin repetidos, cada uno de 1 a 40 caracteres |
| `anio_estreno` | entero | Sí | De 1888 a 2100 |
| `duracion_min` | entero | Sí | De 1 a 1000 |
| `plataformas` | arreglo | Sí | Hasta 30 elementos; puede estar vacío |
| `plataformas[].nombre` | texto | Sí | 1 a 100 caracteres |
| `datos_tecnicos` | subdocumento | Sí | |
| `datos_tecnicos.idioma_original` | texto | Sí | 1 a 40 caracteres |
| `datos_tecnicos.paises` | arreglo de texto | Sí | De 1 a 10 elementos, sin repetidos, cada uno de 1 a 60 caracteres |
| `datos_tecnicos.productoras` | arreglo de texto | No | Hasta 20 elementos, sin repetidos, cada uno de 1 a 100 caracteres |
| `datos_tecnicos.clasificacion` | texto | No | 1 a 20 caracteres |
| `reparto` | arreglo | Sí | Hasta 300 elementos; vacío mientras la ficha es un borrador recién creado. Una ficha publicada tiene al menos uno (D-24); lo comprueba la API al publicar, no el validador |
| `reparto[].persona_id` | texto | Sí | UUID |
| `reparto[].nombre` | texto | Sí | 1 a 150 caracteres |
| `reparto[].personaje` | texto | Sí | 1 a 150 caracteres |
| `reparto[].orden` | entero | Sí | 1 o más |
| `reparto[].foto_url` | texto | No | Hasta 500 caracteres, empieza por `https://` (D-27). Copia de `Persona.foto_url` del grafo; si la persona no tiene foto, el campo no existe |
| `estado_publicacion` | texto | Sí | `borrador` o `publicada` |
| `creado_en` | fecha | Sí | |
| `actualizado_en` | fecha | Sí | |

### 3.3 `resenas_comparativas`

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `_id` | texto | Sí | UUID |
| `usuario_id` | texto | Sí | UUID |
| `libro_id` | texto | Sí | UUID |
| `pelicula_id` | texto | Sí | UUID |
| `veredicto` | subdocumento | Sí | |
| `veredicto.preferencia` | texto | Sí | `libro`, `pelicula` o `empate` |
| `veredicto.comentario` | texto | No | 1 a 2000 caracteres |
| `aspectos` | arreglo | Sí | De 1 a 10 elementos |
| `aspectos[].nombre` | texto | Sí | 1 a 60 caracteres |
| `aspectos[].puntuacion` | entero | No | De 1 a 5 |
| `aspectos[].comentario` | texto | No | 1 a 1000 caracteres |
| `oculta` | booleano | Sí | La API la crea en `false` (MongoDB no tiene valores por defecto) |
| `creado_en` | fecha | Sí | |
| `actualizado_en` | fecha | Sí | |

## 4. Cómo se aplica

- Cada colección se crea con su validador, con `validationLevel: "strict"` y `validationAction: "error"`. Así el validador comprueba tanto las inserciones como las actualizaciones, y un documento inválido se rechaza en vez de guardarse con un aviso. La definición completa está en la sección 8.
- **No se aceptan campos desconocidos** (`additionalProperties: false`), ni en la raíz ni en los subdocumentos. Un error de escritura en el nombre de un campo se rechaza en vez de guardarse en silencio. Si algún día hace falta un campo nuevo, se agrega al validador con `collMod`, sin migrar los documentos existentes.
- **RF-09 sigue cumpliéndose sin cambiar el esquema.** Agregar una edición o una plataforma es agregar un elemento a un arreglo que el validador ya permite; no se modifica el validador.
- La API calcula `actualizado_en` y los demás campos de control; ninguna escritura del usuario los fija directamente.

## 5. Reglas que la base no puede imponer

| Regla | Dónde se cumple | Cómo se verifica |
|---|---|---|
| ISBN repetido dentro del mismo libro (el índice único solo compara entre documentos distintos) | API: la actualización de AP-11 (agregar) lleva el filtro `{_id, "ediciones.isbn": {$ne: isbn}}`. La de AP-12 (corregir), cuando cambia el `isbn`, lleva el mismo filtro más `"ediciones.edicion_id": edicion_id`, y modifica el elemento con `arrayFilters`. Si no modifica ningún documento, se rechaza. Si el `isbn` enviado es el que la edición ya tiene, la API no lo incluye en la corrección | Pruebas 15, 18 y 19 |
| Plataforma repetida dentro de la misma película (D-08) | API: igual. AP-14 (agregar) lleva el filtro `{_id, "plataformas.nombre": {$ne: nombre}}`. AP-15 (corregir) lleva el mismo filtro con el nombre nuevo y modifica el elemento con `arrayFilters` por el nombre actual. Como la plataforma es solo su nombre (D-26), corregirla siempre es cambiar el nombre y siempre lleva el filtro | Pruebas 16, 20 y 21 |
| Aspectos con el mismo nombre dentro de una comparativa | API, antes de guardar (compara sin distinguir mayúsculas) | Prueba de la API |
| Dígito de control del ISBN, conversión de ISBN-10 a ISBN-13 y quitar guiones | API | Prueba de la API |
| Vocabulario permitido de `generos` | API (lista única de configuración) | Prueba de la API |
| `orden` sin repetidos dentro del reparto | API, al regenerar el reparto desde el grafo (AP-17) | Prueba de la API y reconciliación |
| El usuario, el libro y la película de una comparativa existen, y la pareja tiene `adaptado_a` (RN-06) | API, antes de AP-18: consulta al relacional, al documental (AP-05) y al grafo | Prueba de la API. MongoDB no tiene claves foráneas |
| RN-09 solo el Admin modifica el catálogo; RN-10 solo el autor edita o borra su comparativa | API: comprueba el rol y filtra AP-24 y AP-25 por `_id` y `usuario_id` de la sesión | Prueba de la API |
| `_id`, `usuario_id`, `libro_id`, `pelicula_id` y `creado_en` no cambian nunca | API: ninguna actualización los incluye. MongoDB ya impide cambiar `_id` | Prueba de la API |
| Una ficha publicada no vuelve a borrador | API: la única transición es AP-09, que filtra por `borrador` | Prueba de la API |
| `actualizado_en` no es anterior a `creado_en` | API | Prueba de la API |
| Reparto igual al del grafo | Reconciliación (AP-32 y el punto 4 del script) | Script de reconciliación |

## 6. Valores confirmados

Confirmados por el equipo el 2026-11-19.

| # | Valor | Dónde afecta |
|---|---|---|
| 1 | `sinopsis`, `generos` y el año son obligatorios en las fichas. El estado `borrador` existe por la sincronización entre bases, no para guardar fichas a medio llenar | `libros`, `peliculas` |
| 2 | `productoras` y `clasificacion` son opcionales; `idioma_original` y `paises` son obligatorios | `peliculas.datos_tecnicos` |
| 3 | Longitudes: título 200, sinopsis 3000, comentario del veredicto 2000, comentario de un aspecto 1000, nombre de aspecto 60 | Las tres colecciones |
| 4 | Máximos: 5 géneros, 50 ediciones, 30 plataformas, 10 países, 20 productoras, 300 elementos de reparto, 10 aspectos | Las tres colecciones |
| 5 | Años: 1888 a 2100 para el estreno (primer filme conocido), -3000 a 2100 para la publicación original de un libro, 1 a 2100 para una edición | `anio_estreno`, `anio_publicacion_original`, `ediciones[].anio` |
| 6 | `duracion_min` de 1 a 1000 y `paginas` de 1 a 10000 | `peliculas`, `libros` |
| 7 | Una comparativa tiene al menos un aspecto (RF-16 habla de "elegir los aspectos a comparar") | `resenas_comparativas.aspectos` |
| 8 | `portada_url` es opcional, de hasta 500 caracteres y con `https://` (D-25). Una ficha puede publicarse sin portada | `libros`, `peliculas` |

## 7. Pruebas de validación

Cada fila es una prueba que debe ejecutarse sobre la base. Se ejecutaron en MongoDB 9.0.4 con los tres validadores de la sección 8 y los tres documentos de ejemplo de `03-colecciones.md` (las pruebas 18 a 21 sobre el índice `ix_libros_isbn` de `05-indices.md`); todas dieron el resultado esperado. Las pruebas 22 a 24, del campo `portada_url` (D-25), se ejecutaron después, el 2026-11-21, en MongoDB 9.0.4, con el validador de la sección 8 ya actualizado; dieron el resultado esperado, y un campo no definido (por ejemplo `foto`) siguió rechazándose. Tras quitar la `url` de las plataformas (D-26), el mismo día se volvieron a ejecutar los ejemplos de `03-colecciones.md` y las pruebas 1, 7, 9, 12, 16, 20, 21 y 22 a 24 con el validador actualizado, y todas dieron el resultado esperado. Las pruebas 25 y 26, de `reparto[].foto_url` (D-27), se ejecutaron el mismo día con el validador de la sección 8 actualizado y los ejemplos de `03-colecciones.md` (el reparto con una actriz sin foto); dieron el resultado esperado y las anteriores se repitieron sin cambios.

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Insertar el documento de ejemplo de cada colección | Aceptado |
| 2 | Insertar un libro sin `titulo`, una película sin `datos_tecnicos.paises` y una comparativa sin `usuario_id` | Rechazo por campo obligatorio |
| 3 | Insertar un `_id` en mayúsculas y un reparto con `persona_id` inválido | Rechazo por formato de UUID |
| 4 | Insertar una ficha con `estado_publicacion` distinto de `borrador` y `publicada` | Rechazo por `enum` |
| 5 | Insertar un libro con `generos` vacío y otro con géneros repetidos | Rechazo |
| 6 | Insertar un año fuera de rango (libro con 3000, película con 1700) y una duración de 0 | Rechazo por rango |
| 7 | Insertar un libro con un campo no definido, y agregar una edición con un campo no definido | Rechazo por campo desconocido |
| 8 | Insertar una edición con ISBN con guiones | Rechazo por formato |
| 9 | Insertar una edición sin `paginas`, una plataforma sin `nombre` o con un campo `url` (ya no existe, D-26), y un reparto con `orden` 0 | Rechazo |
| 10 | Insertar una comparativa con puntuación 0 o 6, con preferencia `ambas`, sin aspectos, con 11 aspectos, con `oculta` como texto y con un comentario vacío | Rechazo |
| 11 | Insertar un libro sin ediciones, una película en `borrador` con reparto vacío y una película sin productoras ni clasificación | Aceptado |
| 12 | Agregar una edición válida a un libro y una plataforma válida a una película con `$push`, y reemplazar el reparto completo (RF-09, AP-17) | Aceptado, sin modificar el validador |
| 13 | Insertar una comparativa con un aspecto de nombre nuevo y sin puntuación | Aceptado (RF-16) |
| 14 | Ocultar una comparativa (AP-26) | Aceptado |
| 15 | Agregar a un libro una edición con un ISBN que ya tiene, usando el filtro condicional de la API | No modifica ningún documento (la API rechaza) |
| 16 | Agregar a una película una plataforma con un nombre que ya tiene, usando el filtro condicional de la API | No modifica ningún documento (la API rechaza) |
| 17 | Actualizar un documento válido dejándolo inválido (título vacío, puntuación 7) | Rechazo (el nivel estricto valida las actualizaciones) |
| 18 | Corregir el ISBN de una edición (AP-12) a uno que ya tiene otra edición del mismo libro, con el filtro condicional de la API | No modifica ningún documento (la API rechaza) |
| 19 | Corregir el ISBN de una edición (AP-12) a uno libre, y corregir otro campo de la edición sin filtro de ISBN | Aceptado. Corregir el ISBN a uno que ya tiene otro libro lo rechaza el índice único (error de clave duplicada) |
| 20 | Renombrar una plataforma (AP-15) a un nombre que ya tiene la película, con el filtro condicional de la API | No modifica ningún documento (la API rechaza) |
| 21 | Renombrar una plataforma (AP-15) a un nombre libre | Aceptado |
| 22 | Insertar un libro y una película con `portada_url` válida, y sin `portada_url` | Aceptado |
| 23 | Insertar un libro o una película con `portada_url` que empiece por `http://`, vacía, con espacios, o de más de 500 caracteres | Rechazo |
| 24 | Agregar `portada_url` a una ficha existente (AP-10) y quitarla después con `$unset` | Aceptado |
| 25 | Insertar una película con reparto donde un actor lleva `foto_url` válida y otro no la lleva, y reemplazar el reparto completo con otro que cambia o quita una foto (AP-17) | Aceptado |
| 26 | Insertar un reparto con `foto_url` que empiece por `http://`, vacía, con espacios o de más de 500 caracteres | Rechazo |

## 8. Definición de los validadores

Es el código que se probó. Se ejecuta con `mongosh` y crea las tres colecciones.

```js
const UUID = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
const INT = ["int", "long"];
const texto = (min, max) => ({ bsonType: "string", minLength: min, maxLength: max });
const listaTextos = (minItems, maxItems, max) => ({
  bsonType: "array", minItems, maxItems, uniqueItems: true, items: texto(1, max)
});
const urlImagen = { bsonType: "string", maxLength: 500, pattern: "^https://\\S+$" };

const libros = {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "titulo", "sinopsis", "generos", "anio_publicacion_original", "ediciones",
               "estado_publicacion", "creado_en", "actualizado_en"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "string", pattern: UUID },
      titulo: texto(1, 200),
      sinopsis: texto(1, 3000),
      portada_url: urlImagen,
      generos: listaTextos(1, 5, 40),
      anio_publicacion_original: { bsonType: INT, minimum: -3000, maximum: 2100 },
      ediciones: {
        bsonType: "array", maxItems: 50,
        items: {
          bsonType: "object",
          required: ["edicion_id", "paginas", "editorial", "idioma", "anio"],
          additionalProperties: false,
          properties: {
            edicion_id: { bsonType: "string", pattern: UUID },
            isbn: { bsonType: "string", pattern: "^[0-9]{13}$" },
            paginas: { bsonType: INT, minimum: 1, maximum: 10000 },
            editorial: texto(1, 100),
            idioma: texto(1, 40),
            anio: { bsonType: INT, minimum: 1, maximum: 2100 }
          }
        }
      },
      estado_publicacion: { enum: ["borrador", "publicada"] },
      creado_en: { bsonType: "date" },
      actualizado_en: { bsonType: "date" }
    }
  }
};

const peliculas = {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "titulo", "sinopsis", "generos", "anio_estreno", "duracion_min", "plataformas",
               "datos_tecnicos", "reparto", "estado_publicacion", "creado_en", "actualizado_en"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "string", pattern: UUID },
      titulo: texto(1, 200),
      sinopsis: texto(1, 3000),
      portada_url: urlImagen,
      generos: listaTextos(1, 5, 40),
      anio_estreno: { bsonType: INT, minimum: 1888, maximum: 2100 },
      duracion_min: { bsonType: INT, minimum: 1, maximum: 1000 },
      plataformas: {
        bsonType: "array", maxItems: 30,
        items: {
          bsonType: "object",
          required: ["nombre"],
          additionalProperties: false,
          properties: {
            nombre: texto(1, 100)
          }
        }
      },
      datos_tecnicos: {
        bsonType: "object",
        required: ["idioma_original", "paises"],
        additionalProperties: false,
        properties: {
          idioma_original: texto(1, 40),
          paises: listaTextos(1, 10, 60),
          productoras: listaTextos(0, 20, 100),
          clasificacion: texto(1, 20)
        }
      },
      reparto: {
        bsonType: "array", maxItems: 300,
        items: {
          bsonType: "object",
          required: ["persona_id", "nombre", "personaje", "orden"],
          additionalProperties: false,
          properties: {
            persona_id: { bsonType: "string", pattern: UUID },
            nombre: texto(1, 150),
            personaje: texto(1, 150),
            orden: { bsonType: INT, minimum: 1 },
            foto_url: urlImagen
          }
        }
      },
      estado_publicacion: { enum: ["borrador", "publicada"] },
      creado_en: { bsonType: "date" },
      actualizado_en: { bsonType: "date" }
    }
  }
};

const resenas_comparativas = {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "usuario_id", "libro_id", "pelicula_id", "veredicto", "aspectos", "oculta",
               "creado_en", "actualizado_en"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "string", pattern: UUID },
      usuario_id: { bsonType: "string", pattern: UUID },
      libro_id: { bsonType: "string", pattern: UUID },
      pelicula_id: { bsonType: "string", pattern: UUID },
      veredicto: {
        bsonType: "object",
        required: ["preferencia"],
        additionalProperties: false,
        properties: {
          preferencia: { enum: ["libro", "pelicula", "empate"] },
          comentario: texto(1, 2000)
        }
      },
      aspectos: {
        bsonType: "array", minItems: 1, maxItems: 10,
        items: {
          bsonType: "object",
          required: ["nombre"],
          additionalProperties: false,
          properties: {
            nombre: texto(1, 60),
            puntuacion: { bsonType: INT, minimum: 1, maximum: 5 },
            comentario: texto(1, 1000)
          }
        }
      },
      oculta: { bsonType: "bool" },
      creado_en: { bsonType: "date" },
      actualizado_en: { bsonType: "date" }
    }
  }
};

db.createCollection("libros", { validator: libros, validationLevel: "strict", validationAction: "error" });
db.createCollection("peliculas", { validator: peliculas, validationLevel: "strict", validationAction: "error" });
db.createCollection("resenas_comparativas", {
  validator: resenas_comparativas, validationLevel: "strict", validationAction: "error"
});
```
