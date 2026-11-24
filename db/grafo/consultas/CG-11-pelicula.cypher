// CG-11 (película): crear el nodo de una película en el alta (RF-08). Idempotente.
MERGE (f:`Película` {obra_id: $obra_id})
RETURN f.obra_id AS obra_id
