// CG-03: adaptaciones de un libro (RF-23). La API la usa también antes de publicar un libro:
// solo se publica si devuelve al menos una película (D-24).
MATCH (:Libro {obra_id: $libro_id})-[:adaptado_a]->(f:`Película`)
RETURN f.obra_id AS obra_id
ORDER BY obra_id
