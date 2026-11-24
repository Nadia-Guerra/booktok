// CG-18 (crear): crear un seguimiento (evento seguimiento_creado). Idempotente por par.
// Que nadie se siga a sí mismo lo impone el CHECK del relacional (RN-03); el grafo no lo comprueba.
MATCH (a:Usuario {usuario_id: $seguidor_id}), (b:Usuario {usuario_id: $seguido_id})
MERGE (a)-[:sigue]->(b)
RETURN true AS creada
