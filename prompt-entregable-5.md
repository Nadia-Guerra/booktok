Vamos a trabajar el Entregable 5 (Catálogo de operaciones y consultas) del proyecto. Los entregables 1 a 4 están hechos y commiteados: las tres bases corren con `.\db\scripts\reconstruir.ps1`, tienen semilla y pruebas con evidencia en db/evidencias/.

Confírmame que entendiste antes de hacer nada. Después sigue por escalones y enséñame el resultado de cada uno antes de pasar al siguiente.

## Qué pide el entregable (guía del curso, sección 7.5)
Cada operación debe documentarse con:
1. Identificador y propósito.
2. Base o bases que intervienen.
3. Parámetros de entrada y validaciones.
4. Resultado esperado y formato de salida.
5. Casos normales, límite y de error.
6. Evidencia de ejecución y resultado obtenido.
El catálogo debe incluir operaciones que demuestren el uso de los tres modelos y operaciones integradas que requieran consultar más de una base cuando el caso de uso lo demande.

## Lee primero, en este orden
1. Guia_Proyecto_Final_Bases_Datos.pdf, sección 7.5 y lo que diga sobre formato y criterios de evaluación.
2. docs/requerimientos
3. docs/entregables/entregable-4-brief.md, secciones 9 (reglas del entorno), 11 y 12 (qué debe dejar el entregable 4 para el 5).
4. docs/modelado/relacional/04-operaciones.md (O1 a O23), docs/modelado/documental/01-patrones-de-acceso.md (AP) y docs/modelado/grafo/01-consultas-y-entidades.md (CG), con sus consultas en db/grafo/consultas/.
5. docs/arquitectura/04-fuente-de-verdad-y-sincronizacion.md (secciones 4 a 8) y docs/modelado/matriz-responsabilidades.md: de ahí salen las operaciones integradas.
6. docs/decisiones_tomadas.md (en especial D-24, D-36, D-38 a D-48), db/README.md, db/semilla/README.md y db/evidencias/**.

## Estado que debes conocer
- Todavía NO hay API ni worker de sincronización (son los entregables 6 y 7). Las operaciones integradas se demuestran con scripts que orquestan las bases directamente. Lo que dependa del worker (propagar `sync_outbox` al grafo, por ejemplo) solo se puede simular: etiquétalo como "simulado" y explica qué parte es real y cuál no. No inventes resultados.
- La evidencia que ya existe cubre solo una parte: O17, O18, O20, O22; AP-01 a AP-05, AP-21, AP-23; CG-01 a CG-10 y CG-21 a CG-23. Las operaciones de escritura, la cascada de RF-04 y CG-14 a CG-19 no tienen salida guardada.
- Ejecutores existentes: db/scripts/probar-*.ps1, cargar-semilla.ps1, coherencia.ps1, reconstruir.ps1. Las pruebas de db/*/pruebas/ (salvo las "semilla") crean y BORRAN sus datos; probar-grafo.ps1 vacía el grafo entero. La semilla (db/semilla/) debe quedar intacta al terminar: usa transacciones con ROLLBACK, la base aparte dlbp_pruebas, o limpia lo que crees, y termina comprobando con .\db\scripts\coherencia.ps1.

## Escalones
1. Inventario. Una tabla con TODAS las operaciones vigentes (O, AP y CG, sin las retiradas) y las integradas que propongas (mínimo 5, por ejemplo: alta de obra con borrador a publicada (D-24); publicar una reseña con transacción y promedio más ficha con promedio; RF-26 con O18 + CG-08 + AP-04; RF-27 con CG-09 + AP-04; comparativa con validación de la adaptación (CG-10 + AP-05 + escritura en MongoDB); eliminar una cuenta con cascada; reparto con foto del grafo a la ficha). Indica para cada una qué evidencia tiene hoy y cuál falta. Pregúntame el alcance y el formato de entrega (¿Markdown, Word, PDF?) antes de seguir.
2. Evidencia. Scripts nuevos (db/scripts/, PowerShell 5.1) que ejecuten las operaciones que faltan, con casos normales, límite y de error (por ejemplo: la restricción exacta que rechaza, el código 121 del validador de MongoDB, resultados vacíos en el grafo) y guarden la salida real en db/evidencias/catalogo/. Un identificador de caso por ejecución (por ejemplo O5-n1, O5-e1) para poder citarlo.
3. Catálogo. docs/entregables/entregable-5-catalogo.md con una ficha por operación con exactamente los seis puntos de la guía, en una plantilla fija. No copies las consultas enteras de los documentos de modelado: enlázalas. Cada "resultado obtenido" cita el archivo de evidencia y el caso; nada escrito a mano.
4. Revisión cruzada. Comprueba que cada operación del catálogo tiene evidencia, que los casos citados existen y que las cifras coinciden. Ejecuta coherencia.ps1 y confirma que la semilla quedó intacta.

## Reglas importantes
- No rediseñes. Si algo de los documentos choca con el motor real, compruébalo, explícalo y registra una decisión nueva (D-49 en adelante) en docs/decisiones_tomadas.md. Relee cada archivo de docs/ justo antes de editarlo, porque otro chat puede estar tocándolo.
- Memoria: 6 GB de RAM y Docker con unos 3 GB. No lances varias JVM a la vez (cypher-shell por el contenedor neo4j-cliente; un solo mongosh por archivo). Neo4j va al 82 % de su tope.
- Windows PowerShell 5.1: los .ps1 van sin tildes (o con BOM). Canalizar texto por PowerShell antepone un BOM: ejecuta los scripts desde /db dentro de los contenedores. Los scripts con barras invertidas o expresiones regulares se escriben con la herramienta de escritura, nunca con heredoc de Bash.
- No cambies de rama, no hagas push y haz commits solo si te lo pido. Ningún secreto en el repositorio.
- Si una operación falla o no se pudo ejecutar, dilo con la salida real. No marques como hecho lo que no corriste.

## Al terminar cada escalón (y al final) muéstrame
Qué se ejecutó, cuánto tardó, qué falló y qué queda pendiente, cada pendiente con su contexto y un ejemplo (no filas escuetas). Al final, además, cuántas operaciones documentadas por base y cuántas integradas, y cuáles solo se pudieron simular. No pases al Entregable 6.