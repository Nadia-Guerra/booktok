// CG-25: películas en las que actuó una persona, para regenerar su reparto en las fichas cuando cambia su foto (D-27).
MATCH (:Persona {persona_id: $persona_id})-[:`actuó_en`]->(f:`Película`)
RETURN f.obra_id AS obra_id
ORDER BY obra_id
