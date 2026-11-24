// CG-14 (actuó_en): registrar que una persona actuó en una película, con su personaje y su orden (RF-10).
// Rechaza (no devuelve fila) si ya existe la relación de ese par (D-19: una sola por persona y película,
// y no se sobrescribe el personaje) o si el reparto ya tiene 300 personas, el límite de la ficha.
// Que `orden` no se repita dentro de la película lo valida la API: Neo4j no puede comprobarlo.
MATCH (p:Persona {persona_id: $persona_id}), (f:`Película` {obra_id: $obra_id})
WHERE NOT (p)-[:`actuó_en`]->(f)
  AND COUNT { (:Persona)-[:`actuó_en`]->(f) } < 300
CREATE (p)-[:`actuó_en` {personaje: $personaje, orden: $orden}]->(f)
RETURN true AS creada
