// CG-19 (eliminar): eliminar la lectura de un libro (evento obra_no_leida, D-16). Sin efecto si no existe.
MATCH (:Usuario {usuario_id: $usuario_id})-[r:leyó]->(:Libro {obra_id: $obra_id})
DELETE r
