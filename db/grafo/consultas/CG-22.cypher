// CG-22: listar las obras del grafo con sus conteos, para la reconciliación (RNF-03, AP-29, AP-30) y para
// reportar las obras publicadas que no llegan al mínimo de D-24. Columnas fijas para ambos tipos:
//   libro:    n1 = autores (mín. 1)      n2 = adaptaciones (mín. 1)   n3 = 0 (no aplica)
//   pelicula: n1 = libros de origen (1)  n2 = directores (mín. 1)     n3 = reparto (mín. 1, máx. 300)
// En una versión por lotes, la API añade ORDER BY obra_id SKIP/LIMIT al final.
MATCH (l:Libro)
RETURN 'libro' AS tipo, l.obra_id AS obra_id,
       COUNT { (:Persona)-[:escribió]->(l) } AS n1,
       COUNT { (l)-[:adaptado_a]->(:`Película`) } AS n2,
       0 AS n3
UNION ALL
MATCH (f:`Película`)
RETURN 'pelicula' AS tipo, f.obra_id AS obra_id,
       COUNT { (:Libro)-[:adaptado_a]->(f) } AS n1,
       COUNT { (f)-[:dirigida_por]->(:Persona) } AS n2,
       COUNT { (:Persona)-[:`actuó_en`]->(f) } AS n3
