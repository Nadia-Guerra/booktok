// CG-08: recomendar libros a dos saltos de los que le gustaron al usuario, por adaptaciones del mismo director (RF-26, paso 2).
// Camino: (Libro de partida)-[:adaptado_a]->(Película)-[:dirigida_por]->(Persona)<-[:dirigida_por]-(Película)<-[:adaptado_a]-(Libro recomendado).
// $libros_partida: lista corta de obra_id de libros (máximo 20) que entrega O18 del relacional: libros terminados, con
//   calificación de 4 o más y reseña no oculta (RN-11). $usuario_id sirve para excluir los libros que ya leyó.
// Excluye los propios libros de partida (un libro con dos adaptaciones del mismo director volvería a salir a sí mismo).
// Un libro puede alcanzarse desde varios libros de partida o por varios directores: devuelve una fila por
// (libro recomendado, libro de partida, director) y la API agrupa por libro recomendado (05-cardinalidad.md).
MATCH (partida:Libro)
WHERE partida.obra_id IN $libros_partida
MATCH (partida)-[:adaptado_a]->(:`Película`)-[:dirigida_por]->(d:Persona)<-[:dirigida_por]-(:`Película`)<-[:adaptado_a]-(rec:Libro)
WHERE NOT rec.obra_id IN $libros_partida
  AND NOT EXISTS { (:Usuario {usuario_id: $usuario_id})-[:leyó]->(rec) }
RETURN DISTINCT rec.obra_id AS obra_id, partida.obra_id AS partida_id,
       d.persona_id AS persona_id, d.nombre AS nombre, d.foto_url AS foto_url
ORDER BY obra_id, partida_id, nombre, persona_id
