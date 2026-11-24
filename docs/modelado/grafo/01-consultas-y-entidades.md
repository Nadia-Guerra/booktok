# Grafo, paso 1: consultas y entidades

Lista las lecturas y escrituras que el sistema hace sobre el grafo (Neo4j) de *Del Libro a la Pantalla* y, a partir de ellas, las entidades que hay que guardar. Es el punto de partida del diseño: los nodos, las relaciones y los índices se deciden a partir de esta tabla, y no al revés. Mismo criterio que los patrones de acceso del documental.

Parte de `../matriz-responsabilidades.md` (columna Grafo), `../fuente-de-verdad.md`, `../../requerimientos/levantamiento-requerimientos.md` y `../../decisiones_tomadas.md` (D-12, D-14 a D-20, D-25 y D-27).

## 1. Alcance y convenciones

**Qué guarda esta base.** Las personas, la identidad de libros, películas y usuarios, y las relaciones entre ellos (autoría, adaptación, dirección, reparto, seguimiento y lectura).

**Qué no guarda.** Los datos descriptivos de las obras, incluido el título (documental, D-18), las reseñas, calificaciones, listas y estados (relacional) y el nombre o perfil de los usuarios (relacional).

| Columna | Significado |
|---|---|
| ID | `CG-nn` (consulta de grafo). Los números no se reutilizan |
| Usuario | **Visitante** (A3), **Lector** (A1), **Admin** (A2) o **Sistema** (sincronización, reconciliación y pasos internos de la API) |
| Tipo | **Lectura** o **Escritura**. Borrar también cuenta como escritura |
| Datos que requiere | En las lecturas: *Filtro* (con qué se busca) y *Devuelve* (qué necesita quien consulta). En las escrituras: *Recibe* (qué datos escribe) |

**Reglas que se aplican a todas las filas**
- Toda escritura de sincronización es idempotente (`MERGE`): repetirla no duplica nada (`../fuente-de-verdad.md`, sección 5).
- Las consultas devuelven ids y, en las personas, el nombre y la foto (`foto_url`, si tiene, D-25). El título de una obra no está en el grafo: la API lo completa con la ficha (AP-04 del documental), que solo entrega fichas publicadas a visitantes y lectores. Un nodo de obra existe desde el paso 3 del alta, antes de publicarse la ficha.

## 2. Consultas

| Rango | Grupo |
|---|---|
| CG-01 a CG-10 | Lecturas de catálogo, exploración y recomendaciones |
| CG-11 a CG-19 y CG-24 | Escrituras (catálogo y sincronización desde las otras bases). CG-12 retirada |
| CG-20 a CG-23 y CG-25 | Lecturas de reconciliación y de regeneración del reparto |

| ID | Consulta | Usuario | Tipo | Datos que requiere |
|---|---|---|---|---|
| CG-01 | Buscar obras por el nombre de una persona (RF-05) | Visitante, Lector, Admin | Lectura | **Filtro:** texto del nombre. **Devuelve**, por obra: `obra_id`, tipo (libro o película), y la persona (`persona_id`, `nombre`, `foto_url`) con el vínculo que la une a la obra (escribió, dirigida por o actuó en) |
| CG-02 | Buscar personas por nombre, para reutilizar una existente antes de registrar otra (RF-10, D-15) | Admin | Lectura | **Filtro:** texto del nombre. **Devuelve:** `persona_id`, `nombre` y `foto_url` (la foto ayuda a distinguir homónimos) |
| CG-03 | Adaptaciones de un libro (RF-23). También la usa la API antes de publicar un libro: solo se publica si devuelve al menos una película (D-24) | Visitante, Lector, Sistema | Lectura | **Filtro:** `obra_id` del libro. **Devuelve:** `obra_id` de cada película |
| CG-04 | Libro de origen de una película (RF-23). También lo usa la API antes de registrar una adaptación (RN-07) y antes de publicar una película, que solo se publica si devuelve su libro (D-24) | Visitante, Lector, Sistema | Lectura | **Filtro:** `obra_id` de la película. **Devuelve:** `obra_id` del libro, o nada si la película todavía es un borrador sin libro |
| CG-05 | Autores de un libro y directores de una película, para mostrarlos junto a la ficha (R-06, R-07 del documental). También la usa la API antes de publicar una ficha: solo se publica si devuelve al menos una persona (D-24) | Visitante, Lector, Sistema | Lectura | **Filtro:** `obra_id`. **Devuelve:** `persona_id`, `nombre` y `foto_url` de cada persona |
| CG-06 | Todos los caminos más cortos entre dos personas u obras (RF-24, D-17) | Lector | Lectura | **Filtro:** id de origen y de destino (`persona_id` u `obra_id`) y tope de profundidad (6, provisional). **Devuelve**, por camino: la secuencia de nodos (tipo, id y, en las personas, `nombre` y `foto_url`) y los tipos de relación entre ellos |
| CG-07 | Autores cuyos libros fueron adaptados por un mismo director (RF-25) | Lector | Lectura | **Filtro:** `persona_id` de un director. **Devuelve:** `persona_id`, `nombre` y `foto_url` de cada autor, con el `obra_id` del libro y de la película que lo unen al director |
| CG-08 | Recomendar libros a dos saltos de los que le gustaron al usuario, por adaptaciones del mismo director (RF-26, paso 2) | Lector | Lectura | **Filtro:** lista corta de `obra_id` de libros de partida (máximo 20, entregada por el relacional) y `usuario_id`, para excluir los libros que ya leyó y los de partida. **Devuelve:** `obra_id` de cada libro recomendado, con el `obra_id` del libro de partida y el director que los conecta (`persona_id`, `nombre`, `foto_url`) |
| CG-09 | Recomendar películas basadas en libros que leyeron las personas que el usuario sigue (RF-27) | Lector | Lectura | **Filtro:** `usuario_id`. **Devuelve:** `obra_id` de cada película, con el `obra_id` de su libro de origen y cuántos seguidos lo leyeron. No excluye las películas que el usuario ya vio (D-20) |
| CG-10 | Comprobar que un libro y una película están unidos por una adaptación (RN-06) | Sistema | Lectura | **Filtro:** `obra_id` del libro y de la película. **Devuelve:** si existe la relación |
| CG-11 | Crear el nodo de una obra en el alta (RF-08). Debe poder repetirse sin efecto | Sistema | Escritura | **Recibe:** `obra_id` y tipo (libro o película) |
| CG-13 | Registrar una persona (RF-10) | Admin | Escritura | **Recibe:** `persona_id` (UUID generado por la API), `nombre` y `foto_url` (opcional) |
| CG-14 | Registrar que una persona escribió un libro, dirigió una película o actuó en ella (RF-10); el alta de una obra la usa para su primer autor, o para su director y su reparto (D-24). Rechaza la relación si ya existe o si el reparto de la película ya tiene 300 personas, el límite de la ficha | Admin | Escritura | **Recibe:** `persona_id`, `obra_id`, tipo de vínculo y, en el reparto, `personaje` y `orden` |
| CG-15 | Registrar que una película es adaptación de un libro (RF-11); el alta de una película la usa para su libro de origen (D-24). Se rechaza si la película ya tiene libro de origen (RN-07); la API bloquea antes el nodo de la película para evitar escrituras simultáneas (D-23) | Admin | Escritura | **Recibe:** `obra_id` del libro y de la película |
| CG-16 | Crear el nodo de un usuario (evento `usuario_creado`) | Sistema | Escritura | **Recibe:** `usuario_id` |
| CG-17 | Eliminar un usuario y todas sus relaciones (evento `usuario_eliminado`, RF-04). Debe poder repetirse sin error | Sistema | Escritura | **Filtro:** `usuario_id` |
| CG-18 | Crear o eliminar un seguimiento (eventos `seguimiento_creado` y `seguimiento_eliminado`) | Sistema | Escritura | **Recibe:** `usuario_id` de quien sigue y de quien es seguido |
| CG-19 | Crear o eliminar una lectura de libro (eventos `obra_leida` y `obra_no_leida`, D-16) | Sistema | Escritura | **Recibe:** `usuario_id` y `obra_id` del libro |
| CG-20 | Leer el reparto de una película, para regenerar la copia de la ficha (RF-10, AP-17). También la usa la API antes de publicar la ficha: solo se publica si devuelve al menos una persona (D-24) | Sistema | Lectura | **Filtro:** `obra_id` de la película. **Devuelve:** `persona_id`, `nombre`, `foto_url` (si tiene), `personaje` y `orden` de cada actor |
| CG-21 | Leer el reparto de todas las películas, por lotes, para compararlo con la ficha (RNF-03, AP-32) | Sistema | Lectura | **Filtro:** ninguno. **Devuelve:** por película, `obra_id` y su reparto (con la foto de cada actor) |
| CG-22 | Listar las obras del grafo para compararlas con las fichas y con `obra_resumen` (RNF-03, AP-29, AP-30) | Sistema | Lectura | **Filtro:** ninguno; por lotes. **Devuelve:** `obra_id`, tipo y cuántos autores y cuántas adaptaciones (libro), o cuántos libros de origen, directores y personas de reparto (película) tiene, para reportar las obras publicadas que no llegan al mínimo (D-24) |
| CG-23 | Listar los usuarios y las relaciones `sigue` y `leyó` para compararlos con el relacional y detectar huérfanos (RNF-03) | Sistema | Lectura | **Filtro:** ninguno; por lotes. **Devuelve:** `usuario_id`, pares de `sigue` y pares de `leyó` |
| CG-24 | Asignar, cambiar o quitar la foto de una persona (RF-10, D-25). Una persona suele registrarse antes de tener foto. Después de escribirla en el nodo, la API regenera el reparto de cada película donde actuó (CG-25, CG-20 y AP-17), porque la ficha guarda una copia de la foto (D-27) | Admin | Escritura | **Filtro:** `persona_id`. **Recibe:** `foto_url` nueva, o nada para quitarla |
| CG-25 | Listar las películas en las que actuó una persona, para regenerar su reparto en las fichas cuando cambia su foto (D-27) | Sistema | Lectura | **Filtro:** `persona_id`. **Devuelve:** `obra_id` de cada película |

**Resumen:** 24 consultas: 15 lecturas y 9 escrituras. El número CG-12 (actualizar el título de una obra) se retiró por D-18 y no se reutiliza.

## 3. Qué información hay que guardar

Para resolver las 24 consultas hacen falta cuatro cosas:

| Qué se necesita | Para qué consultas | Entidad |
|---|---|---|
| Identificar y nombrar a cada persona, buscarla por nombre y mostrar su foto | CG-01, CG-02, CG-05 a CG-08, CG-13, CG-14, CG-20, CG-21, CG-24, CG-25 | Persona |
| Identificar cada libro y película, como extremo de las relaciones | CG-01, CG-03 a CG-11, CG-14, CG-15, CG-19 a CG-22 | Libro, Película |
| Identificar a cada usuario, para anclar `sigue` y `leyó` | CG-08, CG-09, CG-16 a CG-19, CG-23 | Usuario |
| Distinguir un libro de una película | CG-01, CG-06, CG-10, CG-11, CG-19, CG-22 | La propia entidad (Libro o Película) |

Las conexiones entre ellos (autoría, adaptación, dirección, reparto, seguimiento y lectura) son las relaciones y se definen en `02-relaciones.md`.

## 4. Entidades

| Entidad | Descripción | Propiedades |
|---|---|---|
| **Persona** | Una persona real que escribe libros, dirige películas o actúa en ellas. Es autora, directora o actor según las relaciones que tenga, y una misma persona puede cumplir los tres roles (D-15). El grafo es su fuente de verdad (RF-10) | `persona_id`: identificador de la persona, el mismo de `peliculas.reparto[].persona_id` (D-12)<br>`nombre`: nombre de la persona. Sirve para buscar (CG-01, CG-02), para mostrar caminos y se copia al reparto de la ficha<br>`foto_url`: dirección de la foto de la persona, guardada fuera de la base. Opcional (D-25). Se copia al reparto de la ficha (D-27) |
| **Libro** | Ancla de un libro del catálogo: es el extremo de sus relaciones de autoría, adaptación y lectura. No guarda ninguna descripción: el título, la sinopsis y las ediciones viven en el documental (D-18) | `obra_id`: identificador del libro, el mismo de `libros._id` y de `obra_resumen.obra_id` (RNF-08). Es la clave que une las tres bases, no un dato descriptivo |
| **Película** | Ancla de una película del catálogo: es el extremo de sus relaciones de adaptación, dirección y reparto. No guarda ninguna descripción (D-18) | `obra_id`: identificador de la película, el mismo de `peliculas._id` y de `obra_resumen.obra_id` (RNF-08) |
| **Usuario** | Ancla de la cuenta en el grafo: es el extremo de `sigue` y `leyó`. Su identidad viene del relacional (relacional → grafo) | `usuario_id`: identificador del usuario, el mismo del relacional. No lleva nada más: el nombre y el perfil viven en el relacional |

El tipo de dato, la obligatoriedad y las reglas de cada propiedad están en `03-propiedades.md`.

### 4.1 Qué consulta usa cada propiedad

| Propiedad | Consultas |
|---|---|
| `Persona.persona_id` | CG-01, CG-02, CG-05, CG-06, CG-07, CG-08, CG-13, CG-14, CG-20, CG-21, CG-24, CG-25 |
| `Persona.nombre` | CG-01, CG-02, CG-05, CG-06, CG-07, CG-08, CG-13, CG-20, CG-21 |
| `Persona.foto_url` | CG-01, CG-02, CG-05, CG-06, CG-07, CG-08, CG-13, CG-20, CG-21, CG-24 |
| `obra_id` (Libro y Película) | CG-01, CG-03 a CG-11, CG-14, CG-15, CG-19 a CG-22 |
| `Usuario.usuario_id` | CG-08, CG-09, CG-16 a CG-19, CG-23 |
| `personaje` y `orden` (de la relación `actuó_en`) | CG-14, CG-20, CG-21 |

Toda propiedad la usa al menos una consulta, y toda consulta encuentra en estas propiedades lo que necesita.

### 4.2 Lo que el grafo no guarda

| Dato | Dónde vive | Por qué no está aquí |
|---|---|---|
| Título, sinopsis, géneros, año, ediciones, plataformas, datos técnicos | Documental | Ninguna consulta del grafo los necesita; la API los une con AP-04 (D-18) |
| Calificación, reseñas, estado de una obra, listas | Relacional | RF-26 usa la calificación solo para elegir los libros de partida, y eso lo hace el relacional (D6 de `../fuente-de-verdad.md`) |
| Nombre y perfil del usuario | Relacional | Se completan al mostrar; el grafo solo ancla relaciones |
| Películas terminadas por un usuario | Relacional | `leyó` solo apunta a libros (D-16) |
| Rol de una persona (autor, director, actor) | Se deduce de sus relaciones | Guardarlo repetiría lo que ya dicen las relaciones (D-15) |
| La imagen de una persona, de un libro o de una película | Almacenamiento en la nube | Una imagen no se guarda en una base de datos. De la persona se guarda solo la URL (`foto_url`); la portada de las obras vive en la ficha del documental (D-25) |

## 5. Verificación de redundancia

Se revisó si las entidades introducen duplicación o redundancia no controlada.

| Dato | ¿Está repetido? | Control |
|---|---|---|
| `obra_id` en `Libro` y `Película`, y `usuario_id` en `Usuario` | Sí, el mismo id está en otras bases | No es un dato descriptivo repetido sino la clave que une las tres bases (RNF-08) y el extremo de las relaciones. Sin el nodo no podría existir la relación. Su origen, dirección y reconstrucción están en `../fuente-de-verdad.md` (replicación 5 y 6) |
| `titulo` de las obras | Se repetía, y se **descartó** | AP-04 ya entrega el título a partir de los ids, así que la copia no ahorraba ninguna consulta (D-18) |
| `persona_id` | Sí, en `peliculas.reparto[]` | Controlada: D-12 define la fuente (grafo), la dirección (grafo → documental) y la reconstrucción (reconciliación, punto 4) |
| `nombre` de una persona | Sí, en `peliculas.reparto[]` | Controlada, igual que arriba. El nombre copiado puede quedar desactualizado solo si algún día se permite editar personas, y D-12 ya prevé qué hacer entonces |
| `foto_url` de una persona | Sí, en `peliculas.reparto[]` | Controlada, igual que el nombre: D-27 define la fuente (el nodo `Persona`), la dirección (grafo → documental) y la reconstrucción (CG-24 regenera el reparto de sus películas; la reconciliación, punto 4, compara también la foto). Es opcional en las dos |
| Rol (autor, director, actor) | Habría sido una repetición si se guardara como etiqueta | No se guarda: se deduce de las relaciones (D-15) |
| Una misma persona registrada dos veces con ids distintos | Sí, y la unicidad de `persona_id` no lo impide | **Controlada.** La API consulta CG-02 antes de registrar y ofrece reutilizar una persona existente, y la reconciliación reporta los nombres repetidos para revisión (punto 9 del script), sin corregirlos sola porque puede haber homónimos |
| Relaciones repetidas (la misma persona escribe dos veces el mismo libro) | Se evita | `MERGE` en CG-14 |

Las relaciones `sigue` y `leyó` sí son copias del relacional. Son una redundancia controlada que decidió el equipo (D-01 y D-16), con fuente, dirección y reconstrucción definidas.

## 6. Supuestos propios

| # | Supuesto | Dónde afecta |
|---|---|---|
| 1 | Los nodos de obra y de usuario se guardan por su `obra_id` y `usuario_id`, nunca por el id interno de Neo4j | Todas las consultas |
| 2 | CG-01 busca por el nombre de la persona y no distingue el rol: devuelve las obras que escribió, dirigió o donde actuó | CG-01 |

## 7. Puntos pendientes (todos resueltos)

**Resuelto.** RF-25 (CG-07) parte de un director: dado un director, devuelve los autores cuyos libros adaptó.

**Decisiones tomadas**

**7.1 RF-27: ¿se excluyen las películas que el usuario ya vio? Decisión: no, opción A (D-20)**
- *De qué se trata.* CG-09 recomienda películas basadas en libros que leyeron las personas que el usuario sigue. Por ejemplo, Ana sigue a Luis, que leyó *Dune*, y el sistema le recomienda a Ana la película *Dune*. La duda es qué pasa si Ana ya vio esa película.
- *Por qué hay duda.* El grafo no sabe qué películas ha visto cada usuario, porque `leyó` solo apunta a libros (D-16). Esa información está en el relacional.
- *Opción A (elegida):* no excluir nada. RF-27 no lo pide y no añade consultas.
- *Opción B:* el relacional entrega los ids de las películas que Ana ya marcó como terminadas y CG-09 las deja fuera, igual que CG-08 recibe los libros de partida desde el relacional. Cuesta una consulta más al relacional.

**7.2 `actuó_en`: ¿una relación por cada par actor y película? Decisión: sí (D-19)**
- *De qué se trata.* Cada par actor–película tiene una sola relación `actuó_en` (ver `02-relaciones.md`, sección 5). Un actor que participó en varias películas tiene una relación con cada una; la regla solo evita repetir la relación entre el mismo actor y la misma película.
- *Por qué hay duda.* Solo afecta al caso raro de un actor que interpreta dos personajes en la misma película. Con la propuesta, el texto de `personaje` recoge ambos.
- *Resultado.* Se confirmó la propuesta.

**7.3 Tope de profundidad de CG-06. Decisión: 6, provisional (D-17)**
- *De qué se trata.* CG-06 busca los caminos más cortos entre dos nodos y cuenta cada relación recorrida como un salto. De un autor a un actor son 3 saltos (`escribió`, `adaptado_a` y `actuó_en`). Hace falta un máximo de saltos porque, si no hay conexión entre los dos nodos, Neo4j recorrería toda la parte conectada del grafo antes de concluir que no existe.
- *Por qué importa el valor.* Si es muy bajo, se ignoran conexiones reales pero largas. Si es muy alto, la consulta tarda y devuelve cadenas tan largas que ya no significan nada.
- *Qué se hará.* Se usa 6 como valor provisional y se ajusta cuando haya datos de prueba (D-17, RNF-10).

**7.4 Personas repetidas: ¿se agrega un reporte a la reconciliación? Decisión: sí (D-15)**
- *De qué se trata.* El administrador registra cada persona y la API le asigna un id nuevo. Si registra dos veces a la misma persona real (por ejemplo, como directora en una película y como actriz en otra), el sistema crea dos nodos distintos, y RF-24 y RF-25 no verían que son la misma persona. La unicidad de `persona_id` no lo evita, porque los ids son distintos.
- *Qué defensas hay.* (1) La API busca por nombre antes de crear (CG-02) y ofrece reutilizar la persona existente; eso ya está en el diseño (D-15). (2) La reconciliación podría reportar los nombres que aparecen en más de un nodo, para que el administrador los revise.
- *Decisión.* Se agregó ese reporte como punto 9 del script (`../fuente-de-verdad.md`, sección 6). Solo lee y no corrige nada, porque pueden existir homónimos reales.
- *Lo que queda fuera.* No existe una operación para fusionar dos personas. Definirla afecta al reparto de las fichas, que cambiarían sus `persona_id`, así que quedaría para una etapa posterior.

## 8. Siguiente paso

Las relaciones están en `02-relaciones.md`, las propiedades en `03-propiedades.md` y las restricciones en `04-restricciones.md`. Después siguen los índices.
