# Grafo, paso 4: restricciones

Documenta las reglas de integridad que se imponen sobre las entidades, las propiedades y las relaciones del grafo, y quién las impone: Neo4j, la API o el proceso de sincronización. Se organiza en tres tablas: por entidad (sección 2), por propiedad (sección 3) y por entidad y propiedad juntas (sección 4). La sección 5 comprueba que las tres sean coherentes entre sí y con el resto de los documentos.

Parte de `01-consultas-y-entidades.md`, `02-relaciones.md`, `03-propiedades.md`, `../fuente-de-verdad.md`, `../documental/04-validacion.md` y `../../decisiones_tomadas.md` (D-01, D-04, D-11, D-12, D-14 y D-15 a D-25 y D-27).

## 1. Qué puede imponer Neo4j y qué no

Neo4j ofrece pocos mecanismos de integridad. Por eso muchas reglas se imponen al escribir, desde la API o desde el proceso de sincronización.

| Mecanismo | Qué garantiza | Disponible |
|---|---|---|
| Restricción de unicidad de un nodo | No hay dos nodos con la misma etiqueta y el mismo valor en esa propiedad. También hace seguras las escrituras con `MERGE` cuando dos llegan a la vez, y crea un índice sobre la propiedad | Todas las ediciones |
| Restricción de existencia de una propiedad (en nodos y en relaciones) | La propiedad no puede faltar | Solo Enterprise, según la documentación de Neo4j |
| Restricción de tipo de una propiedad | El valor es del tipo esperado (texto, entero) | Solo Enterprise, según la documentación |
| `MERGE` | No se crea dos veces el mismo nodo ni la misma relación | Todas las ediciones |
| API y proceso de sincronización | Formatos, rangos, extremos permitidos de una relación y cardinalidades | Siempre |

Neo4j no tiene restricciones para validar valores (como el `CHECK` del relacional), para limitar cuántas relaciones puede tener un nodo ni para fijar qué etiquetas pueden ir en los extremos de una relación. Esas reglas las imponen las escrituras.

Se usa la edición Community (D-22), que solo ofrece restricciones de unicidad. La obligatoriedad, el tipo, el formato y el rango de las propiedades los imponen la API y el proceso de sincronización. Con la edición Enterprise, la base también podría imponer la existencia y el tipo, sin cambiar las reglas.

## 2. Restricciones por entidad

| Entidad | Restricción | Cómo se impone |
|---|---|---|
| `Persona` | Hay un solo nodo por `persona_id` | Unicidad de Neo4j |
| `Persona` | Solo puede ser origen de `escribió` y de `actuó_en`, y destino de `dirigida_por`. No se relaciona con `Usuario` | Cada escritura busca los nodos por su etiqueta antes de crear la relación (CG-14) |
| `Persona` | La registra solo el administrador (RN-09) y ninguna operación la elimina | API. No existe operación de borrado |
| `Libro` | Hay un solo nodo por `obra_id` | Unicidad de Neo4j |
| `Libro` | Solo puede ser destino de `escribió` y de `leyó`, y origen de `adaptado_a` | Cada escritura busca los nodos por su etiqueta |
| `Libro` | Si su ficha está publicada, tiene al menos un autor (una relación `escribió`) y al menos una adaptación (una relación `adaptado_a`) (D-24). En borrador puede tener cero de ambos | API: rechaza el alta sin autor y comprueba con CG-05 y CG-03 antes de publicar (AP-09). El libro queda en borrador hasta que se da de alta su primera película, que lo publica. La reconciliación reporta los publicados sin autor o sin adaptación con la cuenta de CG-22 |
| `Libro` | Existe solo si existen su ficha en `libros` y su fila en `obra_resumen`. No se elimina porque no hay baja de obras | Flujo de alta (documental, relacional y grafo, en ese orden) y reconciliación (punto 3) |
| `Película` | Hay un solo nodo por `obra_id` | Unicidad de Neo4j |
| `Película` | Solo puede ser destino de `adaptado_a` y de `actuó_en`, y origen de `dirigida_por` | Cada escritura busca los nodos por su etiqueta |
| `Película` | Tiene como máximo un libro de origen (RN-07) | API: bloquea primero el nodo de la película y después consulta CG-04 antes de registrar la adaptación con CG-15 (D-23) |
| `Película` | Si su ficha está publicada, tiene exactamente un libro de origen (D-24): toda película es adaptación de un libro. En borrador puede tener cero | API: rechaza el alta sin libro de origen y comprueba con CG-04 antes de publicar (AP-09). La reconciliación reporta las publicadas sin libro con la cuenta de CG-22 |
| `Película` | Si su ficha está publicada, tiene al menos un director: una relación `dirigida_por` (D-24). En borrador puede tener cero | API: rechaza el alta sin director y comprueba con CG-05 antes de publicar (AP-09). La reconciliación reporta las publicadas sin director con la cuenta de CG-22 |
| `Película` | Si su ficha está publicada, tiene al menos una persona en el reparto: una relación `actuó_en`, y su copia en `peliculas.reparto` (D-24). En borrador puede tener cero | API: rechaza el alta sin reparto, copia el reparto a la ficha (AP-17) y comprueba con CG-20 antes de publicar (AP-09). La reconciliación reporta las publicadas sin reparto con la cuenta de CG-22 |
| `Película` | Su reparto tiene como máximo 300 personas, que es el límite de `peliculas.reparto` en la ficha | API, al registrar el reparto (CG-14) |
| `Película` | Existe solo si existen su ficha en `peliculas` y su fila en `obra_resumen`. No se elimina | Flujo de alta y reconciliación (punto 3) |
| `Usuario` | Hay un solo nodo por `usuario_id` | Unicidad de Neo4j |
| `Usuario` | Solo puede ser origen y destino de `sigue`, y origen de `leyó` | Cada escritura busca los nodos por su etiqueta |
| `Usuario` | Existe solo si el usuario existe en el relacional. Lo crea el evento `usuario_creado` y lo elimina `usuario_eliminado`, que borra también todas sus relaciones `sigue` y `leyó` (RF-04) | Proceso de sincronización con `DETACH DELETE`. La reconciliación detecta nodos huérfanos |
| `Libro`, `Película` y `Usuario` | Son copias de otra base y no se editan directamente (RNF-03) | Solo los escriben el flujo de alta y el proceso de sincronización |
| Todas las relaciones | Entre dos nodos hay como máximo una relación de cada tipo | `MERGE` en toda escritura. Neo4j no tiene una restricción para esto |
| `escribió` | De `Persona` a `Libro`. Un libro puede tener varios autores y una persona varios libros; el libro publicado tiene al menos uno (D-24). Nunca se elimina, por eso el mínimo se conserva | Escritura de CG-14. El administrador no borra relaciones |
| `adaptado_a` | De `Libro` a `Película`. Un libro puede tener varias películas y, publicado, al menos una; una película tiene exactamente un libro (RN-07, D-24). Nunca se elimina, por eso los mínimos se conservan | Escritura de CG-15 y comprobación de CG-04, con el nodo de la película bloqueado (D-23) |
| `dirigida_por` | De `Película` a `Persona`. Puede haber varios directores; la película publicada tiene al menos uno (D-24). Nunca se elimina, por eso el mínimo se conserva | Escritura de CG-14 |
| `actuó_en` | De `Persona` a `Película`, una sola por cada par persona y película (D-19). La película publicada tiene al menos una (D-24). Nunca se elimina, por eso el mínimo se conserva | Escritura de CG-14 con `MERGE` por el par |
| `sigue` | De `Usuario` a `Usuario`. Nadie se sigue a sí mismo (RN-03). Solo la crean y eliminan los eventos `seguimiento_creado` y `seguimiento_eliminado` | El `CHECK` del relacional: al grafo solo llegan seguimientos válidos. Proceso de sincronización |
| `leyó` | De `Usuario` a `Libro` (D-16). Solo la crean y eliminan los eventos `obra_leida` y `obra_no_leida`, y el proceso descarta los de películas | Proceso de sincronización, que consulta `obra_resumen.tipo` |

## 3. Restricciones por propiedad

El formato de UUID es el mismo patrón que valida el documental (`../documental/04-validacion.md`, sección 2): `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`.

| Propiedad | Restricción | Cómo se impone |
|---|---|---|
| `Persona.persona_id` | Texto. Obligatoria. UUID en minúsculas y con guiones. Única entre los nodos `Persona` | Única: Neo4j. Obligatoria, tipo y formato: API |
| `Persona.nombre` | Texto. Obligatoria. De 1 a 150 caracteres. Puede repetirse: no es única | Obligatoria, tipo y longitud: API |
| `Persona.foto_url` | Texto. **Opcional**. De 1 a 500 caracteres, empieza por `https://` y no tiene espacios (`^https://\S+$`). Puede repetirse (dos personas pueden compartir una imagen). Si no hay foto, la propiedad no existe. Se copia al reparto de la ficha, donde tiene la misma regla (D-27) | Tipo, longitud y formato: API |
| `Libro.obra_id` | Texto. Obligatoria. UUID en minúsculas y con guiones. Única entre los nodos `Libro` | Única: Neo4j. Obligatoria, tipo y formato: API |
| `Película.obra_id` | Texto. Obligatoria. UUID en minúsculas y con guiones. Única entre los nodos `Película` | Igual que `Libro.obra_id` |
| `Usuario.usuario_id` | Texto. Obligatoria. UUID en minúsculas y con guiones. Única entre los nodos `Usuario` | Única: Neo4j. Obligatoria, tipo y formato: API |
| `actuó_en.personaje` | Texto. Obligatoria. De 1 a 150 caracteres | Obligatoria, tipo y longitud: API |
| `actuó_en.orden` | Entero. Obligatoria. Mayor o igual a 1 | Obligatoria, tipo y rango: API |

## 4. Reglas por entidad y propiedad

Son las reglas que dependen de otras bases o del contexto, y que ninguna restricción de Neo4j puede expresar.

| Entidad | Propiedad | Regla | Cómo se impone |
|---|---|---|---|
| `Persona` | `persona_id` | Lo genera la API al registrar a la persona y nunca cambia. Es el mismo de `peliculas.reparto[].persona_id` (D-12) | API. La reconciliación (punto 4) compara el reparto de la ficha con `actuó_en` por este id |
| `Persona` | `foto_url` | La asigna y la cambia solo el administrador (RN-09; CG-13 y CG-24). Es la dirección de una imagen que vive fuera de la base; la API no comprueba que la imagen exista. Se quita eliminando la propiedad, no con un valor vacío. Al asignarla, cambiarla o quitarla, la API regenera el reparto de cada película donde actuó la persona (CG-25, CG-20 y AP-17, D-27), y la reconciliación compara también la foto del reparto (punto 4) | API (CG-24) y reconciliación (punto 4) |
| `Persona` | `nombre` | Puede repetirse entre personas distintas, porque puede haber homónimos, y no se usa para identificarlas. Si se repite, el reporte de la reconciliación lo señala (punto 9). Hoy nadie edita el nombre; si se permitiera, habría que regenerar el reparto de todas sus películas (D-12) | Reconciliación (punto 9) |
| `Libro` | `obra_id` | Es el mismo de `libros._id` y de `obra_resumen.obra_id`, con `tipo = libro`, y nunca cambia. El nodo se crea solo después de comprobar que la ficha existe (AP-05) y de registrar `obra_resumen` | Flujo de alta con `MERGE` (CG-11). La reconciliación (punto 3) compara el id y el tipo |
| `Película` | `obra_id` | Es el mismo de `peliculas._id` y de `obra_resumen.obra_id`, con `tipo = pelicula`, y nunca cambia. Misma condición de creación que el libro | Flujo de alta con `MERGE` (CG-11). La reconciliación (punto 3) compara el id y el tipo |
| `Usuario` | `usuario_id` | Es el mismo de `usuario.usuario_id` del relacional y nunca cambia. El nodo se crea con el evento `usuario_creado`, que siempre se aplica antes que cualquier `sigue` o `leyó` de ese usuario porque los eventos se aplican en orden (D-04) | Proceso de sincronización con `MERGE` (CG-16) |
| `actuó_en` | `personaje` | Se copia tal cual a `peliculas.reparto[].personaje`. Si la persona interpreta dos personajes en la película, el texto los recoge (D-19). Si la relación ya existe, no se sobrescribe: CG-14 la rechaza | API. Reparto de la ficha: AP-17 |
| `actuó_en` | `orden` | No se repite entre las relaciones `actuó_en` de una misma película. Se copia a `peliculas.reparto[].orden`. Neo4j no puede comprobar la unicidad entre las relaciones de un nodo | API, al registrar el reparto y al regenerarlo (`../documental/04-validacion.md`, sección 5) |

## 5. Verificación de coherencia

### 5.1 Entre las tres tablas y los pasos anteriores

| Comprobación | Resultado |
|---|---|
| Las 4 entidades de `01` aparecen en la tabla de entidades | Sí: `Persona`, `Libro`, `Película` y `Usuario` |
| Las 6 relaciones de `02` aparecen en la tabla de entidades, con el mismo origen, destino y cardinalidad | Sí |
| Las 8 propiedades de `03` aparecen en la tabla de propiedades y en la de entidad y propiedad | Sí, 8 de 8 |
| Tipo y obligatoriedad de la tabla de propiedades coinciden con `03` | Sí: siete obligatorias y una opcional (`foto_url`); siete de texto y una entera (`orden`) |
| Cada restricción de unicidad de la tabla de entidades tiene su "única" en la tabla de propiedades | Sí, 4 de 4 |
| Cada regla de la tabla de entidad y propiedad se apoya en una restricción o en una consulta de `01` | Sí (CG-11, CG-14, CG-16 y AP-17) |
| Las escrituras de `01` que usan `MERGE` quedan protegidas por la unicidad | Sí: CG-11, CG-13, CG-16 y las de relaciones. D-12 pedía la unicidad para que `MERGE` fuera idempotente |
| `CG-14` "rechaza la relación si ya existe" frente a `MERGE` | Coherente: `MERGE` no duplica y la API avisa al administrador de que ya existía |

### 5.2 Con las otras bases y los requerimientos

| Comprobación | Resultado |
|---|---|
| Formato de los ids frente al documental | Coherente: el mismo patrón de UUID en minúsculas (D-11) |
| `nombre` y `personaje` hasta 150 caracteres y `orden` desde 1, frente a `peliculas.reparto[]` | Coherente con `../documental/04-validacion.md`, sección 3.2 |
| El reparto de la ficha admite como máximo 300 personas; el grafo no tenía tope | **Incoherente en los documentos anteriores.** Con más de 300 `actuó_en`, AP-17 habría fallado al reemplazar el reparto. Se corrige con el tope de 300 en CG-14 (sección 2) |
| `orden` sin repetidos en el reparto de la ficha frente a la regla del grafo | Coherente: ambas lo validan en la API |
| `foto_url` frente a `portada_url` y a `peliculas.reparto[].foto_url` del documental | Coherente: misma regla de formato (`https://`, hasta 500 caracteres, opcional) en las tres, y mismo criterio: solo se guarda la URL, la imagen vive fuera de las bases (D-25, D-27) |
| La foto copiada al reparto frente a la del nodo | Controlada: CG-24 regenera el reparto al cambiarla y la reconciliación (punto 4, con CG-21) detecta y corrige las diferencias |
| El tipo de una obra se guarda en tres sitios: `obra_resumen.tipo`, la etiqueta del nodo y la colección de la ficha | La reconciliación (punto 3) solo comparaba ids. **Corregido:** ahora compara también el tipo, que AP-29 y CG-22 ya devuelven |
| RN-03 (nadie se sigue a sí mismo) | Coherente: lo impone el `CHECK` del relacional; el grafo no la comprueba |
| RN-06 (comparativa solo entre un libro y su adaptación) | Coherente: no es una restricción del grafo; la API la valida con CG-10 |
| RN-07 (una película, un solo libro de origen; toda película tiene uno) | Coherente con la tabla de entidades: máximo uno y, publicada, exactamente uno. Las escrituras simultáneas se evitan bloqueando el nodo de la película (D-23) |
| RN-09 (solo el administrador modifica el catálogo y sus relaciones) | Coherente: persona y relaciones de catálogo las escribe solo el administrador |
| D-16 (`leyó` solo hacia libros) y D-19 (una `actuó_en` por par) | Coherente en las tablas de entidad, de propiedad y de regla |
| Orden de los eventos (D-04): `usuario_creado` antes que `sigue` y `leyó` | Coherente: un solo proceso los aplica en orden |
| RNF-03 (las copias no se editan directamente) | Coherente: ver la fila de copias en la sección 2 |
| `obra_id` único entre `Libro` y `Película` | Cubierto por el relacional, no por el grafo (D-21) |
| Mínimos en obras publicadas (D-24): autor y adaptación (libro); libro de origen, director y reparto (película) | Coherente con `05-cardinalidad.md`. Para que sea posible, el alta registra las relaciones y copia el reparto antes de publicar, y la reconciliación lo reporta. El libro y la película se publican en el mismo alta, porque cada uno necesita al otro (`05`, 3.3) |

## 6. Cómo crearlas

Sintaxis de Neo4j 5. **Ejecutado el 2026-11-23 contra Neo4j 5.26.34 Community** (`db/grafo/01-restricciones.cypher`, pruebas R-01 a R-09 en `db/grafo/pruebas/01-restricciones.cypher`): las cuatro restricciones de unicidad se crean y rechazan los duplicados; las de existencia y de tipo las rechaza Neo4j con `ConstraintCreationFailed` ("requires Neo4j Enterprise Edition"), tal como decía la documentación. Lo que Community deja pasar (una `Persona` sin `nombre`, un `orden` de texto) es responsabilidad de la API (R-08 y R-09). El índice por nombre que faltaba se define en D-41.

```cypher
// Unicidad: todas las ediciones. Crea además el índice de cada id
CREATE CONSTRAINT persona_id_unico IF NOT EXISTS
  FOR (p:Persona) REQUIRE p.persona_id IS UNIQUE;
CREATE CONSTRAINT libro_obra_id_unico IF NOT EXISTS
  FOR (l:Libro) REQUIRE l.obra_id IS UNIQUE;
CREATE CONSTRAINT pelicula_obra_id_unico IF NOT EXISTS
  FOR (f:`Película`) REQUIRE f.obra_id IS UNIQUE;
CREATE CONSTRAINT usuario_id_unico IF NOT EXISTS
  FOR (u:Usuario) REQUIRE u.usuario_id IS UNIQUE;

// Existencia: solo Enterprise. No se ejecutan, porque se usa Community (D-22)
CREATE CONSTRAINT persona_id_existe IF NOT EXISTS
  FOR (p:Persona) REQUIRE p.persona_id IS NOT NULL;
CREATE CONSTRAINT persona_nombre_existe IF NOT EXISTS
  FOR (p:Persona) REQUIRE p.nombre IS NOT NULL;
CREATE CONSTRAINT libro_obra_id_existe IF NOT EXISTS
  FOR (l:Libro) REQUIRE l.obra_id IS NOT NULL;
CREATE CONSTRAINT pelicula_obra_id_existe IF NOT EXISTS
  FOR (f:`Película`) REQUIRE f.obra_id IS NOT NULL;
CREATE CONSTRAINT usuario_id_existe IF NOT EXISTS
  FOR (u:Usuario) REQUIRE u.usuario_id IS NOT NULL;
CREATE CONSTRAINT actuo_en_personaje_existe IF NOT EXISTS
  FOR ()-[r:`actuó_en`]-() REQUIRE r.personaje IS NOT NULL;
CREATE CONSTRAINT actuo_en_orden_existe IF NOT EXISTS
  FOR ()-[r:`actuó_en`]-() REQUIRE r.orden IS NOT NULL;
```

La edición Enterprise también ofrece restricciones de tipo (`IS :: STRING` e `IS :: INTEGER`). Se agregarían junto a las de existencia. Las tres de unicidad sobre ids ya sirven como índice para buscar nodos por su id, así que el paso de índices solo tendrá que cubrir la búsqueda por nombre de `Persona`.

## 7. Puntos pendientes (todos resueltos)

**7.1 ¿Libro y Película comparten una etiqueta `Obra`? Decisión: no, opción A (D-21)**
- *De qué se trata.* Neo4j impone la unicidad por etiqueta. Con una restricción sobre `Libro.obra_id` y otra sobre `Película.obra_id`, nada impide que exista un `Libro` y una `Película` con el mismo `obra_id`, lo que rompería RNF-08 (un id, una obra).
- *Qué ya lo evita.* El relacional: `obra_resumen.obra_id` es clave primaria y se registra antes de crear el nodo, así que un mismo id no puede darse de alta como libro y como película. Además, los ids son UUID generados por la API.
- *Opción A (elegida):* sin etiqueta común. Dos restricciones, una por etiqueta. Ninguna consulta necesita buscar una obra sin conocer su tipo: el usuario elige el extremo de RF-24 desde resultados que ya dicen si es libro o película.
- *Opción B:* poner además la etiqueta `Obra` a los dos tipos de nodo y una restricción única sobre `Obra.obra_id`. La base lo impediría por sí misma, pero cada nodo de obra llevaría dos etiquetas y el tipo quedaría expresado dos veces (en `Libro` y en `Obra`), que es el tipo de repetición que ya se evitó con los roles (D-15).

**7.2 ¿Qué edición de Neo4j se va a usar? Decisión: Community (D-22)**
- *De qué se trata.* Según la documentación de Neo4j, la edición Community solo ofrece restricciones de unicidad, mientras que las de existencia y de tipo son de Enterprise. La edición cambia quién garantiza que `nombre` o `orden` no falten: solo la API en Community, la API y la base en Enterprise.
- *Qué cambia.* Nada en las reglas: las tablas de la sección 3 valen en ambos casos. Cambia cuáles de las sentencias de la sección 6 se ejecutan. Conviene confirmar estos datos con la versión que se instale.
- *Resultado.* Se usa la edición Community, por ser la gratuita. La existencia y el tipo de las propiedades los garantiza la API.

**7.3 RN-07 y escrituras simultáneas. Decisión: opción B, bloquear el nodo (D-23)**
- *De qué se trata.* La API comprueba con CG-04 que la película no tenga libro de origen y después crea la relación con CG-15. Son dos pasos. Si dos administradores registraran a la vez dos libros de origen distintos para la misma película, ambas comprobaciones pasarían y la película quedaría con dos libros. Neo4j no tiene una restricción que lo impida.
- *Qué tan probable es.* Muy poco: solo escribe el administrador y las adaptaciones se registran de vez en cuando.
- *Opción A:* aceptar el riesgo.
- *Opción B (elegida):* que la API bloquee primero el nodo de la película (escribiendo en él dentro de la misma transacción) y después compruebe. Es el mismo criterio de D-02 en el relacional, y no cambia el modelo.
- *Opción C:* agregar al script de reconciliación una revisión que liste las películas con más de un libro de origen, como el reporte del punto 9. Detecta el problema después de que ocurre, pero no lo evita.

## 8. Siguiente paso

Definir los índices. Los de unicidad ya cubren la búsqueda por id; falta la búsqueda por nombre de `Persona` para CG-01 y CG-02.
