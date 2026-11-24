// CG-01: buscar obras por el nombre de una persona (RF-05). No distingue el rol: devuelve las obras
// que escribió, dirigió o donde actuó. $texto es la consulta Lucene del índice persona_nombre_texto:
// la API la sanea (quita caracteres especiales de Lucene) antes de pasarla.
CALL db.index.fulltext.queryNodes('persona_nombre_texto', $texto) YIELD node AS p
CALL {
  WITH p
  MATCH (p)-[:escribió]->(o:Libro)
  RETURN o.obra_id AS obra_id, 'libro' AS tipo, 'escribió' AS vinculo
  UNION
  WITH p
  MATCH (o:`Película`)-[:dirigida_por]->(p)
  RETURN o.obra_id AS obra_id, 'pelicula' AS tipo, 'dirigida_por' AS vinculo
  UNION
  WITH p
  MATCH (p)-[:`actuó_en`]->(o:`Película`)
  RETURN o.obra_id AS obra_id, 'pelicula' AS tipo, 'actuó_en' AS vinculo
}
RETURN obra_id, tipo, vinculo, p.persona_id AS persona_id, p.nombre AS nombre, p.foto_url AS foto_url
ORDER BY nombre, obra_id, vinculo
