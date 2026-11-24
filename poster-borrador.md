# Borrador de contenido del póster ETEIA 2026 (versión 2, más breve)

Texto por secciones para pasar a PowerPoint (A1 vertical, 60 × 90 cm). Columna izquierda: Introducción, Planteamiento, Justificación. Columna derecha: Metodología y Resultados. Conclusiones y Referencias al pie.

**Cómo leer este archivo**

- **Texto** es lo que va en el póster.
- **Figura / Tabla** dice qué dibujar. Según las instrucciones, cada figura va en un bloque propio con su leyenda, y el texto que la explica va **debajo**, no al lado.
- Los bloques `NOTA` son para ti y no van en el póster.

**Estado en el que se basa:** etapas 1 a 3 terminadas. El Entregable 4 está en curso: el modelo relacional ya se implementó y probó (evidencia en `db/evidencias/relacional/`, ejecución del 23 de nov. de 2026); documental y grafo siguen en curso. Si el Entregable 4 avanza antes de imprimir, actualiza la Tabla 2 y el último párrafo del resumen.

---

## Título

**Del Libro a la Pantalla: plataforma social para conectar libros, sus adaptaciones al cine y a quienes los leen y ven**

Alternativa: *Del libro a la película: modelo de datos y arquitectura para seguir una obra hasta su adaptación*.

## Autores y afiliación

Nadia Guerra Cuessy, Horacio Irán Solís Cisneros (docente)

Ingeniería en Tecnologías de la Información e Innovación Digital, Universidad Politécnica de Chiapas, Tuxtla Gutiérrez, Chiapas, México

---

## Resumen

Quienes leen y ven cine suelen llevar su seguimiento en herramientas separadas, donde es difícil rastrear qué película adapta qué libro y comparar ambas versiones. El objetivo de este trabajo es crear *Del Libro a la Pantalla*, una aplicación móvil social para registrar, reseñar y comparar libros y sus adaptaciones, y para descubrir nuevas obras a partir de las conexiones entre autores, directores, actores y otros usuarios. Se siguió un enfoque por etapas: primero se definieron el problema, los usuarios y 27 requerimientos, y después el modelo de datos y la arquitectura, que reparte la información en tres tipos de base de datos según su naturaleza (relacional, documental y de grafo), coordinadas por una sola API. La solución desarrollada hasta ahora es el diseño completo de la aplicación y la implementación de su parte relacional, que superó 84 pruebas con datos de prueba; una de ellas llevó a corregir el diseño. Las otras dos bases, la API y la app están en curso o pendientes, y aún no hay mediciones de rendimiento.

---

## Introducción

**Contexto y relevancia.** La lectura es una práctica extendida en México: en 2026, 78.6 % de la población de 12 años y más leyó algún material de los que mide el INEGI, los libros fueron el material más frecuente (61.4 % entre quienes leyeron) y la población lectora de libros leyó en promedio 3.9 ejemplares en el último año [12]. La relación entre libros y cine también es estrecha: un estudio de BookNet Canada sobre 60 adaptaciones estrenadas en 2020 y 2021 encontró que las ventas de los libros adaptados subieron 307 % entre las 12 semanas previas al estreno y la primera semana posterior, y que las reservas en bibliotecas crecieron 89 % en el periodo analizado [13]. El efecto se concentra en las primeras semanas y el estudio se limita al mercado anglófono canadiense y a películas bien valoradas, por lo que no es generalizable, pero indica que el estreno de una adaptación coincide con un interés mayor por el libro.

**Cómo se atiende hoy.** Para ver cómo se atiende ese interés se revisaron plataformas de seguimiento. Goodreads permite ordenar libros en estantes (leído, leyendo, por leer), calificarlos, reseñarlos, ver la actividad de otros lectores y recibir recomendaciones [10]; The StoryGraph ofrece reseñas, estadísticas de lectura y recomendaciones basadas en los hábitos del usuario [17]; y Letterboxd cumple un papel equivalente para el cine, con diario de películas vistas, reseñas, listas y seguimiento entre usuarios [11]. Cada plataforma atiende un solo medio. En lo revisado, la adaptación aparece como un género, listas y grupos creados por la comunidad (por ejemplo, la página "Adaptation" de Goodreads [18]) y no como una relación entre la ficha de un libro y la de su película.

Fuera de las plataformas sociales, la adaptación sí se trata como relación y como objeto de estudio. Wikidata la representa como un vínculo entre obras mediante la propiedad "basado en" (P144), cuyos alias incluyen "adaptación de" y "adaptado de" [16]. Hutcheon explora el desarrollo continuo de la adaptación creativa y sostiene que adaptar es central en la forma de contar historias [14], y trabajos computacionales recientes alinean libros con sus adaptaciones para comparar qué se conserva y qué cambia en 40 casos [19].

**Cómo esto llevó al problema y a la solución.** De esta revisión se desprende la brecha que origina el proyecto: la lectura y el cine tienen buenas herramientas de seguimiento por separado, y la adaptación es una relación reconocida por las bases de conocimiento, la teoría y los datos de mercado, pero en las plataformas revisadas no es el eje de una herramienta social para quien lee y ve. Por eso el proyecto toma la adaptación (libro → película) como relación central. Conserva lo que ya hacen esas plataformas (registrar, reseñar, hacer listas, seguir a otros) y añade lo que no resuelven: comparar un libro con su película en una misma reseña y explorar las conexiones entre autores, directores, actores y lectores.

La solución también se desprende de la naturaleza de los datos: hay operaciones que deben ser atómicas (publicar una reseña y actualizar su promedio), fichas con estructura anidada y variable (ediciones, plataformas) y una red de conexiones. Para esa mezcla se adoptó persistencia políglota [6], [7], con una base de grafos para los recorridos [8]. En recomendación, los grafos de conocimiento se usan como información adicional que ayuda con la escasez de datos y el arranque en frío [15], lo que respalda recomendar por conexiones.

> NOTA 1 (esta versión es larga a propósito): si necesitas resumirla, lo imprescindible según las instrucciones es: (a) contexto y relevancia (INEGI [12], BookNet [13]), (b) cómo otros lo atienden (Goodreads/StoryGraph/Letterboxd, y Wikidata o Hutcheon) y (c) la brecha que llevó a la solución. Los párrafos 3 y 4 se pueden fundir en dos frases.
>
> NOTA 2 (ajusta a lo que de verdad hiciste): redacté "se revisaron plataformas" como el razonamiento que sustenta el problema. Si identificaste el problema por tu propia experiencia como lectora y espectadora, dilo en una frase al inicio del segundo párrafo ("Partiendo de la experiencia de usar herramientas separadas, se revisó…").
>
> NOTA 3 (comprueba esto antes de imprimir): la oración "en lo revisado, la adaptación aparece como género, listas y grupos… y no como una relación entre fichas" está respaldada por la página "Adaptation" de Goodreads [18], pero no abrí la ficha de un libro concreto ni la de una película en Letterboxd. Abre la ficha de un libro con película (por ejemplo, *Los juegos del hambre*) en Goodreads y la de su película en Letterboxd. Si alguna muestra un vínculo directo, ajusta o quita esa oración.
>
> NOTA 4 (qué quedó verificado y qué no): leí directamente el comunicado del INEGI [12] (comunicado 109/26, 18 de nov. de 2026), la página de BookNet Canada [13], la página de Goodreads [18], la de Wikidata [16], la ficha de Routledge [14] y los resúmenes de arXiv [15], [19]. Las descripciones de Goodreads, StoryGraph y Letterboxd salen de Wikipedia y de resultados de búsqueda; los sitios oficiales de StoryGraph y Letterboxd no los pude abrir. Ábrelos tú antes de citarlos. El volumen y las páginas de [15] los tomé de un resultado de búsqueda (dblp), no de la página de la revista.
>
> **Referencias nuevas para añadir** (no toqué la sección Referencias; copia estas entradas ahí). [10], [11], [6], [7] y [8] ya existen. Según IEEE, los números deben seguir el **orden de aparición** en el póster, así que al final renumera todo.
>
> [12] INEGI, "Módulo sobre Lectura (MOLEC) 2026," Comunicado de prensa 109/26, nov. 18, 2026. [Online]. Available: https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/molec/MOLEC2026_CP.pdf. [Accessed: Nov. 24, 2026].
>
> [13] BookNet Canada, "Must-watch, must-read: Book adaptations on the big screen," BookNet Canada, May 3, 2022. [Online]. Available: https://booknetcanada.ca/blog/research/2022/5/3/must-watch-must-read-book-adaptations-on-the-big-screen. [Accessed: Nov. 24, 2026].
>
> [14] L. Hutcheon, *A Theory of Adaptation*, 2nd ed. (with an epilogue by S. O'Flynn). Routledge, 2013.
>
> [15] Q. Guo, F. Zhuang, C. Qin, H. Zhu, X. Xie, H. Xiong, and Q. He, "A survey on knowledge graph-based recommender systems," *IEEE Trans. Knowl. Data Eng.*, vol. 34, no. 8, pp. 3549–3568, Aug. 2022, doi: 10.1109/TKDE.2020.3028705.
>
> [16] Wikidata, "Property:P144 (based on)." [Online]. Available: https://www.wikidata.org/wiki/Property:P144. [Accessed: Nov. 24, 2026].
>
> [17] The StoryGraph. [Online]. Available: https://www.thestorygraph.com/. [Accessed: *fecha*].
>
> [18] Goodreads, "Adaptation." [Online]. Available: https://www.goodreads.com/genres/adaptation. [Accessed: Nov. 24, 2026].
>
> [19] T. Pial, S. Salim, C. Pethe, A. Kim, and S. Skiena, "Analyzing film adaptation through narrative alignment," arXiv:2311.04020, Nov. 2023. [Online]. Available: https://arxiv.org/abs/2311.04020.

## Planteamiento del problema

- **Situación:** el seguimiento de lecturas y películas está repartido y la adaptación no está modelada como dato.
- **Afectados:** el lector/espectador (registrar, reseñar, comparar, descubrir), el administrador/curador (mantener el catálogo y moderar) y el visitante (consultar el catálogo).
- **Necesidad:** un solo lugar donde la obra, su adaptación y sus personas estén conectadas.
- **Consecuencias:** reseñas del libro y de la película aisladas; descubrimiento manual; historial disperso.

**Figura 1. Contexto, problemática y solución propuesta** (tres paneles, como en la plantilla): *Contexto*: lectores y espectadores, libros y películas. *Problemática*: apps separadas, adaptación sin relacionar, reseñas aisladas. *Solución*: una aplicación móvil que coordina tres bases mediante una API.
*Fuente: elaboración propia.*

La Figura 1 resume el problema y la solución que se propone; el alcance se limita a libros y películas, con catálogo propio.

## Justificación

La aplicación busca reunir en un solo lugar lo que hoy está disperso y volver consultable la adaptación: comparar un libro con su película y descubrir obras a partir de autores, directores y actores en común. Es un valor esperado del diseño; aún no se evaluó con usuarios.

Cada tipo de dato se asigna a la base que lo resuelve mejor, no por cumplir un requisito: se comprobó qué capacidad se pierde si se quita cada una (Figura 3).

---

## Metodología

**Etapas.** El trabajo sigue las etapas del proyecto integrador: cada una produce la evidencia que usa la siguiente (Figura 2). Se definieron requerimientos y un modelo conceptual común antes de modelar las tres bases.

**Figura 2. Etapas del proyecto y su estado** (flujo con colores)

| Etapa | Estado |
|---|---|
| 1 Propuesta · 2 Modelado de datos · 3 Arquitectura y stack | Terminadas |
| 4 Implementación de las tres bases | En curso (relacional terminada) |
| 5 Catálogo de operaciones · 6 Backend y API · 7 Aplicación e integración · 8 Pruebas y despliegue | Pendientes |

*Fuente: elaboración propia a partir de la guía del proyecto integrador.*

**Responsabilidades de cada base.** Comparten solo `obra_id` y `usuario_id` (mismo UUID en las tres). La Figura 3 muestra qué guarda cada una y qué se pierde sin ella.

**Figura 3. Una base por tipo de problema** (tres paneles)

- **Relacional** (PostgreSQL [1]–[3]) · *¿Es válido y consistente?* Usuarios, reseñas, listas, estados, seguimientos y promedio de cada obra. 9 tablas. *Sin ella:* se pierde la atomicidad de publicar una reseña con su estado y su promedio, y la cascada al eliminar una cuenta.
- **Documental** (MongoDB [5]) · *¿Cómo se ve esta obra completa?* Fichas de libro y película con ediciones y plataformas anidadas, y la reseña comparativa. 3 colecciones. *Sin ella:* la ficha no se lee en una consulta y las comparativas de aspectos libres no tienen estructura propia.
- **Grafo** (Neo4j [4], [8]) · *¿Cómo se conectan?* Personas, libros, películas y usuarios; 6 tipos de relación. *Sin ella:* se pierde el camino de longitud variable entre dos personas u obras y las recomendaciones por adaptaciones.

*Fuente: elaboración propia (modelado del proyecto).*

**Arquitectura, backend e integración.** La aplicación móvil nunca accede a las bases: habla con una API única en tres capas (rutas, servicios y repositorios, uno por base), con un proceso de sincronización dentro (Figura 4). El backend usa Node, Express y TypeScript; la app, React Native con Expo; todo corre en contenedores. **Esta arquitectura está diseñada; la API y la app aún no se implementan.**

**Figura 4. Arquitectura de la aplicación** (diagrama de componentes): Teléfono Android (app) → API (Rutas → Servicios → Repositorios; worker de sincronización; reconciliación) → PostgreSQL, MongoDB, Neo4j. Todo en Docker Compose.
*Fuente: elaboración propia.*

**Fuente de verdad y sincronización.** Cada dato se modifica oficialmente en una sola base; las demás guardan copias. Los cambios del relacional hacia el grafo salen por una tabla de eventos escrita en la misma transacción que el dato [9]; un proceso los aplica en orden, con reintento, y un script de reconciliación reconstruye las copias (Figura 5). Entre bases no hay transacción atómica: la consistencia es eventual.

**Figura 5. Sincronización entre bases** (flechas de fuente a copia)

- Relacional → Grafo: usuario, `sigue`, `leyó` (para recorridos y recomendaciones).
- Documental → Relacional y Grafo: id y tipo de obra (llaves foráneas y anclas del grafo).
- Grafo → Documental: reparto de la película (ficha completa en una lectura).
- Si una copia falla: la operación principal ya quedó confirmada, la copia se reintenta y, si se agota, se reconcilia.

*Fuente: elaboración propia.*

**Estrategia de pruebas.** Por base (integridad, transacción, concurrencia, índices, consultas; documentos válidos e inválidos; unicidad y cardinalidad en el grafo) y entre bases (coherencia de ids y copias, caso integrado). Se ejecutan contra el motor real, con salida guardada como evidencia. **Hasta ahora solo se han ejecutado las del relacional.**

---

## Resultados

El modelo relacional se implementó en PostgreSQL 18.7 (9 tablas, restricciones, índices y el *trigger* que mantiene el promedio) y se probó con **datos de prueba**, no reales. Las 84 comprobaciones pasaron (Tabla 1). Los contenedores de las tres bases se levantan con control de salud.

**Tabla 1. Pruebas del modelo relacional**

| Grupo | Qué verifica | Resultado |
|---|---|---|
| Integridad | Unicidad, rangos, llaves foráneas, cascada al eliminar cuenta, promedio por *trigger* | 43 de 43 |
| Transacción (RF-13) | Si falla un paso, no queda reseña, estado, evento ni promedio | 5 de 5 |
| Concurrencia | Reseñas simultáneas sobre la misma obra | 3 de 3, tras corregir el diseño |
| Índices | Cada consulta usa el índice previsto (`EXPLAIN`) | 16 de 16 |
| Consultas | Sesión, reseñas de una obra, libros de partida de la recomendación, verificación del promedio | 17 de 17 |

*Fuente: salidas en `db/evidencias/relacional/`, ejecución del 23 de nov. de 2026, datos de prueba.*

**Incidencia que cambió el diseño.** Con el bloqueo previsto (`FOR UPDATE`), una ráfaga de 8 reseñas simultáneas sobre la misma obra abortó entre 6 y 7 sesiones por interbloqueo (dos ejecuciones). Sin bloqueo el promedio salía incorrecto. Con `FOR NO KEY UPDATE` las 8 se confirmaron sin errores y el promedio coincidió con el recálculo manual (Figura 6). El diseño se corrigió (D-38).

**Figura 6. Reseñas simultáneas según el bloqueo** (gráfica de barras sencilla)

| Variante | Resultado |
|---|---|
| Sin bloqueo (2 reseñas) | Incorrecto: total 1, promedio 2,00 (correcto: total 2, promedio 3,50) |
| `FOR UPDATE` (8 reseñas) | 6 a 7 sesiones abortadas por interbloqueo |
| `FOR NO KEY UPDATE` (8 reseñas) | 8 confirmadas, total 8, promedio 3,13 = recálculo manual |

*Fuente: prueba 15, `db/evidencias/relacional/`, datos de prueba.*

La Figura 6 muestra que la prueba contra el motor reveló un fallo que la documentación no mostraba. En el documental hubo otra corrección: el índice único parcial del ISBN falló en MongoDB 9.0.4 y se sustituyó por uno *sparse*.

**Tabla 2. Estado por componente**

| Componente | Diseñado | Implementado | Validado |
|---|---|---|---|
| Relacional | Sí | Sí | Sí, con datos de prueba |
| Documental | Sí | En curso | Parcial (índice del ISBN y validador, en MongoDB 9.0.4) |
| Grafo | Sí | En curso | No |
| Sincronización, API y aplicación | Sí | No | No |

**Incompleto:** no hay aún API, aplicación, flujos entre bases ni mediciones de rendimiento.

---

## Conclusiones

- **Qué se logró:** un diseño completo de tres bases con responsabilidades y fuente de verdad definidas, y un modelo relacional implementado que superó 84 comprobaciones con datos de prueba.
- **Qué significan los resultados:** probar contra el motor corrigió un error de diseño (D-38) y uno del documental. La integración entre bases todavía no se ha demostrado.
- **Limitaciones y mejoras:** no hay transacción entre bases y no hay mediciones. El siguiente paso es completar documental y grafo, implementar la API y probar un caso integrado (seguir a un lector y ver recomendaciones), porque ahí está el mayor riesgo sin probar: la sincronización.

---

## Referencias

Las cinco primeras vienen de la plantilla. Las demás son propuestas mías: **verifica autores, año, editorial y URL**, y pon tú la fecha de acceso real.

[1] E. F. Codd, "A relational model of data for large shared data banks," *Communications of the ACM*, vol. 13, no. 6, pp. 377–387, 1970, doi: 10.1145/362384.362685.

[2] R. Elmasri and S. B. Navathe, *Fundamentals of Database Systems*, 7th ed. Pearson, 2016.

[3] PostgreSQL Global Development Group, "PostgreSQL documentation." [Online]. Available: https://www.postgresql.org/docs/. [Accessed: Nov. 13, 2026].

[4] Neo4j, Inc., "Neo4j documentation." [Online]. Available: https://neo4j.com/docs/. [Accessed: Nov. 13, 2026].

[5] MongoDB, Inc., "MongoDB manual." [Online]. Available: https://www.mongodb.com/docs/manual/. [Accessed: Nov. 13, 2026].

[6] P. J. Sadalage and M. Fowler, *NoSQL Distilled: A Brief Guide to the Emerging World of Polyglot Persistence*. Addison-Wesley, 2012.

[7] M. Kleppmann, *Designing Data-Intensive Applications*. Sebastopol, CA, USA: O'Reilly Media, 2017.

[8] I. Robinson, J. Webber, and E. Eifrem, *Graph Databases*, 2nd ed. Sebastopol, CA, USA: O'Reilly Media, 2015.

[9] C. Richardson, "Pattern: Transactional outbox," microservices.io. [Online]. Available: https://microservices.io/patterns/data/transactional-outbox.html. [Accessed: *fecha*].

[10] Goodreads. [Online]. Available: https://www.goodreads.com/. [Accessed: *fecha*].

[11] Letterboxd. [Online]. Available: https://letterboxd.com/. [Accessed: *fecha*].

---

## Revisión contra los criterios de INSTRUCCIONES POSTER

| Criterio | Dónde se cumple |
|---|---|
| Título específico, sin enumerar tecnologías ni prometer impactos | Título |
| Autores completos y afiliación | Autores y afiliación |
| Resumen: problema, objetivo, enfoque, solución y resultados | Resumen |
| Justificación sin apoyarse solo en "tres bases" | Justificación (valor de la aplicación) y Figura 3 |
| Metodología: modelado, responsabilidades, arquitectura, backend, integración y pruebas | Metodología, Figuras 2 a 5 |
| Resultados: implementado y verificado, con procedimiento; lo terminado frente a lo parcial | Resultados, Tablas 1 y 2, Figura 6 |
| Distinguir diseñado, implementado y validado; datos de prueba declarados | Tabla 2 y notas "datos de prueba" |
| Indicar funcionalidades incompletas | Cierre de Resultados |
| Conclusiones con limitaciones y mejoras justificadas | Conclusiones |
| Figuras y tablas con leyenda, fuente y explicadas en el texto | Cada figura y tabla |
| Referencias IEEE y citadas en el texto | Referencias [1] a [11], todas citadas |
| Poco texto, diagramas como protagonistas | Texto breve y 6 figuras |
| QR probado | **Pendiente: aún no hay destino** |

> NOTA: recuenta las cifras (84, 43, 5, 3, 16, 17) en `db/evidencias/relacional/resumen.txt` justo antes de imprimir, porque el Entregable 4 sigue corriendo y puede cambiarlas.
