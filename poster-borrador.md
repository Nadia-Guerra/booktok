# Borrador de contenido del póster ETEIA 2026

Texto por secciones para pasar a PowerPoint (formato recomendado: A1 vertical, 60 × 90 cm). Orden de la plantilla: columna izquierda con Introducción, Planteamiento y Justificación; columna derecha con Metodología y Resultados; Referencias al pie.

**Cómo leer este archivo**

- Lo que está bajo **Texto del póster** es lo que va tal cual (o casi) en el póster.
- Lo que está bajo **Figura / Tabla** describe qué dibujar, con su leyenda.
- Los bloques `NOTA` son para ti: no van en el póster.
- Todo lo que no está marcado como terminado está **sin validar**. Las instrucciones del ETEIA piden distinguir lo diseñado, lo implementado y lo validado (sección 5), y no atribuir mejoras que no se midieron.

**Estado de referencia de este borrador:** etapas 1 a 3 terminadas (propuesta, modelado y arquitectura). El Entregable 4 (implementación de las tres bases) está en curso y todavía no tiene resultados. Si antes de imprimir tienes evidencia de ejecución, actualiza la Tabla 3.

---

## Título

**Del Libro a la Pantalla: diseño de una plataforma social que sigue cada libro hasta su adaptación cinematográfica**

Alternativas, por si prefieres otra:

- La adaptación como relación central: modelo de datos para una red social de lectores y espectadores.
- De la novela a la película: conectar obras, personas y lectores con datos distribuidos y coordinados.

## Autores y afiliación

Nadia Guerra Cuessy, Horacio Irán Solís Cisneros (docente)

Ingeniería en Tecnologías de la Información e Innovación Digital, Universidad Politécnica de Chiapas, Tuxtla Gutiérrez, Chiapas, México

---

## Resumen

**Texto del póster**

Quienes leen y ven cine llevan su seguimiento en herramientas separadas, y ninguna trata la adaptación, es decir, el paso de un libro a su película, como relación central. Este trabajo diseña *Del Libro a la Pantalla*, una aplicación móvil social para registrar, reseñar y comparar libros y sus adaptaciones, y para descubrir obras a través de las conexiones entre autores, directores, actores y otros usuarios.

Siguiendo una metodología por etapas se definieron 27 requerimientos funcionales, 11 reglas de negocio y 10 requerimientos no funcionales. Se modelaron tres bases de datos con responsabilidades distintas (relacional, documental y de grafo), cada dato con una sola fuente de verdad y sincronización eventual entre bases, y se diseñó la arquitectura y el stack tecnológico.

A la fecha el diseño está completo y documentado (etapas 1 a 3). La implementación de las bases está en curso y aún no hay resultados de pruebas ni mediciones de rendimiento.

---

## Introducción

**Texto del póster**

Las personas que leen y ven películas suelen usar una aplicación para libros, otra para cine y notas sueltas. Cada una registra bien su propio medio, pero el vínculo entre ambos queda fuera: no es fácil saber qué películas provienen de un libro, comparar las dos versiones ni descubrir obras a partir de un autor, un director o un actor en común.

Este proyecto parte de esa carencia y toma la **adaptación** (libro → película) como relación central del dominio. Para identificar el problema se revisaron plataformas de seguimiento de lectura y de cine [10], [11] y se delimitó un alcance acotado: solo libros y películas, sin compra ni reproducción, sin mensajería y con un catálogo propio.

La naturaleza de los datos es mixta: operaciones que deben ser atómicas (reseñas, cuentas), fichas con estructura anidada y variable (ediciones, plataformas) y una red de conexiones entre personas y obras. Esa mezcla es la que motiva el uso de persistencia políglota [6], [7], con una base de grafos para los recorridos [8].

**Figura 1.** Contexto, problemática y solución (ver Planteamiento).

> NOTA (verifica antes de imprimir): la frase "se revisaron plataformas [10], [11]" solo es válida si de verdad las revisaste. Si no, quita esa oración y las dos referencias. Tampoco afirmes que "ninguna" plataforma trata la adaptación como relación central sin comprobarlo en cada una; el texto de arriba evita esa afirmación a propósito.
>
> NOTA: la plantilla pide "cómo otras personas lo atienden". Con una sola plataforma de libros y una de cine que hayas mirado (qué ofrecen y qué no) ya cumples.

---

## Planteamiento del problema

**Texto del póster**

**Situación.** El seguimiento de lecturas y películas está repartido en herramientas que no se comunican. La adaptación no es un dato de primera clase: no se puede preguntar qué películas salieron de un libro, ni comparar ambas versiones, ni explorar conexiones entre obras y personas.

**Usuarios afectados.**

| Usuario | Qué necesita hacer |
|---|---|
| Lector/espectador | Registrar lo que leyó o vio, reseñar, comparar libro y adaptación, armar listas, seguir a otros y descubrir adaptaciones |
| Administrador/curador | Mantener el catálogo (obras, personas, adaptaciones) y moderar reseñas |
| Visitante | Consultar el catálogo sin iniciar sesión |

**Consecuencias.**

- Las reseñas de un libro y de su película quedan aisladas y no se pueden comparar.
- El descubrimiento depende de búsquedas manuales, no de las conexiones entre autores, directores y actores.
- El usuario debe sostener su historial en varios lugares.

**Figura 1. Contexto, problemática y solución propuesta** (tres paneles, como en la plantilla)

- *Contexto:* lectores y espectadores; libros y películas.
- *Problemática:* apps separadas · la adaptación no se relaciona · reseñas aisladas · descubrimiento limitado.
- *Solución propuesta:* una aplicación móvil que coordina tres bases de datos mediante una API.

---

## Justificación

**Texto del póster**

La plataforma es pertinente porque su valor está en las **conexiones** (libro → película → personas → lectores), que las herramientas separadas no ofrecen. Además, el dominio tiene tres tipos de datos con necesidades distintas, y cada base se usa para lo que su modelo resuelve mejor. No se eligieron tres bases para cumplir un requisito: se comprobó qué capacidad se pierde si se quita cada una (Tabla 1).

**Tabla 1. Prueba de eliminación: qué se pierde si se quita cada base**

| Si se quita… | Se pierde o empeora… |
|---|---|
| **Relacional** | Atomicidad de publicar reseña + estado + promedio; cascada al borrar una cuenta sin dejar registros huérfanos; unicidad y rangos (una reseña por usuario y obra, calificación de 1 a 5) |
| **Documental** | Leer la ficha completa de una obra en una consulta; ediciones y plataformas anidadas y de campos distintos por tipo; la reseña comparativa con aspectos de número y nombre libres |
| **Grafo** | Recorridos de longitud variable (camino entre un autor y un actor a través de adaptaciones) y las recomendaciones por adaptaciones y por lo que leen las personas que se siguen |

**Alternativa más fuerte que se evaluó:** "todo en PostgreSQL" (JSONB para fichas y consultas recursivas para caminos). Funcionaría para un sistema pequeño, pero obligaría a imitar un grafo con una tabla de aristas y a leer las fichas sin ventaja de modelo. Se reconoce como objeción válida.

> NOTA: no escribas "mejora" ni "optimiza" en esta sección. Es un valor esperado del diseño, no un resultado medido.
>
> NOTA: la plantilla muestra aquí una figura de cuatro cuadros. Puedes hacer lo mismo con: (1) relación libro → adaptación como núcleo, (2) integridad en cuentas y reseñas, (3) fichas flexibles, (4) exploración por conexiones. Es contenido, no resultados.

---

## Metodología

### 1. Etapas del proyecto

**Texto del póster**

El trabajo avanza por etapas, y cada una produce la evidencia que usa la siguiente. Se evitó programar las bases antes de definir problema, usuarios, requerimientos y modelo.

**Figura 2. Etapas del proyecto y su estado** (diagrama de flujo con colores de estado)

| Etapa | Entregable | Estado |
|---|---|---|
| 1 | Propuesta de aplicación | Terminada |
| 2 | Modelado de datos (conceptual y de las tres bases) | Terminada |
| 3 | Arquitectura y selección tecnológica | Terminada |
| 4 | Implementación de las tres bases | En curso |
| 5 | Catálogo de operaciones y consultas | Pendiente |
| 6 | Backend y API | Pendiente |
| 7 | Aplicación e integración | Pendiente |
| 8 | Pruebas, documentación y despliegue | Pendiente |

### 2. Arquitectura y tecnologías

**Texto del póster**

La aplicación móvil nunca se conecta a las bases. Habla con una **API** de un solo proceso organizada en tres capas: rutas (sesión, rol y formato), servicios (reglas de negocio y orden de las operaciones) y repositorios (uno por base). Un *worker* dentro de la API propaga los cambios entre bases.

**Figura 3. Arquitectura de la aplicación** (diagrama de componentes)

- Teléfono Android: app React Native + Expo.
- Flecha por HTTPS con token a la API.
- API (Node + Express + TypeScript): Rutas → Servicios → Repositorios; worker de sincronización; comando de reconciliación.
- Tres bases: PostgreSQL, MongoDB, Neo4j Community.
- Todo en contenedores con Docker Compose.

**Tecnologías elegidas**

| Componente | Tecnología | Razón principal |
|---|---|---|
| App móvil | React Native con Expo (TypeScript) | Experiencia previa y prueba rápida en teléfono real |
| API | Node + Express + TypeScript | Un solo lenguaje para app y API; drivers oficiales de las tres bases |
| Validación | Zod | Cubre lo que Neo4j Community no impone y se comparte con la app |
| Relacional | PostgreSQL | UUID, ENUM, CHECK, triggers y bloqueo de fila nativos |
| Documental | MongoDB | Documentos anidados, validador e índices necesarios para el diseño |
| Grafo | Neo4j Community | Recorridos y patrones en Cypher; edición gratuita |
| Sesión | Token con hash en PostgreSQL; contraseñas con Argon2id (o bcrypt) | Cierra sesión de verdad y la cascada de eliminar cuenta la invalida sola |
| Despliegue | Docker Compose con límites de memoria | Misma composición en cualquier máquina |

> NOTA: el stack se comparó con alternativas (Kotlin nativo, Flutter + Python, Fastify, NestJS, MySQL). Si te sobra espacio, una línea basta: "Se compararon tres combinaciones de cliente y API y dos motores relacionales; ganó la de menor riesgo con el plazo".

### 3. Responsabilidades de cada base

**Texto del póster**

Las tres bases comparten solo dos identificadores, `obra_id` y `usuario_id` (mismo UUID en las tres). Cada una responde a una pregunta distinta.

**Figura 4. Tres modelos, tres preguntas** (figura de tres paneles)

*Panel A. Relacional: "¿es válido y consistente este dato?"* 9 tablas.
Mini diagrama entidad-relación con: `usuario` 1—N `resena` N—1 `obra_resumen` (promedio y total); `usuario` 1—N `estado_obra`; `usuario` 1—N `lista` 1—N `elemento_lista`; `usuario` N—N `usuario` mediante `seguimiento`. Aparte, las tablas técnicas `sync_outbox` y `sesion`.
Reglas: una reseña por usuario y obra, calificación de 1 a 5, nadie se sigue a sí mismo, borrado en cascada.

*Panel B. Documental: "¿cómo se ve esta obra o esta comparación completa?"* 3 colecciones: `libros`, `peliculas` y `resenas_comparativas`.
Ejemplo ilustrativo de estructura (los valores son marcadores, no datos reales):

```json
{
  "_id": "uuid",
  "titulo": "…",
  "sinopsis": "…",
  "generos": ["…"],
  "anio_publicacion_original": 0,
  "ediciones": [
    { "edicion_id": "uuid", "isbn": "… (opcional)",
      "paginas": 0, "editorial": "…", "idioma": "…", "anio": 0 }
  ],
  "estado_publicacion": "borrador | publicada"
}
```

Reglas: validador estricto, ISBN opcional y único, índice único (usuario, libro, película) en la comparativa.

*Panel C. Grafo: "¿cómo se conectan estas personas y obras?"* 4 tipos de nodo y 6 de relación.
Dibujar nodos Persona, Libro, Película y Usuario con: Persona –escribió→ Libro, Libro –adaptado_a→ Película, Película –dirigida_por→ Persona, Persona –actuó_en→ Película; y Usuario –sigue→ Usuario, Usuario –leyó→ Libro.
Recorrido de ejemplo (estructura, no resultado): Autor → Libro → Película ← Actor.

**Figura 4.** Responsabilidad de cada base y su modelo. Los valores del Panel B son ilustrativos.

### 4. Fuente de verdad y sincronización

**Texto del póster**

Cada dato se modifica oficialmente en **una sola base**; las demás guardan copias para evitar consultas encadenadas. Se escribe primero en la fuente y luego en la copia, con reintento. Los cambios del relacional hacia las otras bases salen por una tabla `sync_outbox` que se escribe **en la misma transacción** que el dato; un proceso único los aplica en orden y de forma idempotente. Las copias nunca se editan a mano y un script de reconciliación las reconstruye desde la fuente.

**Figura 5. Sincronización entre bases** (cada flecha va de la fuente a la copia)

| Flecha | Qué viaja | Para qué |
|---|---|---|
| Relacional → Grafo | Nodo Usuario, `sigue`, `leyó` (solo libros) | Recorridos sociales y recomendaciones |
| Documental → Relacional y Grafo | Id y tipo de la obra | Llaves foráneas y anclas del grafo |
| Grafo → Documental | Reparto con foto de cada actor | Ficha de película completa en una lectura |
| Relacional → Documental | Evento de eliminación de usuario | Borrar sus reseñas comparativas |

El promedio de cada obra vive en el relacional (`obra_resumen`) y se actualiza en la misma transacción que la reseña, por lo que no necesita sincronización.

**Tabla 2. Qué pasa si una operación falla a medias**

| Operación | Si falla… | Política |
|---|---|---|
| Publicar reseña | La transacción relacional falla | Rollback: nada cambió |
| Publicar reseña | Se confirma, pero falla la propagación al grafo | Reseña y promedio correctos; la recomendación aún no incluye esa lectura. Reintento con límite y, si se agota, evento `fallido` para reconciliación |
| Alta de obra | Falla tras crear la ficha | La ficha queda en `borrador` y no se muestra; se completan los pasos pendientes |
| Eliminar cuenta | Falla la limpieza en otra base | La cuenta ya no existe; los restos no son visibles porque la API los filtra; se reintenta y la reconciliación los detecta |

**Limitación reconocida:** entre bases distintas no hay transacción atómica. La consistencia fuerte solo se garantiza dentro de cada base; entre bases es eventual.

### 5. Estrategia de pruebas (planeada, aún no ejecutada)

**Texto del póster**

- Relacional: 17 pruebas de integridad y transacciones (rollback de la reseña, cascada, promedio, unicidad, concurrencia).
- Documental: documentos válidos e inválidos, e índices.
- Grafo: restricciones de unicidad y cardinalidad de las seis relaciones.
- Entre bases: script de coherencia (ids, reparto, `sigue`, `leyó`, promedios) y caso integrado de extremo a extremo.

> NOTA: esta es la única subsección donde el verbo es "planeada". No la presentes como hecha.

---

## Resultados

**Texto del póster**

Hasta ahora los resultados son del **diseño**: el modelo está completo, documentado y es consistente entre sus partes. La implementación de las tres bases está en curso. No se presentan mediciones de rendimiento ni resultados de pruebas porque todavía no existen.

**Tabla 3. Estado de cada componente** (distingue lo diseñado, lo implementado y lo validado)

| Componente | Diseñado | Implementado | Validado |
|---|---|---|---|
| Requerimientos (27 RF, 11 RN, 10 RNF) | Sí | No aplica | Revisión cruzada entre documentos |
| Modelo relacional (9 tablas) | Sí | En curso | Pendiente (17 pruebas escritas, sin ejecutar) |
| Modelo documental (3 colecciones) | Sí | En curso | Parcial: índice único *sparse* del ISBN y pruebas 22 a 26 del validador, ejecutados en MongoDB 9.0.4 |
| Modelo de grafo (4 nodos, 6 relaciones, 24 consultas) | Sí | En curso | Pendiente |
| Arquitectura y stack | Sí | No | Pendiente (límites de memoria estimados, no medidos) |
| Sincronización (bandeja de salida y reconciliación) | Sí | No | Pendiente |
| API y aplicación móvil | Sí (responsabilidades y capas) | No | Pendiente |

**Hallazgos del trabajo realizado**

- **Corrección con prueba en motor real.** El diseño usaba un índice único *parcial* para el ISBN opcional. Al probarlo en MongoDB 9.0.4 falló: un segundo libro con una edición con ISBN y otra sin él producía clave duplicada. Se corrigió a un índice único *sparse*, que admite esos casos y sigue rechazando el mismo ISBN en otro libro.
- **Seis huecos detectados al cruzar los documentos** (por ejemplo, ningún documento decía qué base manda sobre la identidad de una obra, y las reseñas no tenían a qué apuntar en el relacional). Cada uno se resolvió comparando alternativas con criterios explícitos.
- **Trazabilidad.** Cada requerimiento está asignado a una base y la prueba de eliminación (Tabla 1) lo respalda.

**Limitaciones identificadas**

- Sin transacción entre bases: la consistencia entre ellas es eventual.
- El documental es la justificación más delicada: con los campos actuales de las ediciones, una tabla hija en SQL también serviría. Se apoya en la reseña comparativa de estructura libre.
- Solo el camino entre dos personas u obras tiene longitud verdaderamente variable; las demás consultas de grafo tienen profundidad fija.
- El catálogo es acotado, por diseño.
- Aún no hay API, aplicación ni mediciones.

**Continuidad**

Implementar y probar las tres bases desde cero con una semilla coherente (etapa 4); documentar el catálogo de operaciones con evidencia de ejecución (5); construir la API y la aplicación (6 y 7); y evaluar consistencia y rendimiento con condiciones documentadas (8). El caso integrado previsto es *seguir a un lector y ver recomendaciones de películas*, que recorre las tres bases.

> NOTA: la plantilla muestra gráficas de rendimiento, escalabilidad y clasificación. **No pongas gráficas** si no hay datos medidos: las instrucciones lo prohíben expresamente. La Tabla 3 ocupa ese espacio.
>
> NOTA: si el Entregable 4 produce evidencia antes de imprimir (por ejemplo, "las tres bases levantan desde cero" o "pasaron N de 17 pruebas relacionales"), cambia la celda correspondiente de la Tabla 3 de "En curso" a la evidencia real, con la salida guardada. Incluye solo lo que de verdad ejecutaste.

---

## Conclusiones

**Texto del póster**

- Se logró un diseño completo y coherente de una plataforma donde la adaptación es la relación central, con tres bases de datos justificadas por necesidades distintas (transacciones, documentos anidados y conexiones) y una fuente de verdad por dato.
- La prueba de eliminación y la comparación de alternativas, incluida "todo en PostgreSQL", sostienen la elección de cada base; el documental es el punto más débil y se reconoce.
- Se identificó y documentó el riesgo central de la integración: sin transacción entre bases, una operación puede fallar a medias. Se mitiga con bandeja de salida, reintento y reconciliación, pero esa mitigación **aún no está probada**.
- El valor del diseño solo se podrá afirmar cuando se implementen y prueben las bases y la API (etapas 4 a 8).

---

## Referencias

Las cinco primeras vienen de la plantilla. Las demás son propuestas mías: **verifica autores, año, editorial y URL antes de imprimir**, y pon tú la fecha de acceso real de las páginas web.

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

> NOTA: [9] respalda el mecanismo de la bandeja de salida. Para usarla, cítala en la subsección "Fuente de verdad y sincronización" (por ejemplo, "…mediante una bandeja de salida [9]"). Hoy ese texto no la cita, así que o la agregas ahí o la quitas de la lista.
>
> NOTA: [10] y [11] solo si las revisaste (ver nota de la Introducción).

---

## Lista de revisión antes de entregar (de las instrucciones del ETEIA)

- [ ] El título describe el aporte y no repite una fórmula común.
- [ ] Autores y afiliación completos.
- [ ] El resumen coincide con el contenido (si cambias la Tabla 3, ajusta el último párrafo del resumen).
- [ ] Las responsabilidades de las tres bases están explicadas y justificadas.
- [ ] Los resultados provienen de entregables y pruebas reales: nada medido que no se midió.
- [ ] Cada figura y tabla tiene leyenda y se explica en el texto.
- [ ] Referencias completas y citadas en el texto.
- [ ] QR y enlaces probados (todavía sin destino).
- [ ] Exposición oral preparada: 5 a 7 minutos más preguntas.
