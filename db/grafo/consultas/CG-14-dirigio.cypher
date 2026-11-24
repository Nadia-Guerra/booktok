// CG-14 (dirigida_por): registrar que una persona dirigió una película (RF-10).
// Devuelve una fila si la creó y ninguna si ya existía o falta un nodo.
MATCH (f:`Película` {obra_id: $obra_id}), (p:Persona {persona_id: $persona_id})
WHERE NOT (f)-[:dirigida_por]->(p)
CREATE (f)-[:dirigida_por]->(p)
RETURN true AS creada
