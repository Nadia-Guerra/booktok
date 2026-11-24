// =============================================================================
// Consultas representativas del documental sobre la SEMILLA, con resultado esperado.
// Fuente de las consultas: docs/modelado/documental/01-patrones-de-acceso.md (AP-01 a AP-05, AP-21, AP-23).
// A diferencia de las demás pruebas de esta carpeta, NO usa la base aparte dlbp_pruebas ni la borra:
// lee la base de la aplicación con los datos de demostración de 03-semilla.js y no escribe nada.
// Requiere la semilla cargada (db/scripts/cargar-semilla.ps1). Los datos: db/semilla/semilla.json.
// Ejecutar con: sh /db/documental/mongo.sh pruebas/04-consultas-semilla.js
//
// Ids de la semilla: libros b1000000-0000-4000-8000-0000000000NN, películas f1..., usuarios c1..., comparativas ca...
// (01 Dune, 04 Historia de tu vida, 11 Neuromante en borrador; ver el encabezado de grafo/pruebas/semilla/01-consultas.cypher).
// =============================================================================

const RESULTADOS = [];
function registrar(prueba, descripcion, esperado, obtenido) {
  RESULTADOS.push({ prueba, descripcion, esperado: String(esperado), obtenido: String(obtenido), ok: String(esperado) === String(obtenido) });
}
const id = (prefijo, n) => prefijo + "000000-0000-4000-8000-" + String(n).padStart(12, "0");
const titulos = (docs) => docs.map(d => d.titulo).sort().join(" | ");
const cortos = (docs) => docs.map(d => d._id.slice(-2)).join(", ");      // los dos últimos dígitos del id
const plan = (explicacion) => JSON.stringify(explicacion.queryPlanner.winningPlan);
function usa(consulta, indice) {
  const p = plan(consulta.explain("executionStats"));
  const usaIndice = indice === "_id" ? (p.includes("IDHACK") || p.includes('"indexName":"_id_"')) : p.includes('"indexName":"' + indice + '"');
  return usaIndice && !p.includes("COLLSCAN") ? "usa " + indice : "NO usa " + indice + ": " + p.slice(0, 160);
}

// ---------------------------------------------------------------- la semilla está cargada
registrar("S-00a", "Hay 11 libros, 12 películas y 5 comparativas", "11, 12, 5",
  [db.libros.countDocuments(), db.peliculas.countDocuments(), db.resenas_comparativas.countDocuments()].join(", "));
registrar("S-00b", "Fichas en borrador: 1 libro y 1 película (Neuromante)", "1, 1",
  [db.libros.countDocuments({ estado_publicacion: "borrador" }), db.peliculas.countDocuments({ estado_publicacion: "borrador" })].join(", "));

// ------------------------------------------------------------------------------- AP-01
const dune = db.libros.findOne({ _id: id("b1", 1) });
registrar("S-AP01a", "AP-01: ficha completa de Dune con sus 2 ediciones (una con ISBN y una sin él)", "Dune | 2 ediciones | 1 con isbn",
  dune.titulo + " | " + dune.ediciones.length + " ediciones | " + dune.ediciones.filter(e => e.isbn !== undefined).length + " con isbn");
registrar("S-AP01b", "AP-01: una ficha de libro sin portada no trae portada_url (Historia de tu vida)", "sin portada_url",
  db.libros.findOne({ _id: id("b1", 4) }).portada_url === undefined ? "sin portada_url" : "con portada_url");
registrar("S-AP01c", "AP-01: el campo estado_publicacion distingue la ficha en borrador (Neuromante, libro 11)", "borrador",
  db.libros.findOne({ _id: id("b1", 11) }).estado_publicacion);

// ------------------------------------------------------------------------------- AP-02
const dune21 = db.peliculas.findOne({ _id: id("f1", 1) });
registrar("S-AP02a", "AP-02: ficha de Dune (2021) con su reparto copiado, ordenado y con foto", "2 actores | Timothée Chalamet (Paul Atreides) | con foto",
  dune21.reparto.length + " actores | " + dune21.reparto[0].nombre + " (" + dune21.reparto[0].personaje + ") | " + (dune21.reparto[0].foto_url ? "con foto" : "sin foto"));
const orgullo = db.peliculas.findOne({ _id: id("f1", 9) });
registrar("S-AP02b", "AP-02: un actor sin foto no lleva foto_url en el reparto (Macfadyen, película 9)", "Matthew Macfadyen | sin foto_url",
  orgullo.reparto[1].nombre + " | " + (orgullo.reparto[1].foto_url === undefined ? "sin foto_url" : "con foto_url"));
registrar("S-AP02c", "AP-02: datos técnicos de Dune (2021)", "inglés | Estados Unidos, Canadá | PG-13 | 155 min",
  dune21.datos_tecnicos.idioma_original + " | " + dune21.datos_tecnicos.paises.join(", ") + " | " + dune21.datos_tecnicos.clasificacion + " | " + dune21.duracion_min + " min");
registrar("S-AP02d", "AP-02: la ficha en borrador no tiene reparto todavía (Neuromante, película 12)", "borrador | 0 actores",
  (p => p.estado_publicacion + " | " + p.reparto.length + " actores")(db.peliculas.findOne({ _id: id("f1", 12) })));

// ------------------------------------------------------------------------------- AP-03
const buscarLibros = (t, soloPublicadas) => db.libros.find(Object.assign({ $text: { $search: t } }, soloPublicadas ? { estado_publicacion: "publicada" } : {})).toArray();
const buscarPelis = (t, soloPublicadas) => db.peliculas.find(Object.assign({ $text: { $search: t } }, soloPublicadas ? { estado_publicacion: "publicada" } : {})).toArray();
registrar("S-AP03a", "AP-03: 'dune' (visitante) encuentra el libro y las 2 películas publicadas", "libros: Dune ; películas: Dune | Dune: Parte dos",
  "libros: " + titulos(buscarLibros("dune", true)) + " ; películas: " + titulos(buscarPelis("dune", true)));
registrar("S-AP03b", "AP-03: 'MARCIANO' en mayúsculas encuentra el libro y la película", "1 libro, 1 película",
  buscarLibros("MARCIANO", true).length + " libro, " + buscarPelis("MARCIANO", true).length + " película");
registrar("S-AP03c", "AP-03: 'expiacion' sin tilde encuentra Expiación", "Expiación",
  titulos(buscarLibros("expiacion", true)));
registrar("S-AP03d", "AP-03: 'neuromante' no muestra los borradores a un visitante", "0 libros, 0 películas",
  buscarLibros("neuromante", true).length + " libros, " + buscarPelis("neuromante", true).length + " películas");
registrar("S-AP03e", "AP-03: el administrador sí ve los borradores", "1 libro, 1 película",
  buscarLibros("neuromante", false).length + " libro, " + buscarPelis("neuromante", false).length + " película");
registrar("S-AP03f", "AP-03: 'dun' (parte de una palabra) no encuentra nada: limitación conocida del índice de texto", "0",
  buscarLibros("dun", true).length + buscarPelis("dun", true).length);
registrar("S-AP03g", "AP-03: 'orgullo prejuicio' encuentra el libro y la película", "Orgullo y prejuicio | Orgullo y prejuicio",
  [buscarLibros("orgullo prejuicio", true), buscarPelis("orgullo prejuicio", true)].map(titulos).join(" | "));

// ------------------------------------------------------------------------------- AP-04
const ids04 = [id("b1", 1), id("f1", 1), id("b1", 4), id("f1", 5)];
const porIds = db.libros.find({ _id: { $in: ids04 } }, { titulo: 1, anio_publicacion_original: 1, portada_url: 1 }).toArray().concat(
  db.peliculas.find({ _id: { $in: ids04 } }, { titulo: 1, anio_estreno: 1, portada_url: 1 }).toArray());
registrar("S-AP04a", "AP-04: datos de presentación de 4 obras (2 libros y 2 películas) a partir de sus ids", "Dune | Dune | Historia de tu vida | La llegada",
  porIds.map(d => d.titulo).sort().join(" | "));
registrar("S-AP04b", "AP-04: el id de una película buscado en la colección de libros no devuelve nada", "0",
  db.libros.find({ _id: id("f1", 1) }).toArray().length);

// ------------------------------------------------------------------------------- AP-05
const existe = (coleccion, oid) => { const d = db.getCollection(coleccion).findOne({ _id: oid }, { estado_publicacion: 1 }); return d ? "existe, " + d.estado_publicacion : "no existe"; };
registrar("S-AP05a", "AP-05: el libro 1 existe y está publicado", "existe, publicada", existe("libros", id("b1", 1)));
registrar("S-AP05b", "AP-05: el libro 11 (Neuromante) existe y está en borrador", "existe, borrador", existe("libros", id("b1", 11)));
registrar("S-AP05c", "AP-05: la película 12 (Neuromante) existe y está en borrador", "existe, borrador", existe("peliculas", id("f1", 12)));
registrar("S-AP05d", "AP-05: el id de un libro no existe en la colección de películas", "no existe", existe("peliculas", id("b1", 1)));

// ------------------------------------------------------------------------------- AP-21
const ap21 = (libro, pelicula, ver_ocultas) => db.resenas_comparativas
  .find(Object.assign({ libro_id: id("b1", libro), pelicula_id: id("f1", pelicula) }, ver_ocultas ? {} : { oculta: false })).sort({ creado_en: -1 }).toArray();
registrar("S-AP21a", "AP-21: comparativas de Dune (libro 1) y Dune 2021 (película 1), la más reciente primero (Marta, luego Ana)", "02, 01",
  cortos(ap21(1, 1, false)));
registrar("S-AP21b", "AP-21: el veredicto y los aspectos de la más reciente", "pelicula | 2 aspectos | Banda sonora (5)",
  (c => c.veredicto.preferencia + " | " + c.aspectos.length + " aspectos | " + c.aspectos[1].nombre + " (" + c.aspectos[1].puntuacion + ")")(ap21(1, 1, false)[0]));
registrar("S-AP21c", "AP-21: la comparativa oculta (Elena, libro 9 y película 10) no se lista a un lector", "0",
  ap21(9, 10, false).length);
registrar("S-AP21d", "AP-21: el administrador sí ve la oculta", "05", cortos(ap21(9, 10, true)));
registrar("S-AP21e", "AP-21: una pareja sin comparativas (Dune y El marciano, no unidas por adaptación) devuelve 0", "0",
  ap21(1, 4, true).length);
registrar("S-AP21f", "AP-21: usa el índice IX-05 (ix_comp_adaptacion)", "usa ix_comp_adaptacion",
  usa(db.resenas_comparativas.find({ libro_id: id("b1", 1), pelicula_id: id("f1", 1), oculta: false }).sort({ creado_en: -1 }), "ix_comp_adaptacion"));

// ------------------------------------------------------------------------------- AP-23
const ap23 = (usuario, ver_ocultas) => db.resenas_comparativas
  .find(Object.assign({ usuario_id: id("c1", usuario) }, ver_ocultas ? {} : { oculta: false })).sort({ creado_en: -1 }).toArray();
registrar("S-AP23a", "AP-23: comparativas de Ana (usuario 2)", "01", cortos(ap23(2, false)));
registrar("S-AP23b", "AP-23: otro lector no ve la comparativa oculta de Elena (usuario 8)", "0", ap23(8, false).length);
registrar("S-AP23c", "AP-23: la propia Elena (o el administrador) sí la ve", "05", cortos(ap23(8, true)));
registrar("S-AP23d", "AP-23: un usuario sin comparativas (Sofía, usuario 6) devuelve 0", "0", ap23(6, true).length);
registrar("S-AP23e", "AP-23: usa el índice IX-04 (ix_comp_unica) por su prefijo usuario_id", "usa ix_comp_unica",
  usa(db.resenas_comparativas.find({ usuario_id: id("c1", 2) }), "ix_comp_unica"));

// ------------------------------------------------------------------------------- ISBN (D-08)
registrar("S-IX03a", "ISBN: 8 libros tienen al menos una edición con ISBN", "8",
  db.libros.countDocuments({ "ediciones.isbn": { $exists: true } }));
registrar("S-IX03b", "ISBN: 3 libros no tienen ninguno (2 con ediciones sin ISBN y el borrador sin ediciones): el índice sparse los admite", "3",
  db.libros.countDocuments({ "ediciones.isbn": { $exists: false } }));
registrar("S-IX03c", "ISBN: buscar uno encuentra su libro y usa el índice IX-03", "Dune | usa ix_libros_isbn",
  db.libros.findOne({ "ediciones.isbn": "9780441172719" }).titulo + " | " +
  usa(db.libros.find({ "ediciones.isbn": "9780441172719" }), "ix_libros_isbn"));

// ---------------------------------------------------------------- resultados
print("\nConsultas del documental sobre la semilla  (MongoDB " + db.version() + ", base '" + db.getName() + "')\n");
for (const r of RESULTADOS) {
  print((r.ok ? "PASA  " : "FALLA ") + r.prueba.padEnd(9) + r.descripcion);
  if (!r.ok) print("      esperado: " + r.esperado + "\n      obtenido: " + r.obtenido);
  else print("      -> " + r.obtenido);
}
const fallan = RESULTADOS.filter(r => !r.ok).length;
print("\nPasan " + (RESULTADOS.length - fallan) + " de " + RESULTADOS.length + ", fallan " + fallan + ".");
quit(fallan === 0 ? 0 : 1);
