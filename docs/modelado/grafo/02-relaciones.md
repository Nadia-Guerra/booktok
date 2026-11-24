# Grafo, paso 2: relaciones

Define cómo se conectan las entidades de `01-consultas-y-entidades.md`. Cada relación responde a cuatro preguntas: quién se relaciona (origen y destino), cómo se relaciona (el tipo y su dirección), qué información adicional lleva y para qué consulta existe.

Parte de las consultas `CG-nn` de `01-consultas-y-entidades.md`, de `../fuente-de-verdad.md` y de `../../decisiones_tomadas.md` (D-01, D-15, D-16, D-17, D-18, D-19 y D-24). Los nombres de las relaciones son los de los requerimientos.

## 1. Tabla de relaciones

| Entidad de origen | Relación | Entidad destino | Propiedades de la relación | Descripción |
|---|---|---|---|---|
| Persona | `escribió` | Libro | — | La persona es autora del libro. Un libro puede tener varios autores y una persona, varios libros (RF-10) |
| Libro | `adaptado_a` | Película | — | La película es una adaptación del libro. Un libro puede tener varias adaptaciones; una película, un solo libro de origen (RF-11, RN-07) |
| Película | `dirigida_por` | Persona | — | La persona dirigió la película. Puede haber varios directores (RF-10) |
| Persona | `actuó_en` | Película | `personaje`: personaje que interpreta<br>`orden`: posición en el reparto | La persona actúa en la película. `personaje` y `orden` son el reparto (RF-10) y se copian a la ficha (D-12) |
| Usuario | `sigue` | Usuario | — | El usuario sigue a otro usuario. Es copia de `seguimiento` del relacional (D-01) |
| Usuario | `leyó` | Libro | — | El usuario terminó de leer el libro. Es copia de `estado_obra` terminada, solo de libros (D-16) |

Los mismos patrones, en notación de Neo4j:

```
(Persona)-[:escribió]->(Libro)
(Libro)-[:adaptado_a]->(Película)
(Película)-[:dirigida_por]->(Persona)
(Persona)-[:actuó_en {personaje, orden}]->(Película)
(Usuario)-[:sigue]->(Usuario)
(Usuario)-[:leyó]->(Libro)
```

Se usan seis tipos de relación, que son los que ya definían los requerimientos. La dirección es la de los documentos; RF-24 las recorre sin dirección (D-17), así que no condiciona esa consulta.

## 2. Reglas de cada relación

| Relación | Cardinalidad | Quién la crea y fuente de verdad | Cómo se evita duplicarla | Consultas que la usan |
|---|---|---|---|---|
| `escribió` | N a M. Un libro publicado tiene al menos un autor (D-24) | El administrador (RF-10, RN-09). El grafo es la fuente | `MERGE` por persona y libro (CG-14) | CG-01, CG-05, CG-06, CG-07, CG-22 |
| `adaptado_a` | Un libro tiene N películas y, publicado, al menos una; una película tiene exactamente un libro (RN-07, D-24) | El administrador (RF-11, RN-09). El grafo es la fuente | `MERGE` por libro y película. Neo4j no impone la cardinalidad: la API comprueba CG-04 antes de crearla (CG-15), con el nodo de la película bloqueado (D-23) | CG-03, CG-04, CG-06 a CG-10, CG-15, CG-22 |
| `dirigida_por` | N a M. Una película publicada tiene al menos un director (D-24) | El administrador (RF-10, RN-09). El grafo es la fuente | `MERGE` por película y persona (CG-14) | CG-01, CG-05, CG-06, CG-07, CG-08, CG-22 |
| `actuó_en` | N a M, con una sola relación por persona y película (ver sección 5). Una película publicada tiene al menos una y como máximo 300 (D-24) | El administrador (RF-10, RN-09). El grafo es la fuente y la ficha guarda una copia (G → D) | `MERGE` por persona y película. `personaje` y `orden` van en la misma relación. La API valida que `orden` no se repita dentro de una película y que el reparto no pase de 300 personas | CG-01, CG-06, CG-14, CG-20 a CG-22, CG-25 |
| `sigue` | N a M. Nadie se sigue a sí mismo | El relacional (`seguimiento`) la origina con los eventos `seguimiento_creado` y `seguimiento_eliminado` (D-01) | `MERGE` por seguidor y seguido. Que nadie se siga a sí mismo lo impone el relacional con CHECK; el grafo no lo comprueba | CG-09, CG-18, CG-23 |
| `leyó` | N a M. Solo hacia libros | El relacional (`estado_obra`) la origina con `obra_leida` y `obra_no_leida`. El proceso descarta los eventos de películas (D-16) | `MERGE` por usuario y libro | CG-08, CG-09, CG-19, CG-23 |

**Regla común.** Entre dos nodos hay como máximo una relación de cada tipo. Además de evitar datos repetidos, esto protege a RF-24: si hubiera dos relaciones iguales entre los mismos nodos, "todos los caminos más cortos" (D-17) devolvería el mismo camino varias veces.

**Propiedades de las relaciones.** Solo `actuó_en` lleva propiedades (`personaje` y `orden`); su tipo y sus reglas están en `03-propiedades.md`. Las otras cinco no llevan ninguna. En `sigue`, la fecha en que se empezó a seguir vive en `seguimiento` y ninguna consulta del grafo la usa; `leyó` tampoco lleva la calificación (ver `../fuente-de-verdad.md`, D6).

## 3. Qué relaciones recorre cada consulta

Verifica que cada consulta se puede resolver con las seis relaciones y que cada relación la usa alguna consulta.

| Consulta | Recorrido |
|---|---|
| CG-01 | `(Persona)` hacia `(Libro)` o `(Película)` por `escribió`, `dirigida_por` o `actuó_en`, filtrando por el nombre de la persona |
| CG-02, CG-13, CG-24 | Solo el nodo `Persona`, sin relaciones |
| CG-03 | `(Libro)-[:adaptado_a]->(Película)` |
| CG-04 | `(Libro)-[:adaptado_a]->(Película)`, desde la película hacia atrás |
| CG-05 | `(Persona)-[:escribió]->(Libro)` y `(Película)-[:dirigida_por]->(Persona)` |
| CG-06 | Cualquier sentido, solo por `escribió`, `adaptado_a`, `dirigida_por` y `actuó_en` (D-17) |
| CG-07 | `(Persona)-[:escribió]->(Libro)-[:adaptado_a]->(Película)-[:dirigida_por]->(Persona)` |
| CG-08 | `(Libro)-[:adaptado_a]->(Película)-[:dirigida_por]->(Persona)<-[:dirigida_por]-(Película)<-[:adaptado_a]-(Libro)`, excluyendo los de partida y los que el usuario ya `leyó` |
| CG-09 | `(Usuario)-[:sigue]->(Usuario)-[:leyó]->(Libro)-[:adaptado_a]->(Película)` |
| CG-10 | `(Libro)-[:adaptado_a]->(Película)` |
| CG-11, CG-16, CG-17 | Los nodos de obra y de usuario. CG-17 borra además todas las relaciones del usuario |
| CG-14 | Crea `escribió`, `dirigida_por` o `actuó_en` |
| CG-15 | Crea `adaptado_a` |
| CG-18 | Crea o elimina `sigue` |
| CG-19 | Crea o elimina `leyó` |
| CG-20, CG-21 | `(Persona)-[:actuó_en]->(Película)` con `personaje` y `orden`, y la `foto_url` de la persona |
| CG-25 | `(Persona)-[:actuó_en]->(Película)`, desde la persona |
| CG-22 | Los nodos de obra y la cuenta de sus `escribió`, `adaptado_a`, `dirigida_por` y `actuó_en` |
| CG-23 | `sigue` y `leyó` |

## 4. Relaciones consideradas y descartadas

| Candidato | Por qué no |
|---|---|
| `(Película)-[:basada_en]->(Libro)`, inversa de `adaptado_a` | Duplica cada adaptación y su sincronización. El recorrido ya funciona en ambos sentidos (D-17) |
| `(Usuario)-[:vio]->(Película)` | Ninguna consulta la usa (D-16) |
| Una sola relación `(Persona)-[:participó_en {rol}]->(Obra)` con el rol como propiedad | Mezcla tres significados. Solo el reparto necesita `personaje` y `orden`, y las consultas distinguen por tipo de relación (CG-05, CG-07, CG-08) |
| Relaciones o etiquetas por rol (`fue_autor_de`, `:Autor`…) | El rol ya se deduce de la relación (D-15) |
| `(Usuario)-[:reseñó {calificacion}]->(Obra)` y `leyó {calificacion}` | RF-26 usa la calificación solo para elegir los libros de partida y eso lo hace el relacional. Plan de respaldo si RF-26 resultara lenta |
| Propiedad `creado_en` en `sigue` | Ninguna consulta del grafo la usa; vive en `seguimiento` |
| `(Obra)-[:tiene_genero]->(Género)` | Ninguna consulta filtra por género |
| `(Usuario)-[:escribió]->(Comparativa)` | Las comparativas viven en el documental. La validación de RN-06 usa CG-10 |

## 5. Decisión sobre `actuó_en` (D-19)

Si una persona interpreta dos personajes en la misma película, hay dos formas de guardarlo:

| Opción | Cómo queda | Efecto |
|---|---|---|
| **A. Una relación por persona y película (elegida)** | Una sola `actuó_en` por par; si hay dos personajes, el texto de `personaje` los recoge | Sin relaciones repetidas entre los mismos nodos, y RF-24 no devuelve caminos duplicados. La copia en la ficha tiene una entrada por persona |
| B. Una relación por personaje | Dos `actuó_en` entre los mismos nodos, identificadas por `orden` | Corresponde mejor a cada entrada del reparto, pero rompe la regla común y duplica los caminos de RF-24 |

**Qué sí se permite.** La regla se aplica a cada par persona–película por separado. Un actor que participó en tres películas tiene tres relaciones `actuó_en`, una con cada película, también si son adaptaciones distintas del mismo libro. Lo único que evita es repetir la relación entre el mismo actor y la misma película.

Se eligió la opción A porque el caso es raro y el costo de la B (caminos repetidos) recae en una de las consultas centrales.

## 6. Siguiente paso

Las propiedades están en `03-propiedades.md`, las restricciones en `04-restricciones.md` y la cardinalidad detallada, en ambos sentidos, en `05-cardinalidad.md`. Después siguen los índices.
