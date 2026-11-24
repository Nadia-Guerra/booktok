# Matriz de asignación de datos y operaciones: Del Libro a la Pantalla

Define desde el inicio qué sistema es responsable de cada dato y operación, para que las tres bases no se construyan de manera aislada. Deriva de `idea-libros-peliculas-adaptaciones.md` y `levantamiento-requerimientos.md`.

## 1. Matriz de responsabilidades

| Aspecto | Relacional | Documental | Grafo |
|---|---|---|---|
| **Entidades o datos** | Usuario, Reseña, Lista, ElementoDeLista, EstadoDeObra, Seguimiento. `ObraResumen` (id y tipo, libro o película, de cada obra; promedio y total de reseñas vigentes como dato derivado). Tablas técnicas `sync_outbox` (eventos pendientes de propagar al grafo) y `sesion` (sesiones iniciadas; solo el hash del token, D-35). | Ficha de libro (con portada y ediciones anidadas), ficha de película (portada, plataformas, datos técnicos, copia del reparto) y reseña comparativa. La portada es solo la dirección de una imagen guardada fuera de las bases (D-25). Cada ficha lleva `estado_publicacion` (borrador o publicada). | Nodos: Persona (autor, director o actor según sus relaciones, con su foto opcional como dirección de una imagen externa, D-25), Libro, Película y Usuario. Relaciones de autoría, adaptación, dirección y reparto, más las proyecciones `sigue` y `leyó` (esta última solo hacia libros). |
| **Estructura** | Tablas, columnas, claves primarias y foráneas (con cascada) y restricciones `UNIQUE` y `CHECK`. | Colecciones `libros`, `peliculas` y `resenas_comparativas` en JSON/BSON. Ediciones y plataformas como arreglos anidados; la reseña comparativa lleva veredicto y un arreglo de aspectos `[{nombre, puntuacion?, comentario?}]` de nombre libre y cantidad variable. | Etiquetas de nodo (`Persona`, `Libro`, `Película`, `Usuario`), relaciones `escribió`, `adaptado_a`, `dirigida_por`, `actuó_en {personaje, orden}`, `sigue`, `leyó`, y propiedades mínimas (id y, en las personas, nombre y `foto_url` opcional). |
| **Operaciones** | Registro, inicio de sesión y edición de perfil. Publicar, editar y eliminar reseñas (RF-12 a RF-14). Marcar estado de obra (RF-15). CRUD de listas y sus elementos (RF-19, RF-20). Seguir y dejar de seguir (RF-21). Ver perfiles, reseñas y listas de seguidos (RF-22). Eliminar cuenta en cascada (RF-04). Recomendaciones (RF-26, paso 1): libros terminados por el usuario con calificación ≥ 4. | Consultar la ficha completa de una obra en una sola lectura (RF-06, RF-07). Alta y corrección de obras (RF-08). Agregar edición o plataforma sin migrar esquema (RF-09). Crear, editar, eliminar y moderar reseñas comparativas (RF-16, RF-17, RF-18). Búsqueda por título (RF-05). | Registrar autores, directores, actores y sus relaciones (RF-10). Registrar adaptaciones (RF-11). Ver adaptaciones y libro de origen (RF-23). Camino entre dos personas u obras (RF-24). Autores con el mismo director (RF-25). Recomendaciones a dos saltos a partir de los libros que entrega el relacional (RF-26, paso 2) y por lo que leen los seguidos (RF-27). Búsqueda por autor, director o actor (RF-05). |
| **Reglas** | Una reseña por usuario y obra (RN-01). Calificación de 1 a 5 (RN-02). Sin auto-seguimiento ni seguimiento duplicado (RN-03). Una obra una vez por lista (RN-04). Promedio acorde a reseñas vigentes (RN-08), mantenido por un trigger sobre `resena` para que también lo corrija la cascada de RF-04. Propiedad de reseñas y listas (RN-10). Atomicidad de reseña + estado + promedio (RF-13). "Le gustó" = libro terminado con calificación ≥ 4 (RN-11). | Validación de estructura de ficha (campos obligatorios y tipos). Índice único compuesto (usuario, libro, película) (RN-05). Referencias a usuario, libro y película validadas en la aplicación. Moderación de comparativas (RN-10, RN-09). | Tipos y dirección de relación válidos. Una película con un solo libro de origen; un libro con varias adaptaciones (RN-07). Comparativa solo sobre pares vinculados por `adaptado_a` (RN-06). Sin duplicar relaciones idénticas. |
| **Pruebas** | Violación de `UNIQUE` y `CHECK`. Rollback de la transacción de reseña. Cascada al borrar cuenta sin huérfanos. Promedio consistente tras alta, edición y baja de reseña. Filtro de RF-26: solo libros terminados con calificación ≥ 4 (no películas, no pendientes, no 3 o menos). | Esquema y documentos válidos e inválidos. Rechazo de comparativa duplicada. Agregar edición y plataforma sin cambiar el esquema. Lectura de ficha en una consulta. | Integridad del grafo (sin relaciones colgantes). Cardinalidad de adaptación. Recorridos de longitud variable (RF-24) y recomendaciones (RF-26, RF-27) con resultados esperados. RF-26: recorrido de dos saltos por el mismo director que no devuelve libros ya leídos ni el libro de partida. |

## 2. Fuente de verdad y redundancia controlada

Cuando un dato vive en más de una base, esta tabla indica quién es dueño y quién tiene la copia.

| Dato | Fuente de verdad | Copia | Dirección | Operación que propaga |
|---|---|---|---|---|
| Seguimiento entre usuarios | Relacional | Grafo (`sigue`) | R → G | RF-21 |
| Estado de lectura de libros | Relacional | Grafo (`leyó`, solo libros) | R → G | RF-13, RF-15 |
| Reparto de una película, con la foto de cada actor (D-27) | Grafo (`actuó_en` y nodo `Persona`) | Ficha documental | G → D | RF-10 |
| Promedio de calificación | Relacional (reseñas) | `ObraResumen.promedio` (campo derivado) | Misma base | RF-13 |
| Existencia e id de obra | Documental (ficha) | Relacional (`ObraResumen`: id, tipo) y grafo (nodo) | D → R, D → G | RF-08 |
| Identidad de usuario | Relacional (`Usuario`) | Grafo (nodo Usuario, solo `usuario_id`) | R → G | RF-01, RF-04 |

Detalle de mecanismos y fallos parciales en `fuente-de-verdad.md`.

Reglas: se escribe primero en la fuente de verdad y luego en la copia, con reintento. Las copias no se editan directamente y se reconstruyen con un script de reconciliación. Entre bases no hay transacción atómica (consistencia eventual, RNF-02).

## 3. Datos compartidos entre bases

| Elemento | Dónde aparece | Cómo se vincula |
|---|---|---|
| Identificador de usuario | Relacional (Usuario), documental (autor de la comparativa), grafo (nodo Usuario) | Mismo ID en las tres bases (RNF-08) |
| Identificador de obra | Documental (ficha), relacional (reseña, estado, lista), grafo (nodo Libro/Película) | Mismo ID en las tres bases (RNF-08) |

## 4. Operaciones que cruzan bases

| Operación | Relacional | Documental | Grafo |
|---|---|---|---|
| Eliminar cuenta (RF-04) | Borra en cascada reseñas, listas, estados y seguimientos | Elimina las reseñas comparativas del usuario | Elimina el nodo Usuario y sus relaciones `sigue` y `leyó` |
| Seguir a un usuario (RF-21) | Inserta `Seguimiento` (fuente) y evento en `sync_outbox` | — | Crea `sigue` (copia) al procesar el evento |
| Publicar reseña (RF-13) | Transacción: reseña + estado terminada + promedio + evento en `sync_outbox` | — | Crea `leyó` (copia, solo si la obra es un libro) al procesar el evento |
| Alta de película adaptada (RF-08, RF-10, RF-11) | Inserta `ObraResumen` (id, tipo) | Crea la ficha como `borrador` y la marca `publicada` al terminar | Crea nodo, `adaptado_a`, `dirigida_por` y `actuó_en` (el libro de origen, al menos un director y un actor, D-24; publica antes el libro si estaba en borrador); luego regenera el reparto en la ficha, antes de publicarla |
| Mostrar ficha de obra (RF-06, RF-07) | Promedio y total de reseñas desde `ObraResumen` | Ficha completa en una lectura (incluye la copia del reparto) | — |
| Recomendar libros por adaptaciones (RF-26) | Paso 1: libros terminados con calificación ≥ 4 | Ficha para mostrar el resultado | Paso 2: recorrido de dos saltos desde esos ids, excluyendo los ya leídos |
| Recomendar películas por seguidos (RF-27) | — | Ficha para mostrar el resultado | Resuelve con `sigue`, `leyó` y `adaptado_a` |
| Buscar obras (RF-05) | — | Búsqueda por título | Búsqueda por autor, director o actor |

## 5. Trazabilidad

| Base | Requerimientos principales |
|---|---|
| Relacional | RF-01 a RF-04, RF-06 y RF-07 (promedio), RF-12 a RF-15, RF-18 (reseñas), RF-19 a RF-22, RF-26 (paso 1); RN-01 a RN-04, RN-08, RN-10, RN-11 |
| Documental | RF-05 a RF-09, RF-16 a RF-18; RN-05; RNF-04 |
| Grafo | RF-05, RF-07, RF-10, RF-11, RF-21, RF-23 a RF-27; RN-06, RN-07 |
