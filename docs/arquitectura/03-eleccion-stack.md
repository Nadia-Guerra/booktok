# Elección del stack: matriz de comparación y justificación

Registra qué tecnologías usa cada componente, por qué se eligieron y cómo se comparan con las alternativas. Las decisiones están en `../decisiones_tomadas.md` (D-32 a D-37). Las piezas y sus conexiones se ven en `01-diagrama-arquitectura.md` y su reparto de tareas en `02-responsabilidades.md`.

## 1. Restricciones que condicionan el stack

| Restricción | Origen | Qué exige |
|---|---|---|
| Plazo de pocos días | Equipo | Pocos lenguajes y herramientas que ya se conozcan |
| App Android con la administración incluida, probada en un teléfono real | D-28 | Un cliente móvil que se pueda probar rápido en un teléfono |
| API modular de un solo proceso, con el worker dentro | D-04, D-29 | Un bucle de fondo sencillo y ninguna dependencia de varias réplicas |
| Neo4j Community no impone obligatoriedad, tipo ni rango | D-22 | Una buena librería de validación en la API |
| Transacciones y bloqueos de fila en el relacional, y escrituras con bloqueo en Neo4j | RF-13, D-02, D-23 | Drivers oficiales con transacciones |
| MongoDB y Neo4j ya elegidos | D-09, D-14 | Drivers oficiales de ambos para Node |
| Identificadores UUID en minúsculas, iguales en las tres bases | RNF-08, D-11 | Un tipo UUID en el relacional y un formato único en la API |
| Desarrollo local con Docker Compose y túnel para la demo | D-30 | Todo debe correr en contenedores |
| Máquina de desarrollo con 6 GB de RAM y Docker compartido con otros proyectos | Equipo | Límites de memoria en los contenedores, sobre todo en Neo4j, que corre sobre la JVM |

## 2. Stack por componente

| Componente | Tecnología | Estado | Por qué (resumen; el detalle está en la sección 4) |
|---|---|---|---|
| App móvil | React Native con Expo, en TypeScript | Decidido (D-32) | Hay experiencia previa; se prueba en un teléfono real con recarga instantánea |
| API: lenguaje y entorno | TypeScript sobre Node | Decidido (D-32) | Un solo lenguaje para app y API; esquemas y tipos compartidos |
| API: framework HTTP | Express | Decidido (D-32) | Hay experiencia previa; sin curva de aprendizaje |
| Validación de datos | Zod | Decidido (D-37) | Cubre lo que Neo4j Community no impone (D-22) y se comparte con la app |
| Base relacional | PostgreSQL | Decidido (D-33) | El diseño usa UUID, ENUM, `CHECK`, triggers y bloqueo de fila, todo nativo |
| Base documental | MongoDB | Decidido (D-09) | Las pruebas del diseño se hicieron en la versión 9.0.4 |
| Base de grafos | Neo4j Community | Decidido (D-14, D-22) | Edición gratuita |
| Sesión y contraseñas | Token aleatorio con su hash en la tabla `sesion` de PostgreSQL; contraseñas con Argon2id (o bcrypt) | Decidido (D-35) | Cierra sesión de verdad y la cascada de RF-04 la invalida sola |
| Contenedores | Docker Compose, con límites de memoria y perfiles | Decidido (D-30, D-36) | Misma composición en la máquina del equipo y, si hiciera falta, en un servidor |
| Túnel para la demo | Cloudflare Tunnel o ngrok | Decidido (D-30) | Da HTTPS, que Android exige por defecto |
| Imágenes | URL pública pegada por el administrador | Decidido (D-31) | Sin almacenamiento propio |

## 3. Matrices de comparación

Las valoraciones de curva, riesgo y encaje son un juicio, no una medida, y dependen de lo que ya se conoce. Donde no hay experiencia declarada con una alternativa, se indica.

### 3.1 Cliente móvil y lenguaje de la API (escalón 3a)

| Criterio | S1. Kotlin nativo + Ktor o Spring | **S2. React Native + Node (TypeScript)** | S3. Flutter + FastAPI (Python) |
|---|---|---|---|
| Lenguajes a manejar | 1 | **1** | 2 (Dart y Python) |
| Prueba en teléfono real mientras se desarrolla | USB desde Android Studio | **QR con Expo Go, cambios al instante** | USB con recarga en caliente |
| Instalación para la demo | APK | APK compilado o Expo Go | APK |
| Drivers oficiales de las tres bases en la API | Sí (los de Java) | **Sí** | Sí |
| Validación de datos | Kotlin serialization, más manual | **Zod** | Pydantic |
| Tipos compartidos entre app y API | Sí | **Sí** | No |
| Curva de aprendizaje | Alta | **La menor: ya hay experiencia con la combinación** | Media |
| Riesgo con el plazo | Alto | **Bajo** | Medio |

### 3.2 Framework HTTP de la API

| Criterio | **Express** | Fastify | NestJS |
|---|---|---|---|
| Experiencia previa | **Sí** | Sin experiencia declarada | Sin experiencia declarada |
| Curva de aprendizaje | **Mínima** | Baja | Media a alta |
| Estructura que impone | Ninguna: la capa de rutas, servicios y repositorios la imponen los documentos (`02-responsabilidades.md`) | Ninguna | Módulos, controladores y servicios, parecidos a las capas del diseño, pero con mucho código base |
| Validación incluida | No: se añade Zod como middleware | Sí, con esquemas JSON | Sí, con clases y decoradores |
| Rendimiento | Suficiente para este volumen | Mayor, que aquí no se aprovecha | Suficiente |
| Riesgo con el plazo | **Bajo** | Medio | Alto |

### 3.3 Motor relacional

| Criterio | **PostgreSQL** | MySQL o MariaDB |
|---|---|---|
| Tipo UUID | **Nativo** (`UUID`), como lo define `../modelado/relacional/01-tablas-campos-llaves-relaciones.md` | MySQL no lo tiene (se guardaría como texto o binario); MariaDB lo incluye desde la versión 10.7 |
| Dominios cerrados (`ENUM`) | **Tipo propio y reutilizable** (`CREATE TYPE ... AS ENUM`) | `ENUM` por columna |
| `CHECK` (calificación de 1 a 5, nadie se sigue a sí mismo, correo en minúsculas) | **Sí** | Sí (MySQL lo hace cumplir desde la 8.0.16) |
| Trigger del promedio con bloqueo de fila (D-02) | **Sí** (`SELECT ... FOR UPDATE`) | Sí |
| Índice automático en las llaves foráneas | No: hay que crearlos | Sí (InnoDB) |
| Encaje con el diseño ya escrito | **Directo, sin adaptaciones** | Hay que resolver el UUID |
| Experiencia previa | Sin experiencia declarada | Sin experiencia declarada |

Una consecuencia de PostgreSQL: como no indexa solas las llaves foráneas, la tabla de cobertura de `../modelado/relacional/03-indices.md` (sección 3) debe cumplirse creando esos índices explícitamente.

## 4. Justificación por componente

### 4.1 App móvil: React Native con Expo y TypeScript

**Por qué.**
- **Experiencia previa.** Con un plazo de pocos días, no aprender una herramienta nueva es el criterio que más pesa.
- **Ciclo de prueba corto.** Con Expo Go se escanea un código QR y la app corre en el teléfono real; al guardar un archivo, el cambio aparece al instante. No hace falta compilar un APK en cada prueba.
- **Una sola base de código para lector y administrador.** Las pantallas de administración (D-28) son pantallas más del mismo proyecto, protegidas por el rol que comprueba la API.
- **Encaja con lo que ya se decidió.** La app solo llama a la API por HTTPS, descarga las imágenes de las URL guardadas (D-31) y no necesita ninguna librería especial de bases de datos.

**Lo que hay que tener en cuenta.**
- **Expo Go es para desarrollar, no para la demo.** Depende de un servidor de desarrollo encendido y alcanzable por el teléfono. Para la demo conviene compilar un APK de prueba, con el servicio de compilación de Expo o de forma local con el SDK de Android. No se verificaron los límites actuales del plan gratuito de ese servicio.
- **HTTPS obligatorio.** Android bloquea por defecto el tráfico HTTP sin cifrar desde su versión 9. El túnel de la demo (D-30) ya entrega HTTPS.
- **Dirección base configurable.** La del túnel puede cambiar entre sesiones (D-30), así que no se escribe fija en el código.
- **Token en almacenamiento seguro del teléfono.** Expo ofrece una librería para eso (`expo-secure-store`); se confirma al definir la autenticación.

### 4.2 API: TypeScript sobre Node con Express

**Por qué TypeScript y Node.**
- **Un solo lenguaje para toda la aplicación.** Los esquemas de validación y los tipos de datos (por ejemplo, la forma de una ficha de libro) se escriben una vez y los usan la app y la API. Para compartirlos basta una carpeta común dentro del mismo repositorio.
- **Drivers oficiales de las tres bases:** `pg` para PostgreSQL, `mongodb` para MongoDB y `neo4j-driver` para Neo4j. Los tres admiten transacciones, que es lo que exigen RF-13, D-02 y D-23.
- **El worker de D-29 cabe de forma natural.** Node ejecuta el código en un solo hilo. Un bucle asíncrono que lee `sync_outbox` y aplica cada evento no compite con el resto de la API, y garantiza por construcción que los eventos se aplican uno a uno y en orden (D-04).

**Por qué Express.**
- **Hay experiencia previa**, y es la razón principal.
- **Es lo bastante simple para las tres capas del diseño.** Los *routers* de Express son la capa de rutas; los servicios y repositorios son módulos de TypeScript sin dependencia del framework.
- **Ecosistema amplio.** La autenticación, el control de acceso por rol, el registro de peticiones y la validación se resuelven con middleware muy documentado.

**Lo que hay que tener en cuenta.**
- **Express no impone estructura.** Las capas se mantienen por disciplina y siguiendo `02-responsabilidades.md`: las rutas no tocan bases y los repositorios no contienen reglas.
- **No valida por sí solo.** La validación de formato se añade como middleware con Zod (4.3).
- **Errores en funciones asíncronas.** En Express 4 hay que envolverlas para que el error llegue al manejador; Express 5 los captura solo. Conviene fijar una versión y usar un único manejador de errores.
- **El plazo no es el único límite:** Node en un solo hilo y Express sin escalado automático obligan a correr una sola copia (D-29), que es lo que el diseño pide.

### 4.3 Validación de datos: Zod (D-37)

D-22 deja a la API como responsable de lo que Neo4j Community no impone, y varias decisiones añaden más validaciones de formato. Todas se expresan como un esquema:

| Qué se valida | Origen | Ejemplo |
|---|---|---|
| Identificador UUID en minúsculas y con guiones | D-11, RNF-08 | `9F1C...` en mayúsculas se rechaza |
| Correo en minúsculas | D-03 | El esquema lo normaliza antes de llegar a la base |
| Puntuación entera de 1 a 5 | RN-02, D-13 | Una reseña con calificación 7 |
| URL `https://` de hasta 500 caracteres | D-25, D-31 | Una portada con `http://` |
| Propiedades obligatorias de los nodos del grafo | D-22 | Una `Persona` sin `nombre` |
| Máximo de 300 personas en un reparto | D-24 | Un alta con 301 actores |

Como el mismo esquema sirve en la app, el formulario avisa pronto y la API vuelve a validar (`02-responsabilidades.md`, sección 2). Si el equipo prefiere otra librería de validación, el diseño no cambia.

### 4.4 Base relacional: PostgreSQL

**Por qué.**
- **El diseño ya escrito usa sus tipos tal cual:** `UUID`, `ENUM` en cuatro campos, `TIMESTAMP`, `CHECK`, `UNIQUE` y llaves foráneas con cascada (`../modelado/relacional/01-tablas-campos-llaves-relaciones.md` y `02-restricciones-integridad.md`). Con otro motor habría que adaptar alguno.
- **Atomicidad de RF-13.** La reseña, el estado `terminada`, el promedio y el evento de sincronización van en una sola transacción.
- **Trigger con bloqueo de fila (D-02).** Se bloquea la fila de `obra_resumen` con `SELECT ... FOR UPDATE` antes de recalcular, para que dos reseñas simultáneas no se pisen.
- **Integridad de correo y seguimientos.** `CHECK (correo = LOWER(correo))` (D-03) y el `CHECK` de que nadie se sigue a sí mismo (RN-03) los exige la propia base.
- **La integridad no depende de funciones propias de otro motor.** La cascada de RF-04 y la unicidad se declaran con sentencias estándar.

**Lo que hay que tener en cuenta.**
- **Indexar las llaves foráneas a mano**, porque PostgreSQL no lo hace solo (sección 3.3).
- **Los textos neutros de los documentos del relacional** (por ejemplo, "algunos motores indexan las llaves foráneas y otros no") se leen ahora como PostgreSQL.

### 4.5 MongoDB y Neo4j: drivers y versiones

- **MongoDB.** Las pruebas de índices, validación y búsqueda de texto se hicieron en la versión 9.0.4 (`../modelado/documental/05-indices.md`). El contenedor debe usar esa misma versión o una compatible, porque el índice único *sparse* del ISBN (D-08) y la búsqueda de título dependen de ella.
- **Neo4j.** Se usa la edición Community (D-22) y la versión 5, que es con la que se probó el grafo. Las escrituras de la API usan transacciones explícitas; D-23 pide bloquear antes el nodo de la película escribiendo en él dentro de la misma transacción.
- **Memoria.** Neo4j corre sobre la JVM y es el contenedor más pesado. En una máquina de 6 GB compartida con otros proyectos hay que limitar la memoria del contenedor y la de la JVM (montículo y caché de páginas), y limitar también la de MongoDB.

### 4.6 Contenedores y túnel

Docker Compose levanta la API y las tres bases con una sola orden y es reutilizable en un servidor si se quisiera mover (sección 6). El túnel (Cloudflare Tunnel o ngrok) da el HTTPS que exige Android y una URL alcanzable desde el teléfono. Su dirección puede cambiar, por eso la app la lee de la configuración.

### 4.7 Límites de memoria del Compose (D-36)

La máquina tiene 6 GB de RAM y comparte Docker con otros proyectos. La JVM de Neo4j y MongoDB no conocen el tope de su contenedor por sí solos: si no se configuran, se pasan y el sistema los mata. Por eso cada servicio lleva **un tope de contenedor y un ajuste interno** que lo respeta.

| Servicio | Tope del contenedor | Ajuste interno |
|---|---|---|
| Neo4j 5 Community | 1,25 GB | Montículo 512 MB y caché de páginas 256 MB. Los nombres exactos de las variables se confirman en la versión que se instale |
| MongoDB | 512 MB | Caché de WiredTiger de 0,25 GB (el mínimo que admite) |
| PostgreSQL | 384 MB | `shared_buffers` de 64 MB y 20 conexiones como máximo; la API usa un grupo de hasta 10 |
| API Node (con el worker) | 384 MB | Montículo de Node de 256 MB |
| **Total** | **~2,5 GB** | |

Son valores iniciales estimados, **no medidos**: se comprueban con `docker stats` y se ajustan. Dos prácticas más:

- **Perfiles de Compose.** Solo se levanta lo que el bloque en curso necesita. En el bloque 1, por ejemplo, bastan PostgreSQL y la API, lo que ahorra unos 1,5 GB.
- **Comprobación de salud y espera.** Cada base declara su comprobación y la API arranca cuando están sanas. Neo4j tarda en levantar y Docker Compose, por sí solo, no espera (`04`, sección 9.3).

Durante la semana de trabajo conviene apagar los contenedores de otros proyectos. Un segundo disco no añade memoria: sirve para mover el almacenamiento de Docker y, como mucho, para memoria virtual de respaldo, mucho más lenta.

### 4.8 Sesión y contraseñas (D-35)

- **Sesión.** Un token aleatorio de 32 bytes que solo conoce la app. La base guarda su hash SHA-256 en `sesion` (`../modelado/relacional/01-tablas-campos-llaves-relaciones.md`, sección 4.9). Vence a los 30 días, sin renovación.
- **Por qué no un JWT.** La API tendría que consultar la base en cada petición igualmente, para saber si el usuario sigue existiendo, así que un JWT no ahorra esa consulta. La sesión en la base cierra sesión de verdad y la cascada de RF-04 la invalida sola.
- **Contraseñas.** Hash lento de buena práctica: propuesto Argon2id con unos 19 MiB de memoria (lo que recuerdo de las recomendaciones de OWASP; los parámetros se verifican al implementar), o bcrypt con coste de 10 a 12 si la instalación da problemas.
- **App.** El token va en el almacenamiento seguro del teléfono y se envía en cada petición.

## 5. Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| S1. Android nativo (Kotlin) | Es el arranque más lento (Android Studio y Compose), y S2 ya es una combinación conocida |
| S3. Flutter y Python | Obliga a mantener dos lenguajes y dos formas de validar los mismos datos |
| Fastify | Su validación y rendimiento no hacen falta aquí y no hay experiencia previa con él |
| NestJS | Su estructura se parece a las capas del diseño, pero añade mucho código base y una curva que el plazo no permite |
| MySQL o MariaDB | Obligan a resolver el UUID y el `ENUM` de otra forma que el diseño ya escrito |
| App web o panel de administración web | Descartados en D-28 |
| Backend como servicio (Firebase, Supabase) | No cubre las tres bases ni el modelo ya diseñado |

## 6. ¿Es apto para AWS o para alojamiento gratuito?

**Sí.** El stack se despliega en cualquier sitio que ejecute Docker, porque la API es un proceso Node en un contenedor. La app no se despliega: es un APK instalado en el teléfono. Solo hay que alojar la API y las tres bases.

| Opción | ¿Sirve? | Observaciones |
|---|---|---|
| **Docker Compose local + túnel** (D-30) | Sí | Costo $0. La demo depende de la máquina y del internet del lugar |
| **AWS, una instancia EC2 con Docker Compose** | Sí | La más sencilla en AWS: las cuatro piezas en una máquina. Con 1 GB de RAM (`t3.micro`) no cabe; con 2 GB (`t3.small` o `t4g.small`) queda justo y hay que limitar la memoria de Neo4j y MongoDB. Pide un dominio y un certificado para tener HTTPS |
| AWS con servicios gestionados | Solo en parte | RDS sirve para PostgreSQL. Amazon DocumentDB es compatible con MongoDB pero no es MongoDB, y no se ha verificado que admita el índice único *sparse*, el validador y la búsqueda de texto como los usa el diseño. Neptune no es Neo4j y obligaría a rehacer el grafo (D-14). Por eso MongoDB y Neo4j irían en contenedores |
| Alojamiento gratuito de aplicaciones (como Render) | No lo recomiendo | La API se duerme por inactividad y con ella el worker de D-29, de modo que `sync_outbox` dejaría de procesarse. En móvil, el arranque en frío se ve como errores de red |

**Sobre el plan gratuito de AWS.** Las cuentas nuevas reciben un plan gratuito de hasta 6 meses o hasta agotar los créditos (unos 100 USD al registrarse y hasta otros 100 por usar servicios). No se puede extender; al terminar, AWS cierra la cuenta y deja 90 días para pasar a un plan de pago. No aplica si ya se tuvo una cuenta de AWS. Estas condiciones cambian y las fuentes no coinciden en todo, así que conviene confirmarlas en la página de AWS antes de depender de ellas.

**Consecuencia para D-29.** En cualquier hosting hay que correr **una sola copia** de la API. En AWS eso significa una instancia, sin escalado automático.

## 7. Riesgos del stack y cómo se mitigan

| Riesgo | Qué podría pasar | Mitigación |
|---|---|---|
| Depender de Expo Go en la demo | Si el servidor de desarrollo se cae o el teléfono no lo alcanza, la app no abre | Compilar un APK de prueba antes de la demo y comprobar que abre sin el servidor de desarrollo |
| Express sin estructura | Con el apuro, las rutas empiezan a consultar bases y se pierden las capas | Seguir `02-responsabilidades.md`; revisar que ningún archivo de rutas importe un driver |
| Memoria de la máquina | Neo4j, MongoDB y PostgreSQL juntos agotan los 6 GB y afectan a otros contenedores | Fijar límites de memoria a cada contenedor y al montículo de Neo4j; no ejecutar muchas pruebas pesadas a la vez |
| Neo4j Community sin restricciones de existencia | Un nodo sin propiedad obligatoria entra por una ruta no validada | Validar con esquemas en la API (4.3); la reconciliación reconstruye las copias (RNF-03) |
| Dos copias de la API | Dos workers rompen el orden de los eventos | Una sola instancia; no escalar (D-29) |
| La URL del túnel cambia | La app deja de llegar a la API | Dirección base configurable en la app |
| PostgreSQL sin índices en llaves foráneas | Consultas lentas y bloqueos más largos en cascadas | Crearlos a mano según `03-indices.md` |

## 8. Pendiente

No quedan decisiones abiertas del stack. Lo que falta se confirma al implementar:

| Tema | Qué se verifica |
|---|---|
| Parámetros de Argon2id | Memoria, iteraciones y paralelismo adecuados para la máquina |
| Variables de memoria de Neo4j | Los nombres exactos en la versión instalada |
| Topes de memoria de cada contenedor | Medirlos con `docker stats` y ajustar |
| Transacciones administradas de Neo4j | El tiempo máximo de reintento por defecto |

El orden de construcción y el calendario están en `05-orden-de-construccion.md`.

## Fuentes

- [AWS Free Tier FAQs](https://aws.amazon.com/free/faqs/)
- [AWS Free Tier: créditos de 200 USD y plan gratuito de 6 meses](https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan)
- [AWS Free Tier: computación](https://aws.amazon.com/free/compute)
