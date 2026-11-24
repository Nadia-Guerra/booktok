// CG-19 (crear): crear la lectura de un libro (evento obra_leida, D-16). Idempotente por par.
// Busca el nodo con la etiqueta Libro: si el id es el de una película no encuentra nada y no crea nada,
// que es lo que el proceso de sincronización debe hacer con las películas terminadas.
MATCH (u:Usuario {usuario_id: $usuario_id}), (l:Libro {obra_id: $obra_id})
MERGE (u)-[:leyó]->(l)
RETURN true AS creada
