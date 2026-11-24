// =============================================================================
// 02-indices.js: índices de la base documental (IX-01 a IX-05).
// Diseño y justificación: docs/modelado/documental/05-indices.md.
// Cada colección ya tiene su índice sobre `_id`. Requiere 01-colecciones.js.
// Opera sobre la base `db` actual. Se puede repetir: createIndex con la misma definición no falla.
// =============================================================================

// IX-01 e IX-02: búsqueda por título (AP-03). default_language "none": los títulos están en
// varios idiomas y así no se aplican palabras vacías ni raíces de un solo idioma.
db.libros.createIndex({ titulo: "text" }, { name: "ix_libros_titulo_texto", default_language: "none" });
db.peliculas.createIndex({ titulo: "text" }, { name: "ix_peliculas_titulo_texto", default_language: "none" });

// IX-03: ISBN único entre libros (D-08). SPARSE y no parcial: el filtro parcial se evalúa por
// documento y no por edición, y un libro con una edición sin ISBN indexaría un nulo que el índice
// único solo admite una vez (comprobado en 05-indices.md, sección 2).
db.libros.createIndex({ "ediciones.isbn": 1 }, { name: "ix_libros_isbn", unique: true, sparse: true });

// IX-04: una comparativa por usuario y pareja libro-película (RN-05). Su prefijo usuario_id
// sirve además a AP-23, AP-28 y AP-33.
db.resenas_comparativas.createIndex(
  { usuario_id: 1, libro_id: 1, pelicula_id: 1 },
  { name: "ix_comp_unica", unique: true }
);

// IX-05: comparativas de una adaptación, recientes primero (AP-21), ya ordenadas por el índice.
db.resenas_comparativas.createIndex(
  { libro_id: 1, pelicula_id: 1, creado_en: -1 },
  { name: "ix_comp_adaptacion" }
);

print("Índices creados en la base '" + db.getName() + "'.");
