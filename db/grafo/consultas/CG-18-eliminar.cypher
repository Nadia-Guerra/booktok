// CG-18 (eliminar): eliminar un seguimiento (evento seguimiento_eliminado). Sin efecto si no existe.
MATCH (:Usuario {usuario_id: $seguidor_id})-[r:sigue]->(:Usuario {usuario_id: $seguido_id})
DELETE r
