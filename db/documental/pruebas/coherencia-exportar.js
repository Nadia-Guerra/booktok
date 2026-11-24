// =============================================================================
// Exporta de MongoDB lo que db/scripts/coherencia.ps1 compara con las otras dos bases.
// Solo lee la base de la aplicación y escribe UNA línea de JSON por la salida estándar.
// Ejecutar con: sh /db/documental/mongo.sh pruebas/coherencia-exportar.js
// =============================================================================

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const idsMalFormados = [];
const revisar = (donde, valor) => { if (typeof valor !== "string" || !UUID.test(valor)) idsMalFormados.push(donde + "=" + valor); };

const fichas = [];
db.libros.find().forEach(d => {
  revisar("libros._id", d._id);
  d.ediciones.forEach(e => revisar("libros.ediciones.edicion_id", e.edicion_id));
  fichas.push({
    id: d._id, tipo: "libro", estado: d.estado_publicacion, titulo: d.titulo,
    isbns: d.ediciones.filter(e => e.isbn !== undefined).map(e => e.isbn)
  });
});
db.peliculas.find().forEach(d => {
  revisar("peliculas._id", d._id);
  d.reparto.forEach(r => revisar("peliculas.reparto.persona_id", r.persona_id));
  fichas.push({
    id: d._id, tipo: "pelicula", estado: d.estado_publicacion, titulo: d.titulo,
    reparto: d.reparto.map(r => ({
      persona_id: r.persona_id, nombre: r.nombre, personaje: r.personaje, orden: r.orden,
      foto_url: r.foto_url === undefined ? null : r.foto_url
    }))
  });
});

const comparativas = [];
db.resenas_comparativas.find().forEach(c => {
  revisar("resenas_comparativas._id", c._id);
  revisar("resenas_comparativas.usuario_id", c.usuario_id);
  revisar("resenas_comparativas.libro_id", c.libro_id);
  revisar("resenas_comparativas.pelicula_id", c.pelicula_id);
  comparativas.push({ id: c._id, usuario_id: c.usuario_id, libro_id: c.libro_id, pelicula_id: c.pelicula_id });
});

print(JSON.stringify({ fichas, comparativas, idsMalFormados }));
