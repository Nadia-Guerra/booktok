// CG-24: asignar, cambiar o quitar la foto de una persona (RF-10, D-25). Con $foto_url = null se quita:
// Neo4j no guarda nulos y SET a null elimina la propiedad (nunca queda un valor vacío).
// Después la API regenera el reparto de cada película donde actuó (CG-25, CG-20 y AP-17, D-27).
MATCH (p:Persona {persona_id: $persona_id})
SET p.foto_url = $foto_url
RETURN p.persona_id AS persona_id
