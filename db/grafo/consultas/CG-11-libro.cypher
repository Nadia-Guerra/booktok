// CG-11 (libro): crear el nodo de un libro en el alta (RF-08). Idempotente: repetirla no hace nada.
MERGE (l:Libro {obra_id: $obra_id})
RETURN l.obra_id AS obra_id
