// CG-13: registrar una persona (RF-10). $foto_url puede ser null: Neo4j no guarda nulos, la propiedad no existe.
// Si el persona_id ya existe no cambia nada (ON CREATE). La API valida antes: nombre de 1 a 150 caracteres
// y foto_url con https:// (Neo4j Community no valida valores, D-22).
MERGE (p:Persona {persona_id: $persona_id})
ON CREATE SET p.nombre = $nombre, p.foto_url = $foto_url
RETURN p.persona_id AS persona_id
