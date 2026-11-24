// =============================================================================
// Pruebas de restricciones del grafo. Fuente: docs/modelado/grafo/04-restricciones.md
// Se ejecutan con db/scripts/probar-grafo.ps1 (formato de este archivo explicado en ese script).
// Convención: R-01 a R-06 unicidad; R-07 a R-09 lo que Community NO impone (queda a la API);
// R-10 a R-15 reglas de las relaciones; R-16 a R-19 índices.
// Atajos: @P1 persona, @L1 libro, @F1 película, @U1 usuario.
// =============================================================================

// ---- Unicidad (Neo4j la impone) ----------------------------------------------------------
// @prueba R-01 | Dos nodos Persona con el mismo persona_id
CREATE (:Persona {persona_id: '@P1', nombre: 'Ana'});
// @espera ok
CREATE (:Persona {persona_id: '@P1', nombre: 'Otra Ana'});
// @espera error Neo.ClientError.Schema.ConstraintValidationFailed

// @prueba R-02 | Dos nodos Libro con el mismo obra_id
CREATE (:Libro {obra_id: '@L1'});
// @espera ok
CREATE (:Libro {obra_id: '@L1'});
// @espera error Neo.ClientError.Schema.ConstraintValidationFailed

// @prueba R-03 | Dos nodos Película con el mismo obra_id
CREATE (:`Película` {obra_id: '@F1'});
// @espera ok
CREATE (:`Película` {obra_id: '@F1'});
// @espera error Neo.ClientError.Schema.ConstraintValidationFailed

// @prueba R-04 | Dos nodos Usuario con el mismo usuario_id
CREATE (:Usuario {usuario_id: '@U1'});
// @espera ok
CREATE (:Usuario {usuario_id: '@U1'});
// @espera error Neo.ClientError.Schema.ConstraintValidationFailed

// @prueba R-05 | MERGE por id es idempotente: repetirlo no duplica el nodo
MERGE (p:Persona {persona_id: '@P1'}) SET p.nombre = 'Ana';
MERGE (p:Persona {persona_id: '@P1'}) SET p.nombre = 'Ana';
// @espera ok
MATCH (p:Persona) RETURN toString(count(p));
// @espera valor 1

// @prueba R-06 | Libro y Película pueden compartir obra_id (D-21): la unicidad es por etiqueta
CREATE (:Libro {obra_id: '@L1'});
CREATE (:`Película` {obra_id: '@L1'});
// @espera ok
MATCH (n {obra_id: '@L1'}) RETURN toString(count(n));
// @espera valor 2
// (Lo impide el relacional: obra_resumen.obra_id es clave primaria y se registra antes que el nodo.)

// ---- Lo que Community NO impone: lo garantiza la API (D-22) -------------------------------
// @prueba R-07 | Las restricciones de existencia y de tipo NO se pueden crear en Community
CREATE CONSTRAINT prueba_existe_persona_nombre FOR (p:Persona) REQUIRE p.nombre IS NOT NULL;
// @espera error Neo.DatabaseError.Schema.ConstraintCreationFailed
CREATE CONSTRAINT prueba_existe_personaje FOR ()-[r:`actuó_en`]-() REQUIRE r.personaje IS NOT NULL;
// @espera error Neo.DatabaseError.Schema.ConstraintCreationFailed
CREATE CONSTRAINT prueba_tipo_persona_nombre FOR (p:Persona) REQUIRE p.nombre IS :: STRING;
// @espera error Neo.DatabaseError.Schema.ConstraintCreationFailed

// @prueba R-08 | Community acepta una Persona sin nombre ni persona_id: RESPONSABILIDAD DE LA API
CREATE (:Persona {persona_id: '@P1'});
CREATE (:Persona {nombre: 'Sin id'});
CREATE (:Libro);
// @espera ok
MATCH (n) RETURN toString(count(n));
// @espera valor 3

// @prueba R-09 | Community acepta tipos incorrectos (nombre numérico, orden de texto): RESPONSABILIDAD DE LA API
CREATE (p:Persona {persona_id: '@P1', nombre: 12345});
CREATE (f:`Película` {obra_id: '@F1'});
MATCH (p:Persona {persona_id: '@P1'}), (f:`Película` {obra_id: '@F1'}) CREATE (p)-[:`actuó_en` {personaje: 7, orden: 'primero'}]->(f);
// @espera ok
MATCH (:Persona)-[r:`actuó_en`]->() RETURN toString(r.personaje) + '|' + r.orden;
// @espera valor 7|primero

// ---- Reglas de las relaciones -----------------------------------------------------------
// @prueba R-10 | Neo4j NO impide relaciones repetidas con CREATE: por eso toda escritura usa MERGE
CREATE (:Persona {persona_id: '@P1', nombre: 'Ana'}), (:Libro {obra_id: '@L1'});
MATCH (p:Persona), (l:Libro) CREATE (p)-[:escribió]->(l);
MATCH (p:Persona), (l:Libro) CREATE (p)-[:escribió]->(l);
// @espera ok
MATCH ()-[r:escribió]->() RETURN toString(count(r));
// @espera valor 2

// @prueba R-11 | MERGE por par no duplica ninguno de los seis tipos de relación
CREATE (:Persona {persona_id: '@P1', nombre: 'Ana'}), (:Libro {obra_id: '@L1'}), (:`Película` {obra_id: '@F1'}),
       (:Usuario {usuario_id: '@U1'}), (:Usuario {usuario_id: '@U2'});
// @espera ok
MATCH (p:Persona), (l:Libro), (f:`Película`), (u1:Usuario {usuario_id: '@U1'}), (u2:Usuario {usuario_id: '@U2'})
UNWIND [1, 2] AS repeticion
MERGE (p)-[:escribió]->(l)
MERGE (l)-[:adaptado_a]->(f)
MERGE (f)-[:dirigida_por]->(p)
MERGE (p)-[:`actuó_en`]->(f)
MERGE (u1)-[:sigue]->(u2)
MERGE (u1)-[:leyó]->(l);
// @espera ok
MATCH ()-[r]->() RETURN toString(count(r)) + '|' + toString(count(DISTINCT type(r)));
// @espera valor 6|6

// @prueba R-12 | CG-14: un id de otro tipo no crea la relación (las escrituras buscan por etiqueta)
CREATE (:Persona {persona_id: '@P1', nombre: 'Ana'}), (:Usuario {usuario_id: '@U1'});
// @espera ok
// @param persona_id = "@P1"
// @param obra_id = "@U1"
// @incluir CG-14-escribio.cypher
// @espera filas 0
MATCH ()-[r]->() RETURN toString(count(r));
// @espera valor 0

// @prueba R-13 | CG-19 con el id de una PELÍCULA no crea `leyó` (D-16): el proceso descarta las películas
CREATE (:Usuario {usuario_id: '@U1'}), (:`Película` {obra_id: '@F1'}), (:Libro {obra_id: '@L1'});
// @espera ok
// @param usuario_id = "@U1"
// @param obra_id = "@F1"
// @incluir CG-19-crear.cypher
// @espera filas 0
// @param usuario_id = "@U1"
// @param obra_id = "@L1"
// @incluir CG-19-crear.cypher
// @espera filas 1

// @prueba R-14 | CG-17 elimina al usuario con sigue y leyó en ambos sentidos, y repetirlo no falla (idempotente)
CREATE (u1:Usuario {usuario_id: '@U1'}), (u2:Usuario {usuario_id: '@U2'}), (u3:Usuario {usuario_id: '@U3'}), (l:Libro {obra_id: '@L1'})
CREATE (u1)-[:sigue]->(u2), (u2)-[:sigue]->(u1), (u3)-[:sigue]->(u1), (u1)-[:leyó]->(l), (u2)-[:sigue]->(u3);
// @espera ok
// @param usuario_id = "@U1"
// @incluir CG-17.cypher
// @espera ok
MATCH ()-[r]->() RETURN toString(count(r));
// @espera valor 1
// @param usuario_id = "@U1"
// @incluir CG-17.cypher
// @espera ok
MATCH (u:Usuario) RETURN toString(count(u));
// @espera valor 2

// @prueba R-15 | `sigue` de un usuario a sí mismo: el grafo lo acepta; lo impide el CHECK del relacional (RN-03)
CREATE (:Usuario {usuario_id: '@U1'});
// @espera ok
// @param seguidor_id = "@U1"
// @param seguido_id = "@U1"
// @incluir CG-18-crear.cypher
// @espera filas 1

// ---- Índices -----------------------------------------------------------------------------
// @prueba R-16 | Inventario: 4 restricciones de unicidad y el índice de texto de Persona.nombre en línea
RETURN 1;
// @espera ok
SHOW CONSTRAINTS YIELD type, name WHERE type = 'UNIQUENESS' RETURN toString(count(*));
// @espera valor 4
SHOW INDEXES YIELD name, type, state WHERE name = 'persona_nombre_texto' AND type = 'FULLTEXT' AND state = 'ONLINE' RETURN toString(count(*));
// @espera valor 1

// @prueba R-17 | Las búsquedas por id usan el índice de la restricción (NodeUniqueIndexSeek), no recorren todo
EXPLAIN MATCH (p:Persona {persona_id: '@P1'}) RETURN p;
// @espera plan NodeUniqueIndexSeek
EXPLAIN MATCH (l:Libro {obra_id: '@L1'}) RETURN l;
// @espera plan NodeUniqueIndexSeek
EXPLAIN MATCH (f:`Película` {obra_id: '@F1'}) RETURN f;
// @espera plan NodeUniqueIndexSeek
EXPLAIN MATCH (u:Usuario {usuario_id: '@U1'}) RETURN u;
// @espera plan NodeUniqueIndexSeek

// @prueba R-18 | Búsqueda por nombre (CG-02): palabras completas, sin distinguir mayúsculas ni tildes
CREATE (:Persona {persona_id: '@P1', nombre: 'Timothée Chalamet'}), (:Persona {persona_id: '@P2', nombre: 'Rebecca Ferguson'}),
       (:Persona {persona_id: '@P3', nombre: 'Denis Villeneuve'}), (:Persona {persona_id: '@P4', nombre: 'Timothy Dalton'});
// @espera ok
// @param texto = "timothee"
// @incluir CG-02.cypher
// @espera filas 1
// @param texto = "CHALAMET"
// @incluir CG-02.cypher
// @espera filas 1
// @param texto = "timothée chalamet"
// @incluir CG-02.cypher
// @espera filas 1
// @param texto = "ferguson villeneuve"
// @incluir CG-02.cypher
// @espera filas 2

// @prueba R-19 | Limitación conocida del índice de texto: un fragmento de palabra no encuentra nada
CREATE (:Persona {persona_id: '@P1', nombre: 'Timothée Chalamet'});
// @espera ok
// @param texto = "chala"
// @incluir CG-02.cypher
// @espera filas 0
// @param texto = "timo"
// @incluir CG-02.cypher
// @espera filas 0

// @prueba R-20 | foto_url es opcional: CG-13 sin foto no crea la propiedad, CG-24 la asigna y la quita (nunca un valor vacío)
// @param persona_id = "@P1"
// @param nombre = "Ana"
// @param foto_url = null
// @incluir CG-13.cypher
// @espera ok
MATCH (p:Persona {persona_id: '@P1'}) RETURN toString(p.foto_url IS NULL);
// @espera valor true
// @param persona_id = "@P1"
// @param foto_url = "https://almacenamiento.ejemplo.com/personas/ana.jpg"
// @incluir CG-24.cypher
// @espera ok
MATCH (p:Persona {persona_id: '@P1'}) RETURN p.foto_url;
// @espera valor https://almacenamiento.ejemplo.com/personas/ana.jpg
// @param persona_id = "@P1"
// @param foto_url = null
// @incluir CG-24.cypher
// @espera ok
MATCH (p:Persona {persona_id: '@P1'}) RETURN toString(p.foto_url IS NULL) + '|' + toString('foto_url' IN keys(p));
// @espera valor true|false
