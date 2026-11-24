// CG-02: buscar personas por nombre, para reutilizar una existente antes de registrar otra (RF-10, D-15).
// La foto ayuda a distinguir homónimos. $texto: consulta Lucene ya saneada por la API.
CALL db.index.fulltext.queryNodes('persona_nombre_texto', $texto) YIELD node AS p
RETURN p.persona_id AS persona_id, p.nombre AS nombre, p.foto_url AS foto_url
ORDER BY nombre, persona_id
