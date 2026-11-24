# Relacional, paso 3: índices

Define los índices de la base relacional y justifica cada uno. Las tablas están en `01-tablas-campos-llaves-relaciones.md`, las restricciones en `02-restricciones-integridad.md` y las operaciones en `04-operaciones.md`.

**Criterio:** un índice se crea solo si una operación del sistema lo usa. Cada índice acelera lecturas y encarece las escrituras de su tabla, así que lo que ninguna operación consulta no se indexa (sección 4).

## 1. Índices que ya existen

Las claves primarias y las restricciones UNIQUE crean su propio índice. No hay que declararlos aparte, pero sí conviene saber qué consultas sirven.

| Índice implícito | Tabla (columnas) | Consultas que sirve |
|---|---|---|
| Clave primaria | `usuario` (`usuario_id`) | Cargar un usuario por id |
| UNIQUE | `usuario` (`correo`) | Inicio de sesión (RF-02): buscar la cuenta por correo |
| Clave primaria | `obra_resumen` (`obra_id`) | Leer el promedio de una obra al mostrar su ficha (RF-06, RF-07); verificar que existe antes de reseñar |
| Clave primaria | `resena` (`resena_id`) | Editar, eliminar u ocultar una reseña concreta (RF-14, RF-18) |
| UNIQUE | `resena` (`usuario_id`, `obra_id`) | Saber si el usuario ya reseñó la obra; **unir** las reseñas de un usuario con sus estados en RF-26 |
| Clave primaria | `estado_obra` (`usuario_id`, `obra_id`) | Leer o actualizar el estado de una obra para un usuario (RF-15); todos los estados de un usuario |
| Clave primaria | `lista` (`lista_id`) | Abrir una lista concreta |
| Clave primaria | `elemento_lista` (`lista_id`, `obra_id`) | Todas las obras de una lista (RF-20); comprobar si una obra ya está en ella (RN-04) |
| Clave primaria | `seguimiento` (`seguidor_id`, `seguido_id`) | A quién sigue un usuario (RF-22); comprobar si ya lo sigue (RN-03) |
| Clave primaria | `sync_outbox` (`evento_id`) | Marcar un evento como procesado |
| Clave primaria | `sesion` (`token_hash`) | Validar la sesión de cada petición (D-35) |

Nota sobre el UNIQUE del correo: como el correo se guarda en minúsculas, la búsqueda en el inicio de sesión también debe usar el correo en minúsculas.

## 2. Índices que se crean

El índice I3 se descartó (ver sección 4); su número no se reutiliza.

| # | Índice | Tabla (columnas) | Tipo |
|---|---|---|---|
| I1 | `idx_resena_obra_fecha` | `resena` (`obra_id`, `creado_en` descendente) | No único |
| I2 | `idx_resena_usuario_fecha` | `resena` (`usuario_id`, `creado_en` descendente) | No único |
| I4 | `idx_seguimiento_seguido` | `seguimiento` (`seguido_id`) | No único |
| I5 | `idx_lista_usuario` | `lista` (`usuario_id`) | No único |
| I6 | `idx_outbox_pendientes` | `sync_outbox` (`evento_id`) donde `estado = 'pendiente'` | No único, parcial (D-33, D-34) |
| I7 | `idx_sesion_usuario` | `sesion` (`usuario_id`) | No único |

### I1: reseñas de una obra, más recientes primero

- **Operaciones:** mostrar las reseñas de una obra en su ficha; recalcular `promedio` y `total_resenas` cada vez que el trigger se dispara (`02-restricciones-integridad.md`, sección 7).
- **Por qué:** ambas consultas filtran por `obra_id`. Sin índice, cada reseña publicada recorrería toda la tabla `resena` para recalcular un promedio. El segundo campo evita ordenar al listar.
- **También ayuda a:** la llave foránea `resena.obra_id` (verificación al intentar borrar una obra).

### I2: reseñas de un usuario, más recientes primero

- **Operaciones:** ver las reseñas de un usuario (su perfil o los perfiles que sigue, RF-22).
- **Por qué:** la lista se muestra de más nueva a más antigua. El UNIQUE (`usuario_id`, `obra_id`) encuentra las reseñas de un usuario, pero no en ese orden. Se mantiene por el feed de las personas que se siguen (RF-22), que consulta las reseñas de muchos usuarios a la vez ordenadas por fecha.

### I4: quién sigue a un usuario

- **Operaciones:** ver los seguidores de un usuario (RF-21); localizar los seguimientos hacia un usuario al eliminar su cuenta (RF-04, cascada).
- **Por qué:** la clave primaria empieza por `seguidor_id` y solo sirve para "a quién sigue". Buscar por `seguido_id` no puede usarla, y sin este índice la cascada de RF-04 recorrería toda la tabla.

### I5: listas de un usuario

- **Operaciones:** mostrar las listas de un usuario (RF-19); localizarlas al eliminar su cuenta (RF-04, cascada).
- **Por qué:** `lista` tiene como clave primaria su propio id, así que no hay otro camino para buscar por dueño.

### I6: eventos pendientes de propagar

- **Operaciones:** el proceso de sincronización toma los eventos `pendiente` en orden de `evento_id` (`../fuente-de-verdad.md`, sección 5).
- **Por qué:** esa consulta se ejecuta continuamente. La tabla crece con cada evento procesado, mientras que los pendientes son pocos; el índice permite encontrarlos sin recorrer los ya procesados.
- **Mantenimiento:** los eventos `procesado` antiguos pueden purgarse periódicamente. Con PostgreSQL (D-33) el índice se crea **parcial**, solo sobre las filas con `estado = 'pendiente'`: contiene únicamente los pocos eventos por propagar y la consulta del proceso de sincronización es casi gratuita, aunque la tabla acumule eventos procesados (D-34).

### I7: sesiones de un usuario

- **Operaciones:** eliminar una cuenta (RF-04): la cascada localiza las sesiones del usuario para borrarlas (D-35).
- **Por qué:** `sesion` tiene como clave primaria el hash del token, así que sin este índice borrar un usuario obligaría a recorrer toda la tabla. PostgreSQL no indexa por sí solo las llaves foráneas.
- **Mantenimiento:** las sesiones vencidas se purgan periódicamente (O21), así que la tabla se mantiene pequeña.

## 3. Cobertura de las llaves foráneas

Algunos motores indexan automáticamente las columnas de una llave foránea y otros no. Esta tabla muestra qué las cubre, para que no dependa del motor.

| Llave foránea | Cubierta por | Observación |
|---|---|---|
| `resena.usuario_id` | UNIQUE (`usuario_id`, `obra_id`) e I2 | |
| `resena.obra_id` | I1 | |
| `estado_obra.usuario_id` | Clave primaria (primer campo) | |
| `estado_obra.obra_id` | Ninguna | Ver sección 4 |
| `lista.usuario_id` | I5 | |
| `elemento_lista.lista_id` | Clave primaria (primer campo) | |
| `elemento_lista.obra_id` | Ninguna | Ver sección 4 |
| `seguimiento.seguidor_id` | Clave primaria (primer campo) | |
| `seguimiento.seguido_id` | I4 | |
| `sesion.usuario_id` | I7 | |

## 4. Índices que se decidió no crear

| Candidato | Por qué no |
|---|---|
| `estado_obra` (`usuario_id`, `estado`) (antes I3) | La clave primaria ya encuentra los estados de un usuario, que son pocos; filtrar por `estado` dentro de ellos es insignificante. Sirve a RF-15 y al paso 1 de RF-26. |
| `estado_obra` (`obra_id`) | Ninguna operación busca estados por obra. La verificación de la llave solo ocurre al borrar una obra, y no hay baja de obras. |
| `elemento_lista` (`obra_id`) | Igual: no hay una operación "en qué listas está esta obra". |
| `elemento_lista` (`lista_id`, `posicion`) | Una lista tiene pocas obras; ordenar por `posicion` en memoria es insignificante frente al costo de mantener otro índice al reordenar. |
| `obra_resumen` (`promedio`) | No hay requerimiento de ranking de obras mejor calificadas. |
| `usuario` (`rol`) | La gestión de administradores es poco frecuente y sobre pocas filas. |
| `resena` (`oculta`) | La moderación (RF-18) actúa sobre una reseña concreta; no hay una cola de reseñas por moderar. |
| `resena` (`calificacion`) | El filtro de RF-26 se resuelve partiendo del usuario (I3 y UNIQUE), no recorriendo reseñas por calificación. |
| Búsqueda de texto en `resena.texto` | No hay requerimiento de búsqueda en reseñas. La búsqueda de obras (RF-05) la resuelven el documental y el grafo. |

Si en la implementación se añade una operación que lo necesite, se agrega el índice entonces, con su justificación en este archivo.

## 5. Costo de escritura

| Tabla | Índices además de la clave primaria | Operaciones frecuentes que escriben |
|---|---|---|
| `resena` | UNIQUE, I1, I2 | Publicar, editar y eliminar reseñas |
| `seguimiento` | I4 | Seguir y dejar de seguir |
| `lista` | I5 | Crear y eliminar listas |
| `sync_outbox` | I6 | Un evento por cada escritura relevante |
| `sesion` | I7 | Una escritura por cada inicio de sesión |

El volumen es de proyecto académico y las lecturas son más frecuentes que las escrituras, así que el costo es aceptable. `resena` concentra más índices porque el trigger del promedio la consulta en cada cambio.

## 6. Cómo verificar que se usan

Al implementar, cada consulta debe revisarse con el plan de ejecución del motor (`EXPLAIN` o equivalente) para comprobar que usa el índice esperado y no un recorrido completo.

| Consulta | Índice esperado |
|---|---|
| Buscar usuario por correo (inicio de sesión) | UNIQUE de `usuario.correo` |
| Reseñas de una obra, recientes primero | I1 |
| Recálculo del promedio de una obra (trigger) | I1 |
| Reseñas de un usuario, recientes primero | I2 |
| Obras terminadas de un usuario | Clave primaria de `estado_obra` |
| RF-26 paso 1: unir estados terminados con reseñas del mismo usuario | Clave primaria de `estado_obra` y UNIQUE (`usuario_id`, `obra_id`) |
| Seguidores de un usuario | I4 |
| Listas de un usuario | I5 |
| Eventos pendientes en orden | I6 |
| Validar la sesión de una petición | Clave primaria de `sesion` y de `usuario` |
| Sesiones de un usuario al eliminar su cuenta | I7 |
| Eliminar una cuenta (RF-04) | Los índices de `usuario_id` y `seguido_id` de la sección 3; no debe haber recorridos completos |
