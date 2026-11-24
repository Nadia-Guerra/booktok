# Levantamiento de requerimientos: Del Libro a la Pantalla

Plataforma social de libros, películas y adaptaciones con persistencia políglota (relacional, documental y grafo).

## 1. Actores

| Clave | Actor | Descripción |
|---|---|---|
| A1 | Lector/espectador | Usuario registrado que consulta, reseña, organiza y sigue a otros |
| A2 | Administrador/curador | Mantiene el catálogo y modera contenido |
| A3 | Visitante | Usuario sin sesión; solo consulta el catálogo |

## 2. Requerimientos funcionales

Columna **BD**: R = relacional, D = documental, G = grafo.

### 2.1 Cuentas y perfiles

| ID | Requerimiento | Actor | BD |
|---|---|---|---|
| RF-01 | El sistema permitirá registrarse con correo y contraseña. | A3 | R |
| RF-02 | El sistema permitirá iniciar y cerrar sesión. | A1, A2 | R |
| RF-03 | El usuario podrá editar su perfil (nombre, biografía breve). | A1 | R |
| RF-04 | El usuario podrá eliminar su cuenta; se borrarán en cascada sus reseñas, listas, estados y seguimientos, y se limpiarán sus reseñas comparativas y sus nodos y relaciones en el grafo. | A1 | R, D, G |

### 2.2 Catálogo

| ID | Requerimiento | Actor | BD |
|---|---|---|---|
| RF-05 | El sistema permitirá buscar obras por título, autor, director o actor. | A1, A3 | D, G |
| RF-06 | El sistema mostrará la ficha de un libro con título, portada (si tiene), sinopsis, géneros, año de publicación original, sus ediciones (ISBN opcional, páginas, editorial, idioma, año) y su calificación promedio. | A1, A3 | D, R |
| RF-07 | El sistema mostrará la ficha de una película con título, portada (si tiene), sinopsis, géneros, año de estreno, duración, plataformas, datos técnicos (idioma original, países de origen, productoras y clasificación), reparto y calificación promedio. | A1, A3 | D, R, G |
| RF-08 | El administrador podrá dar de alta y corregir libros y películas. | A2 | D, R, G |
| RF-09 | El administrador podrá agregar una edición a un libro o una plataforma a una película, con campos propios de cada tipo, sin cambiar el esquema. | A2 | D |
| RF-10 | El administrador podrá registrar autores, directores y actores (con su foto, opcional), y sus relaciones con las obras (escribió, dirigida por, actuó en con personaje y orden). | A2 | G |
| RF-11 | El administrador podrá registrar que una película es adaptación de un libro. | A2 | G |

### 2.3 Reseñas y estados

| ID | Requerimiento | Actor | BD |
|---|---|---|---|
| RF-12 | El usuario podrá publicar una reseña (calificación y texto) de un libro o una película. | A1 | R |
| RF-13 | Al publicar una reseña, el sistema marcará la obra como "terminada" para ese usuario y actualizará el promedio de la obra en una sola transacción. | A1 | R |
| RF-14 | El usuario podrá editar y eliminar sus reseñas. | A1 | R |
| RF-15 | El usuario podrá marcar el estado de una obra: pendiente, en curso o terminada. | A1 | R |
| RF-16 | El usuario podrá publicar una reseña comparativa entre un libro y su adaptación, eligiendo los aspectos a comparar (fidelidad, ritmo, final, personajes u otros). Cada aspecto tiene nombre, puntuación opcional y comentario opcional; el usuario puede nombrar aspectos nuevos y cada comparativa puede tener un número distinto de aspectos. | A1 | D |
| RF-17 | El usuario podrá editar y eliminar sus reseñas comparativas. | A1 | D |
| RF-18 | El administrador podrá moderar (ocultar o eliminar) reseñas y reseñas comparativas. | A2 | R, D |

### 2.4 Listas

| ID | Requerimiento | Actor | BD |
|---|---|---|---|
| RF-19 | El usuario podrá crear, renombrar y eliminar listas. | A1 | R |
| RF-20 | El usuario podrá agregar y quitar obras (libros o películas) en una lista y ordenarlas. | A1 | R |

### 2.5 Red social

| ID | Requerimiento | Actor | BD |
|---|---|---|---|
| RF-21 | El usuario podrá seguir y dejar de seguir a otros usuarios. | A1 | R, G |
| RF-22 | El usuario podrá ver los perfiles, reseñas y listas de las personas que sigue. | A1 | R |

### 2.6 Adaptaciones, exploración y recomendaciones

| ID | Requerimiento | Actor | BD |
|---|---|---|---|
| RF-23 | El sistema mostrará las adaptaciones de un libro y el libro de origen de una película. | A1, A3 | G |
| RF-24 | El sistema mostrará el camino de conexión entre dos personas u obras (por ejemplo, de un autor a un actor a través de adaptaciones). | A1 | G |
| RF-25 | El sistema mostrará autores cuyos libros fueron adaptados por un mismo director. | A1 | G |
| RF-26 | El sistema recomendará libros a dos saltos de uno que le gustó al usuario (RN-11), mediante adaptaciones del mismo director. | A1 | R, G |
| RF-27 | El sistema recomendará películas basadas en libros que leyeron las personas que el usuario sigue. | A1 | G (proyección de R) |

## 3. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Un usuario solo puede tener una reseña por obra y (libro y película). |
| RN-02 | La calificación de una reseña debe estar en el rango válido (1 a 5). |
| RN-03 | Un usuario no puede seguirse a sí mismo ni seguir dos veces a la misma persona. |
| RN-04 | Una obra aparece una sola vez en cada lista. |
| RN-05 | Un usuario solo puede tener una reseña comparativa por pareja libro–película. |
| RN-06 | Una reseña comparativa solo puede hacerse entre un libro y una película vinculados por una relación de adaptación. |
| RN-07 | Toda película es adaptación de un solo libro de origen; un libro puede tener varias adaptaciones y, para publicarse, necesita al menos una (D-24). |
| RN-08 | El promedio de una obra siempre debe corresponder a sus reseñas vigentes. |
| RN-09 | Solo el administrador puede modificar el catálogo y las relaciones de autoría, dirección, reparto y adaptación. |
| RN-10 | Un usuario solo puede editar o eliminar sus propias reseñas, listas y comparativas. |
| RN-11 | Un libro "le gustó" al usuario cuando lo marcó como terminado y su reseña tiene calificación igual o mayor a 4 (escala de 1 a 5). Este criterio se aplica en RF-26. |

## 4. Requerimientos de datos

### 4.1 Relacional (fuente de verdad)

- Usuario, Reseña, Lista, ElementoDeLista, EstadoDeObra, Seguimiento.
- `ObraResumen` (id y tipo, libro o película, de cada obra; promedio y total de reseñas vigentes; dato derivado, misma transacción).
- `sync_outbox`: tabla técnica de eventos pendientes de propagar al grafo.
- `sesion`: tabla técnica de sesiones iniciadas; guarda solo el hash del token (D-35).
- Restricciones: claves únicas (RN-01, RN-03, RN-04), rangos (RN-02), claves foráneas con cascada (RF-04).

### 4.2 Documental

- Ficha de libro: título, sinopsis, portada (`portada_url?`, la dirección de una imagen guardada fuera de la base, D-25), géneros, año de publicación original y ediciones anidadas `[{edicion_id, isbn?, paginas, editorial, idioma, anio}]`. El ISBN es opcional y único entre libros cuando existe (D-08).
- Ficha de película: título, sinopsis, portada (`portada_url?`, D-25), géneros, año de estreno, duración, plataformas `[{nombre}]` (D-26), datos técnicos `{idioma_original, paises, productoras?, clasificacion?}` y copia de presentación del reparto `[{persona_id, nombre, personaje, orden, foto_url?}]` (D-12 y D-27).
- Cada ficha lleva `estado_publicacion` (borrador o publicada); solo las publicadas se muestran en el catálogo. También lleva `creado_en` y `actualizado_en`.
- Reseña comparativa: referencias a usuario, libro y película, veredicto `{preferencia: libro | película | empate, comentario?}` (D-07), un arreglo de aspectos variables `[{nombre, puntuacion? (1 a 5), comentario?}]`, el indicador `oculta` (RF-18) y `creado_en` y `actualizado_en`. Índice único compuesto (usuario, libro, película) (RN-05).
- Los identificadores de obra, comparativa, edición y persona son UUID guardados como texto en minúsculas (D-11).
- El detalle de cada colección (campos, validación e índices) está en `../modelado/documental/`.

### 4.3 Grafo

- Nodos: Persona, Libro, Película, Usuario. Persona lleva `persona_id`, `nombre` y `foto_url?` (la dirección de una imagen guardada fuera de la base, D-25); Libro y Película llevan solo `obra_id` (el título vive en la ficha, D-18); Usuario lleva solo `usuario_id`. Una persona es autor, director o actor según sus relaciones y puede ser las tres cosas (D-15).
- Relaciones: `escribió`, `adaptado_a`, `dirigida_por`, `actuó_en {personaje, orden}`.
- Proyecciones derivadas: `sigue` (Usuario → Usuario) y `leyó` (Usuario → Libro, solo libros, D-16).

### 4.4 Redundancia controlada

| Dato | Fuente | Copia | Dirección |
|---|---|---|---|
| Seguimiento | Relacional | Grafo (`sigue`) | R → G |
| Reparto | Grafo | Ficha documental | G → D |
| Estado de lectura de libros | Relacional | Grafo (`leyó`, solo libros) | R → G |
| Promedio de obra | Relacional (reseñas) | Campo derivado (`ObraResumen`) | Misma base |
| Existencia de obra (id) | Documental (ficha) | Relacional (`ObraResumen`) y grafo (nodo) | D → R, D → G |
| Identidad de usuario (id) | Relacional | Grafo (nodo Usuario) | R → G |

Mecanismos de propagación y fallos parciales: ver `docs/modelado/fuente-de-verdad.md`.

## 5. Requerimientos no funcionales

| ID | Categoría | Requerimiento |
|---|---|---|
| RNF-01 | Consistencia | Las operaciones de una sola base (por ejemplo RF-13) serán atómicas. |
| RNF-02 | Consistencia | La propagación entre bases será eventual: se escribe primero en la fuente de verdad y luego en la copia, con reintento. |
| RNF-03 | Mantenibilidad | Las copias no se editan directamente y pueden reconstruirse desde la fuente con un script de reconciliación. |
| RNF-04 | Rendimiento | La página de detalle de una obra se resolverá leyendo un solo documento. |
| RNF-05 | Rendimiento | Las consultas de recorrido (RF-24 a RF-27) responderán en un tiempo aceptable para el volumen del catálogo del proyecto. |
| RNF-06 | Seguridad | Las contraseñas se almacenan con hash; las acciones de edición exigen sesión y verificación de propiedad (RN-10). |
| RNF-07 | Seguridad | Las acciones de administración solo están disponibles para el rol de administrador. |
| RNF-08 | Integridad | Los identificadores de usuario y obra son los mismos en las tres bases para poder unir resultados. |
| RNF-09 | Usabilidad | La aplicación será móvil, solo para Android, y se usará desde un teléfono. La administración del catálogo va dentro de la misma app (D-28). |
| RNF-10 | Datos de prueba | El conjunto de datos de prueba incluirá cadenas de adaptaciones y repartos compartidos (actores y directores que aparecen en varias películas), de modo que las conexiones de RF-24 a RF-27 tengan caminos de varios saltos y varias rutas posibles. |

## 6. Restricciones y supuestos

- El catálogo es propio y acotado; no se importan catálogos masivos de APIs externas.
- Solo se cubren libros y películas.
- No hay compra, lectura ni reproducción de obras.
- No hay mensajería entre usuarios ni motor de recomendación con aprendizaje automático.
- Entre bases distintas no existe transacción atómica; esto se reconoce y se mitiga con RNF-02 y RNF-03.

## 7. Trazabilidad de la justificación de las tres bases

| Base | Requerimientos que la justifican | Qué se pierde si se elimina |
|---|---|---|
| Relacional | RF-01 a RF-04, RF-06 y RF-07 (promedio), RF-12 a RF-15, RF-18 (reseñas), RF-19 a RF-22, RF-26 (selección del libro de partida); RN-01 a RN-04, RN-08, RN-10, RN-11 | Atomicidad de reseña + estado + promedio, cascada al borrar cuentas, unicidad con integridad referencial |
| Documental | RF-05 (por título), RF-06 a RF-09, RF-16 a RF-18 (comparativas); RN-05; RNF-04 | Lectura completa de la ficha en una consulta, atributos variables por tipo, reseña comparativa flexible |
| Grafo | RF-05 (por autor, director o actor), RF-07 (reparto), RF-10, RF-11, RF-21, RF-23 a RF-27; RN-06, RN-07 | Recorridos de longitud variable y recomendaciones sociales |
