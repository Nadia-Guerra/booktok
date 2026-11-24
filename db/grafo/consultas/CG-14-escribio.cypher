// CG-14 (escribió): registrar que una persona escribió un libro (RF-10).
// Busca los nodos por su etiqueta (así un id de otro tipo no crea nada) y rechaza la relación si ya existe:
// devuelve una fila si la creó y ninguna si ya existía o falta un nodo.
MATCH (p:Persona {persona_id: $persona_id}), (l:Libro {obra_id: $obra_id})
WHERE NOT (p)-[:escribió]->(l)
CREATE (p)-[:escribió]->(l)
RETURN true AS creada
