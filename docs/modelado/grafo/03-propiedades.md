# Grafo, paso 3: propiedades

Define qué propiedades tiene cada nodo y cada relación del grafo, con su tipo de dato y si son obligatorias. Responde a la pregunta: ¿qué propiedades pertenecen a los nodos y cuáles a las relaciones?

Parte de `01-consultas-y-entidades.md` (entidades y consultas), `02-relaciones.md` (relaciones) y `../../decisiones_tomadas.md` (D-11, D-12, D-15, D-18, D-19, D-25 y D-27). Aquí vive el tipo, la obligatoriedad y las reglas de cada propiedad; los otros archivos solo las nombran.

## 1. Cómo se decide dónde va una propiedad

- Va en el **nodo** si describe a la cosa por sí sola. Una persona tiene un nombre, sin importar en qué película actúe.
- Va en la **relación** si describe el vínculo entre dos cosas y solo tiene sentido con los dos extremos juntos. El personaje que interpreta un actor depende de la película: el mismo actor tiene otro personaje en otra película, y una misma película tiene un personaje distinto por cada actor. Si `personaje` estuviera en `Persona`, cada actor tendría un único personaje para todas sus películas.

| Dato | Dónde va | Por qué |
|---|---|---|
| `persona_id` | Nodo `Persona` | Identifica a la persona |
| `nombre` | Nodo `Persona` | Es de la persona y no cambia según la obra |
| `foto_url` | Nodo `Persona` | La foto es de la persona, sin importar en qué obra aparezca. La ficha guarda una copia en su reparto (D-27) |
| `obra_id` | Nodos `Libro` y `Película` | Identifica a la obra |
| `usuario_id` | Nodo `Usuario` | Identifica al usuario |
| `personaje` | Relación `actuó_en` | Cambia con cada película y con cada actor |
| `orden` | Relación `actuó_en` | Es la posición de la persona en el reparto de esa película |
| Tipo de obra (libro o película) | Ninguna: es la etiqueta del nodo | Guardarlo también como propiedad lo repetiría |
| Rol de una persona | Ninguna: se deduce de sus relaciones | D-15 |

## 2. Tabla de propiedades

| Entidad | Propiedad | Tipo de dato | Obligatoria | Descripción |
|---|---|---|---|---|
| `Persona` (nodo) | `persona_id` | Texto (String) | Sí | Identificador único de la persona. UUID en minúsculas y con guiones, guardado como texto de 36 caracteres (D-11). Lo genera la API y es el mismo de `peliculas.reparto[].persona_id` (D-12) |
| `Persona` (nodo) | `nombre` | Texto (String) | Sí | Nombre de la persona, de 1 a 150 caracteres (el mismo límite del reparto de la ficha). Sirve para buscar (CG-01, CG-02), para mostrar caminos y se copia al reparto de la ficha |
| `Persona` (nodo) | `foto_url` | Texto (String) | No | Dirección de la foto de la persona, guardada en el almacenamiento en la nube; la imagen no vive en la base (D-25). De 1 a 500 caracteres y con `https://`, igual que la `portada_url` de las fichas. Si la persona no tiene foto, la propiedad no existe. Sirve para mostrar a la persona en los resultados (CG-01, CG-02, CG-05 a CG-08) y se copia al reparto de la ficha (`peliculas.reparto[].foto_url`, D-27) |
| `Libro` (nodo) | `obra_id` | Texto (String) | Sí | Identificador único del libro. UUID en minúsculas y con guiones, como texto. Es el `_id` de la ficha en `libros` y el `obra_id` de `obra_resumen` (RNF-08) |
| `Película` (nodo) | `obra_id` | Texto (String) | Sí | Identificador único de la película. UUID en minúsculas y con guiones, como texto. Es el `_id` de la ficha en `peliculas` y el `obra_id` de `obra_resumen` (RNF-08) |
| `Usuario` (nodo) | `usuario_id` | Texto (String) | Sí | Identificador único del usuario. UUID en minúsculas y con guiones, como texto. Es el `usuario_id` del relacional (RNF-08) |
| `actuó_en` (relación) | `personaje` | Texto (String) | Sí | Personaje que la persona interpreta en esa película, de 1 a 150 caracteres. Si interpreta dos, el texto recoge ambos (D-19). Se copia a la ficha (D-12) |
| `actuó_en` (relación) | `orden` | Entero (Integer) | Sí | Posición de la persona en el reparto de esa película, desde 1. La API valida que no se repita dentro de la película. Se copia a la ficha (D-12) |

## 3. Relaciones sin propiedades

| Relación | Por qué no lleva propiedades |
|---|---|
| `escribió` | La relación basta. RF-10 no pide guardar nada más sobre la autoría |
| `adaptado_a` | La relación basta. Los datos de cada película, como el año, viven en la ficha |
| `dirigida_por` | La relación basta. RF-10 no pide guardar nada más sobre la dirección |
| `sigue` | La fecha en que se empezó a seguir vive en `seguimiento` y ninguna consulta del grafo la usa |
| `leyó` | La calificación vive en el relacional y se usa solo para elegir los libros de partida de RF-26 (`../fuente-de-verdad.md`, D6) |

## 4. Propiedades consideradas y descartadas

| Candidato | Por qué no |
|---|---|
| `titulo` en `Libro` y `Película` | AP-04 ya entrega el título a partir de los ids (D-18) |
| Tipo de obra como propiedad | Ya lo expresa la etiqueta del nodo; tenerlo en los dos sitios permitiría que se contradijeran |
| Rol de la persona (`es_autor`, `es_director`…) | Se deduce de las relaciones (D-15) |
| `creado_en` y `actualizado_en` en nodos y relaciones | Ninguna consulta del grafo las usa. Las fechas que sí hacen falta viven en las otras bases; por ejemplo, el script usa el `creado_en` de la ficha para detectar borradores (AP-30) |
| `estado_publicacion` en los nodos de obra | Vive en la ficha. La API lo aplica al completar los resultados con AP-04 |
| `nombre` o perfil en `Usuario` | Viven en el relacional; el nodo solo ancla relaciones |
| `portada_url` en `Libro` y `Película` | Vive en la ficha del documental (D-25), igual que el resto de datos descriptivos. El nodo de obra solo guarda su id (D-18) |
| `foto_url` en `Usuario` | El equipo no la quiere por ahora (D-25) |
| `calificacion` en `leyó` | Plan de respaldo si RF-26 resultara lenta; hoy no hace falta (`../fuente-de-verdad.md`, D6) |

## 5. Convenciones

- Las propiedades usan snake_case sin tildes, como los campos de las otras bases.
- Todos los ids son texto en minúsculas con guiones, para que el mismo id coincida en las tres bases (D-11, RNF-08).
- Neo4j no guarda valores nulos: una propiedad sin valor simplemente no existe. Las propiedades obligatorias no deben faltar (cómo se garantiza está en `04-restricciones.md`). `foto_url` es la única opcional: si la persona no tiene foto, la propiedad simplemente no existe, sin un valor vacío.
- Neo4j no valida por sí solo el tipo ni la obligatoriedad de una propiedad. Como se usa la edición Community (D-22), que solo ofrece restricciones de unicidad, el tipo y la obligatoriedad los garantiza la API (`04-restricciones.md`).
- Las etiquetas y los tipos de relación conservan los nombres de los documentos (`Película`, `escribió`, `actuó_en`), que Neo4j admite. Si algún cliente o consola diera problemas con las tildes, se renombrarían todos a la vez.

## 6. Puntos pendientes (todos resueltos)

**¿La foto de una persona se copia al reparto de la ficha de la película? Decisión: sí, opción A (D-27)**
- *De qué se trata.* La ficha de una película guarda una copia del reparto con `persona_id`, `nombre`, `personaje` y `orden` de cada actor (D-12). La foto vive en el nodo `Persona` (`foto_url`). Para que la ficha muestre la cara de cada actor hay que copiarla o pedirla al grafo.
- *Ejemplo.* La ficha de *Dune* lista a Timothée Chalamet como Paul Atreides. Para pintar su foto junto al nombre, la ficha necesita su `foto_url`.
- *Opción A (elegida):* copiar `foto_url` al reparto, como ya se copia el `nombre`. La ficha se lee completa en un solo documento (RNF-04). Costo: un quinto campo copiado y, si se cambia la foto de una persona, hay que regenerar el reparto de todas sus películas. Lo hace CG-24 con CG-25, CG-20 y AP-17.
- *Opción B:* no copiarla y pedirla al grafo por `persona_id` al mostrar la ficha. Sin redundancia nueva, pero la ficha dependería también del grafo y dejaría de ser una sola lectura, que es lo que D-12 descartó para el nombre.
- *Opción C:* copiarla solo para los primeros actores del reparto. Mezcla copia y consulta, y añade una regla de cuántos y cuándo recalcular, por muy poco ahorro.
- *Opción E:* no guardar la URL y derivarla del `persona_id` (por ejemplo `.../personas/{persona_id}.jpg`). Eliminaría la propiedad y la copia, pero no se sabría si una persona tiene foto sin pedirla, cambiar el almacenamiento obligaría a renombrar archivos y contradice D-25 ("guardar la URL").
- *Resultado.* Se copia (opción A). El campo es opcional: si la persona no tiene foto, el elemento del reparto no lleva `foto_url`.

## 7. Siguiente paso

Las restricciones están en `04-restricciones.md`. Después, los índices: el nombre de `Persona` para CG-01 y CG-02.
