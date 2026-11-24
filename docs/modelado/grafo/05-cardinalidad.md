# Grafo, paso 5: cardinalidad

Define cuántas instancias de una entidad pueden relacionarse con instancias de otra, en cada una de las seis relaciones de `02-relaciones.md`. Responde a dos preguntas por cada relación: ¿a cuántos destinos puede apuntar un origen? y ¿de cuántos orígenes puede recibir un destino?

Parte de `02-relaciones.md` (relaciones), `04-restricciones.md` (quién impone cada regla), `../fuente-de-verdad.md` y `../../decisiones_tomadas.md` (D-15, D-16, D-17, D-19, D-23 y D-24). Los requerimientos que fijan topes son RN-03 y RN-07.

## 1. Cómo leer las tablas

Cada cardinalidad se escribe como **mínimo..máximo**, mirando la relación desde un solo extremo.

| Notación | Significa |
|---|---|
| `0..N` | Puede no tener ninguna y no hay tope |
| `1..N` | Tiene al menos una y no hay tope. Cuando se aplica solo a las fichas publicadas, lo dice la tabla (D-24) |
| `0..1` | Puede no tener ninguna y, como mucho, una |
| `1..1` | Tiene exactamente una |
| `0..300` | Puede no tener ninguna y tiene un tope fijo |
| `N a M` | Cada extremo puede relacionarse con muchos del otro (como en el relacional: `../relacional/01-tablas-campos-llaves-relaciones.md`, sección 5) |
| `1 a N` | Un extremo se relaciona con muchos y el otro con uno solo |

Ejemplo de lectura: en `Libro` → `Película` por `adaptado_a`, "0..N" significa que un libro tiene entre cero y muchas adaptaciones.

## 2. Tabla de cardinalidad

| Relación | Origen → destino: cuántos destinos tiene cada origen | Destino → origen: cuántos orígenes tiene cada destino | Tipo | Quién lo impone |
|---|---|---|---|---|
| `escribió` | `Persona` → `Libro`: `0..N`. Una persona escribe varios libros | `Libro` ← `Persona`: `1..N` si el libro está publicado, `0..N` si es borrador. Un libro tiene varios autores y, publicado, al menos uno (D-24) | N a M | `MERGE` por el par. El mínimo lo impone la API antes de publicar la ficha (sección 4) |
| `adaptado_a` | `Libro` → `Película`: `1..N` si el libro está publicado, `0..N` si es borrador. Un libro tiene varias adaptaciones y, publicado, al menos una (D-24) | `Película` ← `Libro`: `1..1` si la película está publicada, `0..1` si es borrador. Una película tiene exactamente un libro de origen y nunca más de uno (RN-07, D-24) | 1 a N | El máximo: la API bloquea el nodo de la película y consulta CG-04 antes de crear (D-23). Los mínimos: la API antes de publicar (sección 4) |
| `dirigida_por` | `Película` → `Persona`: `1..N` si la película está publicada, `0..N` si es borrador. Una película tiene varios directores posibles y, publicada, al menos uno (D-24) | `Persona` ← `Película`: `0..N`. Una persona dirige varias películas | N a M | `MERGE` por el par. El mínimo lo impone la API antes de publicar la ficha (sección 4) |
| `actuó_en` | `Persona` → `Película`: `0..N`, una relación por cada película (D-19) | `Película` ← `Persona`: `1..300` si la película está publicada, `0..300` si es borrador. El reparto tiene como máximo 300 personas, el límite de la ficha, y publicada, al menos una (D-24) | N a M, con propiedades (`personaje`, `orden`) | `MERGE` por el par y tope de 300 en la API (CG-14). El mínimo lo impone la API antes de publicar la ficha (sección 4) |
| `sigue` | `Usuario` → `Usuario`: `0..N`. Un usuario sigue a muchos | `Usuario` ← `Usuario`: `0..N`. Un usuario es seguido por muchos. Nadie se sigue a sí mismo (RN-03) | N a M, entre el mismo tipo de nodo | `CHECK` del relacional: al grafo solo llegan seguimientos válidos. `MERGE` por el par |
| `leyó` | `Usuario` → `Libro`: `0..N`. Un usuario lee muchos libros | `Libro` ← `Usuario`: `0..N`. Un libro lo leen muchos usuarios. Solo libros (D-16) | N a M | Proceso de sincronización: descarta las películas. `MERGE` por el par |

**Cuántas hay entre dos nodos concretos.** Entre dos nodos hay como máximo una relación de cada tipo (`02-relaciones.md`, sección 2). Es decir, `0..1` por par y por tipo. Dos tipos distintos sí pueden unir el mismo par: una persona que dirigió y actuó en la misma película tiene una `dirigida_por` y una `actuó_en` con esa película (ver 3.2).

## 3. Qué significa en la práctica

### 3.1 Ejemplo con datos

El libro *El hobbit* tiene tres películas, y cada una tiene un solo libro de origen:

```
(El hobbit)-[:adaptado_a]->(Un viaje inesperado)
(El hobbit)-[:adaptado_a]->(La desolación de Smaug)
(El hobbit)-[:adaptado_a]->(La batalla de los cinco ejércitos)
```

| Pregunta | Respuesta |
|---|---|
| ¿Un libro puede tener varias adaptaciones? | Sí: *El hobbit* tiene tres. Publicado, tiene al menos una (`1..N`) |
| ¿Una película puede tener dos libros de origen? | No: la API rechaza registrar un segundo libro para *Un viaje inesperado* (RN-07) |
| ¿Se puede publicar *Un viaje inesperado* sin libro de origen? | No: toda película publicada tiene exactamente un libro de origen (`1..1`, D-24) |
| ¿Se puede publicar un libro que no tiene ninguna adaptación? | No: la ficha queda en borrador hasta que exista al menos una relación `adaptado_a` desde el libro (D-24) |
| ¿Una persona puede dirigir varias películas? | Sí: Peter Jackson tiene tres `dirigida_por` con estas tres películas |
| ¿Una película puede tener varios directores? | Sí. Cada uno es una relación distinta. Publicada, tiene al menos uno (`1..N`) |
| ¿Se puede publicar *El hobbit* sin autor? | No: la ficha queda en borrador hasta que exista al menos una relación `escribió` con el libro (D-24) |
| ¿Se puede publicar *Un viaje inesperado* sin reparto? | No: la ficha queda en borrador hasta tener al menos un `actuó_en` (por ejemplo, Ian McKellen como Gandalf) y su copia en `reparto` (D-24) |
| ¿Un actor puede aparecer en varias películas del mismo libro? | Sí: Ian McKellen tiene tres `actuó_en`, una con cada película, cada una con su `personaje` y su `orden`. Lo que no se permite es una segunda `actuó_en` con la misma película (D-19) |

### 3.2 Casos que la cardinalidad permite a propósito

| Caso | Qué pasa |
|---|---|
| Una persona dirigió y actuó en la misma película | Hay dos relaciones entre los mismos nodos, pero de tipos distintos, así que no se viola la regla de una por tipo. RF-24 devolverá dos caminos entre ellos, uno por cada tipo, porque son conexiones distintas |
| Una persona escribió el libro y dirigió su adaptación | Es el caso que busca RF-25 (CG-07): `escribió`, `adaptado_a` y `dirigida_por` sobre la misma persona |
| Un libro en borrador sin autor, o una película en borrador sin director o sin reparto | Es válido solo mientras la ficha es borrador. No se publica así (ver 3.3) |
| Un libro en borrador sin adaptaciones, o una película en borrador sin libro de origen | Es válido solo mientras la ficha es borrador. Toda película del catálogo es adaptación de un libro: el sistema no admite películas sueltas |
| Un usuario que no sigue a nadie ni ha leído nada | Es válido |

### 3.3 El mínimo de 1 se exige al publicar, no al crear el nodo (D-24)

Una ficha publicada cumple estos mínimos (D-24):

| Obra | Mínimo para publicar |
|---|---|
| Libro | Al menos un autor (`escribió`) y al menos una adaptación (`adaptado_a`) |
| Película | Exactamente un libro de origen (`adaptado_a`), al menos un director (`dirigida_por`) y al menos una persona en el reparto (`actuó_en`) |

Se exige **al publicar la ficha**, no al crear el nodo, porque el alta se hace en pasos (`../fuente-de-verdad.md`, sección 5) y entre un paso y otro el nodo existe sin relaciones. El orden del alta queda así:

| Paso | Qué ocurre | Dónde |
|---|---|---|
| 0 | La API comprueba la solicitud. **Libro:** al menos un autor. **Película:** un libro de origen que ya exista (en cualquier estado de publicación), al menos un director y una persona del reparto con su `personaje` y su `orden`. Las personas también deben existir. Si algo falta, rechaza el alta antes de crear nada | API (AP-05 para el libro; CG-02 para reutilizar una persona o CG-13 para registrarla) |
| 1 | Crea la ficha como borrador, con `reparto` vacío en las películas | Documental (AP-07, AP-08) |
| 2 | Inserta `obra_resumen` | Relacional (O5) |
| 3 | Crea el nodo | Grafo (CG-11) |
| 4 | **Libro:** crea `escribió`. **Película:** crea `adaptado_a` (con el nodo de la película bloqueado, D-23), `dirigida_por` y `actuó_en` | Grafo (CG-14 y CG-15) |
| 5 | Solo en películas: copia el reparto del grafo a la ficha | Grafo (CG-20) y documental (AP-17) |
| 6 | Comprueba el mínimo de la obra. **Libro:** CG-05 (autores) y CG-03 (adaptaciones). **Película:** CG-04 (libro de origen), CG-05 (directores) y CG-20 (reparto) | Grafo |
| 7 | Publica la ficha. Si la película tiene su libro de origen en borrador y el libro ya cumple su mínimo, publica primero el libro y después la película | Documental (AP-09) |

El paso 5 va antes de publicar para que una ficha publicada nunca muestre un reparto vacío.

**Por qué el libro y la película dependen uno del otro.** Un libro publicado necesita una adaptación y una película publicada necesita su libro. Si cada uno exigiera que el otro ya estuviera publicado, ninguno podría publicarse nunca. Por eso lo que cuenta es que la relación `adaptado_a` **exista**, no el estado de la ficha del otro extremo. En la práctica, el alta de un libro termina en borrador, porque todavía no tiene adaptación, y el alta de su primera película lo publica a él y después a ella (paso 7). Las demás adaptaciones de ese libro, que ya está publicado, no tienen esta espera.

Si el alta se interrumpe entre los pasos 3 y 7, la ficha sigue en borrador y no se muestra. El script de reconciliación (punto 8) la completa si el grafo ya tiene las relaciones, y si no las tiene la reporta al administrador, que las registra con CG-14 y CG-15 (RF-10, RF-11). El script no puede inventar un autor, un director, un actor ni un libro de origen. Un libro que espera su primera película aparece en ese reporte cuando supera la antigüedad mínima; no se elimina.

**Después de publicada, el mínimo se conserva solo.** Ninguna operación elimina relaciones `escribió`, `adaptado_a`, `dirigida_por` ni `actuó_en`, ni personas (`04-restricciones.md`, sección 2), así que una obra publicada nunca baja de ese mínimo.

`Usuario` no tiene mínimos: el nodo nace con `usuario_creado`, antes de cualquier `sigue` o `leyó`, y un usuario puede no seguir a nadie ni haber leído nada.

## 4. Cómo se imponen

Neo4j no limita cuántas relaciones puede tener un nodo (`04-restricciones.md`, sección 1). Por eso:

| Regla de cardinalidad | Neo4j | API o proceso de sincronización |
|---|---|---|
| Máximo una relación de cada tipo por par de nodos | No | `MERGE` en toda escritura |
| `Película` ← `Libro`: máximo 1 (RN-07) | No | Bloqueo del nodo de la película, consulta CG-04 y después CG-15 (D-23) |
| `Película` publicada ← `Libro`: exactamente 1. `Libro` publicado → `Película`: mínimo 1 (D-24) | No | La API rechaza el alta de una película sin libro de origen (paso 0) y comprueba con CG-04 y CG-03 antes de publicar (paso 6). La reconciliación reporta las películas publicadas sin libro y los libros publicados sin película, con la cuenta que devuelve CG-22 |
| `Película` ← `Persona` por `actuó_en`: máximo 300 | No | Conteo del reparto antes de crear la relación (CG-14) |
| `orden` sin repetirse dentro de una película | No | API, al registrar y al regenerar el reparto |
| `sigue`: nadie se sigue a sí mismo | No | `CHECK` del relacional (RN-03); el grafo no la comprueba |
| `leyó`: solo hacia libros | No | Proceso de sincronización, consultando `obra_resumen.tipo` (D-16) |
| `Libro` publicado ← `Persona` por `escribió`: mínimo 1. `Película` publicada: mínimo 1 `dirigida_por` y mínimo 1 `actuó_en` (D-24) | No | La API rechaza el alta sin esas personas (paso 0) y comprueba con CG-05 y CG-20 antes de publicar (paso 6). La reconciliación reporta las obras publicadas sin autor, director o reparto, con la cuenta que devuelve CG-22 |
| Resto de mínimos: 0 (una persona puede no haber escrito, dirigido ni actuado en nada; un usuario puede no seguir ni haber leído nada) | No hace falta | No se impone nada |

Las demás cardinalidades (`0..N`) no necesitan ninguna regla: la ausencia de restricción es la regla.

La comprobación del paso 6 es la que importa: la del paso 0 solo evita crear borradores que no se podrán completar. La reconciliación cubre el caso de una escritura hecha fuera de la API, que con Community la base no detendría (D-22).

## 5. Consecuencias para las consultas

La cardinalidad `N a M` hace que un mismo resultado pueda alcanzarse por varios caminos. Las consultas deben devolver cada resultado una vez.

| Consulta | Dónde puede repetirse | Qué se hace |
|---|---|---|
| CG-06 (RF-24) | Entre dos nodos hay varios caminos igual de cortos, por ejemplo por distintos directores en común | Es lo pedido: todos los caminos más cortos (D-17). La regla de una relación por tipo y par evita los caminos repetidos |
| CG-08 (RF-26) | Un libro puede alcanzarse desde varios libros de partida o por varios directores en común | La API agrupa por libro recomendado y conserva el libro de partida y el director que lo conectan |
| CG-09 (RF-27) | Una película puede alcanzarse desde varios seguidos, o por varios libros leídos | Se cuentan los seguidos que leyeron el libro de origen, como pide la consulta; la película sale una vez |

Con `adaptado_a` en `1..1` hacia la película publicada, su libro de origen es único, así que CG-04 devuelve exactamente un libro. Devuelve nada solo si la película está en borrador.

## 6. Verificación de coherencia

| Comprobación | Resultado |
|---|---|
| Las 6 relaciones de `02` aparecen en la tabla de la sección 2 | Sí, con el mismo origen y destino |
| La cardinalidad coincide con la columna de `02-relaciones.md`, sección 2 | Sí: `escribió` N a M, `adaptado_a` un libro a N películas y una película a un libro, `dirigida_por` N a M, `actuó_en` N a M con una por par, `sigue` N a M, `leyó` N a M solo a libros. Los mínimos de la publicación (D-24) están en las dos |
| Coincide con `04-restricciones.md`, sección 2 | Sí. El tope de 300, los mínimos de la publicación y la regla RN-07 aparecen en las dos |
| Cada tope y cada mínimo tiene quien lo imponga | Sí, sección 4. Los que Neo4j no impone tienen una consulta de `01` que los aplica (CG-04, CG-05, CG-14, CG-15, CG-18, CG-19, CG-20) o que los verifica (CG-22) |
| RN-07 | Coherente: un solo libro de origen por película (`1..1` publicada, `0..1` en borrador) y varias adaptaciones por libro. El texto de RN-07 en el levantamiento se reescribió para decir también que toda película tiene libro de origen y todo libro publicado, al menos una adaptación |
| RN-03 | Coherente: nadie se sigue a sí mismo, lo impone el relacional |
| D-16 | Coherente: `leyó` solo llega a `Libro` |
| D-19 | Coherente: `0..1` `actuó_en` por par persona y película, y `0..N` películas por persona |
| `peliculas.reparto` admite 300 como máximo y puede estar vacío solo mientras la ficha es borrador (`../documental/04-validacion.md`) | Coherente: el grafo tiene el mismo tope y, al publicar, el reparto de la ficha ya se copió con al menos una persona (pasos 5 y 6). Ajustado el texto de `04-validacion.md` y de `03-colecciones.md` |
| La cardinalidad `N a M` frente al relacional | Coherente: `sigue` es N a M igual que `seguimiento`; `leyó` es una proyección de `estado_obra` solo de libros terminados, y no añade reglas de cardinalidad propias |
| El mínimo de 1 frente al flujo de alta de `../fuente-de-verdad.md` | **Incoherente antes de este paso.** El flujo publicaba la ficha justo después de crear el nodo, antes de registrar a las personas (RF-10). Se corrige: el alta trae las personas y las relaciones se crean antes de publicar (3.3). Ajustados `../fuente-de-verdad.md` (sección 5 y reconciliación, puntos 3 y 8), AP-09 y la matriz |
| El mínimo de 1 frente a la reconciliación punto 8 | Coherente tras el ajuste: completa el borrador si el grafo ya tiene las relaciones; si no, lo reporta |
| El mínimo se conserva tras publicar | Coherente: no existe operación que elimine `escribió`, `dirigida_por`, `actuó_en` ni personas |
| CG-22 devuelve la cuenta de autores y adaptaciones (libro), o de libro de origen, directores y reparto (película) | Coherente: ajustado en `01` y `02` |
| Dependencia circular entre libro y película al publicar | Resuelta en 3.3: cuenta que la relación exista, no que el otro extremo esté publicado |
| Antes de esta versión, `adaptado_a` figuraba sin mínimo ("una película puede no basarse en ningún libro") | **Era un error.** La adaptación es el núcleo de la aplicación. Corregido en `05`, `04`, `01`, `02`, D-24, `fuente-de-verdad.md` y los demás documentos que lo citaban |

## 7. Puntos pendientes (todos resueltos)

**¿Exigir reparto para publicar una película? Decisión: sí (D-24).** Una película publicada tiene al menos un `actuó_en` y su copia en `reparto`, además de al menos un director y su libro de origen.

**¿Toda película es adaptación y todo libro publicado tiene adaptación? Decisión: sí (D-24).** La adaptación es el núcleo de la aplicación. Una película publicada tiene exactamente un libro de origen y un libro publicado tiene al menos una adaptación.

## 8. Siguiente paso

Los índices: la búsqueda por nombre de `Persona` para CG-01 y CG-02. Los de unicidad ya cubren la búsqueda por id.
