# Documental, paso 2: relaciones entre los datos

Analiza cada relación del dominio con cuatro preguntas. Sus respuestas son la base para decidir, en el paso siguiente, qué va **dentro** de un documento (embebido) y qué va **aparte** (referenciado por id). Este archivo no toma esa decisión: la prepara.

Parte de `01-patrones-de-acceso.md` (los `AP-nn` citados son de ese archivo), `../fuente-de-verdad.md` y `../../decisiones_tomadas.md`.

## 1. Cómo leer la tabla

Cada fila es una relación **A → B**: A es el dato desde el que se lee y B es el dato relacionado, el que podría ir dentro de A o aparte.

| Pregunta | Qué responde | Valores |
|---|---|---|
| ¿Viene en una sola lectura? | Al leer A, ¿se necesita B en ese mismo momento? Se contesta con los patrones de acceso | **Sí**: siempre juntos. **No**: B se pide aparte. **Parcial**: solo a veces o solo una parte de B |
| ¿Se actualiza mucho? | ¿B cambia con frecuencia una vez creado? | **Sí** o **No** |
| ¿Se reutiliza en muchos documentos? | ¿El mismo B aparece en varios A? | **Sí**, **No** o **Parcial**: el valor se repite, pero es solo un texto sin datos propios que mantener |
| ¿Crece sin tope? | ¿La cantidad de B por cada A no tiene un límite natural? | **Sí** o **No** |

Las relaciones cuyo B vive en otra base (grafo o relacional) se marcan en la columna Relación. Se incluyen porque explican por qué ese dato **no** está en el documental.

## 2. Tabla de relaciones

| ID | Relación (A → B) | ¿Viene en una sola lectura? | ¿Se actualiza mucho? | ¿Se reutiliza en muchos documentos? | ¿Crece sin tope? | Por qué |
|---|---|---|---|---|---|---|
| R-01 | libro → ediciones | Sí | No | No | No | **Lectura:** AP-01 trae todas las ediciones en la ficha (RF-06). **Cambios:** solo el Admin agrega o corrige una de vez en cuando (RF-09). **Reutilización:** cada edición es de un solo libro y nada fuera del libro la referencia (D-08). **Tope:** un libro tiene pocas ediciones en un catálogo curado |
| R-02 | libro o película → géneros | Sí | No | Parcial | No | **Lectura:** AP-01 y AP-02. **Cambios:** se fijan en el alta y se corrigen rara vez. **Reutilización:** el mismo género aparece en muchas obras, pero es un texto del vocabulario controlado, sin datos propios. **Tope:** pocos géneros por obra |
| R-03 | película → plataformas | Sí | No | Parcial | No | **Lectura:** AP-02. **Cambios:** el Admin agrega o corrige una de vez en cuando (RF-09). **Reutilización:** el mismo nombre se repite en muchas películas, pero es solo un texto sin datos propios que mantener. **Tope:** pocas plataformas por película |
| R-04 | película → datos técnicos (idioma original, países, productoras, clasificación) | Sí | No | Parcial | No | **Lectura:** AP-02. **Cambios:** se corrigen rara vez. **Reutilización:** el mismo país o productora se repite como texto, sin datos propios. **Tope:** son cuatro campos y las listas de países y productoras son cortas |
| R-05 | película → reparto (persona, personaje y orden) | Sí | No | Sí | No | **Lectura:** AP-02; es la copia de presentación que permite leer la ficha completa (RNF-04). **Cambios:** AP-17 lo reemplaza completo, y solo cuando el Admin cambia el reparto en el grafo o la foto de un actor (D-27). **Reutilización:** el mismo actor aparece en muchas películas y su nombre y su foto son del grafo (fuente de verdad), así que corregirlos obliga a regenerar cada ficha afectada. **Tope:** acotado por película |
| R-06 | libro → autor (grafo) | Parcial | No | Sí | No | **Lectura:** la API lo muestra junto a la ficha, pero RF-06 no lo pide al documento y lo trae del grafo (`../fuente-de-verdad.md`, D4). **Cambios:** solo en el alta (RF-10). **Reutilización:** un autor escribe varios libros. **Tope:** pocos autores por libro |
| R-07 | película → director (grafo) | Parcial | No | Sí | No | **Lectura:** igual que R-06, lo trae el grafo (D4). **Cambios:** solo en el alta (RF-10). **Reutilización:** un director dirige varias películas. **Tope:** pocos directores por película |
| R-08 | libro ↔ película, adaptación (grafo) | Parcial | No | Parcial | No | **Lectura:** RF-23 la muestra, pero se resuelve en el grafo (`adaptado_a`), no en la ficha (D5). **Cambios:** el Admin solo la registra, no la borra. **Reutilización:** un libro tiene varias adaptaciones y una película un solo libro de origen (RN-07). **Tope:** pocas adaptaciones por libro |
| R-09 | libro o película → promedio de calificación (relacional) | Sí | Sí | No | No | **Lectura:** RF-06 y RF-07 lo muestran en la ficha. **Cambios:** cambia con cada reseña publicada, editada, oculta o eliminada (RN-08). **Reutilización:** es un dato propio de cada obra. **Tope:** es un solo número y un conteo. Por eso no se copia a la ficha y la API lo adjunta desde `obra_resumen` (`../fuente-de-verdad.md`, D3) |
| R-10 | libro o película → reseñas individuales (relacional) | Parcial | Sí | No | Sí | **Lectura:** la ficha muestra las más recientes, paginadas y desde el relacional (O17). **Cambios:** se publican, editan, ocultan y eliminan constantemente. **Reutilización:** cada reseña es de una sola obra. **Tope:** cada obra acumula reseñas sin límite |
| R-11 | reseña comparativa → veredicto | Sí | No | No | No | **Lectura:** AP-19 y AP-20 lo traen con el documento. **Cambios:** solo cuando el autor edita la comparativa (RF-17). **Reutilización:** es exclusivo de la comparativa. **Tope:** es un único subdocumento (D-07) |
| R-12 | reseña comparativa → aspectos | Sí | No | No | No | **Lectura:** la comparativa se lee como una unidad. **Cambios:** solo cuando el autor edita la comparativa completa (RF-17); los aspectos no se editan por separado. **Reutilización:** son de nombre libre y pertenecen a una sola comparativa. **Tope:** tiene un tope natural porque el usuario elige pocos; el máximo es 10 aspectos (`04-validacion.md`, sección 6) |
| R-13 | usuario → reseñas comparativas | No | No | No | Sí | **Lectura:** AP-23 las lista aparte y paginadas; el perfil del usuario vive en el relacional. **Cambios:** cada usuario escribe pocas y las edita rara vez. **Reutilización:** cada comparativa es de un solo usuario. **Tope:** un usuario puede escribir comparativas sin límite |
| R-14 | reseña comparativa → usuario autor (relacional) | Parcial | No | Sí | No | **Lectura:** para mostrarla hace falta el nombre del autor, que la API agrega desde el relacional (AP-21); la comparativa guarda solo `usuario_id`. **Cambios:** el nombre solo cambia al editar el perfil (RF-03). **Reutilización:** el mismo usuario aparece en todas sus comparativas. **Tope:** un autor por comparativa |
| R-15 | libro o película → reseñas comparativas | No | Sí | Parcial | Sí | **Lectura:** AP-21 las pide aparte y paginadas; la ficha (AP-01 y AP-02) no las trae. **Cambios:** cualquier usuario puede publicar o editar una, y el Admin puede moderarla (RF-16 a RF-18), con mucha más frecuencia que la ficha. **Reutilización:** cada comparativa involucra solo dos fichas, el libro y la película. **Tope:** una adaptación puede acumular comparativas sin límite |
| R-16 | reseña comparativa → libro y película | Parcial | No | Sí | No | **Lectura:** para mostrarla basta el título y el año (AP-04), no la ficha completa. **Cambios:** la ficha casi no cambia y el título se corrige rara vez. **Reutilización:** el mismo libro o película aparece en muchas comparativas. **Tope:** siempre son exactamente dos obras |

## 3. Lectura preliminar

Es solo un resumen de lo que dicen las respuestas. La decisión de qué se embebe y qué se referencia se toma en el paso siguiente.

| Grupo | Relaciones | Qué sugieren las respuestas |
|---|---|---|
| Se leen con A, casi no cambian y no crecen | R-01, R-02, R-03, R-04, R-11, R-12 | Candidatas a ir dentro del documento. R-02, R-03 y R-04 son solo texto, sin datos propios que sincronizar |
| Se leen con A, pero se reutilizan mucho | R-05 | Tensión conocida: el reparto repite datos del grafo en cada ficha. Se acepta como copia controlada por RNF-04 y se regenera desde el grafo (`../fuente-de-verdad.md`) |
| Crecen sin tope | R-13, R-15 | No pueden ir dentro de A: la comparativa va en su propia colección y apunta a usuario, libro y película |
| Se reutilizan mucho y solo hace falta identificarlos | R-14, R-16 | Se guarda solo el id (`usuario_id`, `libro_id`, `pelicula_id`); el resto se completa al mostrar (AP-04 y AP-21) |
| Viven en otra base | R-06 a R-10 | No se copian al documental. Los cambia otra base (promedio y reseñas en el relacional, autoría y adaptación en el grafo) o su fuente de verdad ya está decidida |
