// =============================================================================
// Pruebas de índices documentales: unicidades, búsqueda por texto y planes (explain).
// Fuente: docs/modelado/documental/05-indices.md, secciones 6 y 7 (pruebas 1 a 9).
// Se ejecuta con: docker exec dlbp-mongo sh /db/documental/mongo.sh pruebas/02-indices.js
// Termina con código 1 si alguna prueba falla.
// =============================================================================
load("/db/documental/pruebas/00-ayudas.js");

const U1 = uid(901), U2 = uid(902);
const LIBRO_ID = "6f1d7a52-3c0e-4b8a-9a1e-0b2c4d5e6f01";
const PELI_ID = "9a8c3e17-5b2d-4f60-8e3a-1c7d9b0a2f02";

function libro(id, titulo, ediciones) {
  const d = libroBase(); d._id = id; d.titulo = titulo; d.ediciones = ediciones; return d;
}
const ed = (n, isbn) => Object.assign(
  { edicion_id: uid(500 + n), paginas: 100, editorial: "Ed", idioma: "es", anio: 2000 }, isbn ? { isbn } : {});

// ---- 1 a 4: ISBN único y sparse (IX-03, D-08) -----------------------------------------
vaciar();
db.libros.insertOne(libro(uid(1), "Libro uno", [ed(1, "9780441172719")]));
registrar("1", "Insertar un libro con un ISBN que ya tiene otro libro", RECHAZO_DUPLICADO,
  intentar(() => db.libros.insertOne(libro(uid(2), "Libro dos", [ed(2, "9780441172719")]))));

vaciar();
registrar("2", "Dos libros con una edición con ISBN y otra sin él", "aceptado, aceptado",
  [intentar(() => db.libros.insertOne(libro(uid(1), "Libro uno", [ed(1, "9780441172719"), ed(2)]))),
   intentar(() => db.libros.insertOne(libro(uid(2), "Libro dos", [ed(3, "9780306406157"), ed(4)])))].join(", "));

vaciar();
registrar("3", "Dos libros cuyas ediciones no tienen ISBN, y dos libros sin ediciones",
  "aceptado, aceptado, aceptado, aceptado",
  [intentar(() => db.libros.insertOne(libro(uid(1), "Sin isbn uno", [ed(1)]))),
   intentar(() => db.libros.insertOne(libro(uid(2), "Sin isbn dos", [ed(2)]))),
   intentar(() => db.libros.insertOne(libro(uid(3), "Sin ediciones uno", []))),
   intentar(() => db.libros.insertOne(libro(uid(4), "Sin ediciones dos", [])))].join(", "));

vaciar();
db.libros.insertOne(libro(uid(1), "Libro uno", [ed(1, "9780441172719")]));
db.libros.insertOne(libro(uid(2), "Libro dos", [ed(2)]));
registrar("4", "Agregar a un libro, con una actualización, un ISBN que ya tiene otro libro", RECHAZO_DUPLICADO,
  intentar(() => db.libros.updateOne({ _id: uid(2) }, { $push: { ediciones: ed(5, "9780441172719") } })));

// ---- 5 y 6: una comparativa por usuario y pareja (IX-04, RN-05) -----------------------
vaciar();
const comp = (id, usuario) => { const c = comparativaBase(); c._id = id; c.usuario_id = usuario; return c; };
db.resenas_comparativas.insertOne(comp(uid(601), U1));
registrar("5", "Segunda comparativa del mismo usuario sobre la misma pareja (RN-05)", RECHAZO_DUPLICADO,
  intentar(() => db.resenas_comparativas.insertOne(comp(uid(602), U1))));
registrar("6", "Comparativa de otro usuario sobre la misma pareja", "aceptado",
  intentar(() => db.resenas_comparativas.insertOne(comp(uid(603), U2))));

// ---- 7 y 8: búsqueda por texto (IX-01, IX-02) -----------------------------------------
vaciar();
db.libros.insertMany([
  libro(uid(11), "Dune", [ed(11)]),
  libro(uid(12), "Dúne: Parte Dos", [ed(12)]),
  libro(uid(13), "Los juegos del hambre", [ed(13)]),
  libro(uid(14), "Otro libro cualquiera", [ed(14)])
]);
const buscar = (texto) => db.libros.find({ $text: { $search: texto } }).toArray().map(d => d.titulo).sort().join(" | ");
registrar("7a", "Buscar 'dune'", "Dune | Dúne: Parte Dos", buscar("dune"));
registrar("7b", "Buscar 'DUNE' (mayúsculas)", "Dune | Dúne: Parte Dos", buscar("DUNE"));
registrar("7c", "Buscar 'juegos hambre'", "Los juegos del hambre", buscar("juegos hambre"));
const pel = peliculaBase(); pel._id = uid(21); pel.titulo = "Dune: Parte Dos";
db.peliculas.insertOne(pel);
registrar("7d", "Buscar 'dune' en películas (IX-02)", "Dune: Parte Dos",
  db.peliculas.find({ $text: { $search: "dune" } }).toArray().map(d => d.titulo).join(" | "));
registrar("8", "Buscar 'dun' (parte de una palabra): sin resultados, limitación conocida", "0",
  String(db.libros.find({ $text: { $search: "dun" } }).toArray().length));

// ---- 9: planes de consulta (explain) --------------------------------------------------
// Con datos de volumen: 500 libros, 500 películas y 1 000 comparativas de 200 usuarios.
vaciar();
db.libros.insertMany(Array.from({ length: 500 }, (_, i) =>
  libro(uid(1000 + i), "Relleno número " + i, [ed(i, String(9780000000000 + i))])));
db.peliculas.insertMany(Array.from({ length: 500 }, (_, i) => {
  const p = peliculaBase(); p._id = uid(2000 + i); p.titulo = "Película de relleno " + i; return p; }));
db.resenas_comparativas.insertMany(Array.from({ length: 1000 }, (_, i) => {
  const c = comparativaBase(); c._id = uid(3000 + i);
  c.usuario_id = uid(4000 + (i % 200));             // 200 usuarios
  c.libro_id = uid(1000 + Math.floor(i / 200));     // 5 parejas distintas
  c.pelicula_id = uid(2000 + Math.floor(i / 200));
  c.creado_en = new Date(AHORA.getTime() + i * 60000);
  return c; }));
db.libros.insertOne(libro(uid(9001), "Dune", [ed(9001, "9780441172719")]));

const plan = (explicacion) => JSON.stringify(explicacion.queryPlanner.winningPlan);
const stats = (explicacion) => explicacion.executionStats;
function usa(consulta, indice) {
  const p = plan(consulta.explain("executionStats"));
  const usaIndice = indice === "_id" ? (p.includes("IDHACK") || p.includes('"indexName":"_id_"')) : p.includes('"indexName":"' + indice + '"');
  return usaIndice && !p.includes("COLLSCAN") ? "usa " + indice : "NO usa " + indice + ": " + p.slice(0, 160);
}

registrar("9-AP01", "Libro por _id (AP-01)", "usa _id", usa(db.libros.find({ _id: uid(1000) }), "_id"));
registrar("9-AP02", "Película por _id (AP-02)", "usa _id", usa(db.peliculas.find({ _id: uid(2000) }), "_id"));
registrar("9-AP04", "Varias obras por una lista de ids (AP-04)", "usa _id",
  usa(db.libros.find({ _id: { $in: [uid(1000), uid(1001), uid(1002)] } }), "_id"));
registrar("9-AP20", "Comparativa por _id (AP-20)", "usa _id", usa(db.resenas_comparativas.find({ _id: uid(3000) }), "_id"));
registrar("9-AP03", "Búsqueda por título en libros (AP-03)", "usa ix_libros_titulo_texto",
  usa(db.libros.find({ $text: { $search: "dune" } }), "ix_libros_titulo_texto"));
registrar("9-AP03b", "Búsqueda por título en películas (AP-03)", "usa ix_peliculas_titulo_texto",
  usa(db.peliculas.find({ $text: { $search: "dune" } }), "ix_peliculas_titulo_texto"));
registrar("9-AP11", "ISBN existente en otro libro (AP-11)", "usa ix_libros_isbn",
  usa(db.libros.find({ "ediciones.isbn": "9780441172719" }), "ix_libros_isbn"));
registrar("9-AP19", "Comparativa de un usuario sobre una pareja (AP-19)", "usa ix_comp_unica",
  usa(db.resenas_comparativas.find({ usuario_id: uid(4000), libro_id: uid(1000), pelicula_id: uid(2000) }), "ix_comp_unica"));

const ap21 = db.resenas_comparativas.find({ libro_id: uid(1000), pelicula_id: uid(2000), oculta: false }).sort({ creado_en: -1 });
const ap21Plan = plan(ap21.explain("executionStats"));
registrar("9-AP21", "Comparativas de una adaptación, recientes primero (AP-21)", "usa ix_comp_adaptacion",
  usa(db.resenas_comparativas.find({ libro_id: uid(1000), pelicula_id: uid(2000), oculta: false }).sort({ creado_en: -1 }), "ix_comp_adaptacion"));
registrar("9-AP21b", "AP-21 sin ordenar en memoria (el índice ya entrega el orden)", "sin SORT",
  ap21Plan.includes('"stage":"SORT"') ? "con SORT" : "sin SORT");
const ap21Resultado = db.resenas_comparativas.find({ libro_id: uid(1000), pelicula_id: uid(2000), oculta: false })
  .sort({ creado_en: -1 }).limit(3).toArray().map(c => c.creado_en.getTime());
registrar("9-AP21c", "AP-21 devuelve de más reciente a más antigua", "descendente",
  ap21Resultado[0] > ap21Resultado[1] && ap21Resultado[1] > ap21Resultado[2] ? "descendente" : "desordenado");

registrar("9-AP23", "Comparativas de un usuario (AP-23): prefijo de IX-04", "usa ix_comp_unica",
  usa(db.resenas_comparativas.find({ usuario_id: uid(4000) }), "ix_comp_unica"));
registrar("9-AP28", "Borrado por usuario (AP-28): prefijo de IX-04", "usa ix_comp_unica",
  usa(db.resenas_comparativas.find({ usuario_id: uid(4000) }), "ix_comp_unica"));
registrar("9-AP28b", "AP-28 repetido no falla y la segunda vez no borra nada", "borrados=5, borrados=0",
  [db.resenas_comparativas.deleteMany({ usuario_id: uid(4000) }).deletedCount,
   db.resenas_comparativas.deleteMany({ usuario_id: uid(4000) }).deletedCount].map(n => "borrados=" + n).join(", "));

const ap33 = db.runCommand({ explain: { distinct: "resenas_comparativas", key: "usuario_id" }, verbosity: "executionStats" });
registrar("9-AP33", "Usuarios con comparativas (AP-33): recorre solo el índice, sin leer documentos",
  "ix_comp_unica, 0 documentos leídos",
  (JSON.stringify(ap33.queryPlanner.winningPlan).includes('"indexName":"ix_comp_unica"') ? "ix_comp_unica" : "otro plan") + ", " +
  ap33.executionStats.totalDocsExamined + " documentos leídos");
registrar("9-AP33b", "AP-33 devuelve los 199 usuarios restantes (200 menos el borrado en AP-28)", "199",
  String(db.resenas_comparativas.distinct("usuario_id").length));

terminar("Pruebas de índices documentales");
