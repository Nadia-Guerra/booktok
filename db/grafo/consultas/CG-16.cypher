// CG-16: crear el nodo de un usuario (evento usuario_creado). Idempotente.
MERGE (u:Usuario {usuario_id: $usuario_id})
RETURN u.usuario_id AS usuario_id
