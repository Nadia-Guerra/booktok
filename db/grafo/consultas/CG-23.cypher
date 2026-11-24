// CG-23: listar los usuarios y sus relaciones sigue y leyó, para compararlos con el relacional y detectar huérfanos (RNF-03).
// Una fila por nodo Usuario, con los usuarios que sigue y los obra_id que leyó, ordenados. `leyó` se lee sin filtrar la
// etiqueta del destino a propósito: si alguna apuntara a una película (D-16 lo prohíbe), aparecería aquí y la
// comparación con estado_obra la señalaría. Un usuario sin relaciones devuelve listas vacías.
// En una versión por lotes, la API añade SKIP $desde LIMIT $limite al final (el ORDER BY usuario_id ya está puesto).
MATCH (u:Usuario)
CALL (u) {
  OPTIONAL MATCH (u)-[:sigue]->(s:Usuario)
  WITH s ORDER BY s.usuario_id
  RETURN collect(s.usuario_id) AS sigue
}
CALL (u) {
  OPTIONAL MATCH (u)-[:leyó]->(l)
  WITH l ORDER BY l.obra_id
  RETURN collect(l.obra_id) AS leyo
}
RETURN u.usuario_id AS usuario_id, sigue, leyo
ORDER BY usuario_id
