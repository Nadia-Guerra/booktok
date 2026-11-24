// CG-07: autores cuyos libros fueron adaptados por un mismo director (RF-25).
// Parte de un director: devuelve cada autor con el libro y la película que lo unen a ese director.
MATCH (a:Persona)-[:escribió]->(l:Libro)-[:adaptado_a]->(f:`Película`)-[:dirigida_por]->(:Persona {persona_id: $director_id})
RETURN a.persona_id AS persona_id, a.nombre AS nombre, a.foto_url AS foto_url,
       l.obra_id AS libro_id, f.obra_id AS pelicula_id
ORDER BY nombre, libro_id, pelicula_id
