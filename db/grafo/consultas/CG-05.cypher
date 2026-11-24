// CG-05: autores de un libro y directores de una película, para mostrarlos junto a la ficha (R-06, R-07).
// La API la usa también antes de publicar una ficha: solo se publica si devuelve al menos una persona (D-24).
// $obra_id es el de un libro o el de una película: solo una de las dos ramas encuentra algo.
CALL {
  MATCH (p:Persona)-[:escribió]->(:Libro {obra_id: $obra_id})
  RETURN p
  UNION
  MATCH (:`Película` {obra_id: $obra_id})-[:dirigida_por]->(p:Persona)
  RETURN p
}
RETURN p.persona_id AS persona_id, p.nombre AS nombre, p.foto_url AS foto_url
ORDER BY nombre, persona_id
