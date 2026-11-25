// CG-06: todos los caminos más cortos entre dos personas u obras (RF-24, D-17).
// Recorre las relaciones SIN dirección, solo por escribió, adaptado_a, dirigida_por y actuó_en.
// Tope de profundidad 6, provisional (D-17): Cypher no admite un parámetro en el rango, así que va fijo aquí.
// $origen_id y $destino_id son un persona_id o un obra_id; cada rama del UNION usa el índice de su etiqueta.
// Con $origen_id = $destino_id allShortestPaths falla en el motor (Neo.DatabaseError.Statement.ExecutionFailed): la API lo rechaza antes (D-49).
CALL {
  MATCH (n:Persona {persona_id: $origen_id}) RETURN n
  UNION
  MATCH (n:Libro {obra_id: $origen_id}) RETURN n
  UNION
  MATCH (n:`Película` {obra_id: $origen_id}) RETURN n
}
WITH n AS a
CALL {
  MATCH (m:Persona {persona_id: $destino_id}) RETURN m
  UNION
  MATCH (m:Libro {obra_id: $destino_id}) RETURN m
  UNION
  MATCH (m:`Película` {obra_id: $destino_id}) RETURN m
}
WITH a, m AS b
MATCH path = allShortestPaths((a)-[:`escribió`|`adaptado_a`|`dirigida_por`|`actuó_en`*..6]-(b))
RETURN [n IN nodes(path) | {
         tipo: head([l IN labels(n) WHERE l IN ['Persona', 'Libro', 'Película']]),
         id: coalesce(n.persona_id, n.obra_id),
         nombre: n.nombre,
         foto_url: n.foto_url }] AS nodos,
       [r IN relationships(path) | type(r)] AS relaciones
