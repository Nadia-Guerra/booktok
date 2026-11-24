// CG-21: leer el reparto de todas las películas, por lotes, para compararlo con la ficha (RNF-03, AP-32).
// Una fila por película (también las que no tienen reparto: devuelve []), con el reparto ordenado por `orden` y la
// foto de cada actor si la tiene (si no, foto_url es nulo). Es la lectura masiva de CG-20.
// En una versión por lotes, la API añade SKIP $desde LIMIT $limite al final (el ORDER BY obra_id ya está puesto).
MATCH (f:`Película`)
CALL (f) {
  OPTIONAL MATCH (p:Persona)-[r:`actuó_en`]->(f)
  WITH p, r ORDER BY r.orden, p.persona_id
  RETURN collect(CASE WHEN p IS NULL THEN null ELSE
           {persona_id: p.persona_id, nombre: p.nombre, foto_url: p.foto_url, personaje: r.personaje, orden: r.orden}
         END) AS reparto
}
RETURN f.obra_id AS obra_id, reparto
ORDER BY obra_id
