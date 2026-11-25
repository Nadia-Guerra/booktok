// =============================================================================
// Entregable 5, catalogo del grafo: casos normales (n), limite (l) y de error (e) de las 24 consultas vigentes de
// docs/modelado/grafo/01-consultas-y-entidades.md (CG-01 a CG-11 y CG-13 a CG-25; CG-12 esta retirada).
//
// Se ejecutan con:  .\db\scripts\catalogo-grafo.ps1     sobre la SEMILLA cargada.
// Cada caso (@prueba) corre en una transaccion de Neo4j que se REVIERTE al terminar: la semilla no cambia. Lo que un caso
// escribe lo ven sus pasos siguientes y nada mas. Un paso que provoca un error cierra la transaccion, asi que el error va ultimo.
// El esperado esta escrito aqui; el obtenido lo produce el motor.
//
// Ids de la semilla (el final del UUID es el numero que se ve):
//   personas  @a01 Herbert, @a04 Chiang, @a06 Tolkien, @a07 Austen, @a10 Gibson, @a11 Villeneuve, @a12 Scott, @a13 Spielberg,
//             @a14 Jackson, @a15 Wright, @a16 Branagh (dirige y actua), @a17 Chalamet, @a21 Amy Adams, @a27 Macfadyen (sin foto)
//   libros    @b01 Dune, @b02 Androides, @b03 El marciano, @b04 Historia de tu vida, @b06 El Hobbit, @b08 Orgullo y prejuicio,
//             @b09 Expiacion, @b11 Neuromante (borrador)
//   peliculas @f01 Dune 2021, @f02 Dune parte dos, @f03 Blade Runner, @f04 El marciano, @f05 La llegada, @f07 El Hobbit,
//             @f09 Orgullo y prejuicio, @f11 Orient Express, @f12 Neuromante (borrador)
//   usuarios  @c01 admin, @c02 Ana, @c03 Luis, @c04 Marta, @c05 Pedro, @c06 Sofia, @c07 Diego, @c08 Elena
// Ids de prueba (no existen en la semilla): @T01, @T02, @T03...
// =============================================================================

// ============================================================================ CG-01
// @prueba CG-01-n1 | CG-01: buscar por el nombre de una persona devuelve sus obras con el vinculo (Villeneuve dirigio 3 peliculas)
// @param texto = "villeneuve"
CALL {
// @incluir CG-01.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT obra_id)) + '|' + head(collect(DISTINCT vinculo));
// @espera valor 3|3|dirigida_por
// @prueba CG-01-n2 | CG-01: un autor devuelve el libro que escribio (Herbert)
// @param texto = "herbert"
CALL {
// @incluir CG-01.cypher
}
RETURN head(collect(tipo)) + '|' + head(collect(vinculo));
// @espera valor libro|escribió
// @prueba CG-01-l1 | CG-01: una persona con dos roles en la misma pelicula da 1 obra y 2 vinculos (Branagh)
// @param texto = "branagh"
CALL {
// @incluir CG-01.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT obra_id)) + '|' + toString(count(DISTINCT vinculo));
// @espera valor 2|1|2
// @prueba CG-01-l2 | CG-01: en mayusculas y sin tilde ('TIMOTHEE') encuentra a Chalamet con sus 2 peliculas
// @param texto = "TIMOTHEE"
// @incluir CG-01.cypher
// @espera filas 2
// @prueba CG-01-e1 | CG-01: un nombre que no existe no devuelve nada
// @param texto = "zzzzzz"
// @incluir CG-01.cypher
// @espera filas 0
// @prueba CG-01-e2 | CG-01: un texto con sintaxis Lucene mal formada FALLA en Neo4j: por eso la API debe sanearlo (D-41)
// @param texto = "(("
// @incluir CG-01.cypher
// @espera error Neo.ClientError.Procedure.ProcedureCallFailed

// ============================================================================ CG-02
// @prueba CG-02-n1 | CG-02: buscar una persona por nombre antes de registrar otra (Tolkien)
// @param texto = "tolkien"
CALL {
// @incluir CG-02.cypher
}
RETURN head(collect(nombre));
// @espera valor J. R. R. Tolkien
// @prueba CG-02-n2 | CG-02: varias palabras encuentran a varias personas ('ferguson villeneuve')
// @param texto = "ferguson villeneuve"
// @incluir CG-02.cypher
// @espera filas 2
// @prueba CG-02-l1 | CG-02: una persona sin foto devuelve foto_url nulo (Macfadyen)
// @param texto = "macfadyen"
CALL {
// @incluir CG-02.cypher
}
RETURN head(collect(foto_url));
// @espera valor (nulo)
// @prueba CG-02-l2 | CG-02: sin tilde ('timothee') encuentra a Timothée Chalamet
// @param texto = "timothee"
CALL {
// @incluir CG-02.cypher
}
RETURN toString(count(*)) + '|' + head(collect(nombre));
// @espera valor 1|Timothée Chalamet
// @prueba CG-02-e1 | CG-02: un fragmento de palabra ('chala') no encuentra nada: limitacion conocida del indice de texto (D-41)
// @param texto = "chala"
// @incluir CG-02.cypher
// @espera filas 0
// @prueba CG-02-e2 | CG-02: un texto vacio FALLA en Neo4j (la API no debe llamarla sin texto)
// @param texto = ""
// @incluir CG-02.cypher
// @espera error Neo.ClientError.Procedure.ProcedureCallFailed

// ============================================================================ CG-03
// @prueba CG-03-n1 | CG-03: adaptaciones de un libro con dos peliculas (Dune: f01 y f02)
// @param libro_id = "@b01"
CALL {
// @incluir CG-03.cypher
}
RETURN reduce(s = '', x IN collect(right(obra_id, 2)) | s + x + ',');
// @espera valor 01,02,
// @prueba CG-03-l1 | CG-03: un libro con una sola adaptacion (Historia de tu vida: f05)
// @param libro_id = "@b04"
CALL {
// @incluir CG-03.cypher
}
RETURN reduce(s = '', x IN collect(right(obra_id, 2)) | s + x + ',');
// @espera valor 05,
// @prueba CG-03-l2 | CG-03: un libro en borrador ya tiene su pelicula en borrador (Neuromante: f12)
// @param libro_id = "@b11"
CALL {
// @incluir CG-03.cypher
}
RETURN reduce(s = '', x IN collect(right(obra_id, 2)) | s + x + ',');
// @espera valor 12,
// @prueba CG-03-e1 | CG-03: un libro nuevo sin adaptaciones no devuelve nada (la API no lo publica, D-24)
MERGE (:Libro {obra_id: '@T01'});
// @espera ok
// @param libro_id = "@T01"
// @incluir CG-03.cypher
// @espera filas 0
// @prueba CG-03-e2 | CG-03: el id de una pelicula usado como libro no devuelve nada
// @param libro_id = "@f01"
// @incluir CG-03.cypher
// @espera filas 0
// @prueba CG-03-e3 | CG-03: un id que no existe no devuelve nada
// @param libro_id = "@T09"
// @incluir CG-03.cypher
// @espera filas 0

// ============================================================================ CG-04
// @prueba CG-04-n1 | CG-04: libro de origen de una pelicula (Dune 2021: Dune)
// @param pelicula_id = "@f01"
CALL {
// @incluir CG-04.cypher
}
RETURN left(head(collect(obra_id)), 1) + right(head(collect(obra_id)), 2);
// @espera valor b01
// @prueba CG-04-n2 | CG-04: dos peliculas del mismo libro devuelven el mismo libro (Dune parte dos)
// @param pelicula_id = "@f02"
CALL {
// @incluir CG-04.cypher
}
RETURN left(head(collect(obra_id)), 1) + right(head(collect(obra_id)), 2);
// @espera valor b01
// @prueba CG-04-l1 | CG-04: la pelicula en borrador ya tiene su libro (Neuromante)
// @param pelicula_id = "@f12"
CALL {
// @incluir CG-04.cypher
}
RETURN left(head(collect(obra_id)), 1) + right(head(collect(obra_id)), 2);
// @espera valor b11
// @prueba CG-04-e1 | CG-04: una pelicula nueva sin libro de origen no devuelve nada (la API no la publica, D-24)
MERGE (:`Película` {obra_id: '@T01'});
// @espera ok
// @param pelicula_id = "@T01"
// @incluir CG-04.cypher
// @espera filas 0
// @prueba CG-04-e2 | CG-04: el id de un libro usado como pelicula no devuelve nada
// @param pelicula_id = "@b01"
// @incluir CG-04.cypher
// @espera filas 0
// @prueba CG-04-e3 | CG-04: un id que no existe no devuelve nada
// @param pelicula_id = "@T09"
// @incluir CG-04.cypher
// @espera filas 0

// ============================================================================ CG-05
// @prueba CG-05-n1 | CG-05: autor de un libro (Dune)
// @param obra_id = "@b01"
CALL {
// @incluir CG-05.cypher
}
RETURN head(collect(nombre));
// @espera valor Frank Herbert
// @prueba CG-05-n2 | CG-05: director de una pelicula (Dune 2021)
// @param obra_id = "@f01"
CALL {
// @incluir CG-05.cypher
}
RETURN head(collect(nombre));
// @espera valor Denis Villeneuve
// @prueba CG-05-l1 | CG-05: un libro con dos autores devuelve dos personas
MATCH (l:Libro {obra_id: '@b01'}), (p:Persona {persona_id: '@a04'}) CREATE (p)-[:`escribió`]->(l);
// @espera ok
// @param obra_id = "@b01"
// @incluir CG-05.cypher
// @espera filas 2
// @prueba CG-05-l2 | CG-05: en una pelicula solo cuenta quien la dirigio, no quien actua (Orient Express: Branagh dirige y actua, sale una vez)
// @param obra_id = "@f11"
CALL {
// @incluir CG-05.cypher
}
RETURN toString(count(*)) + '|' + head(collect(nombre));
// @espera valor 1|Kenneth Branagh
// @prueba CG-05-e1 | CG-05: un libro nuevo sin autor no devuelve nada (la API no lo publica, D-24)
MERGE (:Libro {obra_id: '@T01'});
// @espera ok
// @param obra_id = "@T01"
// @incluir CG-05.cypher
// @espera filas 0
// @prueba CG-05-e2 | CG-05: una pelicula nueva sin director no devuelve nada
MERGE (:`Película` {obra_id: '@T01'});
// @espera ok
// @param obra_id = "@T01"
// @incluir CG-05.cypher
// @espera filas 0
// @prueba CG-05-e3 | CG-05: un id que no existe no devuelve nada
// @param obra_id = "@T09"
// @incluir CG-05.cypher
// @espera filas 0

// ============================================================================ CG-06
// @prueba CG-06-n1 | CG-06: de un autor a un actor hay 3 saltos y DOS caminos mas cortos (Herbert a Chalamet, por las dos peliculas de Dune)
// @param origen_id = "@a01"
// @param destino_id = "@a17"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(size(head(collect(relaciones))));
// @espera valor 2|3
// @prueba CG-06-n2 | CG-06: el camino lleva los tipos de relacion en orden
// @param origen_id = "@a01"
// @param destino_id = "@a17"
CALL {
// @incluir CG-06.cypher
}
RETURN reduce(s = '', r IN head(collect(relaciones)) | s + CASE WHEN s = '' THEN '' ELSE ',' END + r);
// @espera valor escribió,adaptado_a,actuó_en
// @prueba CG-06-l1 | CG-06: entre dos obras, por el director comun (Dune a Historia de tu vida): 4 saltos y 2 caminos
// @param origen_id = "@b01"
// @param destino_id = "@b04"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(size(head(collect(relaciones))));
// @espera valor 2|4
// @prueba CG-06-l2 | CG-06: un camino largo, de 5 saltos y 2 rutas (Jane Austen a James McAvoy)
// @param origen_id = "@a07"
// @param destino_id = "@a28"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(size(head(collect(relaciones))));
// @espera valor 2|5
// @prueba CG-06-l3 | CG-06: con origen = destino (Herbert a Herbert) allShortestPaths FALLA en el motor (HALLAZGO, D-49): la API debe rechazarlo antes
// @param origen_id = "@a01"
// @param destino_id = "@a01"
// @incluir CG-06.cypher
// @espera error Neo.DatabaseError.Statement.ExecutionFailed
// @prueba CG-06-e1 | CG-06: dos nodos sin conexion no devuelven ningun camino (Gibson solo esta unido a la ficha en borrador)
// @param origen_id = "@a10"
// @param destino_id = "@a01"
// @incluir CG-06.cypher
// @espera filas 0
// @prueba CG-06-e2 | CG-06: un origen que no existe no devuelve nada ni falla
// @param origen_id = "@T09"
// @param destino_id = "@a01"
// @incluir CG-06.cypher
// @espera filas 0

// ============================================================================ CG-07
// @prueba CG-07-n1 | CG-07: autores cuyos libros adapto un director (Villeneuve: Herbert y Chiang, 3 filas)
// @param director_id = "@a11"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 3|2
// @prueba CG-07-n2 | CG-07: otro director con dos autores (Scott: Dick y Weir)
// @param director_id = "@a12"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 2|2
// @prueba CG-07-l1 | CG-07: un director con dos libros del MISMO autor da 2 filas y 1 autor (Jackson: Tolkien)
// @param director_id = "@a14"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 2|1
// @prueba CG-07-l2 | CG-07: un director con un solo libro adaptado (Spielberg)
// @param director_id = "@a13"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 1|1
// @prueba CG-07-e1 | CG-07: una persona que no dirigio nada no devuelve autores (Herbert)
// @param director_id = "@a01"
// @incluir CG-07.cypher
// @espera filas 0
// @prueba CG-07-e2 | CG-07: un id que no existe no devuelve nada
// @param director_id = "@T09"
// @incluir CG-07.cypher
// @espera filas 0

// ============================================================================ CG-08
// @prueba CG-08-n1 | CG-08: RF-26, Ana (partida: Dune y El marciano) recibe 2 libros por el mismo director
// @param libros_partida = ["@b01", "@b03"]
// @param usuario_id = "@c02"
CALL {
// @incluir CG-08.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT obra_id));
// @espera valor 2|2
// @prueba CG-08-n2 | CG-08: los libros recomendados son Historia de tu vida (por Villeneuve) y Androides (por Scott)
// @param libros_partida = ["@b01", "@b03"]
// @param usuario_id = "@c02"
CALL {
// @incluir CG-08.cypher
}
RETURN reduce(s = '', x IN collect(right(obra_id, 2) + ' por ' + nombre) | s + x + ';');
// @espera valor 02 por Ridley Scott;04 por Denis Villeneuve;
// @prueba CG-08-l1 | CG-08: Pedro ya leyo el otro libro del director: no hay nada que recomendar
// @param libros_partida = ["@b04", "@b01"]
// @param usuario_id = "@c05"
// @incluir CG-08.cypher
// @espera filas 0
// @prueba CG-08-l2 | CG-08: un libro de partida con dos adaptaciones del mismo director no se recomienda a si mismo (Dune)
// @param libros_partida = ["@b01"]
// @param usuario_id = "@c02"
CALL {
// @incluir CG-08.cypher
}
RETURN toString(count(*)) + '|' + toString(count(CASE WHEN obra_id = '@b01' THEN 1 END));
// @espera valor 1|0
// @prueba CG-08-l3 | CG-08: Marta (partida: Orgullo y prejuicio y Dune) recibe Expiacion y Historia de tu vida
// @param libros_partida = ["@b08", "@b01"]
// @param usuario_id = "@c04"
CALL {
// @incluir CG-08.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT obra_id));
// @espera valor 2|2
// @prueba CG-08-e1 | CG-08: una lista de partida vacia no devuelve nada
// @param libros_partida = []
// @param usuario_id = "@c02"
// @incluir CG-08.cypher
// @espera filas 0
// @prueba CG-08-e2 | CG-08: ids de peliculas en la lista de partida no devuelven nada (la partida son libros)
// @param libros_partida = ["@f01"]
// @param usuario_id = "@c02"
// @incluir CG-08.cypher
// @espera filas 0
// @prueba CG-08-e3 | CG-08: los libros que el usuario ya leyo no se recomiendan (Ana leyo Dune: se excluye aunque otro libro la lleve a el)
// @param libros_partida = ["@b04"]
// @param usuario_id = "@c02"
CALL {
// @incluir CG-08.cypher
}
RETURN toString(count(CASE WHEN obra_id = '@b01' THEN 1 END));
// @espera valor 0

// ============================================================================ CG-09
// @prueba CG-09-n1 | CG-09: RF-27, Sofia sigue a 3 lectores y recibe 7 peliculas; las mas alcanzadas, por 2 seguidos
// @param usuario_id = "@c06"
CALL {
// @incluir CG-09.cypher
}
RETURN toString(count(*)) + '|' + toString(max(seguidos));
// @espera valor 7|2
// @prueba CG-09-n2 | CG-09: cada pelicula trae su libro de origen: las 7 peliculas de Sofia vienen de 6 libros (Dune tiene dos adaptaciones)
// @param usuario_id = "@c06"
CALL {
// @incluir CG-09.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT libro_id));
// @espera valor 7|6
// @prueba CG-09-l1 | CG-09: quien sigue a un solo lector cuenta 1 en cada pelicula (Luis)
// @param usuario_id = "@c03"
CALL {
// @incluir CG-09.cypher
}
RETURN toString(max(seguidos));
// @espera valor 1
// @prueba CG-09-l2 | CG-09: NO excluye las peliculas que el usuario ya vio (D-20): Sofia vio Dune 2021 y sigue saliendo
// @param usuario_id = "@c06"
CALL {
// @incluir CG-09.cypher
}
RETURN toString(count(CASE WHEN obra_id = '@f01' THEN 1 END));
// @espera valor 1
// @prueba CG-09-e1 | CG-09: quien no sigue a nadie no recibe nada (Pedro)
// @param usuario_id = "@c05"
// @incluir CG-09.cypher
// @espera filas 0
// @prueba CG-09-e2 | CG-09: un usuario que no existe no recibe nada
// @param usuario_id = "@T09"
// @incluir CG-09.cypher
// @espera filas 0

// ============================================================================ CG-10
// @prueba CG-10-n1 | CG-10: un libro y su pelicula estan unidos por una adaptacion (Dune y Dune 2021)
// @param libro_id = "@b01"
// @param pelicula_id = "@f01"
// @incluir CG-10.cypher
// @espera valor true
// @prueba CG-10-n2 | CG-10: un libro con varias adaptaciones esta unido a cada una (Dune y Dune parte dos)
// @param libro_id = "@b01"
// @param pelicula_id = "@f02"
// @incluir CG-10.cypher
// @espera valor true
// @prueba CG-10-l1 | CG-10: un libro y una pelicula de otra adaptacion no estan unidos (Dune y El marciano: la API rechaza la comparativa, RN-06)
// @param libro_id = "@b01"
// @param pelicula_id = "@f04"
// @incluir CG-10.cypher
// @espera valor false
// @prueba CG-10-e1 | CG-10: con los ids invertidos (pelicula como libro) no hay adaptacion
// @param libro_id = "@f01"
// @param pelicula_id = "@b01"
// @incluir CG-10.cypher
// @espera valor false
// @prueba CG-10-e2 | CG-10: ids que no existen no estan unidos
// @param libro_id = "@T08"
// @param pelicula_id = "@T09"
// @incluir CG-10.cypher
// @espera valor false

// ============================================================================ CG-11
// @prueba CG-11-n1 | CG-11: crear el nodo de un libro
// @param obra_id = "@T01"
// @incluir CG-11-libro.cypher
// @espera filas 1
MATCH (l:Libro {obra_id: '@T01'}) RETURN count(l);
// @espera valor 1
// @prueba CG-11-n2 | CG-11: crear el nodo de una pelicula
// @param obra_id = "@T01"
// @incluir CG-11-pelicula.cypher
// @espera filas 1
MATCH (f:`Película` {obra_id: '@T01'}) RETURN count(f);
// @espera valor 1
// @prueba CG-11-l1 | CG-11: repetir el alta no duplica el nodo (idempotente)
// @param obra_id = "@T01"
// @incluir CG-11-libro.cypher
// @espera filas 1
// @param obra_id = "@T01"
// @incluir CG-11-libro.cypher
// @espera filas 1
MATCH (l:Libro {obra_id: '@T01'}) RETURN count(l);
// @espera valor 1
// @prueba CG-11-l2 | CG-11: sobre una obra de la semilla no cambia nada (Dune sigue siendo un solo nodo)
// @param obra_id = "@b01"
// @incluir CG-11-libro.cypher
// @espera filas 1
MATCH (l:Libro) RETURN count(l);
// @espera valor 11
// @prueba CG-11-l3 | CG-11: un libro y una pelicula pueden compartir obra_id: la unicidad es por etiqueta (D-21)
// @param obra_id = "@T01"
// @incluir CG-11-libro.cypher
// @espera filas 1
// @param obra_id = "@T01"
// @incluir CG-11-pelicula.cypher
// @espera filas 1
MATCH (n {obra_id: '@T01'}) RETURN count(n);
// @espera valor 2
// @prueba CG-11-e1 | CG-11: un obra_id nulo se rechaza (no se puede crear un nodo con clave nula)
// @param obra_id = null
// @incluir CG-11-libro.cypher
// @espera error Neo.ClientError.Statement.SemanticError

// ============================================================================ CG-13
// @prueba CG-13-n1 | CG-13: registrar una persona con foto
// @param persona_id = "@T01"
// @param nombre = "Persona de prueba"
// @param foto_url = "https://almacenamiento.ejemplo.com/personas/t01.jpg"
// @incluir CG-13.cypher
// @espera filas 1
MATCH (p:Persona {persona_id: '@T01'}) RETURN p.nombre + '|' + p.foto_url;
// @espera valor Persona de prueba|https://almacenamiento.ejemplo.com/personas/t01.jpg
// @prueba CG-13-l1 | CG-13: sin foto (null) la propiedad foto_url no existe
// @param persona_id = "@T01"
// @param nombre = "Persona sin foto"
// @param foto_url = null
// @incluir CG-13.cypher
// @espera filas 1
MATCH (p:Persona {persona_id: '@T01'}) RETURN toString(NOT 'foto_url' IN keys(p));
// @espera valor true
// @prueba CG-13-l2 | CG-13: registrar de nuevo el mismo persona_id no cambia el nombre (ON CREATE)
// @param persona_id = "@T01"
// @param nombre = "Nombre original"
// @param foto_url = null
// @incluir CG-13.cypher
// @espera filas 1
// @param persona_id = "@T01"
// @param nombre = "Otro nombre"
// @param foto_url = null
// @incluir CG-13.cypher
// @espera filas 1
MATCH (p:Persona {persona_id: '@T01'}) RETURN toString(count(p)) + '|' + head(collect(p.nombre));
// @espera valor 1|Nombre original
// @prueba CG-13-e1 | CG-13: un persona_id que ya existe con CREATE choca con la restriccion de unicidad (la API usa MERGE)
CREATE (:Persona {persona_id: '@a01', nombre: 'Duplicada'});
// @espera error Neo.ClientError.Schema.ConstraintValidationFailed
// @prueba CG-13-e2 | CG-13: un persona_id nulo se rechaza
// @param persona_id = null
// @param nombre = "Sin id"
// @param foto_url = null
// @incluir CG-13.cypher
// @espera error Neo.ClientError.Statement.SemanticError

// ============================================================================ CG-14
// @prueba CG-14-n1 | CG-14 (escribió): registrar que una persona escribio un libro
MERGE (:Persona {persona_id: '@T01', nombre: 'Autora de prueba'});
MERGE (:Libro {obra_id: '@T02'});
// @espera ok
// @param persona_id = "@T01"
// @param obra_id = "@T02"
// @incluir CG-14-escribio.cypher
// @espera valor true
// @prueba CG-14-n2 | CG-14 (dirigida_por): registrar que una persona dirigio una pelicula
MERGE (:Persona {persona_id: '@T01', nombre: 'Director de prueba'});
MERGE (:`Película` {obra_id: '@T02'});
// @espera ok
// @param persona_id = "@T01"
// @param obra_id = "@T02"
// @incluir CG-14-dirigio.cypher
// @espera valor true
// @prueba CG-14-n3 | CG-14 (actuó_en): registrar un actor con su personaje y su orden
MERGE (:Persona {persona_id: '@T01', nombre: 'Actor de prueba'});
MERGE (:`Película` {obra_id: '@T02'});
// @espera ok
// @param persona_id = "@T01"
// @param obra_id = "@T02"
// @param personaje = "Personaje de prueba"
// @param orden = 1
// @incluir CG-14-actuo.cypher
// @espera filas 1
MATCH (:Persona {persona_id: '@T01'})-[r:`actuó_en`]->(:`Película` {obra_id: '@T02'}) RETURN r.personaje + '|' + toString(r.orden);
// @espera valor Personaje de prueba|1
// @prueba CG-14-l1 | CG-14: repetir la misma relacion no la duplica (devuelve 0 filas la segunda vez)
MERGE (:Persona {persona_id: '@T01', nombre: 'Autora de prueba'});
MERGE (:Libro {obra_id: '@T02'});
// @espera ok
// @param persona_id = "@T01"
// @param obra_id = "@T02"
// @incluir CG-14-escribio.cypher
// @espera filas 1
// @param persona_id = "@T01"
// @param obra_id = "@T02"
// @incluir CG-14-escribio.cypher
// @espera filas 0
// @prueba CG-14-l2 | CG-14 (actuó_en): una segunda relacion del mismo par no sobrescribe el personaje (D-19)
MERGE (:Persona {persona_id: '@T01', nombre: 'Actor de prueba'});
MERGE (:`Película` {obra_id: '@T02'});
// @espera ok
// @param persona_id = "@T01"
// @param obra_id = "@T02"
// @param personaje = "Gandalf"
// @param orden = 1
// @incluir CG-14-actuo.cypher
// @espera filas 1
// @param persona_id = "@T01"
// @param obra_id = "@T02"
// @param personaje = "Otro personaje"
// @param orden = 2
// @incluir CG-14-actuo.cypher
// @espera filas 0
MATCH (:Persona {persona_id: '@T01'})-[r:`actuó_en`]->(:`Película` {obra_id: '@T02'}) RETURN toString(count(r)) + '|' + head(collect(r.personaje));
// @espera valor 1|Gandalf
// @prueba CG-14-l3 | CG-14 (actuó_en): el reparto admite exactamente 300 personas y la 301 se rechaza
MERGE (f:`Película` {obra_id: '@T02'}) WITH f UNWIND range(1, 299) AS i CREATE (p:Persona {persona_id: 'p' + toString(i), nombre: 'Actor ' + toString(i)}) CREATE (p)-[:`actuó_en` {personaje: 'x', orden: i}]->(f);
MERGE (:Persona {persona_id: '@T01', nombre: 'Actor 300'});
MERGE (:Persona {persona_id: '@T03', nombre: 'Actor 301'});
// @espera ok
// @param persona_id = "@T01"
// @param obra_id = "@T02"
// @param personaje = "x"
// @param orden = 300
// @incluir CG-14-actuo.cypher
// @espera filas 1
// @param persona_id = "@T03"
// @param obra_id = "@T02"
// @param personaje = "x"
// @param orden = 301
// @incluir CG-14-actuo.cypher
// @espera filas 0
MATCH (:Persona)-[r:`actuó_en`]->(:`Película` {obra_id: '@T02'}) RETURN count(r);
// @espera valor 300
// @prueba CG-14-e1 | CG-14: el id de una pelicula usado como libro no crea la relacion
MERGE (:Persona {persona_id: '@T01', nombre: 'Autora de prueba'});
// @espera ok
// @param persona_id = "@T01"
// @param obra_id = "@f01"
// @incluir CG-14-escribio.cypher
// @espera filas 0
// @prueba CG-14-e2 | CG-14: una persona que no existe no crea la relacion
// @param persona_id = "@T09"
// @param obra_id = "@b01"
// @incluir CG-14-escribio.cypher
// @espera filas 0
// @prueba CG-14-e3 | CG-14: una obra que no existe no crea la relacion
MERGE (:Persona {persona_id: '@T01', nombre: 'Director de prueba'});
// @espera ok
// @param persona_id = "@T01"
// @param obra_id = "@T09"
// @incluir CG-14-dirigio.cypher
// @espera filas 0
// @prueba CG-14-e4 | CG-14 (dirigida_por): repetir la direccion de una persona sobre una pelicula no la duplica (Villeneuve y Dune 2021)
// @param persona_id = "@a11"
// @param obra_id = "@f01"
// @incluir CG-14-dirigio.cypher
// @espera filas 0

// ============================================================================ CG-15
// @prueba CG-15-n1 | CG-15: registrar una adaptacion con el protocolo de D-23 (bloqueo, CG-04 sin libro, CG-15)
MERGE (:Libro {obra_id: '@T01'});
MERGE (:`Película` {obra_id: '@T02'});
// @espera ok
// @param pelicula_id = "@T02"
// @incluir CG-15-bloqueo.cypher
// @espera filas 1
// @param pelicula_id = "@T02"
// @incluir CG-04.cypher
// @espera filas 0
// @param libro_id = "@T01"
// @param pelicula_id = "@T02"
// @incluir CG-15.cypher
// @espera valor true
// @param pelicula_id = "@T02"
// @incluir CG-04.cypher
// @espera filas 1
// @prueba CG-15-n2 | CG-15: un libro con varias adaptaciones (dos peliculas del mismo libro)
MERGE (:Libro {obra_id: '@T01'});
MERGE (:`Película` {obra_id: '@T02'});
MERGE (:`Película` {obra_id: '@T03'});
// @espera ok
// @param libro_id = "@T01"
// @param pelicula_id = "@T02"
// @incluir CG-15.cypher
// @espera filas 1
// @param libro_id = "@T01"
// @param pelicula_id = "@T03"
// @incluir CG-15.cypher
// @espera filas 1
// @param libro_id = "@T01"
// @incluir CG-03.cypher
// @espera filas 2
// @prueba CG-15-l1 | CG-15: repetir la misma adaptacion no la duplica (idempotente por par)
MERGE (:Libro {obra_id: '@T01'});
MERGE (:`Película` {obra_id: '@T02'});
// @espera ok
// @param libro_id = "@T01"
// @param pelicula_id = "@T02"
// @incluir CG-15.cypher
// @espera filas 1
// @param libro_id = "@T01"
// @param pelicula_id = "@T02"
// @incluir CG-15.cypher
// @espera filas 1
MATCH (:Libro {obra_id: '@T01'})-[r:adaptado_a]->(:`Película` {obra_id: '@T02'}) RETURN count(r);
// @espera valor 1
// @prueba CG-15-l2 | CG-15: por si sola NO impide un segundo libro de origen (RN-07 la impone la API con D-23): la pelicula queda con 2
MERGE (:Libro {obra_id: '@T01'});
MERGE (:Libro {obra_id: '@T03'});
MERGE (:`Película` {obra_id: '@T02'});
// @espera ok
// @param libro_id = "@T01"
// @param pelicula_id = "@T02"
// @incluir CG-15.cypher
// @espera filas 1
// @param libro_id = "@T03"
// @param pelicula_id = "@T02"
// @incluir CG-15.cypher
// @espera filas 1
// @param pelicula_id = "@T02"
// @incluir CG-04.cypher
// @espera filas 2
// @prueba CG-15-e1 | CG-15: con el protocolo, si CG-04 ya devuelve un libro la API rechaza y no llama a CG-15 (una pelicula de la semilla)
// @param pelicula_id = "@f01"
// @incluir CG-15-bloqueo.cypher
// @espera filas 1
// @param pelicula_id = "@f01"
// @incluir CG-04.cypher
// @espera filas 1
// @prueba CG-15-e2 | CG-15: un libro que no existe no crea la adaptacion
MERGE (:`Película` {obra_id: '@T02'});
// @espera ok
// @param libro_id = "@T09"
// @param pelicula_id = "@T02"
// @incluir CG-15.cypher
// @espera filas 0
// @prueba CG-15-e3 | CG-15: una pelicula que no existe no crea la adaptacion
MERGE (:Libro {obra_id: '@T01'});
// @espera ok
// @param libro_id = "@T01"
// @param pelicula_id = "@T09"
// @incluir CG-15.cypher
// @espera filas 0
// @prueba CG-15-e4 | CG-15: el bloqueo sobre una pelicula que no existe no devuelve nada
// @param pelicula_id = "@T09"
// @incluir CG-15-bloqueo.cypher
// @espera filas 0

// ============================================================================ CG-16
// @prueba CG-16-n1 | CG-16: crear el nodo de un usuario
// @param usuario_id = "@T01"
// @incluir CG-16.cypher
// @espera filas 1
MATCH (u:Usuario) RETURN count(u);
// @espera valor 9
// @prueba CG-16-l1 | CG-16: repetirlo no duplica el nodo (idempotente)
// @param usuario_id = "@T01"
// @incluir CG-16.cypher
// @espera filas 1
// @param usuario_id = "@T01"
// @incluir CG-16.cypher
// @espera filas 1
MATCH (u:Usuario {usuario_id: '@T01'}) RETURN count(u);
// @espera valor 1
// @prueba CG-16-l2 | CG-16: sobre un usuario de la semilla no cambia nada (Ana)
// @param usuario_id = "@c02"
// @incluir CG-16.cypher
// @espera filas 1
MATCH (u:Usuario) RETURN count(u);
// @espera valor 8
// @prueba CG-16-e1 | CG-16: un usuario_id que ya existe con CREATE choca con la restriccion de unicidad
CREATE (:Usuario {usuario_id: '@c02'});
// @espera error Neo.ClientError.Schema.ConstraintValidationFailed
// @prueba CG-16-e2 | CG-16: un usuario_id nulo se rechaza
// @param usuario_id = null
// @incluir CG-16.cypher
// @espera error Neo.ClientError.Statement.SemanticError

// ============================================================================ CG-17
// @prueba CG-17-n1 | CG-17: eliminar a Ana borra su nodo y sus sigue y leyó en ambos sentidos (quedan 6 sigue y 8 leyó de 10 y 12)
// @param usuario_id = "@c02"
// @incluir CG-17.cypher
// @espera ok
MATCH ()-[s:sigue]->() WITH count(s) AS a MATCH ()-[l:`leyó`]->() WITH a, count(l) AS b RETURN toString(a) + '|' + toString(b);
// @espera valor 6|8
// @prueba CG-17-n2 | CG-17: no toca los nodos de los demas usuarios ni los de obra
// @param usuario_id = "@c02"
// @incluir CG-17.cypher
// @espera ok
MATCH (u:Usuario) WITH count(u) AS usuarios MATCH (l:Libro) WITH usuarios, count(l) AS libros MATCH (f:`Película`) WITH usuarios, libros, count(f) AS peliculas RETURN toString(usuarios) + '|' + toString(libros) + '|' + toString(peliculas);
// @espera valor 7|11|12
// @prueba CG-17-l1 | CG-17: repetirlo no falla (idempotente): la segunda vez no encuentra nada
// @param usuario_id = "@c02"
// @incluir CG-17.cypher
// @espera ok
// @param usuario_id = "@c02"
// @incluir CG-17.cypher
// @espera ok
// @prueba CG-17-l2 | CG-17: un usuario sin relaciones se elimina igual
MERGE (:Usuario {usuario_id: '@T01'});
// @espera ok
// @param usuario_id = "@T01"
// @incluir CG-17.cypher
// @espera ok
MATCH (u:Usuario {usuario_id: '@T01'}) RETURN count(u);
// @espera valor 0
// @prueba CG-17-e1 | CG-17: un usuario que no existe no falla ni borra nada
// @param usuario_id = "@T09"
// @incluir CG-17.cypher
// @espera ok
MATCH (u:Usuario) RETURN count(u);
// @espera valor 8

// ============================================================================ CG-18
// @prueba CG-18-n1 | CG-18 (crear): crear un seguimiento
MERGE (:Usuario {usuario_id: '@T01'});
MERGE (:Usuario {usuario_id: '@T02'});
// @espera ok
// @param seguidor_id = "@T01"
// @param seguido_id = "@T02"
// @incluir CG-18-crear.cypher
// @espera valor true
// @prueba CG-18-n2 | CG-18 (eliminar): eliminar el seguimiento
MERGE (:Usuario {usuario_id: '@T01'});
MERGE (:Usuario {usuario_id: '@T02'});
MATCH (a:Usuario {usuario_id: '@T01'}), (b:Usuario {usuario_id: '@T02'}) MERGE (a)-[:sigue]->(b);
// @espera ok
// @param seguidor_id = "@T01"
// @param seguido_id = "@T02"
// @incluir CG-18-eliminar.cypher
// @espera ok
MATCH ({usuario_id: '@T01'})-[r:sigue]->({usuario_id: '@T02'}) RETURN count(r);
// @espera valor 0
// @prueba CG-18-l1 | CG-18 (crear): repetirlo no duplica la relacion (idempotente por par)
MERGE (:Usuario {usuario_id: '@T01'});
MERGE (:Usuario {usuario_id: '@T02'});
// @espera ok
// @param seguidor_id = "@T01"
// @param seguido_id = "@T02"
// @incluir CG-18-crear.cypher
// @espera filas 1
// @param seguidor_id = "@T01"
// @param seguido_id = "@T02"
// @incluir CG-18-crear.cypher
// @espera filas 1
MATCH ({usuario_id: '@T01'})-[r:sigue]->({usuario_id: '@T02'}) RETURN count(r);
// @espera valor 1
// @prueba CG-18-l2 | CG-18 (eliminar): eliminar un seguimiento que no existe no falla
MERGE (:Usuario {usuario_id: '@T01'});
MERGE (:Usuario {usuario_id: '@T02'});
// @espera ok
// @param seguidor_id = "@T01"
// @param seguido_id = "@T02"
// @incluir CG-18-eliminar.cypher
// @espera ok
// @prueba CG-18-l3 | CG-18 (crear): dos usuarios pueden seguirse mutuamente (2 relaciones, una por sentido)
MERGE (:Usuario {usuario_id: '@T01'});
MERGE (:Usuario {usuario_id: '@T02'});
// @espera ok
// @param seguidor_id = "@T01"
// @param seguido_id = "@T02"
// @incluir CG-18-crear.cypher
// @espera filas 1
// @param seguidor_id = "@T02"
// @param seguido_id = "@T01"
// @incluir CG-18-crear.cypher
// @espera filas 1
MATCH ({usuario_id: '@T01'})-[r:sigue]-({usuario_id: '@T02'}) RETURN count(r);
// @espera valor 2
// @prueba CG-18-e1 | CG-18 (crear): el grafo ACEPTA un seguimiento a si mismo; RN-03 lo impide el CHECK del relacional
MERGE (:Usuario {usuario_id: '@T01'});
// @espera ok
// @param seguidor_id = "@T01"
// @param seguido_id = "@T01"
// @incluir CG-18-crear.cypher
// @espera valor true
// @prueba CG-18-e2 | CG-18 (crear): un usuario que no existe no crea la relacion
MERGE (:Usuario {usuario_id: '@T01'});
// @espera ok
// @param seguidor_id = "@T01"
// @param seguido_id = "@T09"
// @incluir CG-18-crear.cypher
// @espera filas 0

// ============================================================================ CG-19
// @prueba CG-19-n1 | CG-19 (crear): crear la lectura de un libro
MERGE (:Usuario {usuario_id: '@T01'});
// @espera ok
// @param usuario_id = "@T01"
// @param obra_id = "@b01"
// @incluir CG-19-crear.cypher
// @espera valor true
// @prueba CG-19-n2 | CG-19 (eliminar): eliminar la lectura (Ana deja de haber leido Dune)
// @param usuario_id = "@c02"
// @param obra_id = "@b01"
// @incluir CG-19-eliminar.cypher
// @espera ok
MATCH (:Usuario {usuario_id: '@c02'})-[r:`leyó`]->(:Libro {obra_id: '@b01'}) RETURN count(r);
// @espera valor 0
// @prueba CG-19-l1 | CG-19 (crear): repetirla no duplica la relacion (Ana ya habia leido Dune)
// @param usuario_id = "@c02"
// @param obra_id = "@b01"
// @incluir CG-19-crear.cypher
// @espera filas 1
MATCH (:Usuario {usuario_id: '@c02'})-[r:`leyó`]->(:Libro {obra_id: '@b01'}) RETURN count(r);
// @espera valor 1
// @prueba CG-19-l2 | CG-19 (crear): con el id de una PELICULA no crea nada (D-16: leyó solo apunta a libros)
// @param usuario_id = "@c02"
// @param obra_id = "@f01"
// @incluir CG-19-crear.cypher
// @espera filas 0
// @prueba CG-19-l3 | CG-19 (eliminar): eliminar una lectura que no existe no falla
// @param usuario_id = "@c06"
// @param obra_id = "@b01"
// @incluir CG-19-eliminar.cypher
// @espera ok
// @prueba CG-19-e1 | CG-19 (crear): un usuario que no existe no crea la lectura
// @param usuario_id = "@T09"
// @param obra_id = "@b01"
// @incluir CG-19-crear.cypher
// @espera filas 0
// @prueba CG-19-e2 | CG-19 (crear): un libro que no existe no crea la lectura
// @param usuario_id = "@c02"
// @param obra_id = "@T09"
// @incluir CG-19-crear.cypher
// @espera filas 0

// ============================================================================ CG-20
// @prueba CG-20-n1 | CG-20: el reparto de una pelicula sale ordenado por orden, con personaje (Dune 2021)
// @param pelicula_id = "@f01"
CALL {
// @incluir CG-20.cypher
}
RETURN reduce(s = '', x IN collect(toString(orden) + ':' + personaje) | s + x + ',');
// @espera valor 1:Paul Atreides,2:Lady Jessica,
// @prueba CG-20-l1 | CG-20: una pelicula en borrador sin reparto no devuelve nada (la API no la publica, D-24)
// @param pelicula_id = "@f12"
// @incluir CG-20.cypher
// @espera filas 0
// @prueba CG-20-l2 | CG-20: el orden manda sobre el nombre (El Hobbit: Bilbo 1, Gandalf 2)
// @param pelicula_id = "@f07"
CALL {
// @incluir CG-20.cypher
}
RETURN reduce(s = '', x IN collect(toString(orden) + ':' + personaje) | s + x + ',');
// @espera valor 1:Bilbo Bolsón,2:Gandalf,
// @prueba CG-20-l3 | CG-20: un actor sin foto devuelve foto_url nulo (Macfadyen en Orgullo y prejuicio)
// @param pelicula_id = "@f09"
CALL {
// @incluir CG-20.cypher
}
RETURN toString(count(*)) + '|' + toString([x IN collect({n: nombre, f: foto_url}) WHERE x.n = 'Matthew Macfadyen'][0].f IS NULL);
// @espera valor 2|true
// @prueba CG-20-e1 | CG-20: el id de un libro usado como pelicula no devuelve nada
// @param pelicula_id = "@b01"
// @incluir CG-20.cypher
// @espera filas 0
// @prueba CG-20-e2 | CG-20: un id que no existe no devuelve nada
// @param pelicula_id = "@T09"
// @incluir CG-20.cypher
// @espera filas 0

// ============================================================================ CG-21
// @prueba CG-21-n1 | CG-21: una fila por pelicula (12), tambien las que no tienen reparto
// @incluir CG-21.cypher
// @espera filas 12
// @prueba CG-21-n2 | CG-21: el total de personas en los repartos es 18
CALL {
// @incluir CG-21.cypher
}
RETURN toString(sum(size(reparto)));
// @espera valor 18
// @prueba CG-21-l1 | CG-21: la pelicula sin reparto devuelve una lista vacia (Neuromante)
CALL {
// @incluir CG-21.cypher
}
WITH obra_id, reparto WHERE obra_id = '@f12'
RETURN toString(size(reparto));
// @espera valor 0
// @prueba CG-21-l2 | CG-21: el reparto va ordenado por orden (El Hobbit: primero Bilbo)
CALL {
// @incluir CG-21.cypher
}
WITH obra_id, reparto WHERE obra_id = '@f07'
RETURN reparto[0].personaje;
// @espera valor Bilbo Bolsón
// @prueba CG-21-l3 | CG-21: un actor sin foto lleva foto_url nulo (Macfadyen)
CALL {
// @incluir CG-21.cypher
}
WITH obra_id, reparto WHERE obra_id = '@f09'
RETURN toString(reparto[1].foto_url IS NULL);
// @espera valor true
// @prueba CG-21-e1 | CG-21: un grafo sin peliculas no devuelve nada y no falla
MATCH (f:`Película`) DETACH DELETE f;
// @espera ok
// @incluir CG-21.cypher
// @espera filas 0

// ============================================================================ CG-22
// @prueba CG-22-n1 | CG-22: cuenta autores y adaptaciones de un libro (Dune: 1 autor, 2 adaptaciones)
CALL {
// @incluir CG-22.cypher
}
WITH tipo, obra_id, n1, n2, n3 WHERE obra_id = '@b01'
RETURN toString(n1) + '|' + toString(n2);
// @espera valor 1|2
// @prueba CG-22-n2 | CG-22: cuenta libro de origen, directores y reparto de una pelicula (Dune 2021: 1, 1 y 2)
CALL {
// @incluir CG-22.cypher
}
WITH tipo, obra_id, n1, n2, n3 WHERE obra_id = '@f01'
RETURN toString(n1) + '|' + toString(n2) + '|' + toString(n3);
// @espera valor 1|1|2
// @prueba CG-22-n3 | CG-22: una fila por obra del grafo (11 libros y 12 peliculas)
// @incluir CG-22.cypher
// @espera filas 23
// @prueba CG-22-l1 | CG-22: el libro en borrador ya cumple su minimo (Neuromante: 1 autor, 1 adaptacion)
CALL {
// @incluir CG-22.cypher
}
WITH tipo, obra_id, n1, n2, n3 WHERE obra_id = '@b11'
RETURN toString(n1) + '|' + toString(n2);
// @espera valor 1|1
// @prueba CG-22-l2 | CG-22: la pelicula en borrador no llega al minimo (Neuromante: 1 libro, 0 directores, 0 reparto)
CALL {
// @incluir CG-22.cypher
}
WITH tipo, obra_id, n1, n2, n3 WHERE obra_id = '@f12'
RETURN toString(n1) + '|' + toString(n2) + '|' + toString(n3);
// @espera valor 1|0|0
// @prueba CG-22-e1 | CG-22: la reconciliacion senala exactamente las obras bajo el minimo de D-24 (solo la pelicula en borrador)
CALL {
// @incluir CG-22.cypher
}
WITH tipo, obra_id, n1, n2, n3
WHERE (tipo = 'libro' AND (n1 < 1 OR n2 < 1)) OR (tipo = 'pelicula' AND (n1 <> 1 OR n2 < 1 OR n3 < 1))
RETURN toString(count(*)) + '|' + head(collect(obra_id));
// @espera valor 1|f1000000-0000-4000-8000-000000000012
// @prueba CG-22-e2 | CG-22: detecta una pelicula con DOS libros de origen (RN-07 que Neo4j no impide)
MATCH (l:Libro {obra_id: '@b02'}), (f:`Película` {obra_id: '@f01'}) MERGE (l)-[:adaptado_a]->(f);
// @espera ok
CALL {
// @incluir CG-22.cypher
}
WITH tipo, obra_id, n1, n2, n3 WHERE obra_id = '@f01'
RETURN toString(n1);
// @espera valor 2

// ============================================================================ CG-23
// @prueba CG-23-n1 | CG-23: una fila por usuario (8)
// @incluir CG-23.cypher
// @espera filas 8
// @prueba CG-23-n2 | CG-23: Sofia sigue a 3 y no leyo libros
CALL {
// @incluir CG-23.cypher
}
WITH usuario_id, sigue, leyo WHERE usuario_id = '@c06'
RETURN toString(size(sigue)) + '|' + toString(size(leyo));
// @espera valor 3|0
// @prueba CG-23-l1 | CG-23: un usuario sin relaciones devuelve listas vacias (el administrador sigue a nadie y no leyo nada)
CALL {
// @incluir CG-23.cypher
}
WITH usuario_id, sigue, leyo WHERE usuario_id = '@c01'
RETURN toString(size(sigue)) + '|' + toString(size(leyo));
// @espera valor 0|0
// @prueba CG-23-l2 | CG-23: Ana sigue a 1 y leyo 4 libros
CALL {
// @incluir CG-23.cypher
}
WITH usuario_id, sigue, leyo WHERE usuario_id = '@c02'
RETURN toString(size(sigue)) + '|' + toString(size(leyo));
// @espera valor 1|4
// @prueba CG-23-e1 | CG-23: un leyó hacia una PELICULA (que D-16 prohibe) aparece en la lista, para que la comparacion con el relacional lo senale
MATCH (u:Usuario {usuario_id: '@c01'}), (f:`Película` {obra_id: '@f01'}) CREATE (u)-[:`leyó`]->(f);
// @espera ok
CALL {
// @incluir CG-23.cypher
}
WITH usuario_id, sigue, leyo WHERE usuario_id = '@c01'
RETURN toString(size(leyo)) + '|' + toString(leyo[0] STARTS WITH 'f');
// @espera valor 1|true
// @prueba CG-23-e2 | CG-23: sin usuarios no devuelve nada y no falla
MATCH (u:Usuario) DETACH DELETE u;
// @espera ok
// @incluir CG-23.cypher
// @espera filas 0

// ============================================================================ CG-24
// @prueba CG-24-n1 | CG-24: asignar una foto a una persona que no la tenia (Macfadyen)
// @param persona_id = "@a27"
// @param foto_url = "https://almacenamiento.ejemplo.com/personas/macfadyen.jpg"
// @incluir CG-24.cypher
// @espera filas 1
MATCH (p:Persona {persona_id: '@a27'}) RETURN p.foto_url;
// @espera valor https://almacenamiento.ejemplo.com/personas/macfadyen.jpg
// @prueba CG-24-n2 | CG-24: cambiar la foto de una persona que ya la tenia (Chalamet)
// @param persona_id = "@a17"
// @param foto_url = "https://almacenamiento.ejemplo.com/personas/chalamet-nueva.jpg"
// @incluir CG-24.cypher
// @espera filas 1
MATCH (p:Persona {persona_id: '@a17'}) RETURN p.foto_url;
// @espera valor https://almacenamiento.ejemplo.com/personas/chalamet-nueva.jpg
// @prueba CG-24-l1 | CG-24: quitar la foto con null elimina la propiedad (nunca queda un valor vacio)
// @param persona_id = "@a17"
// @param foto_url = null
// @incluir CG-24.cypher
// @espera filas 1
MATCH (p:Persona {persona_id: '@a17'}) RETURN toString(NOT 'foto_url' IN keys(p));
// @espera valor true
// @prueba CG-24-l2 | CG-24: asignar dos veces la misma foto deja un solo valor (idempotente)
// @param persona_id = "@a17"
// @param foto_url = "https://almacenamiento.ejemplo.com/personas/chalamet-x.jpg"
// @incluir CG-24.cypher
// @espera filas 1
// @param persona_id = "@a17"
// @param foto_url = "https://almacenamiento.ejemplo.com/personas/chalamet-x.jpg"
// @incluir CG-24.cypher
// @espera filas 1
MATCH (p:Persona {persona_id: '@a17'}) WITH count(p) AS n, head(collect(p.foto_url)) AS f RETURN toString(n) + '|' + f;
// @espera valor 1|https://almacenamiento.ejemplo.com/personas/chalamet-x.jpg
// @prueba CG-24-e1 | CG-24: una persona que no existe no cambia nada
// @param persona_id = "@T09"
// @param foto_url = "https://almacenamiento.ejemplo.com/personas/x.jpg"
// @incluir CG-24.cypher
// @espera filas 0
// @prueba CG-24-e2 | CG-24: una foto con http:// SE ACEPTA en el grafo (Community no valida valores, D-22): la valida la API
// @param persona_id = "@a27"
// @param foto_url = "http://inseguro.ejemplo.com/f.jpg"
// @incluir CG-24.cypher
// @espera filas 1
MATCH (p:Persona {persona_id: '@a27'}) RETURN p.foto_url;
// @espera valor http://inseguro.ejemplo.com/f.jpg

// ============================================================================ CG-25
// @prueba CG-25-n1 | CG-25: peliculas en las que actuo una persona (Chalamet: 2)
// @param persona_id = "@a17"
// @incluir CG-25.cypher
// @espera filas 2
// @prueba CG-25-l1 | CG-25: una persona con una sola pelicula (Amy Adams)
// @param persona_id = "@a21"
// @incluir CG-25.cypher
// @espera filas 1
// @prueba CG-25-l2 | CG-25: solo cuenta actuó_en, no dirigida_por (Branagh dirigio y actuo en la misma pelicula: sale una vez)
// @param persona_id = "@a16"
// @incluir CG-25.cypher
// @espera filas 1
// @prueba CG-25-e1 | CG-25: un director que no actuo no devuelve nada (Villeneuve)
// @param persona_id = "@a11"
// @incluir CG-25.cypher
// @espera filas 0
// @prueba CG-25-e2 | CG-25: una persona que no existe no devuelve nada
// @param persona_id = "@T09"
// @incluir CG-25.cypher
// @espera filas 0
// @prueba CG-25-e3 | CG-25: el id de una pelicula usado como persona no devuelve nada
// @param persona_id = "@f01"
// @incluir CG-25.cypher
// @espera filas 0
