# Justificación de las tres bases de datos: Del Libro a la Pantalla

Resume por qué la aplicación usa una base relacional, una documental y una de grafo, cómo se conectan entre sí, y qué alternativas se consideraron. Se apoya en `idea-libros-peliculas-adaptaciones.md`, `levantamiento-requerimientos.md`, `matriz-responsabilidades.md` y `fuente-de-verdad.md`.

## 1. Idea central

Cada base resuelve lo que las otras resuelven peor, y cada dato tiene **una sola fuente de verdad**. Las copias existen solo para evitar consultas encadenadas y siempre se pueden reconstruir.

| Base | Guarda | Pregunta que responde mejor |
|---|---|---|
| Relacional | Usuarios, reseñas, listas, estados, seguimientos y el promedio de cada obra (`ObraResumen`) | ¿Es válido y consistente este dato? |
| Documental | Fichas de libro y película, y reseñas comparativas | ¿Cómo se ve esta obra o esta comparación completa? |
| Grafo | Autores, directores, actores, obras, adaptaciones y red social | ¿Cómo se conectan estas personas y obras? |

## 2. Prueba de eliminación

Si se quita una base, esto es lo que se pierde o queda claramente menos adecuado.

| Si se quita… | Se pierde o empeora | Requerimientos |
|---|---|---|
| **Relacional** | Claves foráneas con cascada (al borrar una cuenta no quedan reseñas, listas, estados ni seguimientos huérfanos), restricciones `CHECK` (calificación de 1 a 5, nadie se sigue a sí mismo) y la actualización consistente de reseña + estado + promedio en una sola transacción. | RF-04, RF-12 a RF-15, RF-19 a RF-21; RN-01 a RN-04, RN-08 |
| **Documental** | Cada obra se lee como un todo con la estructura que le corresponde (libro con ediciones, película con plataformas y datos técnicos). La reseña comparativa, con aspectos de nombre y cantidad libres, deja de ser un documento propio. | RF-06, RF-07, RF-09, RF-16, RF-17; RN-05; RNF-04 |
| **Grafo** | Conectar autores, directores, actores, libros y películas. Sobre todo el camino de longitud no conocida entre dos personas u obras (RF-24), las recomendaciones por adaptaciones (RF-26) y por lo que leen los seguidos (RF-27). | RF-23 a RF-27; RN-06, RN-07 |

## 3. Cómo se conectan las bases

Los identificadores `obra_id` y `usuario_id` son los mismos en las tres bases (RNF-08). Esa es la única unión entre ellas.

```
                 ┌────────────── Relacional ──────────────┐
                 │ Usuario, Reseña, Lista, EstadoDeObra,  │
                 │ Seguimiento, ObraResumen (promedio)    │
                 └───────┬─────────────────────┬──────────┘
        sigue, leyó      │                     │  id y tipo de obra
        (R → G)          │                     │  (D → R)
                         ▼                     ▲
                 ┌──── Grafo ────┐       ┌── Documental ──┐
                 │ Persona,      │ ────► │ Ficha de libro │
                 │ Libro,        │ reparto│ Ficha película │
                 │ Película,     │ (G → D)│ Reseña         │
                 │ Usuario       │ ◄──── │ comparativa    │
                 └───────────────┘ id     └────────────────┘
                                      (D → G)
```

| Copia | Fuente → Copia | Para qué |
|---|---|---|
| `sigue` | Relacional → Grafo | Recorridos sociales (RF-27) |
| `leyó` (solo libros) | Relacional → Grafo | Saber qué leyó cada quien dentro de la consulta de grafo (RF-26, RF-27) |
| Reparto (con la foto de cada actor) | Grafo → Documental | Ficha de película completa en una lectura |
| Id de obra | Documental → Relacional y Grafo | Claves foráneas y anclas de los recorridos |
| Id de usuario | Relacional → Grafo | Anclar `sigue` y `leyó` |
| Promedio | Relacional (reseñas) → `ObraResumen` | Dato derivado, misma base y misma transacción |

**Cómo se mantienen consistentes:** se escribe primero en la fuente de verdad y después en la copia. Los cambios del relacional al grafo salen por una tabla `sync_outbox` escrita en la misma transacción, con reintento. Las copias nunca se editan a mano y un script de reconciliación las reconstruye. Detalle en `fuente-de-verdad.md`.

## 4. Flujos que cruzan bases

| Operación | Relacional | Documental | Grafo |
|---|---|---|---|
| Publicar reseña (RF-13) | Reseña + estado terminada + promedio + evento, en una transacción | — | Crea `leyó` al procesar el evento, solo si la obra es un libro |
| Ver ficha de obra (RF-06, RF-07) | Promedio desde `ObraResumen` | Ficha completa | — (el reparto ya viene copiado) |
| Recomendar libros (RF-26) | Libros terminados con calificación ≥ 4 | Datos para mostrar | Recorrido de dos saltos por el mismo director |
| Crear comparativa (RF-16) | — | Guarda el documento | Valida que existe `adaptado_a` (RN-06) |
| Eliminar cuenta (RF-04) | Borra en cascada | Borra sus comparativas | Borra el nodo y sus relaciones |

## 5. Alternativas y debilidades

Cada fila responde a "yo habría hecho esto" o "esto también era una alternativa".

### 5.1 Sobre las tres bases

| Alternativa | Por qué no la elegimos |
|---|---|
| **"Todo en PostgreSQL"** (con JSONB para fichas y consultas recursivas para caminos) | Es la objeción más fuerte y se reconoce. Funciona, y para un sistema real pequeño sería razonable. Pero las fichas se leerían con uniones o JSONB sin ventaja de modelo, y el camino de longitud variable entre tipos distintos de nodos (autor, libro, película, actor) obligaría a unificar todas las relaciones en una tabla de aristas, es decir, a imitar un grafo. El proyecto busca que cada base se use donde su modelo encaja. |
| **"Todo en MongoDB"** | MongoDB tiene transacciones y índices únicos, así que no se afirma lo contrario. Lo que no tiene es integridad referencial con cascada declarativa: borrar una cuenta y no dejar huérfanos dependería por completo de la aplicación. Tampoco recorre relaciones de longitud variable de forma natural. |
| **"Solo relacional y grafo"** (sin documental) | Es la combinación que más se acerca a ser suficiente, y por eso el documental es el punto más delicado. Las ediciones se podrían guardar en tablas hijas. Se mantiene porque libros y películas se consultan con datos distintos y la reseña comparativa tiene aspectos de nombre y cantidad libres, algo que en SQL exigiría una tabla de pares nombre-valor o una columna JSON. |
| **"Solo relacional y documental"** (sin grafo) | Se perdería el camino de longitud variable (RF-24), que es la función más distintiva. Los recorridos de profundidad fija (RF-25 a RF-27) sí se podrían hacer con uniones; se reconoce. Se mantiene el grafo porque RF-24 y el conjunto de conexiones entre cuatro tipos de nodos son su razón de ser. |
| **"Solo documental y grafo"** (sin relacional) | Se perderían las claves foráneas con cascada y las restricciones `CHECK`. Cuentas, reseñas, listas y estados son datos muy referenciados entre sí; ahí el relacional es lo más natural. |

### 5.2 Sobre dónde vive cada dato

| Decisión | Alternativa | Por qué no |
|---|---|---|
| Ficha de obra como fuente de la identidad de la obra | Que el grafo sea la fuente y la ficha se genere desde él | El grafo no está pensado para ediciones y campos variables, y RF-08 y RF-09 editan fichas. |
| Tabla mínima `ObraResumen` en el relacional | Sin tabla de obras (ids validados en la aplicación) | Reseñas y estados podrían apuntar a obras inexistentes. Con la tabla hay clave foránea. |
| Tabla `Obra` completa en el relacional | Duplicar toda la ficha | Duplicaría ediciones y plataformas y contradice la razón del documental. |
| Promedio en `ObraResumen`, adjuntado por la API | Copiarlo a la ficha | Dejaría de actualizarse en la misma transacción que la reseña y RN-08 pasaría a ser eventual. |
| Promedio en `ObraResumen` | Calcularlo en cada lectura | Obliga a una agregación en cada visita a una ficha. |
| Autores, directores y actores solo en el grafo | Colección `personas` en el documental, o copiar autor y director a la ficha | No hay requerimiento de ficha de persona y cada copia añade una sincronización. |
| `adaptado_a` solo en el grafo, validado por la API | Guardar `libro_origen_id` en la ficha de película | Añade una copia. Queda como plan de respaldo si RN-07 (una película, un solo libro de origen) resulta frágil de validar. |
| "Le gustó" resuelto en dos pasos (relacional filtra, grafo recorre) | Copiar la calificación a `leyó {calificacion}` | La calificación solo sirve para elegir el libro de partida de RF-26 y cambia con cada edición de reseña. Queda como plan de respaldo si RF-26 resulta lenta. |
| `leyó` copiada al grafo | Resolver RF-27 sin copia (grafo para quién sigo, relacional para lo que leyeron, grafo para adaptaciones) | Son más consultas encadenadas. Queda como plan de respaldo si la sincronización de `leyó` resulta difícil. |

### 5.3 Sobre la arquitectura

| Alternativa | Por qué no |
|---|---|
| Transacciones distribuidas o commit en dos fases entre las tres bases | No se justifica para el alcance. Se reconoce que una operación que toca varias bases puede fallar parcialmente y se mitiga con reintento, bandeja de salida y reconciliación. |
| Microservicios, uno por base | Una API modular que coordina las tres bases es suficiente para un proyecto académico. |
| Bus de eventos (Kafka o similar) en lugar de la bandeja de salida | Añade infraestructura. La tabla `sync_outbox` en el propio relacional logra lo necesario (el evento nace en la misma transacción que el dato). |
| Borrar obras o relaciones | No hay baja de obras ni borrado de relaciones por parte del administrador, así que no se definieron cascadas para ello. Si se agrega, habrá que decidir qué ocurre con reseñas, estados, listas y comparativas. |

## 6. Debilidades reconocidas

| Debilidad | Cómo se mitiga |
|---|---|
| **Sin transacción entre bases.** Una copia puede quedar desactualizada un momento o fallar. | Escritura primero en la fuente, reintento desde `sync_outbox`, fichas en `borrador` hasta completar el alta y script de reconciliación. |
| **Documental es la justificación más delicada.** Con los campos actuales de las ediciones, una tabla hija en SQL también serviría. | Se apoya en que libros y películas se consultan con datos distintos y en la reseña comparativa de estructura libre (RF-16). |
| **Solo RF-24 es de longitud verdaderamente variable.** RF-25 a RF-27 tienen profundidad fija. | RNF-10 exige datos de prueba con cadenas de adaptaciones y repartos compartidos. El grafo además modela de forma natural las conexiones entre cuatro tipos de nodos. |
| **Catálogo más acotado que el de un servicio de cine general.** | La relación libro → adaptación es el núcleo del dominio, no una función accesoria. |
| **RF-26 usa dos consultas** (relacional y grafo). | La segunda recibe solo una lista corta de ids. Plan de respaldo documentado. |
| **RN-07 no se impone en el grafo** (los grafos no limitan cardinalidad de forma nativa). | La API valida antes de crear la relación, bloqueando antes el nodo de la película para evitar escrituras simultáneas (D-23), y hay una prueba que lo verifica. |
| **Los mínimos de una obra publicada no se imponen en el grafo** (autor y adaptación en el libro; libro de origen, director y reparto en la película; Neo4j no limita cuántas relaciones tiene un nodo). | El alta trae esos datos y la API comprueba antes de publicar la ficha (D-24). La reconciliación reporta las obras publicadas que no los cumplen. |
| **La página de detalle usa dos lecturas** (ficha y promedio). | Ambas son por clave. "Un solo documento" se aplica a los datos descriptivos de la obra. |
