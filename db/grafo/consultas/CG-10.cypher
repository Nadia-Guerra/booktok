// CG-10: comprobar que un libro y una película están unidos por una adaptación (RN-06).
RETURN EXISTS {
  (:Libro {obra_id: $libro_id})-[:adaptado_a]->(:`Película` {obra_id: $pelicula_id})
} AS unidas
