// =============================================================================
// Pruebas de cardinalidad del grafo. Fuente: docs/modelado/grafo/05-cardinalidad.md
// Neo4j no limita cuántas relaciones tiene un nodo: la cardinalidad la imponen las escrituras (MERGE, CG-14,
// CG-15) y la verifica la reconciliación (CG-22). Aquí se comprueba ambas cosas sobre datos concretos.
// Atajos: @P personas, @L libros, @F películas, @U usuarios.
// =============================================================================

// @prueba K-01 | Ejemplo de 05, sección 3.1: El hobbit tiene tres películas y cada una un solo libro de origen
CREATE (l:Libro {obra_id: '@L1'}), (f1:`Película` {obra_id: '@F1'}), (f2:`Película` {obra_id: '@F2'}), (f3:`Película` {obra_id: '@F3'}),
       (pj:Persona {persona_id: '@P1', nombre: 'Peter Jackson'}), (ian:Persona {persona_id: '@P2', nombre: 'Ian McKellen'}),
       (jrr:Persona {persona_id: '@P3', nombre: 'J. R. R. Tolkien'})
CREATE (jrr)-[:escribió]->(l), (l)-[:adaptado_a]->(f1), (l)-[:adaptado_a]->(f2), (l)-[:adaptado_a]->(f3),
       (f1)-[:dirigida_por]->(pj), (f2)-[:dirigida_por]->(pj), (f3)-[:dirigida_por]->(pj),
       (ian)-[:`actuó_en` {personaje: 'Gandalf', orden: 1}]->(f1),
       (ian)-[:`actuó_en` {personaje: 'Gandalf', orden: 1}]->(f2),
       (ian)-[:`actuó_en` {personaje: 'Gandalf', orden: 1}]->(f3);
// @espera ok
// @paso Un libro puede tener varias adaptaciones (CG-03): tres
// @param libro_id = "@L1"
// @incluir CG-03.cypher
// @espera filas 3
// @paso Una película tiene exactamente un libro de origen: mínimo y máximo de libros por película
MATCH (f:`Película`) OPTIONAL MATCH (l:Libro)-[:adaptado_a]->(f) WITH f, count(l) AS n RETURN toString(min(n)) + '|' + toString(max(n));
// @espera valor 1|1
// @paso CG-04 devuelve exactamente un libro para una película con origen
// @param pelicula_id = "@F2"
// @incluir CG-04.cypher
// @espera filas 1
// @paso Una persona dirige varias películas: Peter Jackson tiene tres dirigida_por
MATCH (:`Película`)-[r:dirigida_por]->(:Persona {persona_id: '@P1'}) RETURN toString(count(r));
// @espera valor 3
// @paso Un actor aparece en varias películas del mismo libro: tres actuó_en, una con cada película
MATCH (:Persona {persona_id: '@P2'})-[r:`actuó_en`]->(f) RETURN toString(count(r)) + '|' + toString(count(DISTINCT f));
// @espera valor 3|3

// @prueba K-02 | D-19: una sola actuó_en por persona y película; la segunda se rechaza y no sobrescribe el personaje
CREATE (:Persona {persona_id: '@P1', nombre: 'Ian McKellen'}), (:`Película` {obra_id: '@F1'});
// @espera ok
// @paso Primera actuó_en (CG-14): se crea
// @param persona_id = "@P1"
// @param obra_id = "@F1"
// @param personaje = "Gandalf"
// @param orden = 1
// @incluir CG-14-actuo.cypher
// @espera filas 1
// @paso Segunda del mismo par, con otro personaje y orden: se rechaza (ninguna fila)
// @param persona_id = "@P1"
// @param obra_id = "@F1"
// @param personaje = "Otro personaje"
// @param orden = 2
// @incluir CG-14-actuo.cypher
// @espera filas 0
// @paso Queda una relación, con el personaje original
MATCH (:Persona)-[r:`actuó_en`]->(:`Película`)
WITH count(r) AS n, collect(r.personaje)[0] AS personaje, collect(r.orden)[0] AS orden
RETURN toString(n) + '|' + personaje + '|' + toString(orden);
// @espera valor 1|Gandalf|1

// @prueba K-03 | El reparto tiene como máximo 300 personas (CG-14): la 301 se rechaza
CREATE (:`Película` {obra_id: '@F1'}), (:Persona {persona_id: '@P1', nombre: 'Persona 300'}), (:Persona {persona_id: '@P2', nombre: 'Persona 301'});
// @espera ok
MATCH (f:`Película` {obra_id: '@F1'})
UNWIND range(1, 299) AS i
CREATE (:Persona {persona_id: '00000000-0000-4000-8000-5' + right('00000000000' + toString(i), 11), nombre: 'Actor ' + toString(i)})-[:`actuó_en` {personaje: 'Personaje', orden: i}]->(f);
// @espera ok
// @paso Con 299 en el reparto, la persona 300 sí entra
// @param persona_id = "@P1"
// @param obra_id = "@F1"
// @param personaje = "Personaje 300"
// @param orden = 300
// @incluir CG-14-actuo.cypher
// @espera filas 1
// @paso Con 300 en el reparto, la 301 se rechaza
// @param persona_id = "@P2"
// @param obra_id = "@F1"
// @param personaje = "Personaje 301"
// @param orden = 301
// @incluir CG-14-actuo.cypher
// @espera filas 0
// @paso El reparto quedó en exactamente 300
MATCH (:Persona)-[r:`actuó_en`]->(:`Película` {obra_id: '@F1'}) RETURN toString(count(r));
// @espera valor 300

// @prueba K-04 | 05, sección 3.2: una persona dirigió y actuó en la misma película => dos relaciones de tipos distintos
CREATE (p:Persona {persona_id: '@P1', nombre: 'Orson'}), (f:`Película` {obra_id: '@F1'})
CREATE (f)-[:dirigida_por]->(p), (p)-[:`actuó_en` {personaje: 'Charles Foster Kane', orden: 1}]->(f);
// @espera ok
// @paso Hay dos relaciones entre los mismos nodos, de tipos distintos
MATCH (:Persona {persona_id: '@P1'})-[r]-(:`Película` {obra_id: '@F1'}) RETURN toString(count(r)) + '|' + toString(count(DISTINCT type(r)));
// @espera valor 2|2
// @paso RF-24 (CG-06) devuelve dos caminos entre ellos, uno por cada tipo, porque son conexiones distintas
// @param origen_id = "@P1"
// @param destino_id = "@F1"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(min(size(relaciones))) + '|' + toString(max(size(relaciones)));
// @espera valor 2|1|1

// @prueba K-05 | 05, sección 3.2: una persona escribió el libro y dirigió su adaptación (RF-25, CG-07)
CREATE (p:Persona {persona_id: '@P1', nombre: 'Autor y director'}), (l:Libro {obra_id: '@L1'}), (f:`Película` {obra_id: '@F1'})
CREATE (p)-[:escribió]->(l), (l)-[:adaptado_a]->(f), (f)-[:dirigida_por]->(p);
// @espera ok
// @param director_id = "@P1"
// @incluir CG-07.cypher
// @espera filas 1

// @prueba K-06 | RN-07: Neo4j NO impide un segundo libro de origen; CG-22 lo detecta (por eso existe D-23)
CREATE (:Libro {obra_id: '@L1'}), (:Libro {obra_id: '@L2'}), (:`Película` {obra_id: '@F1'});
// @espera ok
// @paso Registrar el primer libro de origen con CG-15
// @param libro_id = "@L1"
// @param pelicula_id = "@F1"
// @incluir CG-15.cypher
// @espera filas 1
// @paso CG-15 por sí sola NO rechaza un segundo libro (la API comprueba CG-04 antes, con el nodo bloqueado)
// @param libro_id = "@L2"
// @param pelicula_id = "@F1"
// @incluir CG-15.cypher
// @espera filas 1
// @paso La reconciliación (CG-22) lo detecta: la película tiene 2 libros de origen
CALL {
// @incluir CG-22.cypher
}
WITH * WHERE tipo = 'pelicula' AND n1 <> 1
RETURN toString(n1);
// @espera valor 2

// @prueba K-07 | Mínimos de D-24: CG-22 señala exactamente las obras que no llegan al mínimo
CREATE (l1:Libro {obra_id: '@L1'}), (l2:Libro {obra_id: '@L2'}), (l3:Libro {obra_id: '@L3'}),
       (f1:`Película` {obra_id: '@F1'}), (f2:`Película` {obra_id: '@F2'}), (f3:`Película` {obra_id: '@F3'}),
       (f4:`Película` {obra_id: '@F4'}), (f5:`Película` {obra_id: '@F5'}),
       (autor:Persona {persona_id: '@P1', nombre: 'Autor'}), (dir:Persona {persona_id: '@P2', nombre: 'Director'}),
       (act:Persona {persona_id: '@P3', nombre: 'Actor'})
CREATE (autor)-[:escribió]->(l1), (autor)-[:escribió]->(l3),
       (l1)-[:adaptado_a]->(f1), (l1)-[:adaptado_a]->(f4), (l1)-[:adaptado_a]->(f5), (l2)-[:adaptado_a]->(f2), (l2)-[:adaptado_a]->(f5),
       (f1)-[:dirigida_por]->(dir), (f3)-[:dirigida_por]->(dir), (f4)-[:dirigida_por]->(dir), (f5)-[:dirigida_por]->(dir),
       (act)-[:`actuó_en` {personaje: 'A', orden: 1}]->(f1), (act)-[:`actuó_en` {personaje: 'A', orden: 1}]->(f2),
       (act)-[:`actuó_en` {personaje: 'A', orden: 1}]->(f3), (act)-[:`actuó_en` {personaje: 'A', orden: 1}]->(f5);
// @espera ok
// @paso Libro 2 sin autor, libro 3 sin adaptación; película 2 sin director, 3 sin libro, 4 sin reparto, 5 con dos libros
CALL {
// @incluir CG-22.cypher
}
WITH * WHERE (tipo = 'libro' AND (n1 < 1 OR n2 < 1)) OR (tipo = 'pelicula' AND (n1 <> 1 OR n2 < 1 OR n3 < 1))
WITH tipo + toString(toInteger(right(obra_id, 11))) AS etiqueta ORDER BY etiqueta
RETURN reduce(s = '', e IN collect(etiqueta) | CASE WHEN s = '' THEN e ELSE s + ',' + e END);
// @espera valor libro2,libro3,pelicula2,pelicula3,pelicula4,pelicula5
// @paso Antes de publicar, CG-03 del libro 3 (sin adaptación) no devuelve nada
// @param libro_id = "@L3"
// @incluir CG-03.cypher
// @espera filas 0
// @paso CG-05 de la película 2 (sin director) no devuelve nada
// @param obra_id = "@F2"
// @incluir CG-05.cypher
// @espera filas 0
// @paso CG-05 del libro 2 (sin autor) no devuelve nada
// @param obra_id = "@L2"
// @incluir CG-05.cypher
// @espera filas 0
// @paso CG-04 de la película 3 (sin libro de origen) no devuelve nada
// @param pelicula_id = "@F3"
// @incluir CG-04.cypher
// @espera filas 0
// @paso CG-20 de la película 4 (sin reparto) no devuelve nada
// @param pelicula_id = "@F4"
// @incluir CG-20.cypher
// @espera filas 0
// @paso Las obras completas sí cumplen: libro 1 (autor y 3 adaptaciones) y película 1 (libro, director y reparto)
// @param obra_id = "@L1"
// @incluir CG-05.cypher
// @espera filas 1
// @paso CG-20 de la película 1
// @param pelicula_id = "@F1"
// @incluir CG-20.cypher
// @espera filas 1

// @prueba K-08 | `orden` repetido en el reparto: Neo4j lo acepta; la API lo valida y la reconciliación puede detectarlo
CREATE (a:Persona {persona_id: '@P1', nombre: 'Uno'}), (b:Persona {persona_id: '@P2', nombre: 'Dos'}), (f:`Película` {obra_id: '@F1'})
CREATE (a)-[:`actuó_en` {personaje: 'A', orden: 1}]->(f), (b)-[:`actuó_en` {personaje: 'B', orden: 1}]->(f);
// @espera ok
MATCH (:Persona)-[r:`actuó_en`]->(f:`Película`) WITH f, r.orden AS orden, count(*) AS n WHERE n > 1 RETURN toString(count(*));
// @espera valor 1

// @prueba K-09 | sigue y leyó son N a M: un usuario sigue a varios y es seguido por varios; un libro lo leen varios
CREATE (u1:Usuario {usuario_id: '@U1'}), (u2:Usuario {usuario_id: '@U2'}), (u3:Usuario {usuario_id: '@U3'}), (u4:Usuario {usuario_id: '@U4'}),
       (l1:Libro {obra_id: '@L1'}), (l2:Libro {obra_id: '@L2'})
CREATE (u1)-[:sigue]->(u2), (u1)-[:sigue]->(u3), (u4)-[:sigue]->(u2), (u1)-[:leyó]->(l1), (u1)-[:leyó]->(l2), (u3)-[:leyó]->(l1);
// @espera ok
// @paso U1 sigue a 2 y U2 es seguido por 2
MATCH (u1:Usuario {usuario_id: '@U1'}), (u2:Usuario {usuario_id: '@U2'})
RETURN toString(COUNT { (u1)-[:sigue]->() }) + '|' + toString(COUNT { ()-[:sigue]->(u2) });
// @espera valor 2|2
// @paso U1 leyó 2 libros y el libro 1 lo leyeron 2 usuarios
MATCH (u1:Usuario {usuario_id: '@U1'}), (l1:Libro {obra_id: '@L1'})
RETURN toString(COUNT { (u1)-[:leyó]->() }) + '|' + toString(COUNT { ()-[:leyó]->(l1) });
// @espera valor 2|2

// @prueba K-10 | Las escrituras idempotentes de sincronización y alta no duplican (CG-11, CG-15, CG-16, CG-18)
// @param obra_id = "@L1"
// @incluir CG-11-libro.cypher
// @espera ok
// @param obra_id = "@L1"
// @incluir CG-11-libro.cypher
// @espera ok
// @param obra_id = "@F1"
// @incluir CG-11-pelicula.cypher
// @espera ok
// @param obra_id = "@F1"
// @incluir CG-11-pelicula.cypher
// @espera ok
// @param usuario_id = "@U1"
// @incluir CG-16.cypher
// @espera ok
// @param usuario_id = "@U1"
// @incluir CG-16.cypher
// @espera ok
// @param usuario_id = "@U2"
// @incluir CG-16.cypher
// @espera ok
// @paso Tras repetir CG-11 y CG-16: un libro, una película y dos usuarios
MATCH (n) RETURN toString(count { (:Libro) }) + '|' + toString(count { (:`Película`) }) + '|' + toString(count { (:Usuario) });
// @espera valor 1|1|2
// @param libro_id = "@L1"
// @param pelicula_id = "@F1"
// @incluir CG-15.cypher
// @espera ok
// @param libro_id = "@L1"
// @param pelicula_id = "@F1"
// @incluir CG-15.cypher
// @espera ok
// @param seguidor_id = "@U1"
// @param seguido_id = "@U2"
// @incluir CG-18-crear.cypher
// @espera ok
// @param seguidor_id = "@U1"
// @param seguido_id = "@U2"
// @incluir CG-18-crear.cypher
// @espera ok
// @paso Tras repetir CG-15 y CG-18: una adaptado_a y un sigue
MATCH ()-[r]->() RETURN toString(count(r)) + '|' + toString(count(DISTINCT type(r)));
// @espera valor 2|2
// @param seguidor_id = "@U1"
// @param seguido_id = "@U2"
// @incluir CG-18-eliminar.cypher
// @espera ok
// @param seguidor_id = "@U1"
// @param seguido_id = "@U2"
// @incluir CG-18-eliminar.cypher
// @espera ok
// @paso Eliminar el seguimiento dos veces no falla y deja solo la adaptación
MATCH ()-[r]->() RETURN toString(count(r));
// @espera valor 1
