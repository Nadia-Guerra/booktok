// CG-09: recomendar películas basadas en libros que leyeron las personas que el usuario sigue (RF-27).
// Camino: (Usuario)-[:sigue]->(Usuario)-[:leyó]->(Libro)-[:adaptado_a]->(Película).
// Devuelve una fila por película, con el libro de origen (RN-07: uno solo) y a cuántos de los seguidos les consta la lectura:
// una película que se alcanza por varios seguidos sale una vez, con la cuenta (05-cardinalidad.md).
// NO excluye las películas que el usuario ya vio (D-20): el relacional guarda ese dato y la API decide si las muestra.
MATCH (:Usuario {usuario_id: $usuario_id})-[:sigue]->(s:Usuario)-[:leyó]->(l:Libro)-[:adaptado_a]->(f:`Película`)
RETURN f.obra_id AS obra_id, l.obra_id AS libro_id, count(DISTINCT s) AS seguidos
ORDER BY seguidos DESC, obra_id
