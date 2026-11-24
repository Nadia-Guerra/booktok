# Relacional, paso 4: operaciones principales

Describe lo que el sistema hace sobre la base relacional: qué tablas toca cada operación, si es una transacción y qué evento deja para las otras bases. Las tablas están en `01-tablas-campos-llaves-relaciones.md`, las restricciones en `02-restricciones-integridad.md` y los índices en `03-indices.md`.

**Convenciones**
- `:parametro` es un valor que entrega la API. `:sesion` es el `usuario_id` de quien tiene la sesión iniciada.
- Los permisos (RN-09, RN-10) los comprueba la API antes de ejecutar; aquí se indica la condición que debe cumplirse (por ejemplo, `usuario_id = :sesion`).
- "Evento" significa una fila en `sync_outbox` escrita **en la misma transacción** que el cambio.
- Todas las operaciones de escritura que tocan más de una tabla son una sola transacción: o se completan o no queda nada.

## 1. Resumen

| # | Operación | RF | Actor | Tablas | Transacción | Evento |
|---|---|---|---|---|---|---|
| O1 | Registrar usuario | RF-01 | Visitante | `usuario` | Sí | `usuario_creado` |
| O2 | Iniciar sesión | RF-02 | Visitante | `usuario`, `sesion` | Sí | — |
| O3 | Editar perfil | RF-03 | Lector | `usuario` | No | — |
| O4 | Eliminar cuenta | RF-04 | Lector | `usuario` y cascada | Sí | `usuario_eliminado` |
| O5 | Registrar obra | RF-08 | Admin | `obra_resumen` | No | — |
| O6 | Retirada (D-18): corregir el título solo cambia la ficha documental | RF-08 | Admin | — | — | — |
| O7 | Publicar reseña | RF-12, RF-13 | Lector | `resena`, `obra_resumen`, `estado_obra` | **Sí** | `obra_leida` |
| O8 | Editar reseña | RF-14 | Lector | `resena`, `obra_resumen` | Sí | — |
| O9 | Eliminar reseña | RF-14 | Lector | `resena`, `obra_resumen` | Sí | — |
| O10 | Moderar reseña (ocultar, mostrar o eliminar) | RF-18 | Admin | `resena`, `obra_resumen` | Sí | — |
| O11 | Marcar estado de una obra | RF-15 | Lector | `estado_obra` | Sí | `obra_leida` u `obra_no_leida` |
| O12 | Crear, renombrar y eliminar lista | RF-19 | Lector | `lista`, `elemento_lista` | Sí | — |
| O13 | Agregar y quitar obra de una lista | RF-20 | Lector | `elemento_lista` | No | — |
| O14 | Reordenar lista | RF-20 | Lector | `elemento_lista` | Sí | — |
| O15 | Seguir usuario | RF-21 | Lector | `seguimiento` | Sí | `seguimiento_creado` |
| O16 | Dejar de seguir | RF-21 | Lector | `seguimiento` | Sí | `seguimiento_eliminado` |
| O17 | Consultas de lectura | RF-06, RF-07, RF-15, RF-19, RF-20, RF-22 | Lector, visitante | varias | No | — |
| O18 | Libros de partida para recomendar | RF-26 (paso 1) | Lector | `estado_obra`, `resena`, `obra_resumen` | No | — |
| O19 | Propagar eventos al grafo | RNF-02 | Sistema | `sync_outbox` | Por evento | — |
| O20 | Datos para reconciliación | RNF-03 | Sistema | varias | No | — |
| O21 | Purgar eventos procesados y sesiones vencidas | — | Sistema | `sync_outbox`, `sesion` | No | — |
| O22 | Validar la sesión de una petición | RF-02, RNF-06, RNF-07 | Lector, admin | `sesion`, `usuario` | No (lectura) | — |
| O23 | Cerrar sesión | RF-02 | Lector, admin | `sesion` | No | — |

## 2. Cuentas y perfil

### O1. Registrar usuario (RF-01)
1. Insertar en `usuario` con `rol = 'lector'` y el hash de la contraseña.
2. Insertar el evento `usuario_creado`.
- **Falla si:** el correo ya existe (UNIQUE). La API responde "correo en uso".

### O2. Iniciar sesión (RF-02), una transacción
1. Leer `usuario` por correo normalizado (usa el UNIQUE). La API compara la contraseña con `password_hash`.
2. Si coincide, la API genera un token aleatorio de 32 bytes e inserta en `sesion` (`token_hash` = SHA-256 del token, `usuario_id`, `creado_en` y `expira_en`, propuesto 30 días después). El token en claro se entrega a la app una sola vez y no se guarda.
- **Falla si:** el correo no existe o la contraseña no coincide. La respuesta es la misma en ambos casos, para no revelar qué correos están registrados.
- La sesión sí se guarda en esta base (D-35).

### O3. Editar perfil (RF-03)
- Actualizar `nombre` y `biografia` de `usuario` donde `usuario_id = :sesion`.

### O4. Eliminar cuenta (RF-04)
1. Insertar el evento `usuario_eliminado`.
2. Borrar de `usuario` donde `usuario_id = :sesion`.
- **La cascada** elimina reseñas, estados, listas con sus elementos, seguimientos en ambos sentidos y sesiones. **El trigger** recalcula el promedio de cada obra que el usuario había reseñado (`02-restricciones-integridad.md`, secciones 2 y 7).
- Las comparativas (documental) y el nodo (grafo) se limpian cuando se procesa el evento (O19).

### O22. Validar la sesión de una petición (RF-02, RNF-06, RNF-07)
- La app envía el token en cada petición. La API calcula su SHA-256 y busca la sesión unida con su usuario:

```sql
SELECT u.usuario_id, u.rol
FROM sesion s
JOIN usuario u ON u.usuario_id = s.usuario_id
WHERE s.token_hash = :hash
  AND s.expira_en > now();
```

- Sin fila, la API responde que no hay sesión válida.
- Es una consulta por clave primaria por cada petición autenticada. Trae el rol actual, así que un cambio de rol surte efecto de inmediato.
- No renueva la vigencia: evita una escritura por petición.

### O23. Cerrar sesión (RF-02)
- Borrar de `sesion` la fila con el `token_hash` de la petición actual. La app también borra el token de su almacenamiento.
- Eliminar la cuenta (O4) borra todas las sesiones por cascada.

## 3. Obras

### O5. Registrar obra (RF-08)
- Insertar en `obra_resumen` (`obra_id`, `tipo`) con el id de la ficha documental ya creada como borrador.
- **Debe ser idempotente:** si el alta se reintenta y la fila existe, no hace nada ni falla.

### O6. Retirada (D-18)
- Corregir el título de una obra (RF-08) solo cambia la ficha documental (AP-10). El grafo no guarda el título (D-18), así que no hay evento que registrar en esta base. El número O6 no se reutiliza.

## 4. Reseñas

### O7. Publicar reseña (RF-12, RF-13), una sola transacción
1. Insertar en `resena` (`usuario_id = :sesion`, `obra_id`, `calificacion`, `texto`). El **trigger** actualiza `promedio` y `total_resenas` de la obra.
2. Leer el estado actual de la obra para el usuario (con bloqueo de fila).
3. Insertar o actualizar `estado_obra` a `terminada`.
4. Si el estado anterior no era `terminada` (o no existía), insertar el evento `obra_leida`.
5. Confirmar.
- **Falla si:** ya hay una reseña de ese usuario para la obra (RN-01), la calificación está fuera de 1 a 5 (RN-02) o la obra no existe (llave foránea). En cualquier fallo no queda reseña, estado, promedio ni evento.

### O8. Editar reseña (RF-14)
- Actualizar `calificacion`, `texto` y `actualizado_en` de `resena` donde `resena_id = :id` y `usuario_id = :sesion`. El trigger recalcula el promedio.
- La obra de una reseña no se puede cambiar.

### O9. Eliminar reseña (RF-14)
- Borrar de `resena` donde `resena_id = :id` y `usuario_id = :sesion`. El trigger recalcula el promedio.
- El estado de la obra **no** vuelve a pendiente: terminar una obra es independiente de conservar la reseña.

### O10. Moderar reseña (RF-18)
- Ocultar o mostrar: actualizar `oculta` de `resena` donde `resena_id = :id`. Eliminar: borrar la fila. En ambos casos el trigger recalcula el promedio y solo cuentan las no ocultas.
- Solo rol `admin` (RN-09).
- La moderación de comparativas ocurre en el documental.

## 5. Estados de lectura

### O11. Marcar estado de una obra (RF-15), una transacción
1. Leer el estado anterior de (`:sesion`, `obra_id`) con bloqueo de fila.
2. Insertar o actualizar `estado_obra` con el nuevo estado y `actualizado_en`.
3. Evento según el cambio:
   - de cualquier estado distinto de `terminada` a `terminada` → `obra_leida`;
   - de `terminada` a otro estado → `obra_no_leida`;
   - cualquier otro cambio → ningún evento.
- Solo el estado `terminada` de un libro se refleja en el grafo (`leyó`, D-16); las películas terminadas no generan relación.

## 6. Listas

### O12. Crear, renombrar y eliminar lista (RF-19)
- **Crear:** insertar en `lista` con `usuario_id = :sesion`.
- **Renombrar:** actualizar `nombre` donde `lista_id = :id` y `usuario_id = :sesion`.
- **Eliminar:** borrar de `lista` con la misma condición; la cascada elimina sus elementos.

### O13. Agregar y quitar obra de una lista (RF-20)
- **Agregar:** verificar que la lista es del usuario; insertar en `elemento_lista` con `posicion` = última posición + 1. Falla si la obra ya está (RN-04) o no existe.
- **Quitar:** borrar la fila. No se renumeran las demás; las posiciones no tienen que ser consecutivas.

### O14. Reordenar lista (RF-20), una transacción
- Reasignar `posicion` de todos los elementos de la lista a 1…n en el orden recibido. La transacción evita que se vea un estado intermedio.

## 7. Seguimiento

### O15. Seguir usuario (RF-21), una transacción
1. Insertar en `seguimiento` (`seguidor_id = :sesion`, `seguido_id`).
2. Insertar el evento `seguimiento_creado`.
- **Falla si:** es el mismo usuario (CHECK), ya lo sigue (clave primaria) o el usuario no existe (llave foránea).

### O16. Dejar de seguir (RF-21), una transacción
1. Borrar de `seguimiento` la fila (`:sesion`, `seguido_id`).
2. Si se borró una fila, insertar el evento `seguimiento_eliminado`; si no existía, no se hace nada.

## 8. Lecturas

### O17. Consultas de lectura

| Consulta | Requerimiento | Tablas | Índice |
|---|---|---|---|
| Promedio y total de reseñas de una obra (se une a la ficha en la API) | RF-06, RF-07 | `obra_resumen` | Clave primaria |
| Reseñas de una obra no ocultas, recientes primero | RF-06, RF-07 | `resena` | I1 |
| Reseñas de un usuario no ocultas, recientes primero | RF-22 | `resena` | I2 |
| Obras de un usuario por estado | RF-15 | `estado_obra` | Clave primaria |
| Listas de un usuario | RF-19 | `lista` | I5 |
| Obras de una lista en orden | RF-20 | `elemento_lista` | Clave primaria |
| A quién sigue un usuario | RF-22 | `seguimiento` | Clave primaria |
| Quién sigue a un usuario | RF-21 | `seguimiento` | I4 |
| Perfil de un usuario | RF-22 | `usuario` | Clave primaria |
| Estado que el usuario dio a una obra concreta (para mostrarlo en la ficha) | RF-15 | `estado_obra` | Clave primaria |
| Reseña del usuario sobre una obra concreta (para editarla o saber si ya reseñó) | RF-14 | `resena` | UNIQUE (`usuario_id`, `obra_id`) |

Las listas y reseñas de otros usuarios las muestra la API a quien los sigue; la base no impone esa visibilidad.

### O18. Libros de partida para recomendar (RF-26, paso 1)
Devuelve los ids de los libros que "le gustaron" al usuario (RN-11). La API los pasa al grafo (paso 2).

```sql
SELECT e.obra_id
FROM estado_obra e
JOIN resena r        ON r.usuario_id = e.usuario_id AND r.obra_id = e.obra_id
JOIN obra_resumen o  ON o.obra_id = e.obra_id
WHERE e.usuario_id = :sesion
  AND e.estado = 'terminada'
  AND o.tipo = 'libro'
  AND r.calificacion >= 4
  AND r.oculta = false
ORDER BY r.calificacion DESC, r.actualizado_en DESC
LIMIT :limite;
```

`:limite` acota la lista que se envía al grafo (valor propuesto: 20): los mejor calificados y más recientes primero.

## 9. Sincronización

### Eventos

| `tipo_evento` | Lo genera | `payload` | Efecto al procesarlo |
|---|---|---|---|
| `usuario_creado` | O1 | `usuario_id` | Grafo: crea el nodo Usuario |
| `usuario_eliminado` | O4 | `usuario_id` | Grafo: borra el nodo y sus relaciones. Documental: borra las comparativas del usuario |
| `seguimiento_creado` | O15 | `seguidor_id`, `seguido_id` | Grafo: crea `sigue` |
| `seguimiento_eliminado` | O16 | `seguidor_id`, `seguido_id` | Grafo: borra `sigue` |
| `obra_leida` | O7, O11 | `usuario_id`, `obra_id` | Grafo: consulta `obra_resumen.tipo`; si es un libro, crea `leyó`; si es una película, descarta el evento (D-16) |
| `obra_no_leida` | O11 | `usuario_id`, `obra_id` | Grafo: si es un libro, borra `leyó`; si es una película, descarta el evento (D-16) |

### O19. Propagar eventos al grafo
1. Un **único proceso** toma los eventos `pendiente` en orden de `evento_id`, de a un lote (usa I6). Un solo proceso garantiza el orden: seguir y dejar de seguir se aplican como ocurrieron.
2. Aplicar cada uno a la otra base de forma **idempotente** (`MERGE` en el grafo: repetirlo no duplica nada).
3. Si tiene éxito: `estado = 'procesado'` y `procesado_en`.
4. Si falla: sumar 1 a `intentos` y guardar `error`. Al alcanzar el límite de intentos (propuesto: 5), `estado = 'fallido'` y se continúa con los siguientes.
- Un evento `fallido` lo corrige la reconciliación (O20); no bloquea a los demás.

### O20. Datos para reconciliación (RNF-03)
El script compara esta base con las copias y corrige solo las copias. Esta base le entrega:
- Todos los `seguimiento` y todos los `estado_obra` con `estado = 'terminada'` de obras de tipo `libro` (D-16).
- Todos los `obra_id` de `obra_resumen`.
- Todos los `usuario_id` de `usuario`.
- Los eventos `fallido`.
- Verificación del promedio: para cada obra, comparar `promedio` y `total_resenas` con el recálculo desde `resena` (solo no ocultas). Si no coinciden, es un error de integridad, no de sincronización.

### O21. Purgar eventos procesados y sesiones vencidas
- Borrar de `sync_outbox` los eventos `procesado` con más de 30 días (valor propuesto), para mantener I6 pequeño.
- Borrar de `sesion` las filas con `expira_en` anterior a la fecha actual.

## 10. Supuestos propios a confirmar

| Supuesto | Dónde afecta |
|---|---|
| `texto` de la reseña es opcional | Tabla `resena` |
| Las listas no tienen descripción y sus nombres pueden repetirse dentro de un mismo usuario | Tabla `lista`, O12 |
| La sesión se guarda en la base como token opaco: solo se almacena su hash, vence a los 30 días y no se renueva (D-35) | O2, O22, O23 |
| Una reseña oculta no cuenta como "le gustó" en RF-26 | O18 |
| Eliminar una reseña no cambia el estado de la obra | O9 |
| Cinco intentos antes de marcar un evento como `fallido`; purga a los 30 días | O19, O21 |
| El primer administrador y cualquier cambio de rol se hacen con un script de carga inicial; ningún RF pide gestionar roles desde la aplicación | `usuario.rol`, O1 |
| Se muestran 20 libros de partida como máximo en RF-26 | O18 |
