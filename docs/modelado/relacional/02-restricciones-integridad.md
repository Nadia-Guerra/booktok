# Relacional, paso 2: restricciones de integridad

Documenta las reglas que la base relacional impone por sí misma. Las tablas y campos están en `01-tablas-campos-llaves-relaciones.md`; los índices en `03-indices.md`; las operaciones en `04-operaciones.md`.

## 1. Resumen: qué regla impone qué mecanismo

| Regla | Mecanismo | Sección |
|---|---|---|
| RN-01 una reseña por usuario y obra | UNIQUE (`resena`) | 4 |
| RN-02 calificación de 1 a 5 | CHECK (`resena`) | 5 |
| RN-03 sin auto-seguimiento ni seguimiento duplicado | CHECK y PK compuesta (`seguimiento`) | 5, 3 |
| RN-04 una obra una sola vez por lista | PK compuesta (`elemento_lista`) | 3 |
| RN-08 promedio acorde a reseñas vigentes | Trigger sobre `resena` y CHECK de coherencia en `obra_resumen` | 5, 7 |
| RF-04 eliminar cuenta sin dejar huérfanos | FK con `ON DELETE CASCADE` | 2 |
| Reseña, estado o lista con obra inexistente | FK hacia `obra_resumen` | 2 |
| RF-13 reseña, estado y promedio completos o ninguno | Transacción (ver `04-operaciones.md`) | 8 |
| RN-09, RN-10, RNF-07 permisos por rol y propiedad | Aplicación, no la base | 8 |

## 2. Llaves foráneas y acciones referenciales

Los ids son inmutables, así que no se define `ON UPDATE` (se rechaza cualquier cambio).

| Llave foránea | Referencia | `ON DELETE` | Por qué |
|---|---|---|---|
| `resena.usuario_id` | `usuario.usuario_id` | CASCADE | RF-04: al borrar la cuenta se borran sus reseñas |
| `estado_obra.usuario_id` | `usuario.usuario_id` | CASCADE | RF-04 |
| `lista.usuario_id` | `usuario.usuario_id` | CASCADE | RF-04 |
| `seguimiento.seguidor_id` | `usuario.usuario_id` | CASCADE | RF-04: se borran los seguimientos que el usuario hizo |
| `seguimiento.seguido_id` | `usuario.usuario_id` | CASCADE | RF-04: se borran los seguimientos que otros hacían hacia él |
| `sesion.usuario_id` | `usuario.usuario_id` | CASCADE | RF-04: al borrar la cuenta se cierran todas sus sesiones (D-35) |
| `elemento_lista.lista_id` | `lista.lista_id` | CASCADE | Al borrar una lista (RF-19) desaparecen sus elementos |
| `resena.obra_id` | `obra_resumen.obra_id` | RESTRICT | No hay baja de obras; si alguien lo intenta con reseñas, la base lo impide |
| `estado_obra.obra_id` | `obra_resumen.obra_id` | RESTRICT | Igual |
| `elemento_lista.obra_id` | `obra_resumen.obra_id` | RESTRICT | Igual |

**Cadena de la eliminación de cuenta (RF-04):** al borrar una fila de `usuario`, la base elimina en cascada sus `resena`, sus `estado_obra`, sus `lista` (y con ellas sus `elemento_lista`), los `seguimiento` donde aparece en cualquiera de los dos lados y todas sus `sesion`. Cada reseña eliminada dispara el trigger de la sección 7, que corrige el promedio de su obra. `obra_resumen` nunca se borra.

## 3. Llaves primarias

Las claves compuestas también son restricciones de unicidad:

| Tabla | Clave | Qué garantiza |
|---|---|---|
| `estado_obra` | (`usuario_id`, `obra_id`) | Un solo estado por usuario y obra |
| `elemento_lista` | (`lista_id`, `obra_id`) | Una obra aparece una sola vez por lista (RN-04) |
| `seguimiento` | (`seguidor_id`, `seguido_id`) | No se sigue dos veces a la misma persona (RN-03, parte 2) |

El resto de tablas usa un id propio (`usuario_id`, `obra_id`, `resena_id`, `lista_id`, `evento_id`); `sesion` usa el hash de su token (`token_hash`).

## 4. Restricciones de unicidad (UNIQUE)

| Tabla | Columnas | Regla |
|---|---|---|
| `usuario` | `correo` | No hay dos cuentas con el mismo correo (RF-01). Como el correo se guarda en minúsculas (ver 5.2), basta un UNIQUE normal |
| `resena` | (`usuario_id`, `obra_id`) | Una reseña por usuario y obra (RN-01) |

`obra_id` ya distingue libro de película, así que la unicidad no necesita otra columna.

## 5. Restricciones de dominio

### 5.1 Dominios cerrados (ENUM)

El tipo ENUM hace que el motor rechace cualquier valor fuera de la lista y lo guarde en menos espacio que un texto.

| Tabla | Columna | Valores permitidos |
|---|---|---|
| `usuario` | `rol` | `lector`, `admin` |
| `obra_resumen` | `tipo` | `libro`, `pelicula` |
| `estado_obra` | `estado` (RF-15) | `pendiente`, `en_curso`, `terminada` |
| `sync_outbox` | `estado` | `pendiente`, `procesado`, `fallido` |

### 5.2 Rangos y coherencia (CHECK)

| Tabla | Condición | Regla |
|---|---|---|
| `usuario` | `correo = LOWER(correo)` | El correo se guarda siempre en minúsculas; la API lo normaliza antes de insertar y la base lo exige |
| `obra_resumen` | `promedio BETWEEN 1 AND 5` | El promedio queda en el rango de las calificaciones |
| `obra_resumen` | `total_resenas >= 0` | Sin conteos negativos |
| `obra_resumen` | `(total_resenas = 0) = (promedio IS NULL)` | Coherencia: sin reseñas vigentes no hay promedio, y con reseñas siempre lo hay |
| `resena` | `calificacion BETWEEN 1 AND 5` | RN-02 |
| `elemento_lista` | `posicion >= 1` | Las posiciones empiezan en 1 |
| `seguimiento` | `seguidor_id <> seguido_id` | Nadie se sigue a sí mismo (RN-03, parte 1) |
| `sync_outbox` | `tipo_evento IN (…)` con los valores de `04-operaciones.md` | Solo eventos conocidos |
| `sesion` | `expira_en > creado_en` | Una sesión no nace vencida |

## 6. Restricciones de obligatoriedad y valores por defecto

Las columnas marcadas "No" en la columna Nulo de `01-tablas-campos-llaves-relaciones.md` llevan NOT NULL. Valores por defecto:

| Columna | Valor |
|---|---|
| `usuario.rol` | `'lector'` |
| `resena.oculta` | `false` |
| `obra_resumen.total_resenas` | `0` |
| `sync_outbox.estado` | `'pendiente'` |
| `sync_outbox.intentos` | `0` |

Opcionales (admiten nulo): `usuario.biografia`, `resena.texto`, `obra_resumen.promedio`, `sync_outbox.error` y `sync_outbox.procesado_en`.

## 7. Trigger de mantenimiento del promedio (RN-08)

**Por qué es necesario:** el promedio es un dato derivado de `resena`. Si lo actualizara solo la aplicación, la eliminación de cuenta lo dejaría incorrecto, porque la cascada borra reseñas sin pasar por la aplicación. Un trigger lo corrige en todos los casos.

**Definición**
- **Tabla:** `resena`. Se ejecuta por cada fila afectada, después de la operación.
- **Eventos que lo disparan:** `INSERT`, `DELETE` y `UPDATE` de `calificacion` u `oculta`. El `usuario_id` y el `obra_id` de una reseña no cambian nunca (ids inmutables), así que no se contemplan.
- **Orden de los pasos:** primero **bloquea** la fila de `obra_resumen` de la obra afectada y solo después calcula (ver Concurrencia).
- **Qué recalcula:** para la obra afectada (`obra_id`), en `obra_resumen`:
  - `total_resenas` = cantidad de reseñas con `oculta = false`.
  - `promedio` = promedio de `calificacion` de esas reseñas, redondeado a dos decimales, o nulo si no hay ninguna.
- **Se recalcula desde las reseñas, no por incremento,** para que el valor no se desvíe nunca.

**Casos**

| Situación | Obras recalculadas |
|---|---|
| Se inserta una reseña (RF-12, RF-13) | La obra de la reseña |
| Se edita la calificación (RF-14) | La obra de la reseña |
| Se oculta o se muestra una reseña (RF-18) | La obra de la reseña |
| Se elimina una reseña (RF-14) | La obra de la reseña |
| Se elimina una cuenta (RF-04, por cascada) | Cada obra reseñada por el usuario |

**Concurrencia:** el bloqueo previo es lo que hace correcto el resultado. Si dos reseñas de la misma obra se confirman a la vez, la segunda espera a la primera y calcula con los datos ya confirmados. Si el trigger calculara *antes* de bloquear, la segunda podría sobrescribir el resultado de la primera y dejar `total_resenas` o `promedio` incorrectos.

**Lo que no hace:** no genera eventos para otras bases. El promedio no se replica (vive solo en `obra_resumen`).

## 8. Reglas que la base no puede imponer

| Regla | Dónde se cumple | Cómo se verifica |
|---|---|---|
| RN-09 solo el administrador modifica el catálogo y sus relaciones | API | Comprobación de `usuario.rol` antes de cada operación de administración |
| RN-10 un usuario solo edita o borra sus reseñas, listas y comparativas | API | Comprobación de que el `usuario_id` de la sesión es el dueño |
| RNF-07 acciones de administración solo para el rol administrador | API | Igual que RN-09 |
| Orden de las posiciones en una lista | API | La unicidad de `posicion` no se impone: reordenar pasaría por estados temporalmente repetidos |
| Existencia de la obra en la ficha documental y en el grafo | Flujo de alta y reconciliación | La base solo garantiza que la obra exista en `obra_resumen` (ver `../fuente-de-verdad.md`, sección 5) |
| Atomicidad de publicar reseña, estado y evento | Transacción | Ver `04-operaciones.md` |

## 9. Pruebas de integridad

Cada fila es una prueba que debe ejecutarse sobre la base (ver fila Pruebas, columna Relacional, de `../matriz-responsabilidades.md`).

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Insertar dos usuarios con el mismo correo | Rechazo por UNIQUE |
| 1b | Insertar un usuario con el correo en mayúsculas | Rechazo por CHECK (la API debe normalizarlo antes) |
| 2 | Insertar una segunda reseña del mismo usuario sobre la misma obra | Rechazo por UNIQUE (RN-01) |
| 3 | Insertar reseña con calificación 0 o 6 | Rechazo por CHECK (RN-02) |
| 4 | Insertar un seguimiento de un usuario a sí mismo | Rechazo por CHECK (RN-03) |
| 5 | Insertar dos veces el mismo seguimiento | Rechazo por clave primaria (RN-03) |
| 6 | Insertar la misma obra dos veces en una lista | Rechazo por clave primaria (RN-04) |
| 7 | Insertar reseña, estado o elemento de lista con `obra_id` inexistente | Rechazo por clave foránea |
| 8 | Insertar un estado, rol o tipo de obra fuera de su lista | Rechazo por ENUM |
| 9 | Borrar una `obra_resumen` con reseñas | Rechazo por RESTRICT |
| 10 | Borrar un usuario con reseñas, estados, listas, elementos y seguimientos en ambos sentidos | No queda ninguna fila relacionada (RF-04) |
| 11 | Borrar un usuario y revisar `obra_resumen` de las obras que había reseñado | `promedio` y `total_resenas` coinciden con las reseñas restantes (RN-08) |
| 12 | Insertar, editar calificación, ocultar y eliminar una reseña | El promedio coincide con el recálculo manual tras cada operación |
| 13 | Ocultar la única reseña de una obra | `total_resenas = 0` y `promedio` nulo |
| 14 | Forzar un fallo en el paso 2 o 3 de la transacción de RF-13 | No queda reseña, ni estado, ni evento (rollback) |
| 15 | Dos usuarios publican a la vez una reseña de la misma obra | `total_resenas = 2` y `promedio` igual al recálculo manual (concurrencia del trigger) |
| 16 | Borrar un usuario que tiene varias sesiones abiertas | No queda ninguna fila de `sesion` suya (RF-04, D-35) |
| 17 | Insertar una sesión con `expira_en` igual o anterior a `creado_en` | Rechazo por CHECK |
