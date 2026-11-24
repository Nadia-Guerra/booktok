// CG-20: reparto de una película, para regenerar la copia de la ficha (RF-10, AP-17).
// La API la usa también antes de publicar: solo se publica si devuelve al menos una persona (D-24).
MATCH (p:Persona)-[r:`actuó_en`]->(:`Película` {obra_id: $pelicula_id})
RETURN p.persona_id AS persona_id, p.nombre AS nombre, p.foto_url AS foto_url,
       r.personaje AS personaje, r.orden AS orden
ORDER BY orden, persona_id
