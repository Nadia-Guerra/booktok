# Brief para el Entregable 4: implementación de las tres bases

Instrucciones de trabajo para una sesión nueva. Todo lo que hace falta saber del proyecto está en `docs/`; este archivo dice **qué construir, con qué reglas y en qué orden**. Léelo completo antes de escribir nada.

## 1. Contexto en cinco líneas

- **Del Libro a la Pantalla:** app Android (React Native con Expo) con API Node, TypeScript y Express, que coordina **tres bases**: PostgreSQL, MongoDB y Neo4j Community (D-32, D-33, D-09, D-14, D-22).
- Cada dato tiene una sola fuente de verdad y las copias se sincronizan por la bandeja `sync_outbox` (`docs/modelado/fuente-de-verdad.md`, `docs/arquitectura/04-fuente-de-verdad-y-sincronizacion.md`).
- El **diseño de las tres bases ya está escrito y decidido** en `docs/modelado/`. Tu trabajo es **implementarlo y demostrar que funciona**, no rediseñarlo.
- La demo y el plazo son muy cortos (ver `docs/arquitectura/05-orden-de-construccion.md`, sección 7). Prioriza lo que funciona y se puede reproducir sobre lo elegante.
- Idioma de trabajo y de los documentos: **español**.

## 2. Qué hay que entregar (texto del entregable)

**Entregable 4. Implementación de las tres bases.**

*Base relacional*
- Definición de tablas, claves primarias y foráneas, restricciones e índices justificados.
- Scripts SQL de creación y carga de datos.
- Consultas representativas y pruebas de integridad y transacciones.

*Base documental*
- Definición de colecciones y estructura de documentos.
- Reglas de validación, índices y estrategia de identificación.
- Scripts o mecanismos reproducibles de carga.
- Consultas representativas y pruebas de documentos válidos e inválidos.

*Base de grafos*
- Restricciones, índices, etiquetas, propiedades y relaciones.
- Scripts Cypher de creación y carga.
- Datos de prueba y consultas funcionales.

*Además:* pruebas de humo, integridad, cardinalidad y resultados.

**Criterio de aceptación:** las tres bases pueden construirse **desde cero** mediante instrucciones documentadas y generan datos **coherentes con el dominio**.

## 3. Qué entra y qué no

| Entra | No entra |
|---|---|
| `docker-compose.yml` con las tres bases, límites de memoria, perfiles y comprobaciones de salud (D-36) | La API Express, los servicios y repositorios en TypeScript (entregable 6) |
| Scripts de creación: tablas, restricciones, índices, trigger, colecciones con validador, índices de MongoDB, restricciones de Neo4j | La app móvil |
| Una **semilla coherente** en las tres bases | El worker de sincronización (se simula cargando las copias a mano en la semilla) |
| Pruebas ejecutables de humo, integridad, cardinalidad y resultados | Autenticación en código (solo la tabla `sesion` y su restricción) |
| Un README con la reconstrucción desde cero | |

## 4. Qué leer antes, en este orden

1. `docs/decisiones_tomadas.md` completo. Pesan especialmente: D-02, D-03, D-08, D-09, D-11, D-12, D-13, D-14, D-15, D-17, D-19 a D-24, D-25, D-27, D-33 a D-37.
2. `docs/modelado/relacional/` (`01` a `04`): tablas, restricciones, índices (I6 es **parcial**, I7 existe por D-35), operaciones, tabla `sesion`, 17 pruebas de integridad.
3. `docs/modelado/documental/` (`01` a `05`): patrones de acceso, colecciones, validador, índices, pruebas.
4. `docs/modelado/grafo/` (`01` a `05`): consultas CG-01 a CG-25, propiedades, restricciones, cardinalidad.
5. `docs/modelado/fuente-de-verdad.md`, `docs/modelado/matriz-responsabilidades.md` y `docs/requerimientos/levantamiento-requerimientos.md` (RNF-08 y RNF-10 son clave para la semilla).
6. `docs/arquitectura/03-eleccion-stack.md`, sección 4.7 (memoria), y `04-fuente-de-verdad-y-sincronizacion.md`.

**Regla:** si algo de los documentos choca con lo que el motor real permite, **no lo resuelvas en silencio**. Comprueba con el motor, explícalo y registra la corrección en `docs/decisiones_tomadas.md` y en el documento afectado. Hay un precedente: D-08 corrigió el índice parcial por uno *sparse* tras probarlo en el motor real.

## 5. Decisiones técnicas que ya se aplican

| Tema | Decisión |
|---|---|
| Motores | PostgreSQL (versión estable reciente, fijarla y documentarla), MongoDB 9.0.4 (con la que se hicieron las pruebas de los documentos; si no hay imagen con esa etiqueta, la más cercana, documentándolo) y Neo4j 5 Community |
| Identificadores | UUID en **minúsculas y con guiones**, el mismo en las tres bases (RNF-08, D-11). En PostgreSQL, tipo `UUID`; en MongoDB, `_id` como texto de 36 caracteres; en Neo4j, propiedad de texto |
| Memoria (D-36) | Neo4j: tope 1,25 GB, montículo 512 MB, caché de páginas 256 MB. MongoDB: tope 512 MB, caché de WiredTiger 0,25 GB. PostgreSQL: tope 384 MB, `shared_buffers` 64 MB, 20 conexiones. Son valores iniciales: ajústalos con `docker stats` y anótalos |
| Perfiles de Compose | Un perfil por base, para levantar solo lo que se esté probando. Comprobaciones de salud en las tres |
| Neo4j Community | Solo restricciones de **unicidad** en la base. Obligatoriedad, tipo y rango los valida la API (D-22), así que las pruebas de esas reglas se documentan como "responsabilidad de la API" |
| Sesión | Tabla `sesion` con `token_hash` como clave primaria, `ON DELETE CASCADE` hacia `usuario` y un CHECK (D-35) |

## 6. Estructura de carpetas propuesta

Puedes ajustarla, pero que quede simple y que cada archivo se pueda ejecutar solo.

```
docker-compose.yml
.env.example
db/
  README.md                  cómo construir desde cero, paso a paso
  relacional/                01-esquema.sql, 02-indices.sql, 03-trigger.sql, 04-semilla.sql, pruebas/
  documental/                01-colecciones.js, 02-indices.js, 03-semilla.js, pruebas/
  grafo/                     01-restricciones.cypher, 02-semilla.cypher, pruebas/
  semilla/                   semilla.json y el generador
  scripts/                   reconstruir y probar, para PowerShell
  evidencias/                salida de cada prueba
```

**Una sola fuente para la semilla.** Para que los ids coincidan en las tres bases (RNF-08), escribe los datos una vez en `db/semilla/semilla.json` y genera de ahí los tres cargadores. Los archivos generados **se guardan en el repositorio como scripts normales**, porque el entregable pide scripts SQL, de MongoDB y Cypher legibles.

## 7. Orden de trabajo, por escalones

Termina un escalón y muéstrame el resultado antes del siguiente. No lo hagas todo de golpe.

| # | Escalón | Qué debe quedar funcionando |
|---|---|---|
| 1 | Compose y salud | Las tres bases arrancan con sus límites, por perfil, y responden. Empieza con PostgreSQL solo |
| 2 | Relacional | Esquema, restricciones, índices (I6 parcial, I7), trigger del promedio con bloqueo de fila (D-02), tabla `sesion`. Las 17 pruebas de `02-restricciones-integridad.md`, sección 9, ejecutables |
| 3 | Documental | Colecciones `libros`, `peliculas` y `resenas_comparativas` con su validador, índices IX-01 a IX-05, y las pruebas de documentos válidos e inválidos de `04-validacion.md` y de índices de `05-indices.md` |
| 4 | Grafo | Restricciones de unicidad, índices, relaciones, y las pruebas de cardinalidad de `05-cardinalidad.md` y de restricciones de `04-restricciones.md` |
| 5 | Semilla coherente | El generador y los tres cargadores, más un script de **coherencia entre bases** (sección 8) |
| 6 | README y reconstrucción | Instrucciones y un script que borra todo, construye, carga y prueba, ejecutado de verdad una vez desde cero |

### Riesgos que hay que comprobar pronto

- **El trigger del promedio y la cascada (RF-04).** Los documentos suponen que borrar un usuario dispara el trigger por cada reseña borrada en cascada. Compruébalo con la prueba 11 antes de seguir: si no se cumple, el diseño cambia.
- **Concurrencia de la prueba 15 y de D-23.** Hazlas con **hilos o procesos de un solo script** contra el motor, no con muchos `docker exec` en paralelo (ver reglas de la sección 9).
- **Índice único *sparse* del ISBN** (D-08) y el índice de texto (IX-01, IX-02): ya se probaron en MongoDB 9.0.4; confirma que siguen funcionando con la versión que fijes.

## 8. Semilla: qué debe contener

Pequeña pero **con forma**. El objetivo es que cualquier consulta de los documentos devuelva algo con sentido.

| Tipo | Cantidad aproximada | Observaciones |
|---|---|---|
| Libros y películas | 10 a 12 de cada uno, con adaptaciones reales | Al menos un libro con varias adaptaciones y una cadena de adaptaciones (RNF-10) |
| Personas | 20 a 30 | Actores y directores que aparecen en **varias** películas, y alguna persona con más de un rol |
| Usuarios | 6 a 8 | Uno con rol `admin` y varios `lector`. La contraseña de prueba se documenta **solo** en el README de la semilla |
| Reseñas, estados, seguimientos, listas | Las necesarias para los escenarios de abajo | Incluir una reseña oculta |
| Reseñas comparativas | 3 a 5 | Solo sobre parejas unidas por `adaptado_a` |
| Fichas en `borrador` | Al menos 1 | Para comprobar que no se muestran |
| Libros sin ISBN y con ISBN | Mezcla | Para el índice *sparse* |

**Escenarios que la semilla debe permitir demostrar:**

- **RF-24:** un camino de al menos 3 saltos entre un autor y un actor, con **más de una ruta más corta**.
- **RF-25:** un director que adaptó libros de **dos o más autores**.
- **RF-26:** un usuario con un libro terminado y calificación de 4 o más, cuyo director adaptó **otro libro que no ha leído**. Más casos negativos: calificación de 3, película en vez de libro, estado pendiente y reseña oculta.
- **RF-27:** un usuario que sigue a **dos o más lectores** de un libro con adaptación.
- **RF-13 y RN-08:** `obra_resumen.promedio` y `total_resenas` consistentes con las reseñas (los calcula el trigger al cargar, no a mano).
- **D-24:** cada ficha publicada con sus relaciones mínimas.

**Coherencia entre bases.** Un script debe comprobar, y que falle si algo no cuadra:

| Comprobación |
|---|
| Cada `obra_id` de una ficha publicada existe en `obra_resumen` y como nodo, con el mismo tipo |
| El `reparto` de cada ficha de película coincide con las relaciones `actuó_en` del grafo (incluida la `foto_url`) |
| `sigue` coincide con `seguimiento`, y `leyó` con los estados `terminada` de **libros** |
| `promedio` y `total_resenas` coinciden con las reseñas no ocultas |
| Los ids son UUID en minúsculas en las tres bases |

## 9. Reglas de trabajo en este entorno

- **Sistema:** Windows 11, PowerShell. El Bash disponible es Git Bash. Los comandos que des al usuario van en PowerShell.
- **Docker y memoria.** La máquina tiene **6 GB de RAM** y su Docker también aloja contenedores de **otros proyectos**: no los toques ni los detengas. No lances muchas JVM a la vez: como mucho 2 o 3 procesos de `cypher-shell` en paralelo, con un `--memory` fijo. Pon `timeout` a los comandos `docker`. Para concurrencia, usa hilos de un solo script, no muchos `docker exec`.
- **Scripts con expresiones regulares o barras invertidas:** escríbelos con la herramienta de escritura de archivos, no con *heredoc* de Bash, que se come las barras.
- **Seguridad.** Ningún secreto en el repositorio: usa `.env.example` y mantén `.env` fuera de los commits.
- **Git.** El repositorio ya existe (rama `master`, con un primer commit de `docs/`). No cambies de rama, no hagas `push` y haz commits solo si el usuario lo pide. Otra sesión puede estar editando `docs/` a la vez, así que **vuelve a leer un archivo de `docs/` justo antes de editarlo**. Tú trabajas en `db/`, `docker-compose.yml` y `.env.example`.
- **Documentación.** Si decides algo que no estaba decidido, o corriges algo tras probarlo en el motor, registra una decisión nueva en `docs/decisiones_tomadas.md` con contexto, alternativas y razón, igual que las demás.
- **Pendientes.** Cuando dejes algo pendiente, explícalo con contexto y un ejemplo, no con una fila escueta.
- **Honestidad en los resultados.** Si una prueba falla o algo no se pudo ejecutar, dilo con la salida real. No marques como hecho lo que no corriste.

## 10. Cuándo está hecho

- [ ] `docker compose` levanta las tres bases dentro de sus límites de memoria.
- [ ] Un solo comando de PowerShell reconstruye todo **desde cero** (borra volúmenes, crea, carga y prueba) y se ejecutó con éxito al menos una vez.
- [ ] Las 17 pruebas relacionales, las pruebas del documental (válidos e inválidos, y de índices) y las de grafo (restricciones y cardinalidad) pasan o tienen su fallo documentado.
- [ ] El script de coherencia entre bases pasa.
- [ ] Cada consulta representativa devuelve un resultado esperado con la semilla.
- [ ] La salida de cada prueba está guardada en `db/evidencias/`, porque **el entregable 5 pide "evidencia de ejecución"** y así no hay que repetirla.
- [ ] `db/README.md` explica la reconstrucción paso a paso, las versiones fijadas y los valores de memoria.
- [ ] Las decisiones nuevas o correcciones están en `docs/decisiones_tomadas.md`.

## 11. Cómo reportar

Al cerrar cada escalón: qué se ejecutó, cuánto tardó, versiones fijadas, memoria usada (`docker stats`), qué falló y qué queda pendiente. Al final: la lista de la sección 10 con su estado real.

## 12. Entregables que vienen después

Después vienen los entregables 5 a 8. Esta implementación debe dejar lista la base para ellos.

| Entregable | Qué pide | Qué debe dejar este entregable |
|---|---|---|
| 5. Catálogo de operaciones y consultas | Cada operación con identificador y propósito, bases que intervienen, parámetros y validaciones, resultado y formato de salida, casos normales, límite y error, y evidencia de ejecución. Debe haber operaciones de los tres modelos e integradas que consulten más de una base | Consultas y pruebas **numeradas** (O, AP y CG de los documentos) con su salida guardada en `db/evidencias/` |
| 6. Backend y API | API REST o GraphQL con decisión justificada, controladores, servicios y repositorios separados, drivers oficiales, validación, errores y autorización, consultas parametrizadas, configuración externa de credenciales y contrato de API documentado. El backend coordina las bases y la interfaz no se conecta a ellas | Credenciales por variables de entorno (`.env.example`), consultas ya parametrizadas en los scripts de ejemplo y una semilla reutilizable por las pruebas de la API |
| 7. Aplicación e integración | Interfaz funcional para los usuarios definidos (lector, administrador y visitante), flujos que usen cada una de las tres bases, al menos un caso integrado que combine dos o más, y **evidencia de que los cambios y consultas se reflejan conforme a la estrategia de consistencia**. Criterio: una sola aplicación y los tres modelos con participación demostrable | La semilla debe permitir un caso integrado (por ejemplo, seguir a un lector y ver las recomendaciones de películas, que pasa por PostgreSQL, el grafo y las fichas de MongoDB) y datos con los que se vea el efecto de la sincronización eventual |
| 8. Pruebas, documentación y despliegue | Pruebas unitarias, de cada base y de integración, funcionales de los principales casos de uso, de errores y de consistencia entre bases; evaluación básica de rendimiento con condiciones documentadas; instrucciones de instalación, configuración, carga y ejecución; variables de entorno de ejemplo sin credenciales reales; repositorio de código. Criterio: otra persona puede seguir la documentación y ejecutar el proyecto en un entorno compatible | Las pruebas de este entregable **son las pruebas de cada base** del entregable 8: guárdalas en un formato que se pueda volver a ejecutar, con versiones fijadas y un README que otra persona pueda seguir en una máquina limpia. Nada de rutas ni credenciales propias de esta máquina |
