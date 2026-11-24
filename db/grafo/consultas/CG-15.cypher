// CG-15: registrar que una película es adaptación de un libro (RF-11). Idempotente por par.
// RN-07 (una película, un solo libro de origen) NO la impone esta consulta: la API ejecuta antes
// CG-15-bloqueo y CG-04 en la misma transacción y solo llama a CG-15 si CG-04 no devolvió nada (D-23).
MATCH (l:Libro {obra_id: $libro_id}), (f:`Película` {obra_id: $pelicula_id})
MERGE (l)-[:adaptado_a]->(f)
RETURN true AS creada
