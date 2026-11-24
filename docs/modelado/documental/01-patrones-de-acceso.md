# Documental, paso 1: patrones de acceso

Lista las lecturas y escrituras que el sistema hace sobre la base documental (MongoDB) de *Del Libro a la Pantalla*. Es el punto de partida del diseño: las colecciones, los documentos, las validaciones y los índices se deciden a partir de esta tabla, y no al revés.

Parte de `../matriz-responsabilidades.md` (columna Documental), `../fuente-de-verdad.md`, `../../requerimientos/levantamiento-requerimientos.md` y `../../decisiones_tomadas.md` (D-07, D-08, D-10 y D-18).

## 1. Alcance y convenciones

**Qué guarda esta base.** Las fichas de libros y películas y las reseñas comparativas, en las colecciones `libros`, `peliculas` y `resenas_comparativas`.

**Qué no guarda** (se completa en la API desde otras bases, ver sección 3): promedio y total de reseñas (relacional), autor y director (grafo) y nombre o perfil de los usuarios (relacional).

**Convenciones de la tabla**

| Columna | Significado |
|---|---|
| ID | `AP-nn`. Identifica el patrón de acceso; los números no se reutilizan |
| Operación | Qué hace el sistema, con el requerimiento que la origina |
| Usuario | **Visitante** (A3), **Lector** (A1), **Admin** (A2) o **Sistema** (procesos internos: sincronización, reconciliación y pasos internos de la API) |
| Tipo | **Lectura** o **Escritura**. Borrar también cuenta como escritura |
| Datos que requiere | En las lecturas: *Filtro* (con qué se busca) y *Devuelve* (qué campos necesita quien consulta). En las escrituras: *Filtro* (a quién afecta, si aplica) y *Recibe* (qué datos escribe) |

**Reglas que se aplican a todas las filas, sin repetirlas**
- Visitantes y lectores solo ven fichas con `estado_publicacion = publicada`. El administrador ve también los borradores.
- Visitantes y lectores no ven comparativas con `oculta = true` (excepción para el autor: supuesto 6).
- Toda escritura sobre una ficha actualiza `actualizado_en` (supuesto 1).
- Los nombres de los campos son los definidos en `03-colecciones.md`.
- El Admin ve también las comparativas ocultas (supuesto 6), por eso figura en AP-21 y AP-23.

## 2. Tabla de patrones de acceso

Los patrones se agrupan por rangos de ID:

| Rango | Grupo |
|---|---|
| AP-01 a AP-06 | Lecturas del catálogo (AP-06 retirado) |
| AP-07 a AP-17 | Escrituras del catálogo (administración y sincronización) |
| AP-18 a AP-28 | Reseñas comparativas (AP-22 retirado) |
| AP-29 a AP-33 | Reconciliación (AP-31 retirado, ver D-10) |

| ID | Operación | Usuario | Tipo | Datos que requiere |
|---|---|---|---|---|
| AP-01 | Consultar la ficha completa de un libro (RF-06) | Visitante, Lector, Admin | Lectura | **Filtro:** `obra_id`. **Devuelve:** `titulo`, `sinopsis`, `portada_url` (si tiene), `generos`, `anio_publicacion_original` y todas las `ediciones` (`edicion_id`, `isbn`, `paginas`, `editorial`, `idioma`, `anio`). La API adjunta el promedio desde `obra_resumen` |
| AP-02 | Consultar la ficha completa de una película (RF-07) | Visitante, Lector, Admin | Lectura | **Filtro:** `obra_id`. **Devuelve:** `titulo`, `sinopsis`, `portada_url` (si tiene), `generos`, `anio_estreno`, `duracion_min`, `plataformas`, `datos_tecnicos` (`idioma_original`, `paises`, `productoras`, `clasificacion`) y `reparto`. La API adjunta el promedio desde `obra_resumen` |
| AP-03 | Buscar obras por título (RF-05) | Visitante, Lector, Admin | Lectura | **Filtro:** texto escrito por el usuario, aplicado al `titulo` de libros y películas publicados (el Admin, también de los borradores). **Devuelve**, por resultado: `obra_id`, tipo (libro o película), `titulo`, año y `portada_url` (si tiene). La búsqueda por autor, director o actor la resuelve el grafo |
| AP-04 | Obtener los datos de presentación de varias obras a partir de sus ids (resultados de RF-23 a RF-27, obras de una lista de RF-20, obras de las reseñas y los estados) | Visitante, Lector | Lectura | **Filtro:** lista de `obra_id`. **Devuelve**, por obra: `obra_id`, tipo, `titulo`, año y `portada_url` (si tiene). Los ids los entrega el grafo o el relacional, que no guardan datos descriptivos |
| AP-05 | Verificar que una obra existe y en qué estado de publicación está (alta idempotente de RF-08, registrar relaciones de RF-10 y RF-11, validar las dos obras de una comparativa en RN-06) | Sistema | Lectura | **Filtro:** `obra_id` y la colección esperada (`libros` o `peliculas`). **Devuelve:** si existe y su `estado_publicacion` |
| AP-07 | Crear la ficha de un libro como borrador (RF-08) | Admin | Escritura | **Recibe:** `obra_id` (UUID generado por la API), `titulo`, `sinopsis`, `portada_url` (opcional), `generos`, `anio_publicacion_original`, `ediciones` (vacío o con la primera), `estado_publicacion = borrador`, `creado_en`, `actualizado_en` |
| AP-08 | Crear la ficha de una película como borrador (RF-08) | Admin | Escritura | **Recibe:** `obra_id` (UUID generado por la API), `titulo`, `sinopsis`, `portada_url` (opcional), `generos`, `anio_estreno`, `duracion_min`, `plataformas`, `datos_tecnicos`, `reparto` vacío (se llena desde el grafo, AP-17), `estado_publicacion = borrador`, `creado_en`, `actualizado_en` |
| AP-09 | Publicar una ficha: último paso del alta (RF-08). La API solo la ejecuta si el grafo devuelve al menos un autor y una adaptación (libro), o su libro de origen, al menos un director y una persona de reparto ya copiada a la ficha (película) (CG-03, CG-04, CG-05, CG-20, AP-17, D-24). Debe poder repetirse sin efecto | Sistema | Escritura | **Filtro:** `obra_id` con `estado_publicacion = borrador`. **Recibe:** `estado_publicacion = publicada` |
| AP-10 | Corregir los datos descriptivos de una ficha (RF-08) | Admin | Escritura | **Filtro:** `obra_id`. **Recibe:** solo los campos que cambian: `titulo`, `sinopsis`, `portada_url`, `generos`, `anio_publicacion_original` o `anio_estreno`, `duracion_min`, `datos_tecnicos`. El grafo no guarda el título (D-18), así que no hay nada que propagar |
| AP-11 | Agregar una edición a un libro, sin cambiar el esquema (RF-09) | Admin | Escritura | **Filtro:** `obra_id` del libro. **Recibe:** `edicion_id` (UUID generado por la API), `isbn` (opcional), `paginas`, `editorial`, `idioma`, `anio`. Se rechaza si el ISBN ya existe en otro libro o en el mismo |
| AP-12 | Corregir una edición de un libro (RF-08) | Admin | Escritura | **Filtro:** `obra_id` y `edicion_id`. **Recibe:** los campos de la edición que cambian. Se rechaza si el `isbn` nuevo ya existe en otro libro o en el mismo |
| AP-13 | Quitar una edición de un libro (RF-08, supuesto 4) | Admin | Escritura | **Filtro:** `obra_id` y `edicion_id` |
| AP-14 | Agregar una plataforma a una película, sin cambiar el esquema (RF-09) | Admin | Escritura | **Filtro:** `obra_id` de la película. **Recibe:** `nombre`. Se rechaza si el `nombre` ya está en esa película |
| AP-15 | Corregir el nombre de una plataforma de una película (RF-08) | Admin | Escritura | **Filtro:** `obra_id` y `nombre` actual de la plataforma. **Recibe:** el `nombre` nuevo. Se rechaza si el `nombre` nuevo ya está en esa película |
| AP-16 | Quitar una plataforma de una película (RF-08, supuesto 4) | Admin | Escritura | **Filtro:** `obra_id` y `nombre` de la plataforma |
| AP-17 | Reemplazar el reparto de la ficha con el que hay en el grafo (RF-10, copia G → D) | Sistema | Escritura | **Filtro:** `obra_id` de la película. **Recibe:** el arreglo `reparto` completo, `[{persona_id, nombre, personaje, orden, foto_url?}]`, leído del grafo (CG-20). También lo ejecuta la API cuando cambia la foto de una persona, en cada película donde actuó (CG-24, D-27) |
| AP-18 | Publicar una reseña comparativa (RF-16) | Lector | Escritura | **Recibe:** `comparativa_id` (UUID generado por la API), `usuario_id` (el de la sesión), `libro_id`, `pelicula_id`, `veredicto` (`preferencia`, `comentario` opcional), `aspectos` (`[{nombre, puntuacion?, comentario?}]`), `oculta = false`, `creado_en`, `actualizado_en`. Se rechaza si ya existe una del mismo usuario para esa pareja (RN-05). Antes, la API valida el usuario, las dos obras (AP-05) y la relación `adaptado_a` (RN-06) |
| AP-19 | Consultar la comparativa de un usuario sobre una pareja libro–película: saber si ya existe (RN-05) y abrirla para editarla | Lector | Lectura | **Filtro:** `usuario_id`, `libro_id` y `pelicula_id`. **Devuelve:** el documento completo |
| AP-20 | Consultar una comparativa concreta (RF-16, RF-17 y RF-18) | Visitante, Lector, Admin | Lectura | **Filtro:** `comparativa_id`. **Devuelve:** el documento completo. Las ocultas solo las ven su autor y el Admin (supuesto 6) |
| AP-21 | Listar las comparativas de una adaptación (pareja libro–película), más recientes primero | Visitante, Lector, Admin | Lectura | **Filtro:** `libro_id`, `pelicula_id`, y `oculta = false` salvo para el Admin, que ve también las ocultas; paginado. **Devuelve:** `comparativa_id`, `usuario_id`, `veredicto`, `aspectos`, `creado_en`. El nombre del autor lo agrega la API desde el relacional |
| AP-23 | Listar las comparativas de un usuario, más recientes primero (su perfil y "mis comparativas") | Lector, Admin | Lectura | **Filtro:** `usuario_id`, y `oculta = false` si quien consulta no es el propio autor ni el Admin; paginado. **Devuelve:** `comparativa_id`, `libro_id`, `pelicula_id`, `veredicto`, `creado_en` |
| AP-24 | Editar una comparativa propia (RF-17, RN-10) | Lector | Escritura | **Filtro:** `comparativa_id` y `usuario_id` = el de la sesión. **Recibe:** `veredicto`, `aspectos` y `actualizado_en`. No cambian `usuario_id`, `libro_id` ni `pelicula_id` |
| AP-25 | Eliminar una comparativa propia (RF-17, RN-10) | Lector | Escritura | **Filtro:** `comparativa_id` y `usuario_id` = el de la sesión |
| AP-26 | Ocultar o volver a mostrar una comparativa (RF-18) | Admin | Escritura | **Filtro:** `comparativa_id`. **Recibe:** `oculta` (verdadero o falso) |
| AP-27 | Eliminar una comparativa por moderación (RF-18) | Admin | Escritura | **Filtro:** `comparativa_id` |
| AP-28 | Eliminar todas las comparativas de un usuario al procesar `usuario_eliminado` (RF-04). Debe poder repetirse sin error | Sistema | Escritura | **Filtro:** `usuario_id` |
| AP-29 | Listar las fichas publicadas para compararlas con `obra_resumen` y con los nodos del grafo (RNF-03) | Sistema | Lectura | **Filtro:** `estado_publicacion = publicada`; se recorre por lotes. **Devuelve:** `obra_id` y tipo |
| AP-30 | Listar las fichas en borrador antiguas, es decir, altas incompletas que el script de reconciliación debe completar (RF-08, RNF-03, D-10) | Sistema | Lectura | **Filtro:** `estado_publicacion = borrador` y `creado_en` anterior a un umbral. **Devuelve:** `obra_id`, tipo y `creado_en` |
| AP-32 | Listar el reparto de todas las películas para compararlo con `actuó_en` del grafo (RNF-03) | Sistema | Lectura | **Filtro:** películas publicadas; por lotes. **Devuelve:** `obra_id` y `reparto` |
| AP-33 | Listar los usuarios que tienen comparativas, para detectar huérfanos (RNF-03) | Sistema | Lectura | **Filtro:** ninguno. **Devuelve:** los valores distintos de `usuario_id` |

**Resumen:** 30 patrones: 13 lecturas y 17 escrituras. Los números AP-06, AP-22 y AP-31 se retiraron (ver sección 4, D-10 y D-18) y no se reutilizan.

## 3. Qué se completa fuera del documental

Estos datos no están en las colecciones. La API los une a la respuesta o los comprueba antes de escribir.

| Patrón | Dato de otra base | Base | Para qué |
|---|---|---|---|
| AP-01, AP-02 | Promedio y total de reseñas (`obra_resumen`) | Relacional | Mostrar la calificación en la ficha |
| AP-03 | Búsqueda por autor, director o actor | Grafo | Completar RF-05 |
| AP-18 | Que el usuario existe | Relacional | Evitar comparativas de usuarios inexistentes |
| AP-18 | Que la pareja tiene relación `adaptado_a` | Grafo | RN-06 |
| AP-17 | Reparto de la película (`actuó_en`) | Grafo | Fuente de la copia |
| AP-21, AP-23 | Nombre del autor de cada comparativa | Relacional | Mostrar quién la escribió |

## 4. Consultas consideradas y descartadas

Mismo criterio que en el relacional: lo que ningún requerimiento consulta no se diseña. Si más adelante se añade alguna, se agrega su patrón y, si hace falta, su índice.

| Candidato | Por qué no |
|---|---|
| Filtrar el catálogo por género | Ningún RF lo pide. `generos` se guarda y se muestra, pero no se indexa |
| Explorar o listar el catálogo sin buscar | RF-05 es una búsqueda por título, autor, director o actor; no hay un listado general |
| Buscar un libro por ISBN | Ningún RF lo pide. La unicidad del ISBN se impone al escribir (AP-07 y AP-11), no al leer |
| Buscar texto en la sinopsis o en los aspectos de una comparativa | Ningún RF lo pide |
| Comparativas de las personas que sigo | RF-22 solo habla de perfiles, reseñas y listas. Se agregaría con los ids de seguidos que entrega el relacional |
| Cola de comparativas pendientes de moderar | Igual que con las reseñas en el relacional: el administrador actúa sobre una comparativa concreta (AP-26 y AP-27) |
| Estadísticas de preferencia por adaptación (cuántos prefieren el libro) | Ningún RF lo pide; sería una agregación sobre `veredicto.preferencia` |
| Ordenar o rankear obras por año | Ningún RF lo pide |
| Listar las comparativas en que interviene una obra, en todas sus adaptaciones (antes AP-22) | Ningún RF lo pide y AP-21 ya cubre cada adaptación. Se agregaría si la ficha de un libro mostrara las comparativas de todas sus adaptaciones |

## 5. Supuestos

| # | Supuesto | Dónde afecta |
|---|---|---|
| 1 | Las fichas llevan `creado_en` y `actualizado_en`, igual que la comparativa. Hace falta `creado_en` para detectar los borradores antiguos (AP-30, D-10) | AP-07 a AP-17, AP-30 |
| 2 | `comparativa_id` es un UUID generado por la API, como los demás ids. La unicidad de la comparativa sigue siendo (usuario, libro, película) | AP-18 a AP-27 |
| 3 | Las comparativas visibles las ven también los visitantes, igual que las reseñas en la ficha (RF-06 y RF-07 admiten a A3) | AP-20 y AP-21 |
| 4 | Quitar una edición o una plataforma entra en "corregir" de RF-08. RF-09 solo habla de agregarlas | AP-13 y AP-16 |
| 5 | Ocultar o mostrar una comparativa no modifica su `actualizado_en`, que solo registra las ediciones del autor | AP-26 |
| 6 | El autor ve sus propias comparativas aunque estén ocultas; los demás no. El administrador las ve todas, y por eso consulta también AP-21 y AP-23 sin el filtro `oculta`; así puede llegar a una comparativa oculta para volver a mostrarla (AP-26) | AP-20, AP-21, AP-23 |
| 7 | El umbral de antigüedad de un borrador antiguo no está definido; se fija al implementar (`../fuente-de-verdad.md`, punto 8 del script de reconciliación) | AP-30 |

## 6. Siguiente paso

Con esta tabla se diseña la estructura de cada colección (documentos, campos, qué va anidado y qué referenciado, validación) y después los índices, agrupando los patrones que filtran por los mismos campos.
