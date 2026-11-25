# Entregable 5, escalón 1: inventario de operaciones y evidencia

Borrador de trabajo. Lista **todas** las operaciones vigentes de las tres bases, propone las operaciones integradas y dice, para cada una, qué evidencia hay hoy y cuál falta. Con esto se decide el alcance del Escalón 2 (scripts de evidencia) y la plantilla del Escalón 3 (catálogo).

## 1. Cómo leer las tablas

**Evidencia hoy** (lo que ya hay guardado en `db/evidencias/`, comprobado leyendo los archivos):

| Marca | Significa |
|---|---|
| **Sí** | La operación se ejecutó con caso normal, límite y de error, y la salida está guardada |
| **Parcial** | Hay salida guardada que ejerce una parte (una restricción, el trigger, una sola rama), pero faltan casos o no se ejecutó la operación tal como la describe el documento |
| **No** | No hay salida guardada de esta operación |

Abreviaturas de archivos de evidencia: `rel/NN` = `db/evidencias/relacional/NN-*.txt`; `doc/NN` = `db/evidencias/documental/NN-*.txt`; `graf/NN` = `db/evidencias/grafo/NN-*.txt`; `sem/rel`, `sem/doc`, `sem/graf` = `db/evidencias/semilla/consultas-relacional.txt`, `consultas-documental.txt`, `grafo-01-consultas.txt`. Los ids de caso son los que ya imprimen las pruebas (`1`, `12c`, `Q-O18a`, `K-02`, `R-14`, `S-AP21a`...).

**Cuántas hay** (vigentes, sin las retiradas O6, AP-06, AP-22, AP-31 y CG-12): **22 relacionales + 30 documentales + 24 de grafo = 76**, más las integradas de la sección 5.

## 2. Relacional (PostgreSQL): 22 operaciones

| ID | Operación | Evidencia hoy | Qué falta |
|---|---|---|---|
| O1 | Registrar usuario | Parcial: `rel/01` 1 (UNIQUE del correo), 1b (correo en mayúsculas), E7 (rol `lector` por defecto) | El alta completa con su evento `usuario_creado` en la misma transacción |
| O2 | Iniciar sesión | Parcial: `rel/01` 16, 17a, 17b (CHECK de vigencia de `sesion`) | Insertar la sesión con el hash del token y 30 días; correo inexistente |
| O3 | Editar perfil | No | Normal, límite (biografía vacía) y error (usuario ajeno: 0 filas) |
| O4 | Eliminar cuenta (cascada de RF-04) | Parcial: `rel/01` 10-antes, 10a, 10b, 11a a 11c, 16 (cascada completa sin huérfanos y trigger recalcula el promedio) | El evento `usuario_eliminado` escrito antes del borrado en la misma transacción; que un fallo deshaga ambos |
| O5 | Registrar obra (idempotente) | No (solo las llaves foráneas que la usan, `rel/01` 7a a 7c) | Alta, repetirla sin efecto, tipo inválido |
| O7 | Publicar reseña (transacción) | Parcial, la más cubierta: `rel/02` 14a, 14b, 14c (rollback y éxito); `rel/03` 15a, 15b (concurrencia); `rel/01` 2, 3a, 3b, 7a | Evento `obra_leida` solo si el estado anterior no era `terminada` (caso: ya terminada, sin evento) |
| O8 | Editar reseña | Parcial: `rel/01` 12c (el trigger recalcula al editar) | La operación con `actualizado_en`; reseña ajena (0 filas); calificación fuera de rango al editar |
| O9 | Eliminar reseña | Parcial: `rel/01` 12f | Que el estado de la obra sigue `terminada`; reseña ajena |
| O10 | Moderar reseña | Parcial: `rel/01` 12d, 12e, 13 (ocultar, mostrar, única reseña oculta) | Eliminar por moderación; rol no admin es de la API |
| O11 | Marcar estado de una obra | Parcial: `rel/01` 8a (estado fuera de la lista), E7 | Las tres transiciones con su evento (a `terminada`, de `terminada`, otro cambio sin evento) |
| O12 | Crear, renombrar y eliminar lista | No (la cascada vía `usuario` sí: `rel/01` 10a) | Crear, renombrar, eliminar con sus elementos; nombre repetido permitido |
| O13 | Agregar y quitar obra de una lista | Parcial: `rel/01` 6 (obra repetida), 7c (obra inexistente), E4 (posición 0) | Posición = última + 1; quitar sin renumerar |
| O14 | Reordenar lista | No | Reordenar a 1..n; lista de un elemento; id ajeno a la lista |
| O15 | Seguir usuario | Parcial: `rel/01` 4 (a sí mismo), 5 (repetido) | Alta normal con evento `seguimiento_creado`; usuario inexistente |
| O16 | Dejar de seguir | No | Baja con evento; si no existía, sin evento |
| O17 | Consultas de lectura (11 consultas) | Parcial alta: `rel/05` Q-O17a a Q-O17h; `sem/rel` S-O17a a S-O17j; planes en `rel/04` (I-02 a I-08) | Resultado de 5 de las 11: reseñas de un usuario (RF-22), listas de un usuario, perfil, estado de una obra concreta, reseña del usuario sobre una obra |
| O18 | Libros de partida para recomendar | **Sí**: `rel/05` Q-O18a a Q-O18c; `sem/rel` S-O18a a S-O18h (normal, límite y negativos) | Nada |
| O19 | Propagar eventos al grafo | No (no existe el worker). Solo el plan del índice I6: `rel/04` I-09, I-12, I-13 | **Simulado** (sección 6): tomar pendientes, aplicar al grafo, marcar `procesado` o `fallido` |
| O20 | Datos para reconciliación | Parcial: `rel/05` Q-O20a, Q-O20b; `sem/rel` S-O20a a S-O20c (solo la verificación del promedio) | Las otras listas: seguimientos, `terminada` de libros, ids de obras y usuarios, eventos `fallido` |
| O21 | Purgar eventos y sesiones vencidas | No | En transacción con ROLLBACK: borra lo vencido y conserva lo vigente |
| O22 | Validar la sesión | **Sí**: `rel/05` Q-O22a a Q-O22d; `sem/rel` S-O22a a S-O22d | Nada |
| O23 | Cerrar sesión | No | Borrar la sesión; token inexistente |

## 3. Documental (MongoDB): 30 patrones

Las pruebas documentales corren en la base aparte `dlbp_pruebas`; las de semilla, sobre `dlbp` en solo lectura.

| ID | Operación | Evidencia hoy | Qué falta |
|---|---|---|---|
| AP-01 | Ficha completa de un libro | **Sí**: `doc/02` 9-AP01; `sem/doc` S-AP01a a S-AP01c | Id inexistente (resultado vacío) |
| AP-02 | Ficha completa de una película | **Sí**: `doc/02` 9-AP02; `sem/doc` S-AP02a a S-AP02d | Id inexistente |
| AP-03 | Buscar obras por título | **Sí**: `doc/02` 7a a 7d, 8, 9-AP03; `sem/doc` S-AP03a a S-AP03g | Nada |
| AP-04 | Datos de presentación de varias obras | **Sí**: `doc/02` 9-AP04; `sem/doc` S-AP04a, S-AP04b | Lista vacía de ids |
| AP-05 | Existencia y estado de publicación | **Sí**: `sem/doc` S-AP05a a S-AP05d | Nada |
| AP-07 | Crear ficha de libro (borrador) | Parcial: `doc/01` 1, 2a, 3a, 4, 5a, 5b, 6a, 7a, 11a (válidos e inválidos del validador) | La creación como `borrador` con `creado_en`/`actualizado_en`, y que un visitante no la vea (`sem/doc` S-AP03d lo muestra con la semilla) |
| AP-08 | Crear ficha de película (borrador) | Parcial: `doc/01` 1, 2b, 6b, 6c, 11b, 11c | Igual que AP-07 |
| AP-09 | Publicar una ficha (idempotente) | No | Borrador a publicada; repetirla sin efecto; ficha inexistente o ya publicada |
| AP-10 | Corregir datos descriptivos | Parcial: `doc/01` 24a, 24b, 24c (portada), 17a (título vacío rechazado) | Título y demás campos; `actualizado_en` |
| AP-11 | Agregar una edición | **Sí**: `doc/01` 12a, 15; `doc/02` 1, 4, 9-AP11 | Nada |
| AP-12 | Corregir una edición | **Sí**: `doc/01` 18, 19a a 19c | Nada |
| AP-13 | Quitar una edición | No | Quitar; edición inexistente |
| AP-14 | Agregar una plataforma | **Sí**: `doc/01` 9b, 12b, 16 | Nada |
| AP-15 | Corregir el nombre de una plataforma | **Sí**: `doc/01` 20, 21, 21b | Nada |
| AP-16 | Quitar una plataforma | No | Quitar; nombre inexistente |
| AP-17 | Reemplazar el reparto | **Sí**: `doc/01` 9d, 12c, 25a, 25b, 26 | Nada |
| AP-18 | Publicar una comparativa | **Sí** (solo la parte del documental): `doc/01` 1, 2c, 10a a 10g, 13; `doc/02` 5, 6 | La validación previa de la API: ver INT-06 |
| AP-19 | Comparativa de un usuario sobre una pareja | Parcial: `doc/02` 9-AP19 | Caso vacío (aún no existe) |
| AP-20 | Una comparativa por id | Parcial: `doc/02` 9-AP20 | Id inexistente; oculta vista por quien no es autor ni admin |
| AP-21 | Comparativas de una adaptación | **Sí**: `doc/02` 9-AP21, 9-AP21b, 9-AP21c; `sem/doc` S-AP21a a S-AP21f | Nada |
| AP-23 | Comparativas de un usuario | **Sí**: `doc/02` 9-AP23; `sem/doc` S-AP23a a S-AP23e | Nada |
| AP-24 | Editar una comparativa propia | Parcial: `doc/01` 17b (puntuación 7 rechazada en una actualización) | Edición válida; que no cambia usuario ni obras; usuario ajeno (0 documentos) |
| AP-25 | Eliminar una comparativa propia | No | Eliminar; ajena (0 documentos) |
| AP-26 | Ocultar o mostrar una comparativa | Parcial: `doc/01` 14 | Mostrar de nuevo; que no cambia `actualizado_en` (supuesto 5) |
| AP-27 | Eliminar por moderación | No | Eliminar; id inexistente |
| AP-28 | Eliminar las comparativas de un usuario | **Sí**: `doc/02` 9-AP28, 9-AP28b (idempotente) | Nada |
| AP-29 | Fichas publicadas para la reconciliación | No (indirecta: `coherencia.ps1` recorre las fichas con otro `find`, no con esta consulta) | La consulta del patrón, por lotes |
| AP-30 | Borradores antiguos | No. Además el umbral no está definido (supuesto 7) | Fijar un umbral de prueba y ejecutar |
| AP-32 | Reparto de todas las películas | No (indirecta: `coherencia.ps1`, comprobación C-05) | La consulta del patrón, por lotes |
| AP-33 | Usuarios con comparativas | **Sí**: `doc/02` 9-AP33, 9-AP33b | Nada |

## 4. Grafo (Neo4j): 24 consultas

Las pruebas `graf/01` y `graf/02` están en `db/evidencias/grafo/`; **cada vez que se ejecuta `probar-grafo.ps1` vacía el grafo entero**, así que las del catálogo no pueden volver a ejecutarlo sobre la base de la aplicación.

| ID | Consulta | Evidencia hoy | Qué falta |
|---|---|---|---|
| CG-01 | Obras por nombre de persona | **Sí**: `graf/03` Q-00.2 a Q-00.5; `sem/graf` | Texto con sintaxis Lucene (D-41, la API debe sanearlo) |
| CG-02 | Personas por nombre | **Sí**: `graf/03` Q-00.6; `graf/01` R-18, R-19 | Nada |
| CG-03 | Adaptaciones de un libro | **Sí**: `graf/02` K-01.2, K-07.3; `sem/graf` | Nada |
| CG-04 | Libro de origen de una película | **Sí**: `graf/02` K-01.4; `graf/04` D23-a1, D23-a4; `sem/graf` | Nada |
| CG-05 | Autores o directores de una obra | **Sí**: `graf/03` Q-00.7, Q-00.8; `graf/02` K-07.4, K-07.5 | Nada |
| CG-06 | Caminos más cortos (RF-24) | **Sí**: `graf/03` Q-00.9 a Q-00.14; `sem/graf` | Nada |
| CG-07 | Autores del mismo director (RF-25) | **Sí**: `graf/03` Q-00.15, Q-00.16; `graf/02` K-05 | Nada |
| CG-08 | Recomendar libros (RF-26, paso 2) | **Sí**: `sem/graf` (Ana, Marta, Pedro; lista vacía) | Nada |
| CG-09 | Recomendar películas (RF-27) | **Sí**: `sem/graf` (Sofía, Luis; sin seguidos) | Nada |
| CG-10 | Comprobar la adaptación (RN-06) | **Sí**: `graf/03` Q-00.17, Q-00.18; `sem/graf` | Nada |
| CG-11 | Crear el nodo de una obra | Parcial: `graf/02` K-10 (idempotente); `graf/01` R-05, R-06 | La operación de libro y de película con su salida propia |
| CG-13 | Registrar una persona | Parcial: `graf/01` R-20 (sin foto); R-08, R-09 (la API valida) | Con foto; el id repetido (R-01 lo cubre a nivel de restricción) |
| CG-14 | Relacionar persona y obra | Parcial alta: `graf/02` K-02, K-03, K-04, K-05, K-08; `graf/01` R-11, R-12 | `escribió` y `dirigida_por` normales con su salida propia |
| CG-15 | Registrar la adaptación | **Sí**: `graf/02` K-06, K-10; `graf/04` D23-a1 a D23-a5 y el control sin bloqueo | Nada |
| CG-16 | Crear nodo Usuario | Parcial: `graf/02` K-10 (idempotente); `graf/01` R-04 | Normal con su salida propia |
| CG-17 | Eliminar un usuario | **Sí**: `graf/01` R-14 (con `sigue` y `leyó` en ambos sentidos; repetirlo no falla) | Nada |
| CG-18 | Crear o eliminar `sigue` | Parcial: `graf/02` K-10 (crear y eliminar, idempotente), K-09; `graf/01` R-15 | Eliminar uno que no existe |
| CG-19 | Crear o eliminar `leyó` | Parcial: `graf/01` R-13 (película descartada); `graf/02` K-09 | `leyó` normal con un libro y **eliminar** (no se ejecutó nunca) |
| CG-20 | Reparto de una película | **Sí**: `graf/03` Q-00.19; `sem/graf` | Película sin reparto |
| CG-21 | Reparto de todas las películas | **Sí**: `sem/graf` | Nada |
| CG-22 | Obras con sus cuentas (mínimos de D-24) | **Sí**: `graf/03` Q-00.20 a Q-00.22; `graf/02` K-07; `sem/graf` | Nada |
| CG-23 | Usuarios, `sigue` y `leyó` | **Sí**: `sem/graf` | Nada |
| CG-24 | Foto de una persona | **Sí**: `graf/01` R-20; `graf/03` Q-00.24, Q-00.25 | Nada |
| CG-25 | Películas de una persona | **Sí**: `graf/03` Q-00.23, Q-00.24 | Persona sin películas |

## 5. Operaciones integradas propuestas (10)

Hoy no hay API ni worker, así que cada una se demuestra con **un script que hace de API**: llama a las bases en el orden que dicen los documentos. Ninguna tiene evidencia guardada todavía, salvo INT-10.

| ID | Operación integrada | Bases | Pasos reales que se ejecutarán | Qué se simula | Origen en los documentos |
|---|---|---|---|---|---|
| INT-01 | **Alta de película adaptada**, de borrador a publicada (D-24) | D, R, G | AP-05, AP-08, O5, CG-11, CG-14, CG-15 (con `CG-15-bloqueo` y CG-04), CG-20, AP-17, CG-03/04/05, AP-09. Casos: alta completa; película sin libro de origen (queda en borrador); segundo libro de origen (RN-07) | Nada: todos los pasos son de las bases. Solo la lógica de la API la escribe el script | `04-fuente-de-verdad...` sección 5; `matriz...` sección 4 |
| INT-02 | **Publicar una reseña y ver la ficha con su promedio** (RF-13, RF-06) | R, D | O7 en una transacción (reseña, trigger, estado, evento) y después AP-01 + O17: la ficha se une con el promedio nuevo. Casos: normal, calificación 6 (rechazada, no queda nada), segunda reseña (RN-01) | Nada | `04-fuente-de-verdad...` 4.5 |
| INT-03 | **Propagar `obra_leida` y `seguimiento_creado` al grafo** y su efecto en las recomendaciones | R, G | O11/O15 y el evento en `sync_outbox`; CG-18, CG-19, CG-09 | **El worker (O19).** El script toma los eventos pendientes, los aplica al grafo y los marca `procesado`. Real: el evento, el grafo y el resultado. Simulado: quién los despierta, el orden por lote, los reintentos y el estado `fallido` | `04-fuente-de-verdad...` 4.3, 4.5 |
| INT-04 | **Recomendar libros** (RF-26) | R, G, D | O18, CG-08 y AP-04 con Ana (normal), Pedro (nada que recomendar), un usuario sin libros de partida, y el efecto de una reseña nueva | Nada | `matriz...` sección 4 |
| INT-05 | **Recomendar películas** (RF-27) | G, D | CG-09 y AP-04 con Sofía, Luis y un usuario sin seguidos | Nada | `matriz...` sección 4 |
| INT-06 | **Reseña comparativa con validación de la adaptación** (RF-16, RN-05, RN-06) | R, G, D | Usuario existe (R), AP-05 de las dos obras, CG-10 y la escritura AP-18. Casos: pareja con `adaptado_a`; sin adaptación (se rechaza y no se escribe); duplicada (RN-05); usuario inexistente; ficha en borrador | Nada | `01-patrones-de-acceso.md` sección 3 |
| INT-07 | **Eliminar una cuenta y limpiar las copias** (RF-04) | R, D, G | O4 (cascada y evento en una transacción), y después AP-28 y CG-17. Se ve el estado intermedio (huérfanos que `coherencia.ps1` detecta) y el final (sin huérfanos) | **El worker.** El script aplica AP-28 y CG-17 a mano. Real: la cascada, el trigger del promedio y las dos limpiezas | `04-fuente-de-verdad...` 4.6, 7 |
| INT-08 | **Cambiar la foto de un actor y regenerar los repartos** (RF-10, D-27) | G, D | CG-24, CG-25, CG-20, AP-17 por cada película, y comprobar C-05 de la coherencia | Nada | `04-fuente-de-verdad...` sección 6 |
| INT-09 | **Buscar obras por título, autor, director o actor** (RF-05) | D, G | AP-03 y CG-01, uniendo los ids con AP-04; búsqueda sin resultados | Nada | `matriz...` sección 4 |
| INT-10 | **Reconciliación: detectar copias que no cuadran** (RNF-03) | R, D, G | `coherencia.ps1` (13 comprobaciones) y la prueba negativa con 12 corrupciones, ya guardadas en `sem/coherencia.txt` y `sem/coherencia-prueba-negativa.txt` | La **corrección** de las copias (la reconciliación real) no existe: solo la detección | `04-fuente-de-verdad...` sección 8 |

## 6. Qué es real y qué es simulado

| Real | Simulado |
|---|---|
| Las operaciones de cada base, con sus transacciones, trigger, validador, restricciones y cascada | El worker: nada despierta ni encola. El script de cada caso hace el papel de O19 |
| Las llamadas entre bases, en el orden de los documentos | La API: validaciones, permisos y la sesión (`:sesion`) las pone el script |
| El efecto de una base sobre otra una vez aplicada la copia (por ejemplo, que `leyó` cambie CG-08) | Reintentos con espera creciente, el límite de 5 intentos y el estado `fallido`: no hay ciclo que los ejercite |

Cada ficha del catálogo lo etiquetará con **"real"** o **"simulado"** y dirá qué parte es cuál.

## 7. Diferencias con lo que dice el prompt

Revisando los archivos de evidencia aparecieron dos diferencias. Las anoto para que el catálogo cite la evidencia que existe y no repita trabajo:

1. **La cascada de RF-04 sí tiene salida**, aunque no como operación completa: `rel/01` 10-antes, 10a, 10b, 11a, 11b, 11c y 16 comprueban la cascada, que no quedan filas del usuario, que lo ajeno sobrevive y que el trigger recalcula el promedio. Lo que falta es el evento `usuario_eliminado` y el orden de la transacción.
2. **CG-14 a CG-19 sí aparecen en pruebas guardadas**, repartidas en `graf/01` (R-12, R-13, R-14, R-15, R-20) y `graf/02` (K-02 a K-10). No son casos con el formato del catálogo (normal, límite, error), pero ejecutan las consultas reales. Falta el caso de eliminar `leyó` (CG-19) y los normales aislados de `escribió` y `dirigida_por`.

Se mantiene lo demás: **no hay** evidencia de O3, O5, O12, O14, O16, O19, O21, O23, AP-09, AP-13, AP-16, AP-25, AP-27, AP-29, AP-30 y AP-32.

**Resumen del estado actual** (76 operaciones): **35 con evidencia suficiente** (2 relacionales, 15 documentales, 18 de grafo), **25 parciales** (12, 7 y 6) y **16 sin evidencia** (8 relacionales, 8 documentales, 0 de grafo).

## 8. Estado del entorno

Al empezar el Escalón 1, **Docker Desktop no estaba en ejecución** (`docker ps` no encuentra el motor). Hace falta levantarlo y las tres bases antes del Escalón 2. El Escalón 1 solo leyó archivos.

## 9. Decisiones tomadas tras el Escalón 1

- **Alcance de los casos nuevos:** las **76** operaciones, con identificadores de caso nuevos aunque ya tuvieran evidencia. La evidencia anterior (secciones 2 a 4) sigue guardada y el catálogo podrá citarla además.
- **Operaciones integradas:** **5** (INT-01, INT-02, INT-04, INT-06 e INT-07). Quedan sin script propio INT-03, INT-05, INT-08, INT-09 e INT-10: INT-05 (RF-27, CG-09 y AP-04) ya tiene su parte de grafo en la semilla (`CG-09-n1` a `CG-09-e2`), INT-10 (reconciliación) tiene `coherencia.txt` y su prueba negativa, e INT-03 se ejercita en parte dentro de INT-07 (el evento aplicado a mano).
- **Formato de entrega:** sin respuesta todavía. Se asume Markdown (`docs/entregables/entregable-5-catalogo.md`), que es lo que pidió el prompt.

## 10. Resultado del Escalón 2: la evidencia

Todo se ejecuta con `.\db\scripts\catalogo.ps1` y queda en `db/evidencias/catalogo/` (decisión D-50). Una pasada completa: **183 s** (PostgreSQL 1 s, MongoDB 8 s, Neo4j 17 s, integradas 153 s, coherencia 4 s); memoria al terminar: Neo4j 1,01 GiB (81 %), MongoDB 273 MiB, PostgreSQL 55 MiB.

| Archivo | Qué cubre | Casos | Resultado |
|---|---|---|---|
| `relacional.txt` | 22 operaciones (O1 a O5, O7 a O23), una transacción con ROLLBACK | 148 | 148 pasan |
| `documental.txt` | 30 patrones (AP-01 a AP-05, AP-07 a AP-21, AP-23 a AP-30, AP-32, AP-33), escrituras en `dlbp_pruebas` | 178 de patrones + 2 de control | 180 pasan |
| `grafo.txt` | 24 consultas (CG-01 a CG-11, CG-13 a CG-25), cada caso en una transacción revertida | 153 casos en 234 pasos | 234 pasan |
| `integradas.txt` | INT-01, INT-02, INT-04, INT-06 e INT-07 (INT-01: 7 casos, INT-02: 6, INT-04: 8, INT-06: 8, INT-07: 6) | 35 | 35 pasan |
| `coherencia-final.txt` | La semilla sigue intacta | 13 comprobaciones | 13 de 13 |

**Cobertura:** las 76 operaciones tienen al menos un caso normal, uno límite y uno de error. El resumen por operación está al final de cada archivo (`relacional.txt` y `documental.txt`: tabla de casos por operación; `grafo.txt`: "Casos por consulta").

### 10.1 Qué es real y qué es simulado
- **Real:** las 76 operaciones de las tres bases y las 5 integradas, salvo lo de abajo.
- **Simulado** (marcado `[SIMULADO]` en `integradas.txt`): lo que haría el worker (O19) o la reconciliación. En INT-07 (n3, l1, l2), el script aplica AP-28 y CG-17 a mano y marca el evento `procesado`; en INT-01-l3, repite los pasos de un alta interrumpida; en INT-06-e5, el "grafo caído" es un puerto cerrado (no se detuvo Neo4j). En O19, solo se ejecuta la parte de PostgreSQL (lote, `procesado`, `fallido`).

### 10.2 Hallazgos
| # | Hallazgo | Caso | Qué se hizo |
|---|---|---|---|
| 1 | **CG-06 con origen = destino falla en el motor** con un error de base de datos (`Neo.DatabaseError.Statement.ExecutionFailed`), no "0 filas" | `CG-06-l3` | D-49: la API lo rechaza antes. Nota en `CG-06.cypher` y en la fila de CG-06 de `01-consultas-y-entidades.md` |
| 2 | CG-01 y CG-02 **fallan** (`ProcedureCallFailed`) con Lucene mal formado (`((`) o con el texto vacío | `CG-01-e2`, `CG-02-e2` | Ya lo anticipaba D-41 para el saneo; ahora hay el código exacto. La API no debe llamarlas sin texto |
| 3 | El validador de MongoDB **permite publicar** una película con el reparto vacío. El mínimo de D-24 solo lo impone la API | `AP-09-l1` | Es lo diseñado (D-24); queda demostrado. `INT-01-l2` muestra al script no publicando |
| 4 | Neo4j **acepta** un seguimiento a sí mismo y una `foto_url` con `http://`; los nulos en ids dan `SemanticError` | `CG-18-e1`, `CG-24-e2`, `CG-11-e1`, `CG-13-e2`, `CG-16-e2` | Ya estaba en D-22 (Community no valida valores); la API valida. Falta que lo haga (Entregable 6) |
| 5 | O7 y O11 sobre una **película** generan `obra_leida`; el worker deberá descartarla (D-16) | `O7-l2`, `O11-l2`, `INT-02-l2` | Nada que cambiar; queda un caso que el worker debe cubrir |
| 6 | La cascada de RF-04 recalcula bien el promedio, **también** cuando la reseña borrada estaba oculta | `O4-n1` | Confirma D-02 y D-38 sobre datos reales |
| 7 | Mientras no corre el worker, tras eliminar una cuenta quedan restos (comparativa, nodo, 2 `sigue`, 1 `leyó`) y `coherencia.ps1` falla en C-06, C-07, C-08 y C-10 | `INT-07-n2` | Es el estado intermedio previsto; tras aplicar el evento vuelve a 13 de 13 (`INT-07-n3`) |
| 8 | `sync_outbox.evento_id` **avanza** aunque se revierta la transacción: el último usado es 127 con la bandeja vacía | `resumen.txt` | Normal en PostgreSQL; anotado en D-50 |

Las primeras ejecuciones tuvieron fallas **del propio script** (no del motor): dos esperados mal escritos en el relacional (`'t'` en lugar de `true`), un caso de MongoDB que "ponía en mayúsculas" un UUID formado solo por dígitos, y una comparación de filas que PostgreSQL no admite. Se corrigieron; el único caso en que el motor contradijo lo esperado fue el hallazgo 1.

### 10.3 Pendientes, con contexto
- **Criterio sobre las fichas en borrador en una comparativa.** `AP-05` devuelve el `estado_publicacion` de cada obra, pero los documentos no dicen qué hacer si una de las dos está en `borrador`. El script de `INT-06-l1` las **rechaza** (Neuromante, libro y película, están unidos por `adaptado_a` pero en borrador). Hay que confirmarlo en el Entregable 6; si se aceptaran, un usuario podría comparar una obra que nadie más ve.
- **Umbral de los borradores antiguos (AP-30).** El supuesto 7 de `01-patrones-de-acceso.md` lo deja sin definir. Los casos usan un umbral de prueba (por ejemplo 2026-11-06: devuelve los dos borradores de Neuromante). Cuando se defina, solo cambia el valor.
- **El worker real.** O19, el estado `fallido` tras 5 intentos reales, el aviso en memoria y el sondeo de 30 s no están ejercitados: solo se aplicó cada evento a mano. Ejemplo: un `obra_leida` de una película debe terminar `procesado` sin crear `leyó`; hoy eso lo asegura el caso `CG-19-l2`, no un ciclo del worker.
- **Operaciones integradas sin script propio:** INT-03, INT-05, INT-08, INT-09 e INT-10. Si se quisieran en el catálogo, INT-08 (cambiar la foto de un actor y regenerar los repartos) e INT-09 (buscar por título, autor, director o actor) son las más baratas de añadir.
- **`coherencia.ps1` reescribe su evidencia** (`semilla/coherencia.txt`) en cada ejecución. Tras correr el catálogo se restaura con `git checkout -- db/evidencias/semilla/coherencia.txt`.

## 11. Escalones 3 y 4: el catálogo y su revisión

- **Catálogo:** [entregable-5-catalogo.md](entregable-5-catalogo.md), generado (D-51): 81 fichas (22 relacionales, 30 documentales, 24 de grafo y 5 integradas) con los seis puntos de la guía en una plantilla fija, 514 casos y sus resultados obtenidos copiados de `db/evidencias/catalogo/`.
- **Revisión cruzada, hecha con el generador y con una comprobación aparte:** cada operación tiene evidencia y casos normal, límite y error (si no, el generador falla); los 514 casos citados existen en los archivos de evidencia y pasan; las cifras del catálogo (148, 178, 153 y 35 casos) coinciden con las de cada archivo; los 44 enlaces relativos y las 81 anclas existen; las 178 citas a la evidencia del Entregable 4 apuntan a casos que están en sus archivos; los 366 resultados obtenidos de MongoDB, Neo4j y las integradas aparecen tal cual en su archivo.
- **Semilla:** tras todo el trabajo, `coherencia.ps1` da 13 de 13.
