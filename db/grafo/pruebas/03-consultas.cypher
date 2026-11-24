// =============================================================================
// Consultas funcionales del grafo sobre datos de prueba con la forma de los escenarios de RF-24 y RF-25.
// Fuente: docs/modelado/grafo/01-consultas-y-entidades.md. Las consultas de recomendación (CG-08, CG-09) y
// las de reconciliación por lotes (CG-21, CG-23) se prueban con la semilla (escalón 5).
//
// Datos (ficticios):
//   Frank Herbert (@P1) escribió Dune (@L1)        Dune -> Dune 2021 (@F1) y Dune parte dos (@F2)
//   Philip K. Dick (@P5) escribió Sueñan... (@L4)  Sueñan... -> Blade Runner 2049 (@F4)
//   Tolkien (@P2) escribió El hobbit (@L2)          El hobbit -> Un viaje inesperado (@F3)
//   Denis Villeneuve (@P3) dirige @F1, @F2 y @F4    Peter Jackson (@P4) dirige @F3
//   Chalamet (@P7) y Ferguson (@P8) actúan en @F1 y @F2; McKellen (@P9) en @F3; Gosling (@P10) en @F4
// =============================================================================

// @prueba Q-00 | Consultas funcionales de catálogo y exploración
CREATE (herbert:Persona {persona_id: '@P1', nombre: 'Frank Herbert'}),
       (tolkien:Persona {persona_id: '@P2', nombre: 'J. R. R. Tolkien', foto_url: 'https://almacenamiento.ejemplo.com/personas/tolkien.jpg'}),
       (denis:Persona {persona_id: '@P3', nombre: 'Denis Villeneuve'}),
       (jackson:Persona {persona_id: '@P4', nombre: 'Peter Jackson'}),
       (dick:Persona {persona_id: '@P5', nombre: 'Philip K. Dick'}),
       (chalamet:Persona {persona_id: '@P7', nombre: 'Timothée Chalamet', foto_url: 'https://almacenamiento.ejemplo.com/personas/chalamet.jpg'}),
       (ferguson:Persona {persona_id: '@P8', nombre: 'Rebecca Ferguson'}),
       (mckellen:Persona {persona_id: '@P9', nombre: 'Ian McKellen'}),
       (gosling:Persona {persona_id: '@P10', nombre: 'Ryan Gosling'}),
       (dune:Libro {obra_id: '@L1'}), (hobbit:Libro {obra_id: '@L2'}), (androides:Libro {obra_id: '@L4'}),
       (f1:`Película` {obra_id: '@F1'}), (f2:`Película` {obra_id: '@F2'}), (f3:`Película` {obra_id: '@F3'}), (f4:`Película` {obra_id: '@F4'})
CREATE (herbert)-[:escribió]->(dune), (tolkien)-[:escribió]->(hobbit), (dick)-[:escribió]->(androides),
       (dune)-[:adaptado_a]->(f1), (dune)-[:adaptado_a]->(f2), (hobbit)-[:adaptado_a]->(f3), (androides)-[:adaptado_a]->(f4),
       (f1)-[:dirigida_por]->(denis), (f2)-[:dirigida_por]->(denis), (f4)-[:dirigida_por]->(denis), (f3)-[:dirigida_por]->(jackson),
       (chalamet)-[:`actuó_en` {personaje: 'Paul Atreides', orden: 1}]->(f1), (ferguson)-[:`actuó_en` {personaje: 'Lady Jessica', orden: 2}]->(f1),
       (chalamet)-[:`actuó_en` {personaje: 'Paul Atreides', orden: 1}]->(f2), (ferguson)-[:`actuó_en` {personaje: 'Lady Jessica', orden: 2}]->(f2),
       (mckellen)-[:`actuó_en` {personaje: 'Gandalf', orden: 1}]->(f3), (gosling)-[:`actuó_en` {personaje: 'K', orden: 1}]->(f4);
// @espera ok

// ---- CG-01 y CG-02: búsqueda por nombre -----------------------------------------------------
// @paso CG-01: buscar 'villeneuve' devuelve las 3 películas que dirigió, con el vínculo dirigida_por
// @param texto = "villeneuve"
CALL {
// @incluir CG-01.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT vinculo)) + '|' + head(collect(DISTINCT vinculo)) + '|' + head(collect(DISTINCT tipo));
// @espera valor 3|1|dirigida_por|pelicula
// @paso CG-01: buscar 'chalamet' sin tilde ni mayúsculas: sus 2 películas por actuó_en, con su foto_url
// @param texto = "CHALAMET"
// @incluir CG-01.cypher
// @espera filas 2
// @paso CG-01: buscar 'herbert' devuelve el libro que escribió
// @param texto = "herbert"
CALL {
// @incluir CG-01.cypher
}
RETURN obra_id + '|' + tipo + '|' + vinculo;
// @espera valor @L1|libro|escribió
// @paso CG-01: un nombre inexistente no devuelve nada
// @param texto = "inexistente"
// @incluir CG-01.cypher
// @espera filas 0
// @paso CG-02: buscar 'tolkien' devuelve la persona con su foto_url (ayuda a distinguir homónimos)
// @param texto = "tolkien"
CALL {
// @incluir CG-02.cypher
}
RETURN persona_id + '|' + nombre + '|' + foto_url;
// @espera valor @P2|J. R. R. Tolkien|https://almacenamiento.ejemplo.com/personas/tolkien.jpg

// ---- CG-05: autores y directores ----------------------------------------------------------------
// @paso CG-05 de un libro devuelve su autor
// @param obra_id = "@L1"
CALL {
// @incluir CG-05.cypher
}
RETURN nombre;
// @espera valor Frank Herbert
// @paso CG-05 de una película devuelve su director
// @param obra_id = "@F4"
CALL {
// @incluir CG-05.cypher
}
RETURN nombre;
// @espera valor Denis Villeneuve

// ---- CG-06 (RF-24): caminos más cortos ------------------------------------------------------------
// @paso RF-24: de un autor a un actor, 3 saltos y MÁS DE UNA ruta más corta (Herbert -> Dune -> {F1, F2} -> Chalamet)
// @param origen_id = "@P1"
// @param destino_id = "@P7"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(min(size(relaciones))) + '|' + toString(max(size(relaciones)));
// @espera valor 2|3|3
// @paso RF-24: el camino lleva los tipos de relación en orden: escribió, adaptado_a, actuó_en
// @param origen_id = "@P1"
// @param destino_id = "@P7"
CALL {
// @incluir CG-06.cypher
}
WITH relaciones LIMIT 1
RETURN reduce(s = '', t IN relaciones | s + CASE WHEN s = '' THEN '' ELSE ',' END + t);
// @espera valor escribió,adaptado_a,actuó_en
// @paso RF-24: cada nodo trae tipo, id y, en las personas, nombre
// @param origen_id = "@P1"
// @param destino_id = "@P7"
CALL {
// @incluir CG-06.cypher
}
WITH nodos LIMIT 1
RETURN nodos[0].tipo + ':' + nodos[0].nombre + ' ... ' + nodos[3].tipo + ':' + nodos[3].nombre;
// @espera valor Persona:Frank Herbert ... Persona:Timothée Chalamet
// @paso RF-24: entre obras: de un libro a otro por el director común (Dune -> F1 -> Villeneuve -> F4 -> Sueñan...)
// @param origen_id = "@L1"
// @param destino_id = "@L4"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(min(size(relaciones)));
// @espera valor 2|4
// @paso RF-24: dos nodos sin conexión (otra parte del grafo) no devuelven ningún camino
// @param origen_id = "@P1"
// @param destino_id = "@P4"
// @incluir CG-06.cypher
// @espera filas 0
// @paso RF-24: un origen inexistente no devuelve nada ni falla
// @param origen_id = "@P99"
// @param destino_id = "@P4"
// @incluir CG-06.cypher
// @espera filas 0

// ---- CG-07 (RF-25) --------------------------------------------------------------------------------
// @paso RF-25: Villeneuve adaptó libros de DOS autores (Herbert y Dick): 3 filas, 2 autores distintos
// @param director_id = "@P3"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 3|2
// @paso RF-25: Jackson adaptó libros de un solo autor
// @param director_id = "@P4"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 1|1

// ---- CG-10, CG-20, CG-22, CG-25 -----------------------------------------------------------------------
// @paso CG-10: Dune y Dune 2021 están unidos por una adaptación
// @param libro_id = "@L1"
// @param pelicula_id = "@F1"
// @incluir CG-10.cypher
// @espera valor true
// @paso CG-10: Dune y Un viaje inesperado no están unidos (RN-06 rechazaría la comparativa)
// @param libro_id = "@L1"
// @param pelicula_id = "@F3"
// @incluir CG-10.cypher
// @espera valor false
// @paso CG-20: el reparto de Dune 2021 sale ordenado por `orden`, con personaje y foto
// @param pelicula_id = "@F1"
CALL {
// @incluir CG-20.cypher
}
RETURN reduce(s = '', r IN collect(toString(orden) + ':' + nombre + ':' + personaje) | CASE WHEN s = '' THEN r ELSE s + ' | ' + r END);
// @espera valor 1:Timothée Chalamet:Paul Atreides | 2:Rebecca Ferguson:Lady Jessica
// @paso CG-22: cuenta autores y adaptaciones de cada libro (Dune: 1 autor y 2 adaptaciones)
CALL {
// @incluir CG-22.cypher
}
WITH * WHERE tipo = 'libro' AND obra_id = '@L1'
RETURN toString(n1) + '|' + toString(n2);
// @espera valor 1|2
// @paso CG-22: cuenta libro, directores y reparto de cada película (Dune 2021: 1 libro, 1 director, 2 actores)
CALL {
// @incluir CG-22.cypher
}
WITH * WHERE tipo = 'pelicula' AND obra_id = '@F1'
RETURN toString(n1) + '|' + toString(n2) + '|' + toString(n3);
// @espera valor 1|1|2
// @paso CG-22: las 3 + 4 obras del grafo, todas con el mínimo (ninguna señalada)
CALL {
// @incluir CG-22.cypher
}
WITH * WHERE (tipo = 'libro' AND (n1 < 1 OR n2 < 1)) OR (tipo = 'pelicula' AND (n1 <> 1 OR n2 < 1 OR n3 < 1))
RETURN toString(count(*));
// @espera valor 0
// @paso CG-25: Chalamet actuó en 2 películas (las que hay que regenerar si cambia su foto)
// @param persona_id = "@P7"
// @incluir CG-25.cypher
// @espera filas 2
// @paso CG-24 + CG-25 + CG-20: al cambiar la foto, el reparto leído refleja la foto nueva
// @param persona_id = "@P8"
// @param foto_url = "https://almacenamiento.ejemplo.com/personas/ferguson.jpg"
// @incluir CG-24.cypher
// @espera ok
// @param pelicula_id = "@F2"
CALL {
// @incluir CG-20.cypher
}
WITH * WHERE persona_id = '@P8'
RETURN foto_url;
// @espera valor https://almacenamiento.ejemplo.com/personas/ferguson.jpg
