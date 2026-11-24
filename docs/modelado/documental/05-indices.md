# Documental, paso 5: índices

Define los índices de la base documental (MongoDB) y justifica cada uno. Los patrones de acceso están en `01-patrones-de-acceso.md`, las colecciones en `03-colecciones.md` y las reglas de validación en `04-validacion.md`.

**Criterio:** un índice se crea solo si un patrón de acceso lo usa o si una unicidad lo exige. Cada índice acelera lecturas y encarece las escrituras de su colección, así que lo que ningún patrón consulta no se indexa (sección 4). Es el mismo criterio del modelo relacional.

Los índices y los planes de consulta de este archivo se probaron contra MongoDB 9.0.4 (sección 7).

## 1. Índices que ya existen

Cada colección tiene un índice sobre `_id` que MongoDB crea por sí mismo. Como `_id` es el identificador de la obra o de la comparativa (D-11), sirve a casi todas las lecturas y escrituras por clave.

| Colección | Patrones que sirve |
|---|---|
| `libros` | AP-01 (ficha), AP-04 (varias obras por `$in`), AP-05, AP-09, AP-10, AP-11, AP-12 y AP-13 (se localiza el libro por `_id` y la edición dentro del documento por `edicion_id`) |
| `peliculas` | AP-02 (ficha), AP-04, AP-05, AP-09, AP-10, AP-14, AP-15, AP-16 y AP-17 (se localiza la película por `_id` y la plataforma dentro del documento por `nombre`) |
| `resenas_comparativas` | AP-20 (por id) y AP-24, AP-25, AP-26 y AP-27 (por `_id`, con `usuario_id` como condición adicional en las del autor) |

## 2. Índices que se crean

| # | Índice | Colección (campos) | Tipo |
|---|---|---|---|
| IX-01 | `ix_libros_titulo_texto` | `libros` (`titulo`) | Texto |
| IX-02 | `ix_peliculas_titulo_texto` | `peliculas` (`titulo`) | Texto |
| IX-03 | `ix_libros_isbn` | `libros` (`ediciones.isbn`) | Único, *sparse* |
| IX-04 | `ix_comp_unica` | `resenas_comparativas` (`usuario_id`, `libro_id`, `pelicula_id`) | Único |
| IX-05 | `ix_comp_adaptacion` | `resenas_comparativas` (`libro_id`, `pelicula_id`, `creado_en` descendente) | No único |

### IX-01 e IX-02: búsqueda por título

- **Patrones:** AP-03 (buscar obras por título, RF-05). La API consulta las dos colecciones y junta los resultados.
- **Por qué:** sin índice, cada búsqueda recorrería todas las fichas. MongoDB solo admite un índice de texto por colección, así que cada una lleva el suyo, sobre `titulo`.
- **Idioma:** se crea con `default_language: "none"`. Los títulos están en varios idiomas y así no se aplican reglas de un solo idioma (palabras vacías y raíces) que harían fallar algunas búsquedas.
- **Qué encuentra:** palabras completas, sin distinguir mayúsculas ni tildes: buscar `dune` encuentra "Dune" y "Dúne: Parte Dos", y `juegos hambre` encuentra "Los juegos del hambre".
- **Qué no encuentra:** fragmentos de palabra. Buscar `dun` no devuelve nada. RF-05 no pide búsqueda a medida que se escribe; si se pidiera, habría que añadir un campo de búsqueda normalizado o un motor de búsqueda aparte.
- **El filtro de publicación:** la API añade `estado_publicacion = publicada` al buscar. No se crea un índice compuesto porque casi todas las fichas están publicadas y el filtro descarta pocas.

### IX-03: ISBN único entre libros

- **Patrones:** AP-07, AP-11 y AP-12 (cualquier escritura que ponga un ISBN). Si el ISBN ya está en otro libro, MongoDB rechaza la escritura con error de clave duplicada y la API responde "ISBN ya registrado".
- **Por qué es *sparse* y no parcial.** D-08 preveía un índice único parcial, pero no funciona con arreglos de subdocumentos. Se probó en MongoDB 9.0.4:

| Índice sobre `ediciones.isbn` | Dos libros que mezclan una edición con ISBN y otra sin él | Dos libros solo con ediciones sin ISBN | Mismo ISBN en dos libros |
|---|---|---|---|
| Único parcial (D-08, tal como se había previsto) | **El segundo falla** | Pasa | Falla |
| Único sin más | **El segundo falla** | **El segundo falla** | Falla |
| **Único *sparse* (elegido)** | Pasa | Pasa | Falla |

  El filtro parcial se evalúa por documento y no por edición, así que en un libro que lo cumple, sus ediciones sin ISBN quedan indexadas como nulo, y MongoDB solo admite un nulo en un índice único. El índice *sparse* no indexa las ediciones sin el campo. La corrección está anotada en D-08.
- **Lo que no cubre:** el mismo ISBN repetido dentro de un solo libro (el índice único solo compara entre documentos distintos). Lo evita la API con la actualización condicional de `04-validacion.md`, sección 5.
- **Requisito:** la API nunca guarda `isbn: null`; omite el campo cuando no hay ISBN (el validador exige texto de 13 dígitos).

### IX-04: una comparativa por usuario y pareja

- **Patrones:** AP-18 (publicar: impone RN-05) y AP-19 (consultar la comparativa de un usuario sobre una pareja).
- **Por qué:** la unicidad de RN-05 no puede ser el `_id` (D-11), así que la impone este índice único. La misma consulta de AP-19 usa el índice.
- **También ayuda a:** AP-23 (comparativas de un usuario), AP-28 (borrar las de un usuario) y AP-33 (usuarios con comparativas). Como el primer campo es `usuario_id`, las tres lo usan por prefijo. AP-33 se resuelve solo con el índice, sin leer documentos.

### IX-05: comparativas de una adaptación

- **Patrones:** AP-21 (listar las comparativas de una pareja libro–película, más recientes primero).
- **Por qué:** filtra por `libro_id` y `pelicula_id` y ordena por `creado_en`. El índice entrega los resultados ya ordenados, sin ordenar en memoria. La condición `oculta = false` se comprueba sobre los pocos documentos resultantes.
- **Mantenimiento:** ninguno de sus campos cambia nunca (los ids y `creado_en` son inmutables), así que editar, ocultar o moderar una comparativa no obliga a actualizarlo.

## 3. Cobertura de los patrones de acceso

| Patrón | Índice que usa |
|---|---|
| AP-01, AP-02, AP-04, AP-05, AP-08, AP-09, AP-10 | `_id` |
| AP-03 | IX-01 e IX-02 |
| AP-07, AP-11, AP-12 | `_id` y IX-03 (para rechazar un ISBN ajeno) |
| AP-13, AP-14, AP-15, AP-16, AP-17 | `_id` |
| AP-18, AP-19 | IX-04 |
| AP-20, AP-24, AP-25, AP-26, AP-27 | `_id` |
| AP-21 | IX-05 |
| AP-23, AP-28, AP-33 | IX-04 (prefijo `usuario_id`) |
| AP-29, AP-30, AP-32 | Ninguno: recorren la colección (sección 4) |

Los 30 patrones activos aparecen una vez.

## 4. Índices que se decidió no crear

| Candidato | Por qué no |
|---|---|
| `resenas_comparativas` (`usuario_id`, `creado_en`) | AP-23 pide las comparativas de un usuario de más nueva a más antigua. IX-04 ya encuentra las de un usuario por prefijo; ordenarlas en memoria es insignificante porque cada usuario tiene pocas. Mismo razonamiento que D-06. Se agregaría si los usuarios acumularan muchas |
| `resenas_comparativas` (`libro_id`) o (`pelicula_id`) solos | Solo los usaba AP-22, que se retiró. IX-05 ya cubre un `libro_id` por prefijo |
| `libros` y `peliculas` (`estado_publicacion`) | AP-29 recorre todas las fichas publicadas, y AP-30 busca los pocos borradores en un script periódico sobre un catálogo acotado. Si el script se volviera lento, bastaría un índice parcial sobre `creado_en` solo para los borradores |
| `generos` | No hay patrón que filtre por género (consulta descartada en `01-patrones-de-acceso.md`) |
| `anio_estreno` y `anio_publicacion_original` | No hay patrón que ordene o filtre por año |
| `peliculas` (`reparto.persona_id`) | No hay patrón del documental que busque las películas de una persona. Si cambia la foto o el nombre de una persona, esas películas se localizan en el grafo (CG-25), no aquí (D-12, D-27) |
| `resenas_comparativas` (`oculta`) | La moderación actúa sobre una comparativa concreta (AP-26 y AP-27); no hay cola de pendientes |
| `ediciones.edicion_id` y `plataformas.nombre` | Se localizan dentro de un documento ya encontrado por `_id`. La unicidad del nombre la comprueba la API |
| Texto en sinopsis o en aspectos | Ningún patrón busca ahí |

## 5. Costo de escritura

| Colección | Índices además de `_id` | Escrituras frecuentes |
|---|---|---|
| `libros` | IX-01, IX-03 | Pocas: alta y corrección de fichas |
| `peliculas` | IX-02 | Pocas: alta y corrección de fichas, y el reparto |
| `resenas_comparativas` | IX-04, IX-05 | Publicar, editar y moderar comparativas |

El volumen es el de un proyecto académico y las lecturas son más frecuentes que las escrituras, así que el costo es aceptable.

## 6. Cómo verificar que se usan

Al implementar, cada consulta debe revisarse con `explain()` para comprobar que usa el índice esperado y no un recorrido completo.

| Consulta | Índice esperado | Resultado en la prueba |
|---|---|---|
| Libro o película por `_id` (AP-01, AP-02) | `_id` | Usa `_id` |
| Varias obras por una lista de ids (AP-04) | `_id` | Usa `_id` |
| Comparativa por `_id` (AP-20) | `_id` | Usa `_id` |
| Búsqueda por título (AP-03) | IX-01, IX-02 | Usa el índice de texto |
| ISBN existente en otro libro (AP-11) | IX-03 | Usa IX-03 |
| Comparativa de un usuario sobre una pareja (AP-19) | IX-04 | Usa IX-04 |
| Comparativas de una adaptación, recientes primero (AP-21) | IX-05 | Usa IX-05 |
| Comparativas de un usuario (AP-23) y borrado por usuario (AP-28) | IX-04 | Usa IX-04 |
| Usuarios con comparativas (AP-33) | IX-04 | Recorre solo el índice, sin leer documentos |

## 7. Pruebas de índices

Se ejecutaron en MongoDB 9.0.4; todas dieron el resultado esperado.

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Insertar un libro con un ISBN que ya tiene otro libro | Rechazo por clave duplicada (IX-03) |
| 2 | Insertar dos libros que tienen cada uno una edición con ISBN y otra sin él | Aceptados |
| 3 | Insertar dos libros cuyas ediciones no tienen ISBN, y dos libros sin ediciones | Aceptados |
| 4 | Agregar a un libro, con una actualización, un ISBN que ya tiene otro libro | Rechazo por clave duplicada |
| 5 | Insertar una segunda comparativa del mismo usuario sobre la misma pareja | Rechazo por clave duplicada (RN-05, IX-04) |
| 6 | Insertar una comparativa de otro usuario sobre la misma pareja | Aceptada |
| 7 | Buscar `dune`, `DUNE` y `juegos hambre` con el índice de texto | Encuentran las obras con esas palabras, sin distinguir mayúsculas ni tildes |
| 8 | Buscar `dun` (parte de una palabra) | Sin resultados (limitación conocida de IX-01 e IX-02) |
| 9 | Pedir el plan de cada consulta de la sección 6 | Usa el índice indicado |

## 8. Cómo crearlos

```js
db.libros.createIndex({ titulo: "text" }, { name: "ix_libros_titulo_texto", default_language: "none" });
db.peliculas.createIndex({ titulo: "text" }, { name: "ix_peliculas_titulo_texto", default_language: "none" });

db.libros.createIndex({ "ediciones.isbn": 1 }, { name: "ix_libros_isbn", unique: true, sparse: true });

db.resenas_comparativas.createIndex(
  { usuario_id: 1, libro_id: 1, pelicula_id: 1 },
  { name: "ix_comp_unica", unique: true }
);
db.resenas_comparativas.createIndex(
  { libro_id: 1, pelicula_id: 1, creado_en: -1 },
  { name: "ix_comp_adaptacion" }
);
```
