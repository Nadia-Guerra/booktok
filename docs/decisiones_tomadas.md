# Decisiones tomadas

Registro de las decisiones de diseño que surgieron durante el planteamiento. Solo se documentan las que el equipo indica. Cada decisión lleva su contexto, las alternativas y la razón, para poder defenderla.

| ID | Decisión | Fecha |
|---|---|---|
| D-01 | El seguimiento entre usuarios tiene su fuente de verdad en el relacional | 2026-11-19 |
| D-02 | El trigger del promedio bloquea la fila antes de recalcular | 2026-11-19 |
| D-03 | El correo se guarda en minúsculas y la base lo exige con CHECK | 2026-11-19 |
| D-04 | Un único proceso propaga los eventos, en orden | 2026-11-19 |
| D-05 | ~~El evento de título lleva solo el id de la obra~~ Retirada por D-18 | 2026-11-19 |
| D-06 | Se descarta el índice `estado_obra (usuario_id, estado)` | 2026-11-19 |
| D-07 | La reseña comparativa lleva un veredicto con preferencia obligatoria, `oculta` booleano y fechas de creación y edición | 2026-11-19 |
| D-08 | Las ediciones de un libro se identifican con un `edicion_id` UUID y las plataformas de una película por su nombre | 2026-11-19 |
| D-09 | El motor documental es MongoDB | 2026-11-19 |
| D-10 | Los borradores antiguos se completan, no se eliminan | 2026-11-19 |
| D-11 | El identificador de cada documento es su `_id`, un UUID guardado como texto | 2026-11-19 |
| D-12 | `persona_id` es un UUID generado por la API y el reparto copia cuatro campos (ampliada con la foto por D-27) | 2026-11-19 |
| D-13 | Convenciones de los documentos: puntuación de 1 a 5, fechas en UTC y arreglos sin orden | 2026-11-19 |
| D-14 | El motor de grafos es Neo4j | 2026-11-19 |
| D-15 | Un único nodo `Persona`; los roles salen de las relaciones | 2026-11-19 |
| D-16 | `leyó` solo apunta a libros | 2026-11-19 |
| D-17 | RF-24 recorre las relaciones sin dirección y devuelve todos los caminos más cortos | 2026-11-19 |
| D-18 | Los nodos de obra del grafo no guardan el título | 2026-11-21 |
| D-19 | Una sola relación `actuó_en` por cada par persona y película | 2026-11-21 |
| D-20 | RF-27 no excluye las películas que el usuario ya vio | 2026-11-21 |
| D-21 | `Libro` y `Película` no comparten etiqueta; la unicidad de `obra_id` va por etiqueta | 2026-11-21 |
| D-22 | Neo4j se usa en su edición Community | 2026-11-21 |
| D-23 | Registrar una adaptación bloquea antes el nodo de la película | 2026-11-21 |
| D-24 | Una ficha solo se publica si su libro tiene autor y al menos una adaptación, o su película tiene libro de origen, director y reparto; el alta los trae y los comprueba antes de publicar | 2026-11-21 |
| D-25 | Las imágenes viven fuera de las bases: libros y películas guardan `portada_url` en su ficha y las personas `foto_url` en su nodo | 2026-11-21 |
| D-26 | Se elimina la `url` de las plataformas de una película: cada plataforma es solo su `nombre` | 2026-11-21 |
| D-27 | La foto de cada actor se copia al reparto de la ficha de la película (`reparto[].foto_url`, opcional) | 2026-11-21 |
| D-28 | La aplicación es móvil, solo para Android, y la administración va dentro de la misma app | 2026-11-21 |
| D-29 | La API es un monolito modular y el proceso que propaga `sync_outbox` corre dentro de ella | 2026-11-21 |
| D-30 | Se desarrolla en Docker Compose local y la demo usa un túnel HTTPS hacia esa máquina | 2026-11-21 |
| D-31 | El administrador pega la URL pública de cada imagen; la app no sube archivos | 2026-11-21 |
| D-32 | La app es React Native con Expo y la API es Node con TypeScript y Express | 2026-11-23 |
| D-33 | El motor relacional es PostgreSQL | 2026-11-23 |
| D-34 | El worker se despierta con un aviso dentro del proceso y un sondeo de respaldo cada 30 segundos | 2026-11-23 |
| D-35 | La sesión es un token aleatorio cuyo hash se guarda en PostgreSQL (tabla `sesion`) | 2026-11-23 |
| D-36 | Cada contenedor del Compose lleva un límite de memoria y los motores se ajustan a él; los servicios se levantan por perfiles | 2026-11-23 |
| D-37 | La validación de datos usa Zod, con esquemas compartidos entre la app y la API | 2026-11-23 |
| D-38 | El bloqueo del trigger del promedio es `FOR NO KEY UPDATE`, no `FOR UPDATE` (corrige D-02 tras probarlo) | 2026-11-23 |
| D-39 | Versiones fijadas del Compose, puerto de PostgreSQL y comprobación de salud de MongoDB | 2026-11-23 |
| D-40 | Tipos concretos del relacional en PostgreSQL: `TIMESTAMPTZ`, `JSONB` e identidad del outbox | 2026-11-23 |
| D-41 | La búsqueda de personas por nombre usa un índice de texto completo (`standard-folding`) en Neo4j | 2026-11-23 |
| D-42 | El bloqueo de D-23 se toma reescribiendo `obra_id` en el nodo de la película (`CG-15-bloqueo`), y las pruebas del grafo usan un cliente efímero y la API HTTP | 2026-11-23 |
| D-43 | La semilla sale de un solo JSON con un generador en PowerShell 5.1; los cargadores generados se versionan | 2026-11-23 |
| D-44 | Las contraseñas de la semilla son hashes bcrypt (coste 10) generados con `pgcrypto` | 2026-11-23 |
| D-45 | Forma concreta de CG-08, CG-09, CG-21 y CG-23 | 2026-11-23 |
| D-46 | Las pruebas sobre la semilla son de solo lectura y la coherencia entre bases compara fuera de las bases | 2026-11-23 |
| D-47 | La caché de páginas de Neo4j baja de 256 a 128 MB tras medir el consumo (ajusta D-36) | 2026-11-24 |
| D-48 | `reconstruir.ps1` borra solo los volúmenes del proyecto, levanta una base cada vez, prueba sobre bases vacías y carga la semilla al final | 2026-11-24 |
| D-49 | CG-06 con origen igual a destino falla en el motor: la API lo rechaza antes de llamarla | 2026-11-24 |
| D-50 | La evidencia del catálogo no toca la semilla y las operaciones integradas marcan lo simulado | 2026-11-24 |
| D-51 | El catálogo del Entregable 5 se genera desde una fuente escrita a mano y la evidencia guardada | 2026-11-24 |
| D-52 | La API es REST, versionada en `/api/v1` y documentada con OpenAPI | 2026-11-24 |
| D-53 | El código se organiza en `backend/`, `frontend/` y `shared/` | 2026-11-24 |
| D-54 | Qué se ve de otro usuario; sin buscador de usuarios ni listado de novedades | 2026-11-24 |
| D-55 | El administrador ve las reseñas ocultas de una obra | 2026-11-24 |
| D-56 | Una obra en borrador no se reseña, marca ni lista, y no aparece en los resultados del grafo | 2026-11-24 |
| D-57 | Paginación de 20, reseña de hasta 3000 caracteres y contraseña de al menos 8 | 2026-11-24 |
| D-58 | Un alta que falla a medias responde 503 con el id creado y se completa sin repetirla | 2026-11-24 |

---

## D-01. El seguimiento entre usuarios tiene su fuente de verdad en el relacional

**Contexto.** Seguir a otro usuario es, por naturaleza, una relación entre dos nodos, y surgió la pregunta de si debía vivir solo en el grafo y no en una tabla del relacional.

**Decisión.** La tabla `seguimiento` del relacional es la fuente de verdad. El grafo guarda una copia (`sigue`) que se sincroniza desde el relacional y que se usa para las recomendaciones (RF-27).

**Alternativa descartada: guardar el seguimiento solo en el grafo.**

| | Fuente en el relacional (elegida) | Solo en el grafo |
|---|---|---|
| Datos duplicados | Sí (`sigue` es copia) | No |
| Sincronización | Dos eventos y un punto de reconciliación | Ninguna |
| RN-03 (no seguirse a sí mismo, no duplicar) | La base lo impone con CHECK y clave primaria | La API lo comprueba; el grafo evita duplicados con `MERGE` |
| Eliminar cuenta (RF-04) | La cascada borra los seguimientos de forma atómica | Se borran al procesar el evento, con un lapso de retraso |
| Ver perfiles y reseñas de seguidos (RF-22) | Una sola consulta SQL con unión | Dos pasos: el grafo da los ids y el relacional filtra |
| Si el grafo está caído | Seguir y el feed siguen funcionando | Seguir y el feed dejan de funcionar |

**Por qué se eligió el relacional**
1. **Aislamiento de fallos.** Las funciones sociales básicas (seguir, ver el feed) no dependen del grafo. El grafo queda como herramienta de descubrimiento y recomendaciones.
2. **Integridad declarativa.** La cascada de RF-04 y las reglas de RN-03 son el tipo de integridad que justifica el relacional.
3. **La aplicación no pretende ser una red social completa.** No hay mensajes ni publicaciones; el seguimiento sirve para ver la actividad de otros y para recomendar, no es el centro del producto.

**Respuesta a "entonces el grafo no se usa para el seguimiento".** Sí se usa. La copia `sigue` vive en el grafo y alimenta RF-27 (películas basadas en libros que leyeron las personas que el usuario sigue). Lo único que cambia respecto a la alternativa es dónde está el registro oficial, no si el grafo participa.

**Costo que se acepta.** Una copia más que mantener: dos eventos de sincronización (`seguimiento_creado` y `seguimiento_eliminado`) y una verificación en el script de reconciliación. Es una redundancia controlada, con fuente, dirección y forma de reconstruirse.

**Si se quisiera cambiar más adelante.** Pasar el seguimiento solo al grafo es posible: se quitarían la tabla `seguimiento`, el índice `idx_seguimiento_seguido` y los dos eventos, y RN-03 pasaría a validarse en la API. No afectaría al documental.

**Documentos relacionados**
- `requerimientos/idea-libros-peliculas-adaptaciones.md`, sección 9 (registro de redundancia).
- `requerimientos/levantamiento-requerimientos.md`: RF-21, RF-22, RF-27, RN-03.
- `modelado/fuente-de-verdad.md`, sección 4 (replicación).
- `modelado/relacional/`: tabla `seguimiento` (paso 1), restricciones (paso 2), índice I4 (paso 3), operaciones O15 y O16 (paso 4).

---

## D-02. El trigger del promedio bloquea la fila antes de recalcular

**Problema.** Si el trigger calcula el promedio y después actualiza `obra_resumen`, dos reseñas simultáneas de la misma obra pueden pisarse: la segunda sobrescribe el resultado de la primera.
**Decisión.** El trigger bloquea primero la fila de `obra_resumen` y solo después recalcula desde las reseñas. *(Corrección de implementación, D-38: el bloqueo es `FOR NO KEY UPDATE`; con `FOR UPDATE` varias reseñas simultáneas se interbloquean.)*
**Alternativa descartada.** Guardar una suma de calificaciones y actualizar por incremento: es más rápido pero el trigger se vuelve más complejo (alta, baja, edición y ocultar), y el volumen del proyecto no lo exige.
**Dónde.** `modelado/relacional/02-restricciones-integridad.md`, sección 7 y prueba 15.

---

## D-03. El correo se guarda en minúsculas y la base lo exige con CHECK

**Problema.** El correo no debe repetirse aunque cambien las mayúsculas, y la forma de lograrlo dependía del motor.
**Decisión.** La API normaliza el correo a minúsculas, la base lo exige con `CHECK (correo = LOWER(correo))` y la unicidad es un UNIQUE normal.
**Alternativas descartadas.** Un índice único sobre `lower(correo)` o un tipo de texto insensible a mayúsculas: ambos dependen de funciones propias de cada motor.
**Dónde.** `modelado/relacional/02-restricciones-integridad.md`, secciones 4 y 5.2.

---

## D-04. Un único proceso propaga los eventos, en orden

**Problema.** Con varios procesos en paralelo, "seguir" y "dejar de seguir" podrían aplicarse al grafo en orden inverso.
**Decisión.** Un solo proceso lee `sync_outbox` por `evento_id` y aplica los eventos de forma idempotente.
**Alternativa descartada.** Varios procesos repartidos por usuario: conserva el orden por usuario pero añade complejidad que el proyecto no necesita.
**Dónde.** `modelado/relacional/04-operaciones.md` (O19) y `modelado/fuente-de-verdad.md`, sección 5.

---

## D-05. El evento de título lleva solo el id de la obra

> **Retirada el 2026-11-21 por D-18.** El grafo ya no guarda el título de las obras, así que el evento `obra_titulo_actualizado` y la operación O6 dejaron de existir. El texto original se conserva como registro.

**Problema.** El título cambia en el documental y el evento se escribe en el relacional, así que no pueden ir en la misma transacción; un evento con el título dentro podía dejar uno viejo en el grafo.
**Decisión.** `obra_titulo_actualizado` lleva solo `obra_id`; al procesarlo se lee el título actual de la ficha y se actualiza el nodo.
**Alternativas descartadas.** Dejar el título en el evento y confiar en la reconciliación, o actualizar el grafo directamente desde la API tras el documental.
**Dónde.** `modelado/relacional/04-operaciones.md` (O6 y tabla de eventos) y `modelado/fuente-de-verdad.md`, sección 5.

---

## D-06. Se descarta el índice `estado_obra (usuario_id, estado)`

**Problema.** Era el índice I3, pensado para listar las obras de un usuario por estado y para el paso 1 de RF-26.
**Decisión.** No se crea: la clave primaria ya encuentra los estados de un usuario, que son pocos, y filtrar por `estado` dentro de ellos es insignificante. Se mantiene I2 (reseñas por usuario y fecha), que sirve al feed de los seguidos.
**Alternativas descartadas.** Mantener los seis índices, o quitar también I2.
**Dónde.** `modelado/relacional/03-indices.md`, secciones 2 y 4. El número I3 no se reutiliza.

---

## D-07. La reseña comparativa lleva un veredicto con preferencia obligatoria, `oculta` booleano y fechas de creación y edición

**Problema.** RF-16 define los aspectos de la comparativa (de nombre y cantidad libres), pero no dice cómo se expresa el veredicto general ni cómo se marca una comparativa oculta por moderación (RF-18).
**Decisión.**
- `veredicto` es un subdocumento `{preferencia, comentario?}`. `preferencia` es obligatoria y solo admite `libro`, `pelicula` o `empate`; `comentario` es opcional.
- `oculta` es un booleano, falso por defecto.
- `creado_en` y `actualizado_en`, como `resena` en el relacional.

**Alternativas descartadas.**
- Veredicto como texto libre opcional: no se puede agregar ni filtrar.
- `puntuacion_general` de 1 a 5 con comentario: repite el esquema de la reseña individual y puede confundirse con ella.
- Preferencia más una puntuación general opcional: más campos que validar sin un requerimiento que los pida.
- Llevar solo `creado_en`: RF-17 permite editar la comparativa y se perdería la fecha de la última edición.

**Por qué.** Una comparativa responde de forma natural a "¿cuál prefieres?". La preferencia es un valor cerrado, así que se puede validar y contar.
**Dónde.** Colección `resenas_comparativas` en `modelado/documental/` (`03-colecciones.md` y `04-validacion.md`). Requerimientos: RF-16 a RF-18, RN-05.

---

## D-08. Las ediciones de un libro se identifican con un `edicion_id` UUID y las plataformas de una película por su nombre

**Problema.** Las ediciones van anidadas en la ficha del libro y las plataformas en la de la película (RF-06, RF-07, RF-09), y el administrador debe poder corregir o quitar un elemento concreto. Nada fuera del documento los referencia (las reseñas son por obra, no por edición ni por plataforma), así que el identificador solo sirve para editar un elemento del arreglo.
**Decisión.** Cada edición lleva un `edicion_id` UUID generado por la API. El `isbn` es opcional, pero único entre libros cuando existe: se impone con un índice único *sparse* sobre `ediciones.isbn`, que ignora las ediciones sin ISBN (ver la corrección más abajo). La API valida que no se repita un ISBN dentro del mismo libro, porque el índice único no lo detecta entre elementos del mismo documento.

Las plataformas de una película se identifican por su `nombre`, sin id propio. La API valida que el nombre no se repita dentro de la película.

**Corrección del mecanismo (2026-11-19).** La decisión no cambia (ISBN opcional y único entre libros cuando existe), pero el índice único *parcial* que se había previsto no funciona. El filtro parcial se evalúa por documento y no por edición: un libro con una edición con ISBN y otra sin él deja una clave nula en el índice, y un segundo libro con esa misma forma falla con error de clave duplicada. Se comprobó en MongoDB 9.0.4. El índice único *sparse* admite esos casos y sigue rechazando el mismo ISBN en otro libro. Corrección aprobada por el equipo. Detalle en `modelado/documental/05-indices.md`, IX-03.

**Alternativas descartadas.**
- ISBN como clave natural: una edición antigua sin ISBN no tendría identidad, y corregir un ISBN cambiaría la identidad de la edición.
- Posición en el arreglo: frágil, al quitar un elemento cambian las posiciones de los demás.
- Colección `ediciones` aparte: rompe el anidamiento, que es la razón de usar el documental.
- Un UUID por plataforma: es un dato simple que nada referencia, así que el identificador sería un campo más sin uso.
- Colección de plataformas: añade una colección y una unión sin ninguna necesidad real.
- Índice único parcial sobre `ediciones.isbn`: falla con libros que mezclan ediciones con y sin ISBN (ver la corrección).

**Dónde.** Colecciones `libros` y `peliculas` en `modelado/documental/` (`03-colecciones.md`, `04-validacion.md` y `05-indices.md`). Requerimientos: RF-06, RF-07, RF-09.

---

## D-09. El motor documental es MongoDB

**Contexto.** Los documentos hablaban de una base documental en JSON/BSON y mencionaban MongoDB solo como alternativa descartada ("todo en MongoDB", `modelado/justificacion-tres-bases.md`, sección 5.1), sin declarar qué motor se usaría para el documental.
**Decisión.** El documental se implementa en MongoDB. Sigue siendo una de las tres bases: no cambia qué datos guarda ni la fuente de verdad de cada dato.
**Alternativas descartadas.** No se compararon otros motores documentales; el equipo eligió MongoDB.
**Lo que el diseño ya usa de MongoDB.** Arreglos anidados (ediciones, plataformas, aspectos, reparto), índice único compuesto (RN-05), índice único *sparse* para el ISBN (D-08), validación de estructura de las fichas y búsqueda por título (RF-05).
**Si se quisiera cambiar más adelante.** Habría que comprobar que el nuevo motor ofrece el índice único *sparse*, la validación de estructura y la búsqueda por título; el resto del diseño es propio del modelo documental.
**Dónde.** `modelado/documental/` y `modelado/justificacion-tres-bases.md`, sección 5.1.

---

## D-10. Los borradores antiguos se completan, no se eliminan

**Contexto.** El alta de una obra toca las tres bases sin transacción: ficha como `borrador`, fila en `obra_resumen`, nodo en el grafo y, al final, ficha `publicada`. Si falla a medias, la ficha queda en `borrador`, invisible en el catálogo. `modelado/fuente-de-verdad.md` decía que el script de reconciliación "completa o elimina" los borradores antiguos.
**Decisión.** El script solo los completa: repite los pasos que faltan (`obra_resumen`, nodo y publicación), que son idempotentes y usan los datos que la ficha ya tiene. Solo toca los que superan una antigüedad mínima, para no interferir con altas en curso. El que no pueda completar lo reporta al administrador.

**Alternativas descartadas.**
- Completar o eliminar: borrar solo la ficha deja una fila en `obra_resumen` y quizá un nodo apuntando a una ficha que ya no existe. Borrar bien exige deshacer el alta en las tres bases, en orden inverso.
- No tratar los borradores: las altas trabadas quedarían invisibles hasta que alguien las encuentre a mano.

**Por qué.** Completar siempre es seguro y no requiere deshacer nada. Además es coherente con que no haya baja de obras.
**Costo que se acepta.** Un borrador que no se pueda completar queda en la base hasta que el administrador intervenga. Para distinguirlos de las altas en curso, las fichas llevan `creado_en`.
**Dónde.** `modelado/fuente-de-verdad.md`, sección 6 (fila "Alta de obra" y punto 8 del script) y `modelado/documental/01-patrones-de-acceso.md`, AP-30. El patrón AP-31 (eliminar borrador) se retiró y su número no se reutiliza. Requerimientos: RF-08, RNF-03.

---

## D-11. El identificador de cada documento es su `_id`, un UUID guardado como texto

**Contexto.** Los identificadores son los mismos en las tres bases (RNF-08). Había que decidir cómo se guardan en el documental y cómo se llama el campo.
**Decisión.** El `_id` de cada documento es el propio identificador: el `obra_id` en `libros` y `peliculas`, y el `comparativa_id` en `resenas_comparativas`. Es un UUID generado por la API, guardado como texto de 36 caracteres. En `resenas_comparativas`, la unicidad de RN-05 (usuario, libro, película) la da un índice único, no el `_id`.

**Alternativas descartadas.**
- `_id` autogenerado (ObjectId) con un campo `obra_id` aparte: dos identificadores por documento y un índice único extra, sin ventaja.
- UUID binario de 16 bytes: depende de la representación de UUID configurada en el controlador, y un error genera ids que no coinciden con los de las otras bases.
- `_id` compuesto por usuario, libro y película en las comparativas: toda operación por id necesitaría los tres valores.

**Por qué.** El `_id` ya está indexado, así que las lecturas por clave (AP-01, AP-02, AP-05 y AP-20) no necesitan índice extra, y el texto es idéntico en las tres bases sin conversión.
**Formato común a las tres bases.** El UUID se escribe siempre en minúsculas y con guiones (el validador del documental rechaza mayúsculas, `04-validacion.md`). El relacional y el grafo deben guardar y devolver los ids en ese mismo formato; de lo contrario, el mismo id dejaría de coincidir entre bases (RNF-08).
**Dónde.** `modelado/documental/03-colecciones.md`, sección 6 (decisión 1) y `modelado/documental/05-indices.md`.

---

## D-12. `persona_id` es un UUID generado por la API y el reparto copia cuatro campos

**Contexto.** El reparto de la ficha de película es una copia del grafo (G → D) y la reconciliación lo compara contra `actuó_en`. Hacía falta una identidad estable para cada persona y decidir cuánto se copia.
**Decisión.** `persona_id` es un UUID generado por la API, guardado como texto. Cada elemento del reparto copia `persona_id`, `nombre`, `personaje` y `orden`. El grafo guarda ese id como propiedad del nodo `Persona` (D-15), con restricción de unicidad para que `MERGE` sea idempotente.

**Alternativas descartadas.**
- El id interno del motor de grafo: no es estable y ata el documental a un motor que aún no se ha elegido.
- El `nombre` como clave: los homónimos chocan y corregir un nombre rompe la identidad.
- Un id externo (IMDb, TMDB): el catálogo es propio y no importa datos de APIs externas.
- Copiar solo `persona_id` y pedir el nombre al grafo al mostrar: el nombre nunca quedaría desactualizado, pero cada lectura de ficha dependería del grafo y se pierde RNF-04.

**Costo que se acepta.** El nombre copiado puede quedar desactualizado. Hoy ningún requerimiento edita el nombre de una persona (RF-10 solo registra), así que no se espera. Si se añadiera, habría que regenerar el reparto de todas sus películas y agregar un índice sobre `reparto.persona_id`.
**Ampliación (2026-11-21).** D-27 añade a cada elemento del reparto un quinto campo, la `foto_url` opcional de la persona, con el mismo criterio y el mismo costo que el nombre.
**Dónde.** `modelado/documental/03-colecciones.md`, sección 6 (decisión 3) y el modelo del grafo (`modelado/grafo/`).

---

## D-13. Convenciones de los documentos: puntuación de 1 a 5, fechas en UTC y arreglos sin orden

**Contexto.** Quedaban tres detalles de formato por fijar en el documental.
**Decisión.**
- La `puntuacion` de un aspecto de la comparativa es un entero de 1 a 5, como las reseñas individuales (RN-02).
- Las fechas (`creado_en` y `actualizado_en`) se guardan como fecha y hora en UTC.
- El orden de `ediciones`, `plataformas` y `aspectos` no tiene significado. El del `reparto` lo da el campo `orden`.

**Alternativas descartadas.** No se discutieron otras: son convenciones.
**Dónde.** `modelado/documental/03-colecciones.md`, sección 6 (decisiones 2, 4 y 5).

---

## D-14. El motor de grafos es Neo4j

**Contexto.** Los documentos usaban `MERGE` y `DETACH DELETE`, propios de Cypher, pero D-12 daba el motor de grafos como no elegido.
**Decisión.** El grafo se implementa en Neo4j. Sigue siendo una de las tres bases: no cambia qué datos guarda ni la fuente de verdad de cada dato.
**Alternativas descartadas.** No se compararon otros motores; el equipo eligió Neo4j.
**Lo que el diseño ya usa de Neo4j.** `MERGE` idempotente, restricciones de unicidad (D-12), recorridos de longitud variable y caminos más cortos (D-17) y `DETACH DELETE` (RF-04).
**Dónde.** `modelado/grafo/`.

---

## D-15. Un único nodo `Persona`; los roles salen de las relaciones

**Contexto.** Una persona puede ser autora, directora y actriz a la vez. Los documentos hablaban de tres tipos de nodo (Autor, Director y Actor).
**Decisión.** Hay un solo tipo de nodo, `Persona`, con `persona_id` único. Ser autor, director o actor se deduce de las relaciones `escribió`, `dirigida_por` y `actuó_en`. No se añaden etiquetas de rol.

**Alternativas descartadas.**
- Tres tipos de nodo: la misma persona sería varios nodos sin conexión entre sí; RF-24 no encontraría el camino que pasa por ella y RF-25 se complicaría.
- `Persona` con etiquetas de rol (`:Autor`, `:Director`, `:Actor`): ninguna consulta las necesita y repiten lo que ya dicen las relaciones, con riesgo de desincronizarse. Si una consulta las pidiera, se agregarían como copia controlada (fuente: las relaciones; reconstruibles desde ellas).

**Costo que se acepta.** La unicidad de `persona_id` no impide registrar dos veces a la misma persona con ids distintos, porque no hay clave natural (D-12). Se controla en la API, que busca por nombre antes de crear (CG-02), y la reconciliación reporta los nombres repetidos para revisión (punto 9 del script de `modelado/fuente-de-verdad.md`), sin corregirlos sola porque puede haber homónimos. No existe una operación para fusionar dos personas: queda para una etapa posterior.
**Dónde.** `modelado/grafo/01-consultas-y-entidades.md`.

---

## D-16. `leyó` solo apunta a libros

**Contexto.** `leyó` se definía como `Usuario –[leyó]→ Obra`, pero el estado "terminada" se registra también para películas.
**Decisión.** `leyó` va de `Usuario` a `Libro`. RF-26 y RF-27 solo usan lo que el usuario leyó. Las películas terminadas se quedan en el relacional.
**Alternativa descartada.** `leyó` hacia libros y películas: ninguna consulta usa las películas vistas y obligaría a mantener más relaciones.
**Consecuencias.** El proceso que aplica `obra_leida` y `obra_no_leida` consulta `obra_resumen.tipo` y descarta los eventos de películas (`modelado/relacional/04-operaciones.md`). El grafo no sabe qué películas terminó un usuario.
**Dónde.** `modelado/fuente-de-verdad.md`, `modelado/relacional/04-operaciones.md` y `modelado/grafo/`.

---

## D-17. RF-24 recorre las relaciones sin dirección y devuelve todos los caminos más cortos

**Contexto.** Las relaciones del catálogo apuntan en sentidos distintos: de un autor a un actor, el camino pasa por `escribió` y `adaptado_a` hacia adelante y por `actuó_en` hacia atrás. Un recorrido que respete la dirección no lo encontraría.
**Decisión.** El camino se busca sin tener en cuenta la dirección, solo por las relaciones `escribió`, `adaptado_a`, `dirigida_por` y `actuó_en`, con un tope de profundidad. Devuelve todos los caminos más cortos entre los dos extremos.
- El filtro por tipo de relación es obligatorio: sin él, el recorrido pasaría por `Usuario` (`sigue`, `leyó`) y conectaría obras solo porque alguien las leyó.
- El tope de profundidad es de 6 saltos, de forma provisional, y se ajusta con los datos de prueba (RNF-10).

**Alternativas descartadas.**
- Relaciones inversas: duplican cada relación y su sincronización.
- Una consulta de patrón fijo por cada combinación de tipos de nodo: pierde la longitud variable, que es la razón de ser del grafo.
- Proyección con Graph Data Science: requiere un plugin y una copia más que se desactualiza; desproporcionado para un catálogo acotado.

**Por qué.** Es una sola consulta nativa de Neo4j, sin datos adicionales.
**Dónde.** CG-06 en `modelado/grafo/01-consultas-y-entidades.md`. Requerimientos: RF-24, RNF-10.

---

## D-18. Los nodos de obra del grafo no guardan el título

**Contexto.** D-05 y la fila "título de obra" del registro de redundancia copiaban el `titulo` a los nodos `Libro` y `Película` para mostrar caminos y recomendaciones sin otra consulta. Al revisar las entidades del grafo se vio que esa consulta ya existe: AP-04 devuelve `titulo` y año de varias obras a partir de sus ids, y la API lo usa en los resultados de RF-23 a RF-27. El título del grafo repetía un dato que ninguna consulta necesitaba.
**Decisión.** Los nodos `Libro` y `Película` llevan solo `obra_id`. La API obtiene los títulos con AP-04. Se retiran D-05, el evento `obra_titulo_actualizado`, la operación O6 del relacional, el patrón AP-06 del documental y la consulta CG-12 del grafo. Sus números no se reutilizan.

**Alternativa descartada.** Mantener `titulo` en el grafo por comodidad (leer y depurar el grafo en Neo4j sin consultar otra base): no responde a ningún requerimiento y obligaba a mantener un evento, un patrón de acceso, una operación y un punto de reconciliación.

**Por qué.** Hay menos sincronización y desaparece el riesgo de títulos viejos en el grafo. Cada nodo de obra sigue repitiendo el `obra_id`, que no es un dato descriptivo sino la clave que une las tres bases (RNF-08) y el extremo de las relaciones.
**Costo que se acepta.** Los resultados del grafo traen ids hasta que la API los completa con AP-04. Al depurar directamente en Neo4j, los nodos de obra se leen por id y no por título.
**Dónde.** `modelado/fuente-de-verdad.md` (secciones 2 a 6), `modelado/relacional/04-operaciones.md` (O6 y tabla de eventos), `modelado/documental/` (AP-06, AP-10, AP-29 y AP-30), `modelado/grafo/01-consultas-y-entidades.md` y las tablas de redundancia de la idea, el levantamiento, la matriz y la justificación de las tres bases.

---

## D-19. Una sola relación `actuó_en` por cada par persona y película

**Contexto.** Una persona puede interpretar dos personajes en la misma película. Había que decidir si eso se guarda como una relación o como dos.
**Decisión.** Entre una persona y una película hay una sola relación `actuó_en`. Si interpreta dos personajes, el texto de `personaje` recoge ambos. La regla se aplica a cada par por separado: una persona que actúa en varias películas tiene una relación con cada una.

**Alternativa descartada.** Una relación por personaje, identificadas por `orden`: deja dos relaciones del mismo tipo entre los mismos nodos, rompe la regla de una relación de cada tipo entre dos nodos y hace que RF-24 devuelva el mismo camino repetido (D-17).

**Por qué.** El caso es raro y el costo de la alternativa recaería en una de las consultas centrales.
**Dónde.** `modelado/grafo/02-relaciones.md`, sección 5. Requerimientos: RF-10, RF-24.

---

## D-20. RF-27 no excluye las películas que el usuario ya vio

**Contexto.** RF-27 recomienda películas basadas en libros que leyeron las personas que el usuario sigue. El grafo no sabe qué películas ha visto el usuario, porque `leyó` solo apunta a libros (D-16).
**Decisión.** La consulta no excluye nada: puede recomendar una película que el usuario ya terminó.

**Alternativa descartada.** Que el relacional entregue los ids de las películas terminadas por el usuario y la consulta las deje fuera, como en RF-26 con los libros de partida (CG-08). Cuesta una consulta más al relacional y RF-27 no lo pide.

**Si se quisiera cambiar más adelante.** Se agregaría ese parámetro a CG-09 con una operación del relacional parecida a O18. No afecta al modelo del grafo.
**Dónde.** CG-09 en `modelado/grafo/01-consultas-y-entidades.md`. Requerimientos: RF-27.

---

## D-21. `Libro` y `Película` no comparten etiqueta; la unicidad de `obra_id` va por etiqueta

**Contexto.** Neo4j impone la unicidad por etiqueta. Con una restricción sobre `Libro.obra_id` y otra sobre `Película.obra_id`, la base no impide que existan un libro y una película con el mismo `obra_id`, lo que rompería RNF-08 (un id, una obra).
**Decisión.** No hay etiqueta común: cada tipo de obra lleva su propia restricción de unicidad. La unicidad entre los dos tipos la garantiza el relacional: `obra_resumen.obra_id` es clave primaria y se registra antes de crear el nodo, así que un mismo id no puede darse de alta como libro y como película.

**Alternativa descartada.** Una etiqueta común `Obra` en los dos tipos de nodo, con una restricción de unicidad sobre `Obra.obra_id`: la base lo impediría por sí misma, pero cada nodo llevaría dos etiquetas y el tipo quedaría expresado dos veces, igual que con las etiquetas de rol (D-15). Ninguna consulta necesita buscar una obra sin conocer su tipo.

**Dónde.** `modelado/grafo/04-restricciones.md`, secciones 2, 5 y 7.1.

---

## D-22. Neo4j se usa en su edición Community

**Contexto.** D-14 eligió Neo4j sin precisar la edición. Según la documentación de Neo4j, la edición Community solo ofrece restricciones de unicidad; las de existencia y de tipo son de la edición Enterprise.
**Decisión.** Se usa la edición Community, por ser la gratuita. La base impone la unicidad de los ids; la obligatoriedad, el tipo, el formato y el rango de las propiedades los garantiza la API.

**Alternativa descartada.** La edición Enterprise: permitiría imponer también la existencia y el tipo en la base, pero el equipo prefirió la edición gratuita.

**Costo que se acepta.** Una escritura hecha fuera de la API, por ejemplo con una sentencia manual, podría dejar un nodo sin una propiedad obligatoria. Las copias no se editan a mano (RNF-03) y la reconciliación las reconstruye.
**Si se quisiera cambiar más adelante.** Bastaría ejecutar las sentencias de existencia de `modelado/grafo/04-restricciones.md`, sección 6. Las reglas no cambian. Conviene confirmar los límites de la edición con la versión que se instale.
**Dónde.** `modelado/grafo/04-restricciones.md`, secciones 1, 3 y 7.2.

---

## D-23. Registrar una adaptación bloquea antes el nodo de la película

**Contexto.** RN-07 dice que una película tiene un solo libro de origen. Neo4j no limita cuántas relaciones puede tener un nodo, así que la API comprueba con CG-04 y después crea la relación con CG-15. Son dos pasos: si dos administradores registraran a la vez dos libros de origen distintos para la misma película, las dos comprobaciones pasarían y quedarían dos libros.
**Decisión.** La API bloquea primero el nodo de la película (escribiendo en él dentro de la misma transacción) y solo después comprueba y crea la relación. Es el mismo criterio que D-02 en el relacional.

**Alternativas descartadas.**
- Aceptar el riesgo: es poco probable, pero no cuesta nada evitarlo.
- Una revisión en la reconciliación que liste las películas con más de un libro de origen: detecta el problema después de que ocurre, pero no lo evita.

**Por qué.** No cambia el modelo ni añade sincronización: solo fija el orden de las operaciones de la API.
**Dónde.** CG-15 en `modelado/grafo/01-consultas-y-entidades.md` y `modelado/grafo/04-restricciones.md`, secciones 2 y 7.3. Requerimientos: RN-07.

---

## D-24. Una ficha solo se publica con sus relaciones mínimas: autor y adaptación (libro); libro de origen, director y reparto (película)

**Contexto.** Al fijar la cardinalidad de las seis relaciones había que decidir el mínimo de cada lado. El equipo decidió exigir los mínimos: la adaptación es el núcleo de la aplicación (toda película es adaptación de un libro y todo libro publicado tiene al menos una), y un libro tiene autor y una película director y reparto. El flujo de alta de `fuente-de-verdad.md` publicaba la ficha justo después de crear el nodo, antes de registrar las relaciones (RF-10, RF-11), así que exigirlo obliga a ajustar el orden. Una primera versión de esta decisión dejaba la adaptación opcional ("una película puede no basarse en ningún libro"); era un error y se corrigió.
**Decisión.**
- **Libro publicado:** al menos un `escribió` (`1..N`) y al menos un `adaptado_a` (`1..N`).
- **Película publicada:** exactamente un `adaptado_a` como destino (`1..1`), al menos un `dirigida_por` (`1..N`) y al menos un `actuó_en` (`1..300`), con su copia en `reparto` ya hecha.
- **Cuándo se exige:** al publicar la ficha, no al crear el nodo. Una ficha en borrador puede tener cero.
- **Alta (RF-08):** trae al menos un autor (libro), o el libro de origen, al menos un director y una persona del reparto con `personaje` y `orden` (película). La API lo comprueba antes de crear nada, crea las relaciones (CG-14 y CG-15), copia el reparto a la ficha (CG-20 y AP-17) y, antes de publicar (AP-09), verifica el mínimo con CG-03, CG-04, CG-05 y CG-20.
- **Libro y película dependen uno del otro:** cada uno necesita al otro para publicarse. Para que no se bloqueen, lo que cuenta es que la relación `adaptado_a` exista, no que la ficha del otro extremo esté publicada. El alta de un libro termina en borrador y el alta de su primera película lo publica, y después publica a la película.
- **Máximos, los de siempre: una película tiene como máximo un libro de origen (RN-07), nadie se sigue a sí mismo (RN-03), `leyó` solo apunta a libros (D-16), una sola `actuó_en` por par persona y película (D-19), un reparto de 300 personas como máximo y una relación de cada tipo por par de nodos.**

**Alternativas descartadas.**
- Mínimo 0 en todas: sin reglas nuevas, pero permitiría obras publicadas sin autor, director, reparto ni adaptación.
- Exigir solo autor y director, con el reparto y la adaptación opcionales: era la versión inicial; se descartó.
- Exigir que el otro extremo de `adaptado_a` esté publicado: dejaría a libro y película sin poder publicarse.

**Por qué.** No hay baja de relaciones ni de personas, así que una vez publicada la obra el mínimo se conserva solo. Neo4j no puede imponerlo, de modo que lo imponen la API y la reconciliación (CG-22 devuelve la cuenta de autores y adaptaciones, o de libro de origen, directores y reparto, y el script reporta las obras publicadas que no llegan al mínimo). El reparto se copia a la ficha antes de publicar para que una ficha publicada nunca muestre un reparto vacío.
**Costo que se acepta.** Dar de alta una película exige conocer su libro de origen, que ya debe existir, y al menos un actor con su personaje y su orden. Un libro queda en borrador, y sin verse, hasta que se da de alta su primera película; el script de reconciliación lo reporta si tarda más del umbral, sin eliminarlo. Si un alta se interrumpe, el script no puede completarla sin saber el autor, el director, el actor o el libro: la reporta al administrador, que registra las relaciones con CG-14 y CG-15.
**Dónde.** `modelado/grafo/05-cardinalidad.md` (secciones 2, 3.3 y 4), `modelado/grafo/04-restricciones.md` (sección 2), CG-03, CG-04, CG-05, CG-15, CG-20 y CG-22 en `modelado/grafo/01-consultas-y-entidades.md`, RN-07 en `requerimientos/levantamiento-requerimientos.md`, `modelado/fuente-de-verdad.md` (secciones 5 y 6), AP-09 en `modelado/documental/01-patrones-de-acceso.md` y `modelado/documental/04-validacion.md`.

---

## D-25. Las imágenes viven fuera de las bases: `portada_url` en libros y películas, `foto_url` en personas

**Contexto.** Ningún modelo contemplaba una imagen para libros, películas ni personas. El equipo quiere una portada para cada libro y película y una foto para cada persona (autor, director, actor). Una imagen no se guarda en una base de datos: vive en el almacenamiento en la nube y las bases guardan solo su dirección. No se quiere foto de perfil de usuario por ahora.
**Decisión.**
- **Libros y películas:** campo opcional `portada_url` en la ficha del documental (`libros` y `peliculas`). Texto de hasta 500 caracteres que empieza por `https://`. La ficha se publica con o sin portada. Se devuelve en AP-01 a AP-04 y se recibe en AP-07, AP-08 y AP-10.
- **Personas:** propiedad opcional `foto_url` en el nodo `Persona` del grafo, con la misma regla de formato. La devuelven las consultas que ya devuelven el nombre de una persona (CG-01, CG-02, CG-05 a CG-08). Se recibe en CG-13 (registrar) y se asigna, cambia o quita con la nueva CG-24.
- **Usuarios:** sin foto.
- **Fuente de verdad única:** la ficha para las obras y el nodo para las personas. El relacional no guarda imágenes. La única copia es la foto de cada actor dentro del reparto de la ficha, decidida en D-27.
- **Validación:** el validador de `libros` y `peliculas` añade `portada_url` (esquema de `04-validacion.md`, sección 8). Las pruebas 22 a 24 se ejecutaron en MongoDB 9.0.4 y dieron el resultado esperado.

**Alternativas descartadas.**
- Guardar la imagen en la base (binario): una base no es el lugar de los archivos.
- Una colección `personas` en el documental para guardar la foto: ya se descartó una ficha de persona (no hay requerimiento) y duplicaría el nodo.
- Guardar la portada también en el nodo del grafo: añadiría una copia sin que ninguna consulta del grafo la necesite (mismo criterio que el título, D-18).
- Guardar la foto en el relacional: el relacional solo guarda id y tipo de las obras y no tiene personas.

**Por qué.** Cada URL vive junto al resto de los datos de su entidad, en la base que ya es su fuente de verdad, y no añade ninguna sincronización.
**Lo que quedaba pendiente.** Si la foto de cada actor se copiaba al reparto de la ficha: se resolvió en D-27.
**Dónde.** Documental: `03-colecciones.md`, `04-validacion.md` y `01-patrones-de-acceso.md`. Grafo: `01-consultas-y-entidades.md` (CG-24), `03-propiedades.md` y `04-restricciones.md`. Requerimientos: RF-06, RF-07 y RF-10.

---

## D-26. Se elimina la `url` de las plataformas de una película

**Contexto.** Cada plataforma de `peliculas.plataformas` tenía un `nombre` y una `url` opcional (el enlace a la película dentro de esa plataforma). Ningún requerimiento la pide: RF-07 solo exige mostrar las plataformas y RF-09 agregarlas, y la aplicación no reproduce contenido. Ninguna consulta ni regla la usa; solo añadía parámetros a AP-14 y AP-15, una regla de formato en el validador y pruebas.
**Decisión.** Cada plataforma es solo su `nombre`. Se identifica por él (D-08) y el validador rechaza cualquier otro campo, incluida la `url`.

**Alternativa descartada.** Conservarla como campo opcional: no cuesta guardarla, pero nadie la usa y obligaba a mantener su validación.

**Por qué.** Menos campos sin uso. No toca las otras bases: ninguna copia ni consulta de ellas dependía de la `url`.
**Si se quisiera volver a tenerla.** Se añade el campo al validador con `collMod`, sin migrar los documentos existentes.
**Consecuencia.** Con un solo campo, AP-15 (corregir una plataforma) se reduce a renombrarla. Una plataforma ya es un texto con nombre único dentro de la película y se podría guardar como una lista de textos, como `generos`, pero no se cambió porque D-08 la define como subdocumento identificado por `nombre` y eso afectaría a AP-14 a AP-16.
**Dónde.** `modelado/documental/` (`01-patrones-de-acceso.md` AP-14 y AP-15, `02-relaciones.md` R-03, `03-colecciones.md` y `04-validacion.md`, con las pruebas 9 y 21 ajustadas) y `requerimientos/levantamiento-requerimientos.md`.

---

## D-27. La foto de cada actor se copia al reparto de la ficha de la película

**Contexto.** La ficha de una película guarda una copia del reparto con `persona_id`, `nombre`, `personaje` y `orden` de cada actor (D-12). La foto de una persona vive en el nodo `Persona` (D-25). Para que la ficha muestre la cara de cada actor había que copiarla o pedirla al grafo al mostrar la ficha. Se compararon cuatro alternativas.
**Decisión.** Cada elemento del reparto copia también la `foto_url` de la persona, como quinto campo opcional: si la persona no tiene foto, el elemento no lleva el campo. La fuente de verdad sigue siendo el nodo `Persona`; la copia solo se escribe desde el grafo.
- **Cuándo se copia:** al regenerar el reparto (CG-20 y AP-17), que CG-20 devuelve ahora con la foto.
- **Si cambia la foto:** CG-24 la escribe en el nodo y la API regenera el reparto de cada película donde actuó la persona. Esas películas las da la nueva consulta CG-25 (el grafo ya tiene las relaciones `actuó_en`, así que no hace falta un índice sobre `reparto.persona_id` en el documental).
- **Reconciliación:** el punto 4 compara también la foto (CG-21 y AP-32) y regenera el reparto si hay diferencias.
- **Validación:** `reparto[].foto_url` en el validador de `peliculas`, con la misma regla que `portada_url` (`https://`, hasta 500 caracteres). Pruebas 25 y 26, ejecutadas en MongoDB 9.0.4 con resultado esperado; las anteriores se repitieron sin cambios.

**Alternativas descartadas.**
- Pedir la foto al grafo al mostrar la ficha (B): sin copia, pero la ficha dependería también del grafo y dejaría de leerse en un solo documento (RNF-04). Es lo mismo que D-12 descartó para el nombre.
- Copiarla solo para los primeros actores (C): mezcla copia y consulta, y añade una regla de cuántos y cuándo recalcular, por muy poco ahorro.
- No guardar la URL y derivarla del `persona_id` (E): eliminaría la propiedad y la copia, pero no se sabría si una persona tiene foto sin pedirla, cambiar el almacenamiento obligaría a renombrar archivos y contradice D-25.

**Por qué.** Es coherente con lo ya decidido para el nombre, mantiene la ficha en un solo documento y su costo está acotado: una URL pesa unos 100 bytes (unos 2 KB con 20 actores y 30 KB como máximo, con 300) y solo hay que regenerar fichas cuando el administrador cambia una foto, algo poco frecuente.
**Costo que se acepta.** Mientras se regeneran las fichas tras cambiar una foto, algunas pueden mostrar la anterior. Si la regeneración falla, el grafo queda correcto y la reconciliación lo corrige. Se reintenta con el mismo mecanismo que el reparto (`modelado/fuente-de-verdad.md`, sección 6).
**Dónde.** Documental: `01-patrones-de-acceso.md` (AP-17), `02-relaciones.md` (R-05), `03-colecciones.md`, `04-validacion.md` y `05-indices.md`. Grafo: `01-consultas-y-entidades.md` (CG-20, CG-21, CG-24 y CG-25), `03-propiedades.md` y `04-restricciones.md`. También `modelado/fuente-de-verdad.md`, `modelado/matriz-responsabilidades.md`, `modelado/justificacion-tres-bases.md` y `requerimientos/`.

---

## D-28. La aplicación es móvil, solo para Android, y la administración va dentro de la misma app

**Contexto.** El levantamiento decía que la aplicación sería web (RNF-09) y excluía la aplicación móvil nativa. Era un error: el equipo la quiere móvil. Además, por el poco tiempo disponible, no se quiere construir una interfaz web aparte para el administrador.
**Decisión.**
- El único cliente es una app Android. Lectores y administradores usan la misma app, y las pantallas de administración se muestran según el rol.
- Lo que protege las acciones de administración es la API (RNF-07), no ocultar pantallas.
- La demo se hace en un teléfono real con la app instalada.

**Alternativas descartadas.**
- Aplicación web: más trabajo y no es lo que el equipo quiere.
- Panel de administración web aparte: añade un segundo cliente que construir y mantener.
- iOS: no se necesita.

**Por qué.** Un solo cliente y una sola base de código, que es lo que el plazo permite.
**Costo que se acepta.** Cargar datos grandes desde un teléfono es incómodo (por ejemplo, un reparto de hasta 300 personas). Android bloquea por defecto el tráfico HTTP sin cifrar desde su versión 9, así que la API debe responder por HTTPS incluso en la demo. Las apps ya instaladas siguen llamando a la API, por lo que conviene versionarla.
**Dónde.** `requerimientos/levantamiento-requerimientos.md` (RNF-09 y la exclusión de la aplicación móvil, retirada) y `requerimientos/idea-libros-peliculas-adaptaciones.md` (misma exclusión, retirada).

---

## D-29. La API es un monolito modular y el proceso que propaga `sync_outbox` corre dentro de ella

**Contexto.** D-04 exige un único proceso que propague los eventos, pero no decía dónde corre. Se compararon dos formas: dentro de la API o como proceso aparte con el mismo código.
**Decisión.** Una sola API modular, con un solo proceso que incluye la propagación de la bandeja. Nunca se ejecuta más de una copia. El script de reconciliación es un comando del mismo código.

**Alternativas descartadas.**
- Worker como proceso aparte con el mismo código: garantiza por configuración que haya uno solo y deja reiniciar la API sin pausar la propagación, pero obliga a configurar y vigilar dos procesos.
- Microservicios y bus de eventos: ya descartados en `modelado/justificacion-tres-bases.md`, sección 5.3.

**Por qué.** Un solo despliegue y una sola configuración, por el plazo del proyecto.
**Costo que se acepta.** Si alguna vez corren dos copias de la API habrá dos workers y se rompe el orden de D-04, así que la API no se escala. Un reinicio de la API pausa la propagación, aunque la bandeja conserva los eventos.
**Si se quisiera cambiar más adelante.** Se arranca el mismo código con otro comando para que solo propague, sin cambiar el modelo ni los eventos.
**Dónde.** `modelado/fuente-de-verdad.md` (sección 5, que ya dice "un único proceso de la API") y `modelado/relacional/04-operaciones.md` (O19).

---

## D-30. Se desarrolla en Docker Compose local y la demo usa un túnel HTTPS hacia esa máquina

**Contexto.** Había que decidir dónde corre el sistema, con la restricción de que la demo es en un teléfono real y de que el plazo es de pocos días.
**Decisión.** Las tres bases y la API corren en Docker Compose en la máquina del equipo. Para la demo, el teléfono llega a la API por un túnel HTTPS (Cloudflare Tunnel o ngrok). La dirección base de la API es configurable en la app, porque la del túnel puede cambiar. Neo4j se usa en su edición Community (D-22).

**Alternativas descartadas.**
- Una VM pública (Oracle Always Free, con la capacidad recortada en junio de 2026, o un VPS de pocos dólares): URL estable y más confiable para la demo, pero requiere tarjeta o pago, un dominio para el certificado y más configuración.
- Servicios gestionados gratuitos: se pausan por inactividad, la API se duerme y el proceso de sincronización dejaría de correr.

**Por qué.** Cuesta $0, no depende de cuentas ni de pausas y es lo más rápido de montar.
**Costo que se acepta.** La demo depende de la máquina y del internet del lugar.
**Si se quisiera cambiar más adelante.** El mismo Compose se puede subir a una VM sin cambiar el diseño.
**Dónde.** Sin documento propio todavía; se reflejará en el diagrama de arquitectura.

---

## D-31. El administrador pega la URL pública de cada imagen; la app no sube archivos

**Contexto.** D-25 dice que las bases guardan solo la dirección de la imagen, pero no quién sube el archivo. Los administradores registran obras y personas desde la app Android (D-28).
**Decisión.** Para poner una portada o una foto, el administrador pega la URL pública `https://` de una imagen que ya está alojada en internet. La API valida el formato de D-25 y la guarda. No hay endpoint de subida ni almacenamiento propio de imágenes.

**Alternativa descartada.** Subir la imagen desde la galería del teléfono: exige un endpoint de subida y un lugar donde guardar y servir los archivos, más piezas que montar y probar en el plazo del proyecto.

**Por qué.** Es lo más simple y no cambia el modelo de datos: las bases ya guardan una URL.
**Costo que se acepta.** Las imágenes dependen de sitios ajenos: pueden cambiar de dirección o desaparecer, y algunos sitios bloquean que se muestren desde otra aplicación. La API valida el formato de la URL, no que la imagen exista o cargue. Pegar enlaces desde un teléfono es incómodo.
**Si se quisiera cambiar más adelante.** Se añadiría una subida desde la galería que devuelva una URL propia y la use en los mismos campos. No cambia ningún patrón de acceso ni consulta.
**Dónde.** Ningún modelo cambia: `portada_url` (AP-07, AP-08, AP-10), `foto_url` (CG-13, CG-24) y `reparto[].foto_url` (D-27) siguen igual.

---

## D-32. La app es React Native con Expo y la API es Node con TypeScript y Express

**Contexto.** Con la app móvil solo para Android (D-28) y un plazo de pocos días, había que elegir la tecnología del cliente y del servidor. Se compararon tres combinaciones: Kotlin nativo con Ktor o Spring, React Native con Node y TypeScript, y Flutter con FastAPI. Para el servidor se propusieron además Fastify y NestJS.
**Decisión.**
- **App:** React Native con Expo, en TypeScript.
- **API:** Node con TypeScript y Express.
- Los esquemas de validación y los tipos de datos se escriben una vez y los comparten la app y la API.

**Alternativas descartadas.**
- Kotlin nativo: el arranque más lento, con Android Studio y Compose.
- Flutter con FastAPI: dos lenguajes y dos formas de validar los mismos datos.
- Fastify: su validación integrada y su rendimiento no hacen falta aquí, y no hay experiencia previa con él.
- NestJS: añade mucho código base y una curva de aprendizaje que el plazo no permite.

**Por qué.** Hay experiencia previa con esta combinación, es un solo lenguaje y se prueba en un teléfono real con recarga instantánea. Los drivers oficiales de PostgreSQL, MongoDB y Neo4j existen para Node, y el worker de D-29 es un bucle asíncrono dentro del mismo proceso.
**Costo que se acepta.** Express no impone estructura ni valida por sí solo: las capas de `arquitectura/02-responsabilidades.md` se mantienen por disciplina y la validación se añade con una librería (propuesta: Zod). Expo Go sirve para desarrollar, pero la demo debe usar un APK de prueba para no depender de un servidor de desarrollo.
**Si se quisiera cambiar más adelante.** El diseño de las bases y de la sincronización no depende del lenguaje. Cambiar de framework solo afectaría a la capa de rutas.
**Dónde.** `arquitectura/03-eleccion-stack.md` y `arquitectura/02-responsabilidades.md`.

---

## D-33. El motor relacional es PostgreSQL

**Contexto.** Los documentos del relacional describían las tablas con tipos genéricos (`UUID`, `ENUM`, `TIMESTAMP`) y evitaban nombrar un motor (`modelado/relacional/03-indices.md`, sección 3). Hacía falta elegirlo para implementar.
**Decisión.** El relacional se implementa en PostgreSQL. Sigue siendo una de las tres bases: no cambia qué datos guarda ni la fuente de verdad de cada dato.

**Alternativa descartada.** MySQL o MariaDB: obligan a resolver el UUID (MySQL no tiene un tipo nativo) y el `ENUM` de otra forma que la ya escrita en los documentos.

**Por qué.** Los tipos del diseño existen tal cual en PostgreSQL: `UUID`, `ENUM` como tipo propio, `CHECK`, `UNIQUE`, llaves foráneas con cascada, triggers y bloqueo de fila para D-02 (`SELECT ... FOR UPDATE`; el modo exacto se corrigió a `FOR NO KEY UPDATE` en D-38).
**Costo que se acepta.** PostgreSQL no indexa automáticamente las llaves foráneas, así que los índices de la tabla de cobertura de `modelado/relacional/03-indices.md` (sección 3) se crean a mano.
**Si se quisiera cambiar más adelante.** Habría que comprobar que el nuevo motor ofrece los mismos tipos, el trigger con bloqueo de fila y las llaves foráneas con cascada; el resto del diseño es propio del modelo relacional.
**Dónde.** `modelado/relacional/` y `arquitectura/03-eleccion-stack.md`.

---

## D-34. El worker se despierta con un aviso dentro del proceso y un sondeo de respaldo cada 30 segundos

**Contexto.** D-04 y D-29 fijan un único worker dentro de la API, pero no decían cómo se entera de que hay eventos nuevos en `sync_outbox`. Se compararon cinco formas: sondeo fijo cada 2 segundos, sondeo adaptativo, `LISTEN/NOTIFY` de PostgreSQL con sondeo de respaldo, aviso en memoria con sondeo de respaldo, y herramientas externas (leer el log de PostgreSQL con Debezium, o colas como pg-boss y BullMQ).
**Decisión.**
- Cuando la API confirma una transacción que escribió en `sync_outbox`, avisa al worker en memoria y este corre un ciclo.
- El worker consulta además la bandeja cada 30 segundos y la vacía en cuanto arranca.
- Nunca corren dos ciclos a la vez: un aviso que llega durante un ciclo provoca otro al terminar.
- El índice I6 se crea parcial, solo sobre los eventos `pendiente`.

**Alternativas descartadas.**
- Sondeo fijo cada 2 s: unas 43 200 consultas al día en reposo y hasta 2 s de retraso. Funcionaba, pero es la más costosa en reposo.
- Sondeo adaptativo: tras un rato inactivo, un cambio podría tardar hasta 30 s en reflejarse, lo que se vería en la demo.
- `LISTEN/NOTIFY`: milisegundos de latencia, pero exige una conexión permanente y reconectarla. Queda como reserva si el worker se separa de la API.
- Debezium o colas ya hechas: componentes y memoria extra (la máquina tiene 6 GB), y modelos pensados para trabajos independientes, no para eventos que deben aplicarse en orden (D-04).

**Por qué.** Todos los eventos los escribe esta misma API y el worker vive dentro de ella, así que una señal en memoria basta. Baja las consultas en reposo un 93 % respecto al sondeo cada 2 s y el retraso es de milisegundos.
**Costo que se acepta.** Los servicios que escriben eventos deben llamar al aviso después de confirmar la transacción (un acoplamiento pequeño). Un aviso perdido lo cubre el sondeo de 30 s, y un reinicio, el vaciado al arrancar.
**Si se quisiera cambiar más adelante.** Si el worker se separa de la API, se sustituye el aviso en memoria por `LISTEN/NOTIFY` y se conserva el sondeo de respaldo. No cambia ningún evento ni el modelo.
**Dónde.** `arquitectura/04-fuente-de-verdad-y-sincronizacion.md` (secciones 4.3 y 9.1) y `modelado/relacional/03-indices.md` (I6).

---

## D-35. La sesión es un token aleatorio cuyo hash se guarda en PostgreSQL

**Contexto.** Los documentos del relacional asumían un token firmado y que la sesión no se guardaba en la base (O2). Con la app Android (D-28), la app guarda el token y lo envía en cada petición. Se compararon cuatro formas: un token firmado (JWT) de vida larga, un JWT corto con token de renovación, un token opaco guardado en la base y un proveedor de identidad externo.
**Decisión.**
- Nueva tabla `sesion` (`token_hash`, `usuario_id`, `creado_en`, `expira_en`), con llave foránea hacia `usuario` y `ON DELETE CASCADE`.
- Al iniciar sesión, la API genera un token aleatorio de 32 bytes y lo entrega una sola vez a la app. En la base solo se guarda su hash SHA-256, nunca el token.
- La sesión vence a los 30 días y no se renueva en cada petición, para no escribir en la base por cada llamada.
- En cada petición autenticada, la API consulta `sesion` unida con `usuario` por clave primaria. Eso confirma la sesión y trae el rol actual.
- Cerrar sesión borra la fila. Eliminar la cuenta (RF-04) las borra todas por la cascada. Las sesiones vencidas se purgan junto con los eventos procesados (O21).
- Las contraseñas se guardan con un hash lento de buena práctica (propuesto: Argon2id; bcrypt si hay problemas de instalación), según RNF-06. La app guarda el token en el almacenamiento seguro del teléfono.

**Alternativas descartadas.**
- JWT de vida larga sin renovación: para saber si el usuario sigue existiendo, la API tendría que consultar la base igualmente en cada petición, así que no ahorra esa consulta. Además, cerrar sesión solo borraría el token del teléfono y uno robado serviría hasta vencer.
- JWT corto con token de renovación: más seguro, pero exige una tabla de renovación, rotación del token y lógica de renovación en la app, más trabajo y más riesgo para el plazo.
- Proveedor externo (Firebase, Auth0 u otro): la identidad viviría fuera del relacional, lo que contradice RF-01 a RF-04 y RNF-06, y añade una copia más que sincronizar al eliminar la cuenta.

**Por qué.** Cuesta lo mismo que un JWT, no necesita librería de firmas, permite cerrar sesión de verdad y aprovecha la cascada del relacional: al eliminar la cuenta, las sesiones desaparecen sin código extra.
**Costo que se acepta.** Una tabla más y una consulta por clave por petición, despreciable en este volumen. Un token robado sirve hasta que se cierre esa sesión o venza, pero se puede revocar borrando la fila.
**Si se quisiera cambiar más adelante.** Pasar a un JWT corto con renovación reemplazaría la tabla `sesion` por una de tokens de renovación, sin tocar el resto del modelo.
**Dónde.** `modelado/relacional/` (`01` sección 4.9, `02`, `03` I7 y `04` O2, O4, O21, O22 y O23), `requerimientos/levantamiento-requerimientos.md` (sección 4.1) y `modelado/matriz-responsabilidades.md`. Los parámetros de Argon2id y de la vigencia se confirman al implementar.

---

## D-36. Cada contenedor del Compose lleva un límite de memoria y los motores se ajustan a él; los servicios se levantan por perfiles

**Contexto.** La máquina de desarrollo tiene 6 GB de RAM y su Docker también aloja contenedores de otros proyectos. Neo4j corre sobre la JVM y es el servicio más pesado. Un incidente anterior, al lanzar muchas JVM en paralelo, tumbó el motor de Docker.
**Decisión.**
- Cada servicio tiene un tope de memoria en el Compose y, dentro de él, el motor se configura para respetarlo. Valores iniciales, estimados y por ajustar con `docker stats`:

| Servicio | Tope del contenedor | Ajuste interno |
|---|---|---|
| Neo4j 5 Community | 1,25 GB | Montículo 512 MB y caché de páginas 256 MB |
| MongoDB | 512 MB | Caché de WiredTiger de 0,25 GB |
| PostgreSQL | 384 MB | `shared_buffers` de 64 MB y 20 conexiones como máximo |
| API Node (con el worker) | 384 MB | Montículo de Node de 256 MB |

- Los servicios se agrupan en perfiles de Compose: solo se levanta lo que el bloque en curso necesita (por ejemplo, el bloque 1 no necesita Neo4j ni MongoDB).
- Cada base declara una comprobación de salud y la API espera a que esté sana antes de arrancar.

**Alternativas descartadas.**
- Solo ajuste interno, sin tope por contenedor: si un servicio se desborda, afecta a los contenedores de otros proyectos, que fue lo que ocurrió.
- Neo4j en Aura Free solo para desarrollar: libera memoria, pero no es la edición Community de D-22, se pausa por inactividad y depende de internet.

**Por qué.** La JVM y MongoDB no conocen el tope del contenedor por sí solos; si no se configuran, el sistema los mata al pasarse. Los perfiles ahorran unos 1,5 GB mientras se construyen los primeros bloques.
**Costo que se acepta.** Los valores no están medidos: si un servicio se queda corto, se reiniciará y habrá que subirlo. Durante la semana de trabajo conviene apagar los contenedores de otros proyectos.
**Dónde.** `arquitectura/03-eleccion-stack.md`, sección 4.7.

---

## D-37. La validación de datos usa Zod, con esquemas compartidos entre la app y la API

**Contexto.** D-22 deja a la API como responsable de lo que Neo4j Community no impone, y varias decisiones añaden validaciones de formato (identificadores en minúsculas, URL `https://`, puntuaciones de 1 a 5). Hacía falta una librería de validación en Node.
**Decisión.** Se usa Zod. Los esquemas viven en una carpeta común del repositorio y los usan la app y la API.
**Alternativas descartadas.** No se compararon otras librerías de validación: el equipo confirmó Zod.
**Por qué.** Un esquema se escribe una vez y sirve para validar en la API y avisar pronto en los formularios de la app.
**Si se quisiera cambiar más adelante.** El diseño de las bases y de la sincronización no depende de la librería; cambiaría solo la capa de rutas y los formularios.
**Dónde.** `arquitectura/03-eleccion-stack.md`, sección 4.3.

---

## D-38. El bloqueo del trigger del promedio es `FOR NO KEY UPDATE`, no `FOR UPDATE`

**Contexto.** D-02 fija que el trigger bloquea la fila de `obra_resumen` antes de recalcular, y D-33 lo anotó como `SELECT ... FOR UPDATE`. Al implementarlo, la prueba 15 con dos sesiones pasaba, pero una ráfaga de 8 sesiones publicando a la vez sobre la misma obra falló: 6 de las 8 fueron abortadas por interbloqueo (`deadlock detected`), y quedó `total_resenas = 2` en lugar de 8. Salida guardada en `db/evidencias/relacional/hallazgo-interbloqueo-con-for-update.txt`. Con dos sesiones no se veía porque la segunda llegaba cuando la primera ya tenía el candado.
**Causa.** El `INSERT` en `resena` comprueba la llave foránea `fk_resena_obra` y para ello toma `FOR KEY SHARE` sobre la fila de la obra. Ese modo choca con `FOR UPDATE`. Dos transacciones simultáneas reciben primero su `KEY SHARE` y después cada una pide `FOR UPDATE` esperando que la otra suelte el suyo: interbloqueo.
**Decisión.** El trigger conserva el orden de D-02 (bloquear primero, recalcular después) pero con `FOR NO KEY UPDATE`. Ese modo no choca con `KEY SHARE` y sí con otro `NO KEY UPDATE`, así que las reseñas de la misma obra se serializan sin interbloquearse. Es además el modo que el `UPDATE` posterior toma de todos modos, porque no toca la clave.

| Alternativa | Resultado | Descartada porque |
|---|---|---|
| `FOR UPDATE` (la redacción original) | 6 de 8 sesiones abortadas por interbloqueo | Falla en la prueba |
| Sin bloqueo | Pierde una actualización: con dos reseñas quedó `total = 1` y `promedio = 2.00` (control 15c) | Es el problema que D-02 quería evitar |
| Bloqueo consultivo por obra (`pg_advisory_xact_lock`) | Funcionaría | Añade un mecanismo ajeno a la fila, sin ventaja sobre el candado de fila |
| Guardar suma e incrementar | Sin recálculo | Ya descartado en D-02 |

**Por qué.** Se comprobó con el motor (PostgreSQL 18.7): la ráfaga de 8 termina sin errores con `total = 8` y el promedio igual al recálculo manual, en tres ejecuciones seguidas.
**Costo que se acepta.** Sigue siendo posible un interbloqueo entre dos eliminaciones de cuenta simultáneas cuyas reseñas caigan en las mismas obras en distinto orden, porque la cascada de RF-04 bloquea una obra tras otra. **No se probó**: es un caso raro con el volumen del proyecto. La API debe tratar el código `40P01` como reintentable.
**Si se quisiera cambiar más adelante.** Si se necesitara eliminar cuentas en masa, ordenar las obras antes de borrar o usar el bloqueo consultivo.
**Dónde.** `db/relacional/03-trigger.sql`, `db/relacional/pruebas/03-concurrencia.sh` (15a, 15b y los controles 15c y 15d), `modelado/relacional/02-restricciones-integridad.md`, sección 7. Corrige la anotación de D-02 y D-33.

---

## D-39. Versiones fijadas del Compose, puerto de PostgreSQL y comprobación de salud de MongoDB

**Contexto.** Al construir el Compose (D-36) había que fijar versiones y se encontraron dos cosas que los documentos no preveían.
**Decisión.**
- **Versiones:** PostgreSQL 18.7 (imagen Debian), MongoDB 9.0.4 (existe la etiqueta con la que se hicieron las pruebas de los documentos) y Neo4j 5.26.34 Community. Se fijan en `.env.example`.
- **Puerto de PostgreSQL en la máquina:** 5433, no 5432, porque un PostgreSQL local de Windows ya escucha en 5432. Es configurable (`POSTGRES_HOST_PORT`).
- **Comprobación de salud de MongoDB:** abre el puerto TCP; no ejecuta `mongosh`. El ping real lo hacen las pruebas, una vez y a demanda.
- **Scripts dentro del contenedor:** `./db` se monta de solo lectura en `/db` en las tres bases y los scripts se ejecutan allí, no canalizados desde PowerShell, porque Windows PowerShell 5.1 antepone un BOM al texto que se canaliza y Neo4j lo rechazó.

**Alternativas descartadas.**
- PostgreSQL 17.12 o 16.4 (esta última ya estaba en la máquina): más veteranas pero menos recientes; el diseño no usa nada que dependa de la versión.
- Comprobación de MongoDB con `mongosh`: se probó primero. Cada comprobación arranca un proceso Node entero; repetidas dentro del tope de 512 MB dejaron a `mongod` al 800 % de CPU y el contenedor nunca llegó a `healthy`. Subir el tope a más de 512 MB se descartó porque rompe el presupuesto de D-36.

**Por qué.** Se comprobó en el motor: con la comprobación por puerto, MongoDB queda sano en unos 14 s y usa ~205 MB.
**Costo que se acepta.** La comprobación de MongoDB confirma que el puerto está abierto, no que el motor responda a una orden. PostgreSQL 18 guarda los datos en un subdirectorio versionado: el volumen se monta en `/var/lib/postgresql`, no en `/var/lib/postgresql/data`, y un volumen creado con la 16 no se reutiliza.
**Dónde.** `docker-compose.yml`, `.env.example`. El `db/README.md` los documentará al cerrar el entregable.

---

## D-40. Tipos concretos del relacional en PostgreSQL: `TIMESTAMPTZ`, `JSONB` e identidad del outbox

**Contexto.** Los documentos describen tipos genéricos (`TIMESTAMP`, `JSON`, `BIGINT autoincremental`). PostgreSQL pide elegir la variante.
**Decisión.**
- Las fechas son `TIMESTAMPTZ` con `DEFAULT now()` en las de creación (D-13 pide UTC; `TIMESTAMP` sin zona deja la interpretación a quien lee).
- `sync_outbox.payload` es `JSONB`.
- `sync_outbox.evento_id` es `BIGINT GENERATED ALWAYS AS IDENTITY`.
- Los UUID no llevan `DEFAULT`: los genera la aplicación (RNF-08, D-11).
- Todas las restricciones llevan nombre explícito (`pk_`, `uq_`, `ck_`, `fk_`), para que las pruebas comprueben **qué** restricción rechazó, no solo que hubo rechazo.

**Alternativas descartadas.** `TIMESTAMP` sin zona y `JSON` (texto sin índice ni operadores): el diseño no se beneficia de ninguna de las dos. `UUID DEFAULT gen_random_uuid()`: ocultaría un error si la API olvidara generar el id y rompería el mismo id en las tres bases.
**Por qué.** Cambian el tipo, no el diseño: las columnas, claves y restricciones son las de `01` y `02`.
**Costo que se acepta.** Dos reglas del diseño no las impone la base y quedan a cargo de la API: la inmutabilidad de `resena.usuario_id` y `resena.obra_id` (el trigger solo se dispara al cambiar `calificacion` u `oculta`, como dice `02`, sección 7) y el formato de 64 caracteres hexadecimales de `sesion.token_hash` (la columna es `CHAR(64)`, sin CHECK de formato).
**Dónde.** `db/relacional/01-esquema.sql`.

---

## D-41. La búsqueda de personas por nombre usa un índice de texto completo (`standard-folding`) en Neo4j

**Contexto.** CG-01 (obras por el nombre de una persona) y CG-02 (personas por nombre, para reutilizar una existente) filtran por `Persona.nombre`. Los documentos del grafo (`03`, `04` y `05`) terminaban en "después siguen los índices: el nombre de `Persona`" y ese paso no se escribió, así que la decisión estaba pendiente al implementar. Las restricciones de unicidad ya indexan los ids; el nombre no tenía índice.
**Decisión.** Un índice de texto completo `persona_nombre_texto` sobre `Persona.nombre`, con el analizador `standard-folding`. Busca palabras completas sin distinguir mayúsculas ni tildes, igual que los índices de texto del documental (IX-01 e IX-02): `timothee` y `CHALAMET` encuentran a "Timothée Chalamet", y `ferguson villeneuve` encuentra a las dos personas.

| Alternativa | Por qué no |
|---|---|
| Índice `RANGE` sobre `nombre` | Solo acepta igualdad y prefijo, y distingue mayúsculas y tildes: el visitante tendría que escribir el nombre exacto |
| Índice `TEXT` con `CONTAINS` | Admite fragmentos, pero distingue mayúsculas y tildes; habría que guardar además una copia normalizada del nombre |
| Sin índice | Recorrería todos los nodos `Persona` en cada búsqueda, y CG-02 se ejecuta cada vez que el administrador registra a alguien |

**Por qué.** Se comprobó en Neo4j 5.26.34 Community (el índice de texto completo está disponible en esa edición): las pruebas R-16 a R-19 de `db/grafo/pruebas/01-restricciones.cypher`.
**Costo que se acepta.** **No encuentra fragmentos de palabra**: `chala` y `timo` no devuelven nada (prueba R-19), la misma limitación que el documental; RF-05 no pide búsqueda mientras se escribe. El texto de búsqueda es sintaxis Lucene (`*`, `~`, `AND`...), así que la API debe sanearlo antes de pasarlo a CG-01 y CG-02.
**Dónde.** `db/grafo/01-restricciones.cypher`, `db/grafo/consultas/CG-01.cypher` y `CG-02.cypher`. Cierra el "siguiente paso" de `modelado/grafo/04-restricciones.md` y `05-cardinalidad.md`.

---

## D-42. El bloqueo de D-23 se toma reescribiendo `obra_id` en el nodo de la película (`CG-15-bloqueo`), y las pruebas del grafo usan un cliente efímero y la API HTTP

**Contexto.** D-23 dice que la API bloquea el nodo de la película "escribiendo en él dentro de la misma transacción" antes de consultar CG-04 y crear con CG-15, pero no dice **qué** escribir. Escribir una propiedad nueva (un marcador) la dejaría en el nodo y en el modelo. Además, el contenedor de Neo4j va justo de memoria (D-36: 85 % de sus 1,25 GB en reposo) y cada `cypher-shell` es una JVM.
**Decisión.**
- El bloqueo es `MATCH (f:Película {obra_id: $pelicula_id}) SET f.obra_id = f.obra_id` (`db/grafo/consultas/CG-15-bloqueo.cypher`): reescribe la propiedad con el mismo valor, sin dejar nada nuevo en el grafo. La API ejecuta, en **una** transacción: `CG-15-bloqueo`, `CG-04` y, solo si CG-04 no devolvió nada, `CG-15`.
- Los scripts Cypher de creación se ejecutan con `cypher-shell` en un contenedor cliente efímero (`neo4j-cliente`, perfil `herramientas`, tope de 384 MB), no dentro del contenedor de Neo4j.
- Las pruebas del grafo hablan con Neo4j por su API HTTP transaccional desde PowerShell: sin JVM, y con transacciones abiertas e intercaladas para probar la concurrencia desde un solo script.

**Alternativas descartadas.** Un marcador (`SET f.bloqueo = true REMOVE f.bloqueo`): deja una propiedad fuera del modelo si algo falla a medias. Ejecutar `cypher-shell` dentro del contenedor de Neo4j: sumaba una JVM a un contenedor ya al 85 %.
**Por qué.** Se comprobó con el motor (`db/scripts/probar-grafo-concurrencia.ps1`): con el bloqueo, la segunda sesión esperó mientras la primera tenía la transacción abierta y, al confirmar esta, vio su libro, y la película quedó con **un** libro de origen. Sin el bloqueo, las dos comprobaciones pasaron y la película quedó con **dos** (L1 y L2): la violación de RN-07 que D-23 evita.
**Costo que se acepta.** Si la transacción no se confirma o revierte, el candado se retiene hasta que Neo4j la cierre por tiempo de espera: la API debe confirmar o revertir siempre. Las pruebas necesitan Windows PowerShell 5.1.
**Dónde.** `db/grafo/consultas/CG-15-bloqueo.cypher`, `docker-compose.yml` (servicio `neo4j-cliente`), `db/scripts/probar-grafo.ps1` y `probar-grafo-concurrencia.ps1`.

---

## D-43. La semilla sale de un solo JSON con un generador en PowerShell 5.1; los cargadores generados se versionan

**Contexto.** El brief (secciones 6 y 8) pide escribir los datos una vez y generar de ahí los tres cargadores, para que los ids coincidan en las tres bases (RNF-08), pero no dice en qué lenguaje. En esta máquina hay Node 24 y Python 3.14, pero lo único que el equipo tiene asegurado es Windows PowerShell 5.1: todos los scripts de `db/scripts` ya lo usan.
**Decisión.**
- `db/semilla/semilla.json` es la única fuente. `db/semilla/generar.ps1` (PowerShell 5.1, sin dependencias) la valida y escribe `db/relacional/04-semilla.sql`, `db/documental/03-semilla.js` y `db/grafo/02-semilla.cypher`, que se guardan en el repositorio como scripts legibles. `generar.ps1 -Verificar` comprueba que están al día y `cargar-semilla.ps1` lo exige antes de cargar.
- El generador se niega a escribir si la fuente rompe una regla: UUID en minúsculas, referencias a ids inexistentes, los mínimos de D-24, un solo libro de origen por película (RN-07), una comparativa sin `adaptado_a` (RN-06), una reseña sin su estado "terminada" (RF-13), ISBN repetido o con mal dígito de control.
- Lo derivado **no se escribe a mano**: `promedio` y `total_resenas` los calcula el trigger al insertar cada reseña (RN-08); el `reparto` de cada ficha se copia de `actuó_en` (D-12, D-27); `leyó` sale de los estados "terminada" de **libros** (D-16); `obra_resumen` y los nodos de obra salen de los libros y películas.
- Los ids son UUID válidos con un patrón legible por tipo (`a1…` personas, `b1…` libros, `f1…` películas, `c1…` usuarios, `d1…` reseñas, `e1…` ediciones, `11…` listas, `ca…` comparativas), para reconocer una fila de cualquier base de un vistazo al depurar.
- Cada cargador vacía su base antes de cargar (`TRUNCATE`, `deleteMany`, `DETACH DELETE`): se puede repetir.

**Alternativas descartadas.**
- Generador en Node o en Python: más cómodo con JSON, pero añade un requisito de instalación que el equipo no tiene garantizado hoy.
- Un archivo de datos por base: tres fuentes que se desalinean, que es lo que RNF-08 quiere evitar.
- Ids aleatorios: imposibles de reconocer a simple vista en una consulta o en un fallo de coherencia.
- Escribir el reparto, el promedio y `leyó` en el JSON: serían datos derivados a mano que pueden contradecir a las reseñas, los estados y las relaciones.

**Por qué.** El generador valida y escribe los tres archivos en unos 3 s. Los tres cargadores se ejecutaron en las tres bases sin errores (el validador estricto de MongoDB aceptó los 28 documentos) y la coherencia entre bases dio 13 de 13.
**Costo que se acepta.** Los ids con patrón no son los que generará la API (aleatorios, D-11); sirven para la demostración. El generador no reproduce el `$jsonSchema` de MongoDB: lo hace el propio motor al cargar.
**Dónde.** `db/semilla/` (con su `README.md`), `db/scripts/cargar-semilla.ps1`.

---

## D-44. Las contraseñas de la semilla son hashes bcrypt (coste 10) generados con `pgcrypto`

**Contexto.** D-35 fija contraseñas con Argon2id "o bcrypt" y deja los parámetros para cuando se implemente la API. La semilla debe traer un administrador que pueda iniciar sesión, así que `password_hash` no puede ser texto de relleno, y el brief exige que la contraseña de prueba solo aparezca en `db/semilla/README.md`.
**Decisión.** Los 8 usuarios llevan un hash bcrypt `$2a$10$…`, con un *salt* distinto cada uno, generado una sola vez con `crypt(contraseña, gen_salt('bf', 10))` de `pgcrypto` (viene en la imagen `postgres:18.7`), en una base temporal que se borró después. El hash vive en `semilla.json`; la contraseña, solo en `db/semilla/README.md`.
**Alternativas descartadas.**
- Argon2id: ninguna herramienta de la máquina ni de la imagen de PostgreSQL lo genera sin añadir una librería, y elegirla aquí sería decidir la librería de la API.
- Un valor de relleno: las cuentas de la semilla no podrían iniciar sesión.
- La contraseña en claro dentro de `semilla.json` o de los cargadores: contradice RNF-06 y el brief.

**Por qué.** Se comprobó con el motor que los 8 hashes verifican con la contraseña de prueba y rechazan otra (`crypt(contraseña, hash) = hash`).
**Costo que se acepta.** **No se probó con una librería de Node**, porque el proyecto aún no tiene API. Si ésta adopta Argon2id, hay que regenerar los 8 hashes en `semilla.json` (la contraseña de prueba puede seguir siendo la misma) y volver a ejecutar `generar.ps1`.
**Dónde.** `db/semilla/semilla.json` (campo `password_hash`), `db/semilla/README.md`.

---

## D-45. Forma concreta de CG-08, CG-09, CG-21 y CG-23

**Contexto.** `modelado/grafo/01-consultas-y-entidades.md` dice qué filtra y qué devuelve cada una, pero no fija columnas, orden ni casos límite. Faltaba escribirlas.
**Decisión.**

| Consulta | Parámetros | Devuelve |
|---|---|---|
| CG-08 | `$libros_partida` (lista de hasta 20 `obra_id` que entrega O18) y `$usuario_id` | Una fila por (libro recomendado, libro de partida, director): `obra_id`, `partida_id`, `persona_id`, `nombre`, `foto_url`. Excluye los libros de partida y los que el usuario ya `leyó`. La API agrupa por libro recomendado. Una lista vacía devuelve 0 filas |
| CG-09 | `$usuario_id` | Una fila por película: `obra_id`, `libro_id` y `seguidos` (cuántos de los seguidos leyeron ese libro), de más a menos seguidos. No excluye las películas vistas (D-20) |
| CG-21 | ninguno | Una fila por película, **también las que no tienen reparto** (`[]`): `obra_id` y `reparto`, una lista de mapas (`persona_id`, `nombre`, `foto_url`, `personaje`, `orden`) ordenada por `orden`. `foto_url` es nulo si la persona no tiene foto. Termina en `ORDER BY obra_id` para que la API añada `SKIP`/`LIMIT`, como en CG-22 |
| CG-23 | ninguno | Una fila por nodo `Usuario`: `usuario_id`, `sigue` (ids de usuarios) y `leyo` (ids de obra), ordenadas. `leyó` se lee **sin filtrar la etiqueta del destino**, para que una relación hacia una película (que D-16 prohíbe) aparezca y la comparación con `estado_obra` la señale. Termina en `ORDER BY usuario_id` |

CG-21 y CG-23 usan la cláusula de alcance `CALL (variable) { … }`, que exige Neo4j 5.23 o más; la versión fijada (5.26.34, D-39) la admite.
**Alternativas descartadas.** CG-21 con una fila por actor: obliga a la API a reagrupar y pierde las películas sin reparto, que la reconciliación necesita ver (D-24). CG-23 en tres consultas (nodos, `sigue`, `leyó`): tres lecturas sin una vista común y más viajes. CG-08 con un solo libro por fila: pierde el libro de partida y el director que el diseño pide devolver (`05-cardinalidad.md`).
**Por qué.** Se probaron sobre la semilla con 52 comprobaciones del grafo (`db/grafo/pruebas/semilla/01-consultas.cypher`), incluidos los casos negativos de RF-26 y RF-27.
**Dónde.** `db/grafo/consultas/CG-08.cypher`, `CG-09.cypher`, `CG-21.cypher` y `CG-23.cypher`.

---

## D-46. Las pruebas sobre la semilla son de solo lectura y la coherencia entre bases compara fuera de las bases

**Contexto.** Las pruebas existentes crean y borran sus propios datos, y `probar-grafo.ps1` vacía el grafo entero: no sirven para repetir las consultas sobre la semilla. El brief pide además un script de coherencia que falle si algo no cuadra.
**Decisión.**
- Las consultas representativas sobre la semilla no escriben nada que perdure: `06-consultas-semilla.sql` (O17, O18, O20 y O22) corre en una transacción que termina en `ROLLBACK`; `04-consultas-semilla.js` (AP-01 a AP-05, AP-21 y AP-23) lee la base de la aplicación y no la base de pruebas ni la borra; `probar-grafo.ps1 -Semilla` (CG-01 a CG-10 y CG-21 a CG-23) no limpia el grafo. `probar-semilla.ps1` las ejecuta juntas. Las pruebas que borran siguen siendo las de antes: se corren antes de cargar la semilla.
- `db/scripts/coherencia.ps1` exporta de cada base con un solo proceso (`psql` y `mongosh` dentro de su contenedor; Neo4j por la API HTTP, sin JVM) y compara en PowerShell. Hace 13 comprobaciones: las cinco de la sección 8 del brief y además D-24, huérfanos, borradores, ISBN, comparativas y administrador. Sale con código 1 si alguna falla.
- Como el script compara las bases entre sí y no contra `semilla.json`, sirve igual con datos reales cuando exista la API (reconciliación, RNF-03).

**Alternativas descartadas.** Comparar cada base contra `semilla.json`: solo valdría para la semilla recién cargada. Una consulta de reconciliación dentro de cada base: ninguna ve a las otras dos.
**Por qué.** Se comprobó que el script **sabe fallar**: se introdujeron 12 corrupciones deliberadas (4 en PostgreSQL, 2 en MongoDB y 6 en Neo4j) y 12 de las 13 comprobaciones fallaron, con código de salida 1, señalando el dato exacto; la 13.ª (ISBN, que no se tocó) pasó. Salida en `db/evidencias/semilla/coherencia-prueba-negativa.txt`. Tras recargar la semilla, 13 de 13.
**Costo que se acepta.** C-12 (ISBN repetido) no se probó con una corrupción: el índice único *sparse* de MongoDB (IX-03) impide insertar un ISBN repetido, y eso ya lo cubren las pruebas de índices. Una ejecución completa de `coherencia.ps1` tarda unos 15 s, sobre todo por el proceso de `mongosh`.
**Dónde.** `db/relacional/pruebas/06-consultas-semilla.sql`, `db/documental/pruebas/04-consultas-semilla.js`, `db/grafo/pruebas/semilla/01-consultas.cypher`, `db/scripts/probar-semilla.ps1`, `db/scripts/coherencia.ps1`, y los exportadores `coherencia-exportar.sql` y `coherencia-exportar.js`.

---

## D-47. La caché de páginas de Neo4j baja de 256 a 128 MB tras medir el consumo (ajusta D-36)

**Contexto.** D-36 fijó valores iniciales "por ajustar con `docker stats`". Con la semilla cargada, Neo4j marcaba 81–85 % de su tope de 1,25 GB. Se midió qué parte era memoria que el sistema no puede liberar: el proceso de la JVM ocupaba unos 1000 MiB de forma estable (sin reinicios ni muertes por memoria), repartidos entre el montículo de 512 MB, la caché de páginas y la memoria interna de la JVM. No era una fuga: era el suelo de la configuración. Los topes de los contenedores ya suman unos 2,1 GB (2,5 GB con el cliente efímero y unos 2,9 GB con la API de D-36) sobre los ~3 GB que ve Docker, así que subir el tope de Neo4j no cabe.
**Decisión.** `NEO4J_server_memory_pagecache_size` pasa de `256m` a `128m`. El montículo (512 MB) y el tope del contenedor (1,25 GB) no cambian. La caché de páginas guarda en memoria los datos del grafo y el de la semilla ocupa unos pocos MB.

| Alternativa | Por qué no |
|---|---|
| Bajar el montículo a 384 MB | Con `ExitOnOutOfMemoryError`, quedarse corto mata el proceso, y CG-06 (caminos más cortos, profundidad 6) es lo que más montículo pedirá cuando el grafo crezca |
| Subir el tope del contenedor | No cabe en los ~3 GB de Docker junto con los demás servicios |
| Subir el límite de memoria de Docker/WSL | Depende de la máquina y de los otros proyectos; no lo decide el diseño |
| No tocar nada | Válida (no hubo ningún fallo), pero deja menos margen para picos |

**Por qué.** Se comprobó con el motor (Neo4j 5.26.34): tras reiniciar con 128 MB la JVM pasó de 1000 MiB a 768 MiB **en reposo**, pero después de cargar la semilla y correr todas las pruebas, la memoria no liberable (`anon`) quedó en 920 MiB frente a 975 MiB antes: **la mejora bajo carga es de unos 55 MiB (6 %)**, mucho menos que en reposo, porque el resto del crecimiento es memoria interna de la JVM, no la caché. Con `docker stats` pasó de 81–85 % a 79 % tras la carga y a 67 % en reposo. Con el cambio pasan las 137 comprobaciones del grafo, la prueba de concurrencia de D-23, las 117 consultas sobre la semilla y las 13 de coherencia, sin reinicios ni muertes por memoria.
**Costo que se acepta.** El margen ganado es pequeño; no se midió si el consumo se estabiliza a largo plazo con la API en marcha. Con un grafo mucho mayor que el de la semilla, 128 MB de caché obligarían a Neo4j a leer más del disco: habría que volver a medir (y, si hace falta, subirla de nuevo). El resto del consumo (unos 175 MiB que aparecen al trabajar, de 768 a 943 MiB de proceso) es memoria interna de la JVM; reducirla pide ajustes de la JVM (código compilado, metaspacio) que no se probaron.
**Dónde.** `docker-compose.yml` (servicio `neo4j`) y `docs/arquitectura/03-eleccion-stack.md` (tabla de memoria). Ajusta D-36; el brief del Entregable 4 conserva los valores iniciales.

---

## D-48. `reconstruir.ps1` borra solo los volúmenes del proyecto, levanta una base cada vez, prueba sobre bases vacías y carga la semilla al final

**Contexto.** El brief pide un solo comando de PowerShell que reconstruya todo desde cero (borra volúmenes, crea, carga y prueba). Tres cosas no estaban decididas: qué se borra, en qué orden se hace cada cosa y qué pasa con la semilla que `construir.sh` ya cargaba por su cuenta. Las pruebas de `db/*/pruebas/` crean y borran sus datos y `probar-grafo.ps1` vacía el grafo entero, así que no pueden correr después de cargar la semilla sin destruirla.
**Decisión.** `db/scripts/reconstruir.ps1` ejecuta en este orden y deja la salida de cada paso en `db/evidencias/reconstruccion/`:
1. **Borrar** con `docker compose --profile todas --profile herramientas down -v --remove-orphans`, que solo alcanza los contenedores y los tres volúmenes del proyecto `dlbp`; no toca nada de otros proyectos, que comparten este Docker. Como borra datos, **pide escribir `SI`**; `-Forzar` omite la pregunta.
2. **Levantar** PostgreSQL, MongoDB y Neo4j **de uno en uno** con `up -d --wait`, para no arrancar a la vez los procesos pesados (D-36).
3. **Construir los esquemas sin semilla**: los tres `construir.sh` aceptan `SIN_SEMILLA=1` y entonces omiten sus archivos de semilla.
4. **Pruebas** de las tres bases y la de concurrencia de D-23, sobre bases vacías. Un paso de pruebas que falla no detiene la reconstrucción (se anota y se sigue); un fallo al borrar, levantar o construir sí la detiene.
5. **Cargar la semilla** y repetir sobre ella las consultas y la coherencia (solo lectura).
Termina con código 1 si falló algún paso. `-SinPruebas` omite el paso 4.

**Alternativas descartadas.**
- Construir con la semilla y correr las pruebas encima: las pruebas borran el grafo entero y habría que recargar de todos modos; además no se sabe si las pruebas relacionales y documentales toleran datos ajenos (no se probó).
- `up --profile todas` de una vez: arranca las tres bases a la vez, lo que D-36 quiere evitar (no se probó si tumba Docker, pero es el riesgo que motivó la regla).
- Limpiar con `docker system prune` o `docker volume prune`: alcanzaría volúmenes y contenedores de otros proyectos.
- No pedir confirmación: un comando que borra datos no debe poder lanzarse sin querer.

**Por qué.** Se ejecutó una vez desde cero con `-Forzar` y pasaron los 13 pasos en **202 s (3,4 min)**: 6 s en borrar, 12 s en levantar PostgreSQL, 7 s MongoDB, 42 s Neo4j, 20 s en construir los esquemas, 70 s en las pruebas, 22 s en cargar la semilla y 22 s en consultar y comprobar la coherencia. Al terminar: 8 usuarios, 23 obras, 18 reseñas, 11 libros, 12 películas y 5 comparativas; los tres contenedores sanos y Neo4j sin reinicios. Se comprobó además que responder `NO` a la confirmación cancela con código 1 sin tocar los contenedores.
**Costo que se acepta.** **No se ejercitaron** la ruta sin `-Forzar` hasta el final (solo la cancelación), `-SinPruebas`, la falta de `.env` ni Docker apagado. Un fallo a medias deja las bases a medio construir: se arregla ejecutando de nuevo el script. Cada paso se ejecuta con `chcp 65001` para que los registros de los scripts hijos queden en UTF-8; se comprobó en el de `probar-grafo.ps1`, que es el que lleva acentos.
**Dónde.** `db/scripts/reconstruir.ps1`, `db/relacional/construir.sh`, `db/documental/construir.sh`, `db/grafo/construir.sh` y `db/README.md`.

---

## D-49. CG-06 con origen igual a destino falla en el motor: la API lo rechaza antes de llamarla

**Contexto.** Al ejecutar el catálogo de operaciones (Entregable 5, caso `CG-06-l3`) se probó CG-06 con el mismo id como origen y destino. Los documentos (`01-consultas-y-entidades.md`, D-17) no preveían el caso. Neo4j 5.26.34 responde con un **error de base de datos, no de cliente**: `Neo.DatabaseError.Statement.ExecutionFailed: The shortest path algorithm does not work when the start and end nodes are the same`. La consulta que se había escrito para ese caso esperaba "0 filas"; el motor dijo otra cosa.
**Decisión.** La API compara `origen_id` y `destino_id` **antes** de llamar a CG-06 y responde un error de validación (400) si son iguales. Si el producto prefiere devolver "un camino de longitud 0" en lugar de rechazarlo, lo resuelve también la API, sin llamar al grafo. `db/grafo/consultas/CG-06.cypher` **no cambia**.

| Alternativa | Por qué no |
|---|---|
| Añadir `WHERE a <> b` dentro de CG-06 | Cambia una consulta ya probada con las pruebas del grafo (`probar-grafo.ps1` vacía el grafo entero y habría que recargar la semilla) y esconde una entrada que ya es un error de uso |
| Dejar que el error llegue al usuario | Es un `DatabaseError`: la API lo trataría como fallo interno (500) |

**Por qué.** Se comprobó con el motor sobre la semilla: `db/evidencias/catalogo/grafo.txt`, caso `CG-06-l3`.
**Costo que se acepta.** Un cliente que llame a CG-06 sin esa validación verá un error interno. Es la misma clase de regla que D-41 (sanear el texto de CG-01 y CG-02) y D-22 (la API valida lo que Community no puede).
**Dónde.** `db/evidencias/catalogo/grafo.txt` (CG-06-l3), `db/grafo/pruebas/catalogo/01-catalogo.cypher`. La API (Entregable 6) debe implementarlo.

---

## D-50. La evidencia del catálogo no toca la semilla: transacciones revertidas, base aparte y datos de prueba que se borran; las operaciones integradas hacen de API y marcan lo simulado

**Contexto.** El Entregable 5 pide casos normales, límite y de error de **todas** las operaciones, escrituras incluidas, con evidencia guardada. Las pruebas de `db/*/pruebas/` (salvo las de la semilla) crean y **borran** sus datos y `probar-grafo.ps1` vacía el grafo entero (D-46, D-48), así que no sirven para repetir las operaciones sobre la semilla. Tampoco existen todavía la API ni el worker.
**Decisión.**
- **PostgreSQL** (`07-catalogo.sql`): una sola transacción que termina en `ROLLBACK`. Cada operación O1 a O23 es una función temporal (`pg_temp`) que ejecuta los pasos de `04-operaciones.md` en su orden. Las escrituras usan usuarios y obras de prueba creados dentro de la transacción; la única que borra datos de la semilla (O4 sobre Ana) va al final.
- **MongoDB** (`05-catalogo.js`): las lecturas de la semilla van a la base `dlbp`, que no se escribe; las escrituras van a `dlbp_pruebas`, construida con los mismos `01-colecciones.js` y `02-indices.js` (validador e índices reales) y a la que se **copia** la semilla. Se borra al terminar.
- **Neo4j** (`catalogo-grafo.ps1`): cada caso abre una transacción por la API HTTP, ejecuta sus pasos dentro de ella y la **revierte**. Consecuencia: un paso con error cierra la transacción, así que el error va en el último paso del caso.
- **Operaciones integradas** (`catalogo-integradas.ps1`): el script hace de API y llama a las tres bases en el orden de `04-fuente-de-verdad-y-sincronizacion.md`. Usan ids `99000000-...`, los crean y los borran en un bloque `finally`, y terminan con `coherencia.ps1`. Cada paso del registro lleva `[REAL]` (lo ejecutó una base) o `[SIMULADO]` (lo haría el worker o la reconciliación, que no existen).
- Los casos se identifican como `O5-n1`, `AP-18-e1`, `CG-14-l3`, `INT-07-n2` (n normal, l límite, e error). El **esperado** se escribe en el script; el **obtenido** lo produce el motor; el resultado compara ambos.

**Alternativas descartadas.**
- Reconstruir las bases tras cada bloque de pruebas (4 minutos por vuelta): la semilla se perdería a mitad de camino.
- Una base PostgreSQL aparte para las escrituras: la transacción con `ROLLBACK` ya aísla, sin construir un esquema más.
- Escribir en `dlbp` y limpiar a mano en todos los casos de MongoDB: queda reservado a las integradas, que necesitan que la ficha viva en la base real para que la coherencia entre bases la vea.

**Por qué.** Se ejecutó todo sobre la semilla: **148 casos relacionales, 178 documentales, 153 de grafo y 35 integrados pasan** y `coherencia.ps1` da 13 de 13 antes y después (`db/evidencias/catalogo/resumen.txt`).
**Costo que se acepta.**
- Las funciones `pg_temp` **repiten** el SQL de `04-operaciones.md`: si el documento cambia, hay que actualizarlas.
- `sync_outbox.evento_id` **avanza** aunque se revierta (una secuencia de PostgreSQL no vuelve atrás): tras la ejecución el último id usado es 127 con la bandeja vacía.
- Lo simulado no demuestra el worker: ni el aviso en memoria, ni los reintentos, ni el estado `fallido` por agotar intentos en un ciclo real. Solo el efecto de aplicar cada evento a mano.
- `coherencia.ps1` reescribe `db/evidencias/semilla/coherencia.txt` en cada ejecución (la hora y los tiempos); tras correr el catálogo se restauró con `git checkout`.
- Un fallo a medias en una integrada podría dejar datos `99000000-...`: el script empieza borrándolos (`Limpiar-Todo`) y `coherencia.ps1` los detectaría.
**Dónde.** `db/relacional/pruebas/07-catalogo.sql`, `db/documental/pruebas/05-catalogo.js`, `db/grafo/pruebas/catalogo/01-catalogo.cypher`, `db/scripts/catalogo.ps1`, `catalogo-grafo.ps1` y `catalogo-integradas.ps1`, `db/evidencias/catalogo/`.

---

## D-51. El catálogo del Entregable 5 se genera desde una fuente escrita a mano y la evidencia guardada; el generador falla si algo no cuadra

**Contexto.** El catálogo pide, por operación, seis puntos y que cada «resultado obtenido» cite la evidencia sin escribirse a mano. Son 81 fichas y 514 casos: copiar los resultados a mano los habría desalineado de la evidencia en la primera repetición.
**Decisión.** `docs/entregables/entregable-5-catalogo.md` **no se edita**: lo genera `db/scripts/generar-catalogo.ps1` (Windows PowerShell 5.1, con BOM porque lleva acentos) a partir de dos fuentes. (1) `docs/entregables/catalogo-operaciones.json`, escrito a mano: propósito, bases, parámetros y validaciones, resultado esperado, enlaces y evidencia previa de cada operación, más los textos fijos. (2) `db/evidencias/catalogo/*.txt`: los casos, su descripción y el resultado obtenido, tal como los imprimieron los motores. El generador **termina con error** si una operación no tiene casos normal, límite y error, si un caso no pasó, si hay casos que no pertenecen a ninguna operación o si una operación no tiene evidencia; `-Verificar` comprueba que el archivo en disco corresponde a la fuente y a la evidencia.
**Alternativas descartadas.** Escribir el catálogo a mano (se desalinea al repetir la evidencia); generarlo con Node o Python (mismo argumento que D-43: solo está asegurado PowerShell 5.1); poner los casos también en el JSON (serían una segunda copia del resultado).
**Por qué.** Se generó con 81 operaciones y 514 casos; se comprobó que las cifras coinciden con los archivos de evidencia (148 relacionales, 178 documentales, 153 de grafo y 35 integrados), que los 44 enlaces y las 81 anclas existen y que las 178 citas a la evidencia del Entregable 4 apuntan a casos que están en sus archivos.
**Costo que se acepta.** El propósito, los parámetros y el resultado esperado son texto escrito a mano en el JSON: si un documento de diseño cambia, hay que actualizarlos (el generador no lo detecta). Las citas a la evidencia previa también son texto; la revisión de este escalón las verificó una vez, pero no se repite sola. Los resultados obtenidos de varios pasos en el grafo muestran el último paso del caso.
**Dónde.** `docs/entregables/catalogo-operaciones.json`, `docs/entregables/entregable-5-catalogo.md`, `db/scripts/generar-catalogo.ps1`.

---

## D-52. La API es REST, versionada en `/api/v1` y documentada con OpenAPI

**Contexto.** El Entregable 6 pide "API REST o GraphQL, según la decisión justificada del equipo". D-32 fijó Node con Express, pero no el estilo de la API ni cómo se documenta su contrato.
**Decisión.** API REST con JSON, bajo el prefijo `/api/v1`. El contrato se documenta en OpenAPI, en `docs/api/openapi.yaml`, y se escribe junto con cada ruta, no al final.
**Alternativa descartada.** GraphQL: un solo endpoint con resolvers y esquema como contrato.
**Por qué.**
- Encaja con lo ya decidido: Express para las rutas, Zod para validar la entrada (D-37) y las capas de rutas, servicios y repositorios.
- Las operaciones del dominio son un conjunto cerrado y conocido (RF-01 a RF-27), con un solo cliente (D-28): no hace falta que el cliente componga consultas.
- GraphQL añadiría una librería de servidor y otra de cliente, resolvers que habría que optimizar para no encadenar consultas a tres bases y un modelo de errores distinto, en un plazo que no lo permite.
- La autorización por rol y propiedad (RN-09, RN-10) se aplica ruta por ruta.
**Costo que se acepta.** Algunas pantallas reciben más campos de los que muestran, y el contrato OpenAPI hay que mantenerlo a mano junto al código. El prefijo `/api/v1` recoge la advertencia de D-28: las apps instaladas siguen llamando a la API.
**Si se quisiera cambiar más adelante.** Cambiaría la capa de rutas y el cliente de la app; servicios y repositorios no dependen del estilo de la API.
**Dónde.** `AGENTS.md`, `docs/api/openapi.yaml` (se crea al implementar el Entregable 6).

---

## D-53. El código se organiza en `backend/`, `frontend/` y `shared/`

**Contexto.** `arquitectura/05-orden-de-construccion.md` hablaba de `api/`, `app/` y una carpeta compartida, mientras que el repositorio ya tenía las carpetas vacías `backend/` y `frontend/`.
**Decisión.** `backend/` (API, worker y reconciliación), `frontend/` (app Android con Expo) y `shared/` (esquemas Zod y tipos que usan las dos, D-37). `db/` y `docs/` no cambian.
**Alternativa descartada.** `api/`, `app/` y la carpeta compartida: habría que borrar las carpetas ya creadas y se aleja de la estructura que sugiere la guía (sección 10).
**Dónde.** `AGENTS.md` y `arquitectura/05-orden-de-construccion.md` (bloque 0).

---

## D-54. Qué se ve de otro usuario, y no hay buscador de usuarios ni listado de novedades

**Contexto.** Al recorrer los flujos de la aplicación (`api/endpoints.md`) se vio que ningún requerimiento permite buscar usuarios, que RF-22 reserva perfiles, reseñas y listas a quien sigue (aunque las reseñas ya son públicas en cada ficha) y que D-06 mencionaba un "feed" que ningún requerimiento pide.
**Decisión.**
- Cualquier usuario con sesión ve el perfil básico de otro (nombre y biografía), para poder decidir si lo sigue. Sus listas y su historial de reseñas, solo si lo sigue.
- No hay buscador de usuarios: se llega a un perfil desde el nombre del autor de una reseña o de una comparativa.
- No hay listado de novedades de los seguidos: RF-22 se cumple entrando a cada perfil.

**Alternativas descartadas.** Un buscador de usuarios o un feed: son alcance nuevo.
**Costo que se acepta.** Solo se puede seguir a quien haya publicado algo que se haya visto. Para la demo, la semilla debe dar ese camino.
**Dónde.** `api/endpoints.md` (secciones 2.5 y 6).

---

## D-55. El administrador ve las reseñas ocultas de una obra

**Contexto.** O17 solo lista reseñas no ocultas, así que una reseña ocultada por error no se podía volver a encontrar para mostrarla (RF-18).
**Decisión.** Hay una consulta de las reseñas de una obra incluidas las ocultas, solo para el rol `admin`.
**Alternativa descartada.** Dejar la moderación sin vuelta atrás desde la aplicación.
**Dónde.** `modelado/relacional/04-operaciones.md` (O17) y `api/endpoints.md`.

---

## D-56. Una obra en borrador no se reseña, marca ni agrega a listas, y no aparece en los resultados del grafo

**Contexto.** Los documentos ocultan los borradores del catálogo, pero no decían si se podía reseñar uno, y el grafo no sabe qué está publicado.
**Decisión.**
- La API responde 404 al reseñar, marcar el estado o agregar a una lista una obra en borrador, como ya se hace con las comparativas.
- Los caminos y las recomendaciones que incluyan una obra en borrador se descartan de la respuesta antes de enviarla a un lector.

**Alternativa descartada.** Mostrarlos sin título o permitir actividad sobre obras que el usuario no puede ver.
**Costo que se acepta.** Una consulta a la ficha antes de esas escrituras y un filtro en la API.
**Dónde.** `api/endpoints.md`.

---

## D-57. Paginación de 20, reseña de hasta 3000 caracteres y contraseña de al menos 8

**Contexto.** Ningún documento fijaba el tamaño de página, el máximo del texto de una reseña ni las reglas de la contraseña.
**Decisión.**
- Los listados largos devuelven 20 elementos por defecto y se paginan con un cursor por fecha.
- El texto de una reseña tiene como máximo 3000 caracteres, el mismo límite que una sinopsis. Lo valida la API; la columna sigue siendo `TEXT`.
- La contraseña tiene al menos 8 caracteres. Lo valida la API.

**Alternativas descartadas.** Paginar por número de página (se desplaza al publicarse reseñas nuevas); no poner límites.
**Dónde.** `api/endpoints.md` y los esquemas de `shared/` cuando existan.

---

## D-58. Un alta que falla a medias responde 503 con el id creado y se completa sin repetirla

**Contexto.** El alta de una obra escribe en las tres bases sin transacción común (D-24) y la API genera los ids (D-11): repetir el envío crearía otra obra.
**Decisión.** Si la ficha ya se creó y un paso posterior falla, la API responde 503 con el `obra_id`, y la obra queda en `borrador`. La app no repite el alta: pide completar la publicación de ese id.
**Alternativas descartadas.** Responder éxito con la obra en borrador (oculta el fallo) o que la app genere el id (contradice D-11).
**Costo que se acepta.** Hace falta una forma de completar la publicación. Si se recorta ese endpoint, lo hace el script de reconciliación (D-10).
**Dónde.** `api/endpoints.md` (flujo F8).
