// CG-17: eliminar un usuario y todas sus relaciones sigue y leyó, en ambos sentidos (evento usuario_eliminado, RF-04).
// Puede repetirse sin error: si el nodo ya no existe no encuentra nada.
MATCH (u:Usuario {usuario_id: $usuario_id})
DETACH DELETE u
