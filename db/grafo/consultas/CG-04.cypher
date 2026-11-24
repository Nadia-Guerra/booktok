// CG-04: libro de origen de una película (RF-23). La API la usa antes de registrar una adaptación (RN-07)
// y antes de publicar una película, que solo se publica si devuelve su libro (D-24).
// No devuelve nada si la película todavía es un borrador sin libro.
MATCH (l:Libro)-[:adaptado_a]->(:`Película` {obra_id: $pelicula_id})
RETURN l.obra_id AS obra_id
ORDER BY obra_id
