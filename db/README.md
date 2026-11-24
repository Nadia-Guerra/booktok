# Bases de datos de Del Libro a la Pantalla

Las tres bases del Entregable 4: **PostgreSQL** (usuarios, reseñas, estados, listas, seguimientos), **MongoDB** (fichas de libros y películas, reseñas comparativas) y **Neo4j** (personas, autoría, dirección, reparto, adaptaciones, recorridos y recomendaciones). Corren en contenedores de Docker con la memoria limitada, se construyen con scripts, y cada prueba deja su salida guardada en [`evidencias/`](evidencias/).

El diseño está en `docs/modelado/` y las decisiones en `docs/decisiones_tomadas.md`; aquí solo se implementa.

## Empezar en dos comandos

Necesitas Windows con **Docker Desktop** y **Windows PowerShell 5.1** (el que trae Windows). Desde la raíz del repositorio:

```powershell
Copy-Item .env.example .env          # una sola vez; cambia las claves si quieres
.\db\scripts\reconstruir.ps1         # borra, levanta, construye, prueba y carga la semilla (unos 4 min)
```

`reconstruir.ps1` pide confirmación porque **borra los volúmenes** de las tres bases (solo los del proyecto `dlbp`; no toca contenedores de otros proyectos). `-Forzar` no pregunta; `-SinPruebas` omite las pruebas y deja las bases construidas y con la semilla. Termina con código 0 si todo pasa y 1 si algo falla, y deja su salida en [`evidencias/reconstruccion/`](evidencias/reconstruccion/).

Al terminar, las tres bases quedan **levantadas y con la semilla cargada** (8 usuarios, 11 libros, 12 películas, 29 personas…; ver [`semilla/README.md`](semilla/README.md), con los usuarios de prueba).

## Qué hace la reconstrucción, paso a paso

Cada paso se puede ejecutar a mano. Los scripts se ejecutan **dentro de los contenedores**, donde `./db` está montado en `/db` de solo lectura.

| # | Paso | Comando |
|---|---|---|
| 1 | Borrar contenedores y volúmenes del proyecto | `docker compose --profile todas --profile herramientas down -v --remove-orphans` |
| 2 | Levantar cada base (espera a que esté sana) | `docker compose --profile postgres up -d --wait`, luego `--profile mongo` y `--profile neo4j` |
| 3 | Construir el esquema relacional | `docker exec dlbp-postgres sh /db/relacional/construir.sh` |
| 4 | Construir colecciones e índices | `docker exec dlbp-mongo sh /db/documental/construir.sh` |
| 5 | Construir restricciones e índice del grafo | `docker compose --profile herramientas run --rm --no-deps -T neo4j-cliente /db/grafo/construir.sh` |
| 6 | Pruebas de cada base (crean y **borran** sus datos) | `.\db\scripts\probar-relacional.ps1`, `probar-documental.ps1`, `probar-grafo.ps1` y `probar-grafo-concurrencia.ps1` |
| 7 | Cargar la semilla | `.\db\scripts\cargar-semilla.ps1` |
| 8 | Consultas representativas y coherencia sobre la semilla (solo lectura) | `.\db\scripts\probar-semilla.ps1` |

Los pasos 3 a 5 también cargan la semilla si existe; `reconstruir.ps1` la omite (`SIN_SEMILLA=1`) para que las pruebas del paso 6 corran sobre bases vacías y la semilla se cargue después.

> **El orden importa.** Las pruebas de los pasos 6 (`db/*/pruebas/`) crean y borran sus propios datos, y `probar-grafo.ps1` **vacía el grafo entero** al empezar y al terminar. Córrelas antes de cargar la semilla, o vuelve a ejecutar `cargar-semilla.ps1` después. Las del paso 8 solo leen.

## Versiones fijadas

Fijadas en [`.env.example`](../.env.example) (D-39). El diseño no depende de nada de la versión, pero las pruebas se hicieron con estas.

| Motor | Versión | Imagen |
|---|---|---|
| PostgreSQL | 18.7 | `postgres:18.7` (Debian) |
| MongoDB | 9.0.4 | `mongo:9.0.4` |
| Neo4j | 5.26.34 Community | `neo4j:5.26.34-community` |

Neo4j Community solo impone restricciones de **unicidad**; la obligatoriedad y el tipo los valida la API (D-22). Las consultas CG-21 y CG-23 usan `CALL (variable) { … }`, que pide Neo4j 5.23 o más (D-45).

## Puertos y conexión

Las bases solo escuchan en `127.0.0.1`. Las credenciales están en `.env` (no se versiona).

| Base | Puerto en tu máquina | Cómo entrar |
|---|---|---|
| PostgreSQL | **5433** (el 5432 suele estar ocupado por un PostgreSQL local de Windows) | `docker exec -it dlbp-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'` |
| MongoDB | 27017 | `docker exec -it dlbp-mongo sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin "$MONGO_INITDB_DATABASE"'` |
| Neo4j | 7474 (navegador y API HTTP) y 7687 (Bolt) | `http://localhost:7474` con el usuario y la clave de `.env` |

## Memoria (D-36 y D-47)

La máquina tiene 6 GB y Docker ve unos 3 GB, compartidos con otros proyectos. Cada servicio lleva un **tope de contenedor** y un ajuste interno que lo respeta. Valores en uso, con lo medido con `docker stats` al terminar `reconstruir.ps1` (las cifras exactas de cada ejecución están en `evidencias/reconstruccion/resumen.txt`):

| Servicio | Tope | Ajuste interno | Medido (con la semilla) |
|---|---|---|---|
| Neo4j | 1,25 GB | montículo 512 MB; **caché de páginas 128 MB** (bajada desde 256 MB, D-47) | 1,03 GiB (82 %) |
| MongoDB | 512 MB | caché de WiredTiger de 0,25 GB | 203 a 230 MiB (40–45 %) |
| PostgreSQL | 384 MB | `shared_buffers` 64 MB, 20 conexiones | 56 a 58 MiB (15 %) |
| Cliente de Neo4j (efímero, `cypher-shell`) | 384 MB | `-Xmx128m` | solo mientras corre un script |

Reglas para no tumbar Docker:

- **Un proceso pesado a la vez.** Cada `cypher-shell` es una JVM y cada `mongosh` es un Node entero. Los scripts los lanzan en secuencia; no los pongas en paralelo.
- **Neo4j va al 79–85 % de su tope** (lo que ocupa la JVM, no una fuga). No hay margen en Docker para subirlo; sí para bajarlo (D-47).
- La comprobación de salud de MongoDB solo abre el puerto: ejecutar `mongosh` cada pocos segundos ahogaba a `mongod` dentro de 512 MB (D-39).

## Estructura

```
docker-compose.yml          un perfil por base (postgres, mongo, neo4j, todas) y uno de herramientas (cliente de Neo4j)
.env.example                versiones, usuarios y puertos
db/
  relacional/               01-esquema.sql, 02-indices.sql, 03-trigger.sql, 04-semilla.sql (generado), construir.sh, pruebas/
  documental/               01-colecciones.js, 02-indices.js, 03-semilla.js (generado), construir.sh, mongo.sh, pruebas/
  grafo/                    01-restricciones.cypher, 02-semilla.cypher (generado), consultas/CG-*.cypher, construir.sh, cypher.sh, pruebas/
  semilla/                  semilla.json (la única fuente), generar.ps1 y su README
  scripts/                  los .ps1 de abajo
  evidencias/               la salida guardada de cada prueba
```

## Scripts (`db/scripts/`)

| Script | Para qué | ¿Borra datos? |
|---|---|---|
| `reconstruir.ps1` | Todo lo de arriba, desde cero | **Sí**, los volúmenes |
| `cargar-semilla.ps1` | Vacía y carga la semilla en las tres bases | Sí, las vacía antes de cargar |
| `probar-relacional.ps1` | Las 17 pruebas de `02-restricciones-integridad.md`, sección 9 (integridad, transacción, concurrencia del trigger, índices) | Usa sus propios datos |
| `probar-documental.ps1` | Documentos válidos e inválidos, índices y controles negativos (en una base aparte, `dlbp_pruebas`) | No toca la base de la aplicación |
| `probar-grafo.ps1` | Restricciones, cardinalidad y consultas del grafo (137 pasos) | **Vacía el grafo entero** |
| `probar-grafo-concurrencia.ps1` | Prueba de D-23: dos sesiones intentan dar dos libros de origen a una película | Sí, el grafo |
| `probar-grafo.ps1 -Semilla` | Las consultas CG sobre la semilla | No |
| `probar-semilla.ps1` | O17, O18, O20 y O22; AP-01 a AP-05, AP-21 y AP-23; CG-01 a CG-10 y CG-21 a CG-23; y la coherencia | No (solo lee) |
| `coherencia.ps1` | 13 comprobaciones entre las tres bases; **falla si algo no cuadra** | No (solo lee) |
| `..\semilla\generar.ps1` | Valida `semilla.json` y regenera los tres cargadores | Escribe los 3 archivos generados |

Los `.ps1` están escritos **sin tildes** a propósito: Windows PowerShell 5.1 lee mal el UTF-8 sin BOM. Los archivos que generan o las pruebas que leen, que sí las llevan, se leen y se escriben explícitamente en UTF-8 sin BOM.

## Evidencias (`db/evidencias/`)

El Entregable 5 pide evidencia de ejecución; cada script guarda la suya aquí.

| Carpeta | Qué hay |
|---|---|
| `relacional/`, `documental/`, `grafo/` | Salida de cada prueba de cada base y un `resumen.txt` |
| `semilla/` | Carga de la semilla, consultas sobre ella (`consultas-*.txt`, `grafo-01-consultas.txt`), `coherencia.txt` y la **prueba negativa** de la coherencia (12 corrupciones deliberadas, todas detectadas) |
| `reconstruccion/` | La salida de cada paso de `reconstruir.ps1` y su `resumen.txt` con versiones, tiempos y memoria |

## Problemas conocidos y cómo se resuelven

| Síntoma | Causa y solución |
|---|---|
| `coherencia.ps1` falla con muchos nodos o filas que faltan | Corriste `probar-grafo.ps1` (o una prueba que borra) después de cargar la semilla. Ejecuta `.\db\scripts\cargar-semilla.ps1` |
| `cargar-semilla.ps1` dice que los cargadores no corresponden a `semilla.json` | Editaste el JSON sin regenerar. Ejecuta `.\db\semilla\generar.ps1` |
| El puerto 5432 está ocupado | Por eso PostgreSQL usa el 5433 (`POSTGRES_HOST_PORT` en `.env`) |
| Un contenedor se reinicia solo o `docker` va lento | Se acabó la memoria de Docker. Cierra otros proyectos y no lances varias JVM a la vez (D-36) |
| Neo4j rechaza un script con un carácter raro al inicio | Un texto canalizado desde PowerShell 5.1 antepone un BOM. Ejecuta los scripts desde `/db` dentro del contenedor, como hacen los de aquí (D-39) |
| PostgreSQL no arranca con un volumen creado con la versión 16 | La 18 guarda los datos en un subdirectorio versionado (D-39). Reconstruye con `reconstruir.ps1` |
| Neo4j tarda más de un minuto en estar sano | Es normal: `start_period` de 40 s y la JVM arranca despacio. `up --wait` espera |

## Decisiones que conviene leer

D-36 (memoria y perfiles), D-38 (bloqueo del trigger del promedio), D-39 (versiones, puerto y salud), D-40 (tipos de PostgreSQL), D-41 (índice de texto de personas), D-42 (bloqueo de D-23), D-43 a D-46 (la semilla y su coherencia) y D-47 (memoria de Neo4j). Los documentos de diseño de cada base están en `docs/modelado/relacional/`, `documental/` y `grafo/`.
