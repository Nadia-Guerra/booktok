// =============================================================================
// Controles negativos: demuestran que las pruebas de 01 y 02 detectan los problemas que dicen evitar.
// Cada control cambia UNA decisión del diseño en la base de pruebas y comprueba que el resultado empeora.
// Fuente: docs/modelado/documental/05-indices.md, sección 2 (IX-03) y 04-validacion.md (sección 4).
// Se ejecuta con: docker exec dlbp-mongo sh /db/documental/mongo.sh pruebas/03-controles.js
// =============================================================================
load("/db/documental/pruebas/00-ayudas.js");

const libroCon = (id, ediciones) => { const d = libroBase(); d._id = id; d.titulo = "Libro " + id; d.ediciones = ediciones; return d; };
const edicion = (n, isbn) => Object.assign(
  { edicion_id: uid(700 + n), paginas: 1, editorial: "e", idioma: "es", anio: 2000 }, isbn ? { isbn } : {});

// ---- C1: sin SPARSE, el índice único de ISBN rechaza libros legítimos (por qué IX-03 es sparse) ----
db.libros.dropIndex("ix_libros_isbn");
db.libros.createIndex({ "ediciones.isbn": 1 }, { name: "ix_libros_isbn", unique: true });          // único normal
vaciar();
registrar("C1", "Único SIN sparse: dos libros con ediciones sin ISBN => el segundo falla (con sparse pasa: prueba 3)",
  "aceptado, rechazado 11000",
  [intentar(() => db.libros.insertOne(libroCon(uid(1), [edicion(1)]))),
   intentar(() => db.libros.insertOne(libroCon(uid(2), [edicion(2)])))].join(", "));

// ---- C2: un índice parcial (la idea original de D-08) tampoco sirve con arreglos de subdocumentos ----
db.libros.dropIndex("ix_libros_isbn");
db.libros.createIndex({ "ediciones.isbn": 1 }, { name: "ix_libros_isbn", unique: true,
  partialFilterExpression: { "ediciones.isbn": { $exists: true } } });
vaciar();
registrar("C2", "Único PARCIAL (D-08 original): dos libros que mezclan edición con ISBN y sin él => el segundo falla",
  "aceptado, rechazado 11000",
  [intentar(() => db.libros.insertOne(libroCon(uid(1), [edicion(1, "9780441172719"), edicion(2)]))),
   intentar(() => db.libros.insertOne(libroCon(uid(2), [edicion(3, "9780306406157"), edicion(4)])))].join(", "));

// ---- C3: sin el validador, un documento inválido se guarda en silencio ----------------------
db.libros.dropIndex("ix_libros_isbn");
db.runCommand({ collMod: "libros", validator: {}, validationLevel: "off" });
vaciar();
const sinTitulo = libroBase(); delete sinTitulo.titulo; sinTitulo.estado_publicacion = "archivada";
registrar("C3", "Sin validador: un libro sin título y con estado inválido SE ACEPTA (con validador: pruebas 2a y 4)",
  "aceptado", intentar(() => db.libros.insertOne(sinTitulo)));

terminar("Controles negativos documentales");
