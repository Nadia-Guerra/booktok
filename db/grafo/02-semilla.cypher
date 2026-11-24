// =============================================================================
// ARCHIVO GENERADO: no lo edites a mano.
// Fuente unica: db/semilla/semilla.json. Regenerar con: powershell -File db\semilla\generar.ps1
// Descripcion y escenarios: db/semilla/README.md
// Se puede repetir: borra el grafo entero y lo vuelve a crear. Requiere 01-restricciones.cypher.
// Ejecutar con cypher-shell (grafo/cypher.sh): un archivo, un proceso.
// leyo se deriva de los estados "terminada" de LIBROS (D-16); las peliculas terminadas no crean relacion.
// Las etiquetas y relaciones llevan su nombre con tilde, como en los documentos de diseno.
// =============================================================================

MATCH (n) DETACH DELETE n;

// ---- Nodos ----
UNWIND [
  {persona_id: 'a1000000-0000-4000-8000-000000000001', nombre: 'Frank Herbert', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000001.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000002', nombre: 'Philip K. Dick', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000002.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000003', nombre: 'Andy Weir', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000003.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000004', nombre: 'Ted Chiang', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000004.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000005', nombre: 'Michael Crichton', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000005.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000006', nombre: 'J. R. R. Tolkien'},
  {persona_id: 'a1000000-0000-4000-8000-000000000007', nombre: 'Jane Austen'},
  {persona_id: 'a1000000-0000-4000-8000-000000000008', nombre: 'Ian McEwan', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000008.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000009', nombre: 'Agatha Christie'},
  {persona_id: 'a1000000-0000-4000-8000-000000000010', nombre: 'William Gibson'},
  {persona_id: 'a1000000-0000-4000-8000-000000000011', nombre: 'Denis Villeneuve', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000011.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000012', nombre: 'Ridley Scott', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000012.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000013', nombre: 'Steven Spielberg', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000013.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000014', nombre: 'Peter Jackson', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000014.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000015', nombre: 'Joe Wright', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000015.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000016', nombre: 'Kenneth Branagh', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000016.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000017', nombre: 'Timothée Chalamet', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000017.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000018', nombre: 'Rebecca Ferguson', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000018.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000019', nombre: 'Harrison Ford', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000019.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000020', nombre: 'Matt Damon', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000020.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000021', nombre: 'Amy Adams', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000021.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000022', nombre: 'Sam Neill', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000022.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000023', nombre: 'Martin Freeman', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000023.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000024', nombre: 'Ian McKellen', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000024.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000025', nombre: 'Elijah Wood', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000025.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000026', nombre: 'Keira Knightley', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000026.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000027', nombre: 'Matthew Macfadyen'},
  {persona_id: 'a1000000-0000-4000-8000-000000000028', nombre: 'James McAvoy', foto_url: 'https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000028.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000029', nombre: 'Penélope Cruz'}
] AS fila
MERGE (p:Persona {persona_id: fila.persona_id})
SET p.nombre = fila.nombre, p.foto_url = fila.foto_url;

UNWIND [
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002',
  'b1000000-0000-4000-8000-000000000003',
  'b1000000-0000-4000-8000-000000000004',
  'b1000000-0000-4000-8000-000000000005',
  'b1000000-0000-4000-8000-000000000006',
  'b1000000-0000-4000-8000-000000000007',
  'b1000000-0000-4000-8000-000000000008',
  'b1000000-0000-4000-8000-000000000009',
  'b1000000-0000-4000-8000-000000000010',
  'b1000000-0000-4000-8000-000000000011'
] AS id
MERGE (:Libro {obra_id: id});

UNWIND [
  'f1000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000002',
  'f1000000-0000-4000-8000-000000000003',
  'f1000000-0000-4000-8000-000000000004',
  'f1000000-0000-4000-8000-000000000005',
  'f1000000-0000-4000-8000-000000000006',
  'f1000000-0000-4000-8000-000000000007',
  'f1000000-0000-4000-8000-000000000008',
  'f1000000-0000-4000-8000-000000000009',
  'f1000000-0000-4000-8000-000000000010',
  'f1000000-0000-4000-8000-000000000011',
  'f1000000-0000-4000-8000-000000000012'
] AS id
MERGE (:`Película` {obra_id: id});

UNWIND [
  'c1000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000002',
  'c1000000-0000-4000-8000-000000000003',
  'c1000000-0000-4000-8000-000000000004',
  'c1000000-0000-4000-8000-000000000005',
  'c1000000-0000-4000-8000-000000000006',
  'c1000000-0000-4000-8000-000000000007',
  'c1000000-0000-4000-8000-000000000008'
] AS id
MERGE (:Usuario {usuario_id: id});

// ---- Relaciones del catalogo (las crea el administrador, RF-10 y RF-11) ----
UNWIND [
  {persona: 'a1000000-0000-4000-8000-000000000001', libro: 'b1000000-0000-4000-8000-000000000001'},
  {persona: 'a1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000002'},
  {persona: 'a1000000-0000-4000-8000-000000000003', libro: 'b1000000-0000-4000-8000-000000000003'},
  {persona: 'a1000000-0000-4000-8000-000000000004', libro: 'b1000000-0000-4000-8000-000000000004'},
  {persona: 'a1000000-0000-4000-8000-000000000005', libro: 'b1000000-0000-4000-8000-000000000005'},
  {persona: 'a1000000-0000-4000-8000-000000000006', libro: 'b1000000-0000-4000-8000-000000000006'},
  {persona: 'a1000000-0000-4000-8000-000000000006', libro: 'b1000000-0000-4000-8000-000000000007'},
  {persona: 'a1000000-0000-4000-8000-000000000007', libro: 'b1000000-0000-4000-8000-000000000008'},
  {persona: 'a1000000-0000-4000-8000-000000000008', libro: 'b1000000-0000-4000-8000-000000000009'},
  {persona: 'a1000000-0000-4000-8000-000000000009', libro: 'b1000000-0000-4000-8000-000000000010'},
  {persona: 'a1000000-0000-4000-8000-000000000010', libro: 'b1000000-0000-4000-8000-000000000011'}
] AS r
MATCH (p:Persona {persona_id: r.persona}), (l:Libro {obra_id: r.libro})
MERGE (p)-[:escribió]->(l);

UNWIND [
  {libro: 'b1000000-0000-4000-8000-000000000001', pelicula: 'f1000000-0000-4000-8000-000000000001'},
  {libro: 'b1000000-0000-4000-8000-000000000001', pelicula: 'f1000000-0000-4000-8000-000000000002'},
  {libro: 'b1000000-0000-4000-8000-000000000002', pelicula: 'f1000000-0000-4000-8000-000000000003'},
  {libro: 'b1000000-0000-4000-8000-000000000003', pelicula: 'f1000000-0000-4000-8000-000000000004'},
  {libro: 'b1000000-0000-4000-8000-000000000004', pelicula: 'f1000000-0000-4000-8000-000000000005'},
  {libro: 'b1000000-0000-4000-8000-000000000005', pelicula: 'f1000000-0000-4000-8000-000000000006'},
  {libro: 'b1000000-0000-4000-8000-000000000006', pelicula: 'f1000000-0000-4000-8000-000000000007'},
  {libro: 'b1000000-0000-4000-8000-000000000007', pelicula: 'f1000000-0000-4000-8000-000000000008'},
  {libro: 'b1000000-0000-4000-8000-000000000008', pelicula: 'f1000000-0000-4000-8000-000000000009'},
  {libro: 'b1000000-0000-4000-8000-000000000009', pelicula: 'f1000000-0000-4000-8000-000000000010'},
  {libro: 'b1000000-0000-4000-8000-000000000010', pelicula: 'f1000000-0000-4000-8000-000000000011'},
  {libro: 'b1000000-0000-4000-8000-000000000011', pelicula: 'f1000000-0000-4000-8000-000000000012'}
] AS r
MATCH (l:Libro {obra_id: r.libro}), (f:`Película` {obra_id: r.pelicula})
MERGE (l)-[:adaptado_a]->(f);

UNWIND [
  {pelicula: 'f1000000-0000-4000-8000-000000000001', persona: 'a1000000-0000-4000-8000-000000000011'},
  {pelicula: 'f1000000-0000-4000-8000-000000000002', persona: 'a1000000-0000-4000-8000-000000000011'},
  {pelicula: 'f1000000-0000-4000-8000-000000000003', persona: 'a1000000-0000-4000-8000-000000000012'},
  {pelicula: 'f1000000-0000-4000-8000-000000000004', persona: 'a1000000-0000-4000-8000-000000000012'},
  {pelicula: 'f1000000-0000-4000-8000-000000000005', persona: 'a1000000-0000-4000-8000-000000000011'},
  {pelicula: 'f1000000-0000-4000-8000-000000000006', persona: 'a1000000-0000-4000-8000-000000000013'},
  {pelicula: 'f1000000-0000-4000-8000-000000000007', persona: 'a1000000-0000-4000-8000-000000000014'},
  {pelicula: 'f1000000-0000-4000-8000-000000000008', persona: 'a1000000-0000-4000-8000-000000000014'},
  {pelicula: 'f1000000-0000-4000-8000-000000000009', persona: 'a1000000-0000-4000-8000-000000000015'},
  {pelicula: 'f1000000-0000-4000-8000-000000000010', persona: 'a1000000-0000-4000-8000-000000000015'},
  {pelicula: 'f1000000-0000-4000-8000-000000000011', persona: 'a1000000-0000-4000-8000-000000000016'}
] AS r
MATCH (f:`Película` {obra_id: r.pelicula}), (p:Persona {persona_id: r.persona})
MERGE (f)-[:dirigida_por]->(p);

UNWIND [
  {persona: 'a1000000-0000-4000-8000-000000000017', pelicula: 'f1000000-0000-4000-8000-000000000001', personaje: 'Paul Atreides', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000018', pelicula: 'f1000000-0000-4000-8000-000000000001', personaje: 'Lady Jessica', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000017', pelicula: 'f1000000-0000-4000-8000-000000000002', personaje: 'Paul Atreides', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000018', pelicula: 'f1000000-0000-4000-8000-000000000002', personaje: 'Lady Jessica', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000019', pelicula: 'f1000000-0000-4000-8000-000000000003', personaje: 'Rick Deckard', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000020', pelicula: 'f1000000-0000-4000-8000-000000000004', personaje: 'Mark Watney', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000021', pelicula: 'f1000000-0000-4000-8000-000000000005', personaje: 'Louise Banks', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000022', pelicula: 'f1000000-0000-4000-8000-000000000006', personaje: 'Alan Grant', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000023', pelicula: 'f1000000-0000-4000-8000-000000000007', personaje: 'Bilbo Bolsón', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000024', pelicula: 'f1000000-0000-4000-8000-000000000007', personaje: 'Gandalf', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000025', pelicula: 'f1000000-0000-4000-8000-000000000008', personaje: 'Frodo Bolsón', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000024', pelicula: 'f1000000-0000-4000-8000-000000000008', personaje: 'Gandalf', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000026', pelicula: 'f1000000-0000-4000-8000-000000000009', personaje: 'Elizabeth Bennet', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000027', pelicula: 'f1000000-0000-4000-8000-000000000009', personaje: 'Señor Darcy', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000026', pelicula: 'f1000000-0000-4000-8000-000000000010', personaje: 'Cecilia Tallis', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000028', pelicula: 'f1000000-0000-4000-8000-000000000010', personaje: 'Robbie Turner', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000016', pelicula: 'f1000000-0000-4000-8000-000000000011', personaje: 'Hercule Poirot', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000029', pelicula: 'f1000000-0000-4000-8000-000000000011', personaje: 'Pilar Estravados', orden: 2}
] AS r
MATCH (p:Persona {persona_id: r.persona}), (f:`Película` {obra_id: r.pelicula})
MERGE (p)-[a:`actuó_en`]->(f)
SET a.personaje = r.personaje, a.orden = r.orden;

// ---- Relaciones que llegan desde el relacional (seguimiento y estado_obra) ----
UNWIND [
  {seguidor: 'c1000000-0000-4000-8000-000000000006', seguido: 'c1000000-0000-4000-8000-000000000002'},
  {seguidor: 'c1000000-0000-4000-8000-000000000006', seguido: 'c1000000-0000-4000-8000-000000000005'},
  {seguidor: 'c1000000-0000-4000-8000-000000000006', seguido: 'c1000000-0000-4000-8000-000000000007'},
  {seguidor: 'c1000000-0000-4000-8000-000000000003', seguido: 'c1000000-0000-4000-8000-000000000002'},
  {seguidor: 'c1000000-0000-4000-8000-000000000004', seguido: 'c1000000-0000-4000-8000-000000000002'},
  {seguidor: 'c1000000-0000-4000-8000-000000000004', seguido: 'c1000000-0000-4000-8000-000000000005'},
  {seguidor: 'c1000000-0000-4000-8000-000000000007', seguido: 'c1000000-0000-4000-8000-000000000004'},
  {seguidor: 'c1000000-0000-4000-8000-000000000008', seguido: 'c1000000-0000-4000-8000-000000000004'},
  {seguidor: 'c1000000-0000-4000-8000-000000000008', seguido: 'c1000000-0000-4000-8000-000000000001'},
  {seguidor: 'c1000000-0000-4000-8000-000000000002', seguido: 'c1000000-0000-4000-8000-000000000005'}
] AS r
MATCH (a:Usuario {usuario_id: r.seguidor}), (b:Usuario {usuario_id: r.seguido})
MERGE (a)-[:sigue]->(b);

UNWIND [
  {usuario: 'c1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000001'},
  {usuario: 'c1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000003'},
  {usuario: 'c1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000006'},
  {usuario: 'c1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000009'},
  {usuario: 'c1000000-0000-4000-8000-000000000003', libro: 'b1000000-0000-4000-8000-000000000005'},
  {usuario: 'c1000000-0000-4000-8000-000000000004', libro: 'b1000000-0000-4000-8000-000000000001'},
  {usuario: 'c1000000-0000-4000-8000-000000000004', libro: 'b1000000-0000-4000-8000-000000000008'},
  {usuario: 'c1000000-0000-4000-8000-000000000005', libro: 'b1000000-0000-4000-8000-000000000001'},
  {usuario: 'c1000000-0000-4000-8000-000000000005', libro: 'b1000000-0000-4000-8000-000000000004'},
  {usuario: 'c1000000-0000-4000-8000-000000000007', libro: 'b1000000-0000-4000-8000-000000000005'},
  {usuario: 'c1000000-0000-4000-8000-000000000007', libro: 'b1000000-0000-4000-8000-000000000003'},
  {usuario: 'c1000000-0000-4000-8000-000000000008', libro: 'b1000000-0000-4000-8000-000000000009'}
] AS r
MATCH (u:Usuario {usuario_id: r.usuario}), (l:Libro {obra_id: r.libro})
MERGE (u)-[:leyó]->(l);

// ---- Resumen de lo cargado ----
MATCH (n) RETURN head(labels(n)) AS nodos, count(*) AS total ORDER BY nodos;
MATCH ()-[r]->() RETURN type(r) AS relacion, count(*) AS total ORDER BY relacion;
