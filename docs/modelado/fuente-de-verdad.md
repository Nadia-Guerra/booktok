# Fuente de verdad: Del Libro a la Pantalla

Responde las cuatro decisiones de la sección 5.2 (fuente de verdad, replicación, sincronización, consistencia) para cada dato relevante. Parte de `idea-libros-peliculas-adaptaciones.md`, `levantamiento-requerimientos.md` y `matriz-responsabilidades.md`.

**Arquitectura asumida:** una API modular que coordina las tres bases. No hay microservicios ni transacciones distribuidas. Se reconoce que una operación que toca varias bases puede fallar parcialmente (sección 6).

## 1. Qué ya estaba definido y qué faltaba

**Ya definido** (se conserva sin cambios):

| Dato | Fuente | Copia | Origen |
|---|---|---|---|
| Seguimiento entre usuarios | Relacional | Grafo `sigue` | Idea §9, Req. §4.4 |
| Estado de lectura | Relacional | Grafo `leyó` | Idea §9, Req. §4.4 |
| Reparto de película | Grafo `actuó_en` | Ficha documental | Idea §9, Req. §4.4 |
| Promedio de obra | Relacional (reseñas) | Campo derivado | Idea §9, Req. §4.4 |
| Usuarios, reseñas, listas, estados | Relacional | — | Idea §7 |
| Fichas de obra y reseñas comparativas | Documental | — | Idea §7 |
| Autoría, adaptación, dirección | Grafo | — | Idea §7 |

**Huecos detectados** al cruzar los tres documentos (se resuelven en la sección 2):

| # | Hueco | Por qué importa |
|---|---|---|
| H1 | Los nodos `Libro` y `Película` y las fichas documentales describen la misma obra, pero ningún documento dice cuál manda. La matriz da a ambas el "alta" (RF-08). | Dos fuentes para el mismo dato. |
| H2 | Reseñas, estados y listas apuntan a una obra, pero el relacional no tiene tabla de obras. | No hay clave foránea posible; el promedio no tiene dónde vivir. |
| H3 | El promedio está en el relacional (Idea §7), pero la página de detalle se lee de un solo documento (RNF-04). | La ficha no trae el promedio. |
| H4 | Autores, directores y actores existen solo como nodos; la ficha no los incluye. | Falta decidir si se copian a la ficha. |
| H5 | RN-06 y RN-07 dependen de la relación de adaptación, que vive en el grafo, y las comparativas viven en el documental. | Validación entre bases y qué pasa si se quita una adaptación con comparativas. |
| H6 | RF-26 recomienda por libros que "le gustaron", pero `leyó` no lleva calificación. | El criterio "le gustó" no tiene dato que lo soporte. |

## 2. Alternativas evaluadas (árbol de decisiones)

Criterios usados para podar ramas:

- **C1** Coherencia con requerimientos y reglas ya establecidas.
- **C2** Integridad y atomicidad donde el requerimiento la exige (RF-13, RF-04).
- **C3** Pocas copias y sincronizaciones nuevas (proyecto académico).
- **C4** Cumple las lecturas pedidas (RNF-04, RNF-05).

### D1. Identidad y atributos descriptivos de la obra (H1)

| Rama | Descripción | C1 | C2 | C3 | C4 | Resultado |
|---|---|---|---|---|---|---|
| **A** | Documental es la fuente (título, sinopsis, ediciones, etc.). Relacional y grafo guardan solo id. | Alta: RF-08 y RF-09 editan fichas | n/a | Dos copias mínimas | Ficha completa en una lectura | **Elegida** |
| B | Grafo es la fuente y la ficha se genera desde él. | Baja: el grafo no está pensado para ediciones y atributos variables (Idea §8) | n/a | Obliga a regenerar fichas | Igual | Descartada |
| C | Tabla `Obra` completa en relacional. | Baja: contradice la lista de entidades relacionales y los atributos variables | Buena | Duplica ediciones y plataformas | Más uniones | Descartada |

### D2. Referencia a la obra en el relacional (H2)

| Rama | Descripción | C1 | C2 | C3 | Resultado |
|---|---|---|---|---|---|
| A | Sin tabla de obras; los ids se validan en la aplicación. | Media | Mala: reseñas con obra inexistente | Ninguna copia | Descartada |
| **B** | Tabla mínima `ObraResumen(obra_id, tipo, promedio, total_resenas)` con FK desde reseña, estado y elemento de lista. `tipo` es libro o película. | Alta: la Idea ya prevé el promedio como "dato derivado" en el relacional | Alta: integridad referencial y atomicidad de RF-13 | Una copia (id y tipo) | **Elegida** |
| C | `Obra` completa. | Baja | Alta | Alta duplicación | Descartada |

### D3. Dónde vive el promedio y cómo llega a la página de detalle (H3)

| Rama | Descripción | C2 | C3 | C4 | Resultado |
|---|---|---|---|---|---|
| **A** | `ObraResumen.promedio` en relacional, actualizado en la transacción de RF-13. La API arma la respuesta de detalle con la ficha (documental) y el promedio (relacional). | Alta: RN-08 se cumple dentro de una sola base | Sin copia nueva | Dos lecturas, ambas por clave | **Elegida** |
| B | Copiar el promedio a la ficha (R → D). | Pierde la garantía de RN-08 (eventual) | Nueva sincronización en cada reseña | Una lectura | Descartada |
| C | Calcular el promedio al leer. | Alta | Sin copia | Agregación en cada visita | Descartada |

**Interpretación de RNF-04:** "un solo documento" significa que *los datos descriptivos de la obra* se leen de un solo documento. El promedio es un dato derivado que la API adjunta.

### D4. Autores, directores y actores (H4)

| Rama | Descripción | C1 | C3 | Resultado |
|---|---|---|---|---|
| **A** | Solo grafo (nodo con `id` y `nombre`). La ficha no copia autor ni director. La API los consulta al grafo (RF-23). | Alta: Idea §7 los lista solo como nodos | Sin copia nueva | **Elegida** |
| B | Colección documental `personas` como fuente y nodo como copia. | Media: no hay requerimiento de ficha de persona | Nueva copia | Descartada |
| C | Copiar autor y director a la ficha. | Media | Nuevas sincronizaciones | Descartada |

El reparto sigue siendo la única copia de personas, ya definida (G → D).

### D5. Adaptación, RN-06 y RN-07 (H5)

| Rama | Descripción | C1 | C3 | Resultado |
|---|---|---|---|---|
| **A** | `adaptado_a` solo en el grafo (fuente). La API valida contra el grafo antes de crear una comparativa (RN-06) y antes de crear la relación (RN-07, porque el grafo no impone cardinalidad). | Alta: RF-11, RN-06 y RN-07 ya lo asignan al grafo | Sin copia | **Elegida** |
| B | Guardar `libro_origen_id` en la ficha de película. | Media | Nueva copia, aunque hace RN-07 trivial | Descartada; queda como plan de respaldo si RN-07 resulta frágil |

**Decisión de alcance:** el administrador no borra relaciones (solo las registra), igual que no hay baja de obras. Por eso una comparativa nunca queda sobre una pareja sin adaptación y no hace falta una regla de bloqueo. Si en el futuro se permite borrar, habrá que decidir qué pasa con las comparativas existentes.

### D6. Qué significa "le gustó" en RF-26 (H6)

| Rama | Descripción | C1 | C3 | Resultado |
|---|---|---|---|---|
| A | `leyó` sin propiedades; "le gustó" = terminó el libro. | Baja: terminar no implica que gustó | Sin copia nueva | Descartada |
| B | `leyó {calificacion}` copiada desde la reseña. | Alta | Copia nueva que cambia con cada edición de reseña | Plan de respaldo si RF-26 resulta lenta |
| C | Relación aparte `le_gustó`. | Media | Una proyección más | Descartada |
| **D** | Sin copia. La API resuelve en dos pasos: el relacional devuelve los libros terminados con calificación ≥ 4 y esos ids se pasan como parámetro a la consulta de grafo, que recorre las adaptaciones y excluye los ya leídos. | Alta: es el mismo patrón del plan de respaldo de Idea §9 | Ninguna | **Elegida** |

**Por qué D:** la calificación solo se usa para elegir el libro de partida de RF-26; RF-27 y el recorrido no la necesitan. Copiarla obligaría a propagar cada edición de reseña al grafo para un único requerimiento. El costo de D es una consulta adicional con una lista corta de ids.

**Criterio fijado:** "le gustó" = calificación ≥ 4 (escala 1 a 5), evaluada en el relacional al momento de recomendar.

## 3. Matriz de propiedad de datos (evidencia para "fuente de verdad")

¿En qué base se modifica oficialmente cada dato?

| Dato | Base oficial | Quién lo modifica | Requerimientos |
|---|---|---|---|
| Cuenta, credenciales (hash), rol, perfil | Relacional | Usuario; el rol `admin` se asigna con un script de carga inicial | RF-01 a RF-03 |
| Reseña individual (calificación, texto, oculta) | Relacional | Usuario; administrador modera | RF-12, RF-14, RF-18 |
| Estado de obra por usuario | Relacional | Usuario (y automático en RF-13) | RF-13, RF-15 |
| Listas y sus elementos | Relacional | Usuario | RF-19, RF-20 |
| Seguimiento | Relacional | Usuario | RF-21 |
| Promedio y total de reseñas vigentes | Relacional (`ObraResumen`) | Solo la transacción de reseña | RF-13, RN-08 |
| Atributos de obra: título, sinopsis, géneros, ediciones, plataformas, datos técnicos | Documental (ficha) | Administrador | RF-06 a RF-09 |
| Existencia de la obra (id) | Documental (ficha) | Administrador | RF-08 |
| Reseña comparativa (aspectos, oculta) | Documental | Usuario; administrador modera | RF-16 a RF-18 |
| Autores, directores, actores | Grafo | Administrador | RF-10 |
| `escribió`, `dirigida_por`, `actuó_en` (reparto) | Grafo | Administrador | RF-10 |
| `adaptado_a` | Grafo | Administrador | RF-11 |
| `sigue`, `leyó`, reparto en ficha, id en `ObraResumen` | **Copias**, nunca fuente | Solo el proceso de sincronización | Sección 4 |

## 4. Replicación: qué se copia y para qué

| # | Dato | Fuente | Copia | Campos replicados | Para qué |
|---|---|---|---|---|---|
| 1 | Seguimiento | Relacional `Seguimiento` | Grafo `sigue` | `usuario_id` origen y destino | Recorridos sociales (RF-27) |
| 2 | Estado de lectura | Relacional `EstadoDeObra` | Grafo `leyó` | `usuario_id`, `obra_id` (sin propiedades) | Recomendaciones (RF-26, RF-27) sin consultar el relacional para saber qué leyó cada quien. Solo estado "terminada" y solo de libros (D-16); si deja de estarlo, se borra la relación |
| 3 | Reparto | Grafo `actuó_en` y nodo `Persona` | Ficha de película | `[{persona_id, nombre, personaje, orden, foto_url?}]` (la foto, D-27) | Ficha completa en una lectura (RNF-04) |
| 4 | Existencia de obra | Documental (ficha) | Relacional `ObraResumen` | `obra_id`, `tipo` | Claves foráneas y sede del promedio |
| 5 | Existencia de obra | Documental (ficha) | Grafo (nodo Libro/Película) | `obra_id` | Anclar las relaciones (autoría, adaptación, dirección, reparto y `leyó`). El título no se copia (D-18): la API lo obtiene de la ficha con AP-04 |
| 6 | Identidad de usuario | Relacional `Usuario` | Grafo (nodo Usuario) | Solo `usuario_id` | Anclar `sigue` y `leyó` |
| 7 | Promedio | Relacional (reseñas) | `ObraResumen.promedio` | `promedio`, `total_resenas` | Dato derivado, misma base y misma transacción |

**Sin replicación (decisión consciente):** calificación de reseñas fuera del grafo (RF-26 la consulta al relacional); nombre y perfil del usuario fuera del relacional; autor y director fuera del grafo; la reseña comparativa en el documental y nada más; `adaptado_a` solo en el grafo; la portada de cada obra solo en su ficha; la foto de cada persona en su nodo, con una copia en el reparto de las fichas (D-25 y D-27).

## 5. Sincronización: cómo se propagan los cambios

Principio general (Idea §9, RNF-02): se escribe primero en la fuente de verdad y después en la copia, con reintento. Toda operación de propagación es **idempotente** (`MERGE` en el grafo, reemplazo completo del arreglo `reparto`, `upsert` en `ObraResumen`), de modo que reintentar nunca duplica.

| Flujo | Disparador | Mecanismo |
|---|---|---|
| R → G (nodo Usuario, `sigue`, `leyó`) | RF-01, RF-21, RF-13, RF-15 | **Bandeja de salida** (`outbox`): la misma transacción relacional que escribe el dato inserta un evento en la tabla `sync_outbox`. Un único proceso de la API (para conservar el orden) lee los eventos pendientes, los aplica al grafo y los marca como procesados |
| D → R y D → G (alta de obra) | RF-08 | La API comprueba que el alta trae al menos un autor (libro), o el libro de origen, al menos un director y una persona del reparto (película); crea la ficha con `estado_publicacion = "borrador"`, luego inserta `ObraResumen`, luego crea el nodo, luego crea `escribió`, o `adaptado_a`, `dirigida_por` y `actuó_en`; en películas copia el reparto a la ficha, y al final comprueba con el grafo que la obra tiene el mínimo y marca la ficha como `"publicada"` (D-24). Un libro necesita una adaptación para publicarse, así que su alta termina en borrador y el alta de su primera película lo publica antes de publicar la película. El catálogo solo muestra fichas publicadas |
| G → D (reparto) | RF-10 | Después de escribir `actuó_en`, la API regenera el arreglo `reparto` de la ficha desde el grafo. Lo mismo ocurre cuando cambia la foto de una persona (CG-24): la API regenera el reparto de cada película donde actuó (D-27) |
| Eliminar cuenta | RF-04 | Se borra en el relacional (cascada) y, en la misma transacción, se registra el evento `usuario_eliminado`. El proceso de propagación borra las comparativas del usuario en el documental y hace `DETACH DELETE` del nodo en el grafo |

## 6. Consistencia: qué pasa si una actualización falla parcialmente

Aclaración: dentro de una base la operación es atómica (RNF-01). Los fallos parciales solo existen entre bases.

| Operación | Si falla… | Estado visible | Política |
|---|---|---|---|
| Publicar reseña (RF-13) | La transacción relacional falla | Nada cambió | Rollback; el usuario reintenta |
| Publicar reseña (RF-13) | La relacional se confirma, falla la propagación a `leyó` | Reseña y promedio correctos; las recomendaciones no incluyen aún esa lectura | **Reintento** automático desde `sync_outbox` con límite de intentos; si se agota, el evento queda en estado `fallido` para **reconciliación** |
| Seguir usuario (RF-21) | Falla la escritura de `sigue` | Seguimiento válido; sin efecto en recomendaciones | Igual que arriba |
| Alta de obra (RF-08) | Falla tras crear la ficha | La ficha queda como `borrador` y no se muestra | **Compensación**: se reintentan los pasos pendientes; el script de reconciliación completa los borradores antiguos repitiendo los pasos que faltan. No se eliminan: el que no se pueda completar se reporta al administrador |
| Reparto (RF-10) o foto de una persona (CG-24) | Falla la regeneración de la ficha | El grafo es correcto; la ficha muestra un reparto o una foto desactualizados | Reintento; reconciliación regenera `reparto` desde el grafo |
| Eliminar cuenta (RF-04) | Falla la limpieza en documental o grafo | La cuenta ya no existe; quedan comparativas o nodos huérfanos, no visibles porque la API los filtra contra el relacional | Se limpia en la fuente primero (orden definido en Idea §9) y el resto se **reintenta**; la reconciliación detecta huérfanos por ids ausentes en `Usuario` |
| Crear comparativa (RN-06) | El grafo no responde al validar | No se crea | Se rechaza con error recuperable; no se guarda nada |

**Script de reconciliación** (Req. RNF-03). Compara fuente contra copia y corrige solo la copia:

1. `Seguimiento` frente a `sigue`.
2. `EstadoDeObra` terminada de libros frente a `leyó`.
3. Ids y tipo (libro o película) de fichas publicadas frente a `ObraResumen` y nodos. Además, que cada libro publicado tenga al menos un autor y una adaptación, y cada película publicada su libro de origen, al menos un director y una persona de reparto (D-24): solo se reporta, porque el script no puede inventar la persona.
4. `actuó_en` y la `foto_url` de la persona frente a `reparto` en la ficha.
5. `ObraResumen.promedio` y `total_resenas` frente al recálculo desde reseñas vigentes.
6. Huérfanos: usuarios y obras presentes en documental o grafo y ausentes en su fuente.
7. Eventos `fallido` en `sync_outbox`.
8. Fichas en `borrador` antiguas (altas incompletas): repite los pasos que faltan del alta (`ObraResumen`, nodo y publicación de la ficha), todos idempotentes. Si el grafo no tiene el mínimo de la obra (un autor y una adaptación en el libro; el libro de origen, un director y una persona de reparto en la película), no la publica (D-24) y la reporta al administrador, que registra las relaciones (RF-10, RF-11). Un libro que espera su primera película se reporta cuando supera la antigüedad mínima. Si el grafo ya lo tiene, también regenera el `reparto` de la ficha antes de publicar. Solo toca las que superan una antigüedad mínima, que se fija al implementar, para no interferir con altas en curso. No elimina ninguna: las que no logra completar las reporta al administrador. Es la única excepción a "corrige solo la copia": publicar la ficha modifica la fuente, pero solo con los datos que ya tiene.
9. Personas repetidas (D-15): lista los nombres que aparecen en más de un nodo `Persona` para que el administrador los revise. Es un reporte: no corrige ni fusiona nada, porque puede haber homónimos reales. No compara fuente con copia, porque el grafo es la fuente de las personas.

## 7. Verificación de coherencia

| Verificación | Resultado |
|---|---|
| Las cuatro filas de la sección 4.4 del levantamiento y la sección 9 de la idea se conservan sin cambios de fuente ni dirección | Coherente |
| RF-13 sigue siendo una sola transacción relacional (reseña, estado, promedio) y ahora actualiza `ObraResumen` | Coherente |
| Matriz de responsabilidades: cada operación asignada (RF-04, RF-08, RF-10, RF-13, RF-21, RF-27) aparece con la base y propagación de la sección 5 | Coherente |
| RN-05 (índice compuesto) sigue en el documental; RN-06 y RN-07 se validan contra el grafo desde la API | Coherente |
| RNF-04 (un solo documento) | Se mantiene para los datos descriptivos; el promedio se adjunta (D3) |
| RNF-08 (mismos ids en las tres bases) | Se refuerza: `obra_id` y `usuario_id` son la clave común de las copias |
| La matriz **no** mencionaba `ObraResumen` ni la copia del título (retirada después, D-18) | **Corregido en la matriz** (sección 2 y fila de entidades relacionales) |
| El levantamiento no define el umbral de "le gustó" | Fijado en ≥ 4 y registrado como RN-11 en el levantamiento; RF-26 y la trazabilidad ya lo reflejan |

**Decisiones de alcance (confirmadas):** no hay baja de obras ni borrado de relaciones por parte del administrador. Por eso no se definieron cascadas para eliminar obras, ni reglas para quitar `adaptado_a`. Si se agregan, habrá que decidir qué ocurre con reseñas, estados, listas y comparativas.
