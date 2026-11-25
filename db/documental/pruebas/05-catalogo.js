// =============================================================================
// Entregable 5, catalogo documental: casos normales (n), limite (l) y de error (e) de los 30 patrones de acceso vigentes
// de docs/modelado/documental/01-patrones-de-acceso.md (AP-01 a AP-05, AP-07 a AP-21, AP-23 a AP-30, AP-32 y AP-33).
//
// - Las LECTURAS de la semilla (AP-01 a AP-05, AP-19 a AP-21, AP-23, AP-29, AP-30, AP-32 y AP-33) se hacen sobre la base de la
//   aplicacion (dlbp), que este script NO escribe.
// - Las ESCRITURAS (AP-07 a AP-18, AP-24 a AP-28) se hacen sobre la base aparte dlbp_pruebas, que se construye con los mismos
//   01-colecciones.js y 02-indices.js que se entregan (validador e indices reales) y a la que se COPIAN los documentos de la
//   semilla. Se borra al terminar. MongoDB no tiene transacciones sin replica; por eso no se escribe en dlbp.
// - Un error del validador es el codigo 121 (DocumentValidationFailure); una clave duplicada, el 11000.
// - El esperado de cada caso esta escrito aqui; el obtenido lo produce el motor.
//
// Un solo proceso mongosh. Ejecutar con: sh /db/documental/mongo.sh pruebas/05-catalogo.js
// =============================================================================

const APP = db;                                       // base de la aplicacion: solo lectura
load("/db/documental/pruebas/00-ayudas.js");          // deja `db` apuntando a dlbp_pruebas y define registrar, intentar, uid, AHORA...

const id = (prefijo, n) => prefijo + "000000-0000-4000-8000-" + String(n).padStart(12, "0");   // ids de la semilla
const corto = (x) => String(x).slice(-2);
const titulos = (docs) => docs.map(d => d.titulo).sort().join(" | ");
const plan = (explicacion) => JSON.stringify(explicacion.queryPlanner.winningPlan);

// Resultado de un updateOne: cuantos documentos coincidieron y cuantos cambiaron; o el codigo si se rechazo.
function upd(escritura) {
  try { const r = escritura(); return "coincidencias=" + r.matchedCount + " modificados=" + r.modifiedCount; }
  catch (e) { return "rechazado " + (e.code !== undefined ? e.code : e.message); }
}
const borrados = (r) => "borrados=" + r.deletedCount;

// Restaura dlbp_pruebas: las tres colecciones vuelven a ser copia exacta de la semilla.
function restaurar() {
  vaciar();
  for (const c of ["libros", "peliculas", "resenas_comparativas"]) {
    const docs = APP.getCollection(c).find().toArray();
    if (docs.length) db.getCollection(c).insertMany(docs);
  }
}

// Fichas y comparativa nuevas, validas, para los casos de escritura
const libroNuevo = (n) => ({ _id: uid(n), titulo: "Libro de prueba " + n, sinopsis: "Sinopsis de prueba.", generos: ["prueba"],
  anio_publicacion_original: 2000, ediciones: [], estado_publicacion: "borrador", creado_en: AHORA, actualizado_en: AHORA });
const peliculaNueva = (n) => ({ _id: uid(n), titulo: "Pelicula de prueba " + n, sinopsis: "Sinopsis de prueba.", generos: ["prueba"],
  anio_estreno: 2020, duracion_min: 100, plataformas: [], datos_tecnicos: { idioma_original: "español", paises: ["México"] },
  reparto: [], estado_publicacion: "borrador", creado_en: AHORA, actualizado_en: AHORA });
const edicionNueva = (n, isbn) => Object.assign({ edicion_id: uid(n), paginas: 100, editorial: "Editorial de prueba", idioma: "español", anio: 2020 },
  isbn ? { isbn } : {});
const actor = (n, orden, conFoto) => Object.assign({ persona_id: uid(n), nombre: "Actor " + n, personaje: "Personaje " + n, orden },
  conFoto ? { foto_url: "https://almacenamiento.ejemplo.com/personas/" + n + ".jpg" } : {});
const comparativaNueva = (n, usuario, libro, pelicula) => ({ _id: uid(n), usuario_id: usuario, libro_id: libro, pelicula_id: pelicula,
  veredicto: { preferencia: "libro" }, aspectos: [{ nombre: "Final" }], oculta: false, creado_en: AHORA, actualizado_en: AHORA });

const DUNE = id("b1", 1), DUNE21 = id("f1", 1), NEUROMANTE = id("b1", 11), NEUROMANTE_P = id("f1", 12);
const ANA = id("c1", 2), ELENA = id("c1", 8), LUIS = id("c1", 3);

// ============================================================================== preparacion
restaurar();
const copiados = [db.libros.countDocuments(), db.peliculas.countDocuments(), db.resenas_comparativas.countDocuments()].join(", ");
registrar("DOC-00", "Preparacion: dlbp_pruebas queda con una copia de la semilla (11 libros, 12 peliculas, 5 comparativas), con validador e indices reales",
  "11, 12, 5", copiados);
const antes = [APP.libros.countDocuments(), APP.peliculas.countDocuments(), APP.resenas_comparativas.countDocuments()].join(", ");
const dune = APP.libros.findOne({ _id: DUNE });
const ISBN_DUNE = dune.ediciones.find(e => e.isbn).isbn;
const ED_CON_ISBN = dune.ediciones.find(e => e.isbn).edicion_id;
const ED_SIN_ISBN = dune.ediciones.find(e => !e.isbn).edicion_id;
const otroLibro = APP.libros.findOne({ _id: { $ne: DUNE }, "ediciones.isbn": { $exists: true } });
const ISBN_OTRO = otroLibro.ediciones.find(e => e.isbn).isbn;
const ISBN_LIBRE = "9780140449136";

// ============================================================================== AP-01 (semilla)
{
  const d = APP.libros.findOne({ _id: DUNE });
  registrar("AP-01-n1", "AP-01: ficha completa de un libro en una sola lectura (Dune)", "Dune | 1965 | 2 ediciones",
    d.titulo + " | " + d.anio_publicacion_original + " | " + d.ediciones.length + " ediciones");
  registrar("AP-01-l1", "AP-01: un libro sin portada no trae el campo portada_url (Historia de tu vida)", "sin portada_url",
    APP.libros.findOne({ _id: id("b1", 4) }).portada_url === undefined ? "sin portada_url" : "con portada_url");
  const n = APP.libros.findOne({ _id: NEUROMANTE });
  registrar("AP-01-l2", "AP-01: una ficha en borrador y sin ediciones tambien se lee (Neuromante)", "borrador | 0 ediciones",
    n.estado_publicacion + " | " + n.ediciones.length + " ediciones");
  registrar("AP-01-e1", "AP-01: un id que no existe no devuelve ficha", "(no existe)",
    APP.libros.findOne({ _id: uid(9999) }) ? "existe" : "(no existe)");
  registrar("AP-01-e2", "AP-01: el id va en minusculas (D-11): el mismo id en mayusculas no encuentra nada", "(no existe)",
    APP.libros.findOne({ _id: DUNE.toUpperCase() }) ? "existe" : "(no existe)");
}

// ============================================================================== AP-02 (semilla)
{
  const p = APP.peliculas.findOne({ _id: DUNE21 });
  registrar("AP-02-n1", "AP-02: ficha completa de una pelicula con reparto, datos tecnicos y clasificacion (Dune 2021)", "2021 | 155 min | 2 actores | PG-13",
    p.anio_estreno + " | " + p.duracion_min + " min | " + p.reparto.length + " actores | " + p.datos_tecnicos.clasificacion);
  const b = APP.peliculas.findOne({ _id: NEUROMANTE_P });
  registrar("AP-02-l1", "AP-02: una ficha en borrador tiene el reparto vacio (Neuromante)", "borrador | 0 actores",
    b.estado_publicacion + " | " + b.reparto.length + " actores");
  const o = APP.peliculas.findOne({ _id: id("f1", 9) });
  registrar("AP-02-l2", "AP-02: un actor sin foto no lleva foto_url en el reparto (Macfadyen)", "Matthew Macfadyen | sin foto_url",
    o.reparto[1].nombre + " | " + (o.reparto[1].foto_url === undefined ? "sin foto_url" : "con foto_url"));
  registrar("AP-02-e1", "AP-02: un id que no existe no devuelve ficha", "(no existe)",
    APP.peliculas.findOne({ _id: uid(9999) }) ? "existe" : "(no existe)");
  registrar("AP-02-e2", "AP-02: el id de un libro buscado en peliculas no devuelve nada", "(no existe)",
    APP.peliculas.findOne({ _id: DUNE }) ? "existe" : "(no existe)");
}

// ============================================================================== AP-03 (semilla)
{
  const buscar = (t, publicadas) => {
    const f = Object.assign({ $text: { $search: t } }, publicadas ? { estado_publicacion: "publicada" } : {});
    return { libros: APP.libros.find(f).toArray(), pelis: APP.peliculas.find(f).toArray() };
  };
  const cuenta = (r) => r.libros.length + " libros, " + r.pelis.length + " películas";
  let r = buscar("dune", true);
  registrar("AP-03-n1", "AP-03: 'dune' (visitante) encuentra el libro y las dos peliculas publicadas", "libros: Dune ; películas: Dune | Dune: Parte dos",
    "libros: " + titulos(r.libros) + " ; películas: " + titulos(r.pelis));
  registrar("AP-03-n2", "AP-03: 'MARCIANO' en mayusculas encuentra el libro y la pelicula", "1 libros, 1 películas", cuenta(buscar("MARCIANO", true)));
  r = buscar("orgullo prejuicio", true);
  registrar("AP-03-l1", "AP-03: varias palabras: 'orgullo prejuicio' encuentra libro y pelicula", "Orgullo y prejuicio | Orgullo y prejuicio",
    titulos(r.libros.concat(r.pelis)));
  registrar("AP-03-l2", "AP-03: sin tilde ('expiacion') encuentra 'Expiación'", "libros: Expiación ; películas: Expiación",
    "libros: " + titulos(buscar("expiacion", true).libros) + " ; películas: " + titulos(buscar("expiacion", true).pelis));
  registrar("AP-03-l3", "AP-03: el administrador (sin filtro de publicacion) si ve los borradores", "1 libros, 1 películas", cuenta(buscar("neuromante", false)));
  registrar("AP-03-e1", "AP-03: un visitante no ve los borradores", "0 libros, 0 películas", cuenta(buscar("neuromante", true)));
  registrar("AP-03-e2", "AP-03: un fragmento de palabra ('dun') no encuentra nada: limitacion conocida del indice de texto", "0 libros, 0 películas", cuenta(buscar("dun", true)));
  registrar("AP-03-e3", "AP-03: un texto vacio no encuentra nada y no falla", "0 libros, 0 películas", cuenta(buscar("", true)));
}

// ============================================================================== AP-04 (semilla)
{
  const presentar = (ids, soloPublicadas) => {
    const f = Object.assign({ _id: { $in: ids } }, soloPublicadas ? { estado_publicacion: "publicada" } : {});
    return APP.libros.find(f).toArray().concat(APP.peliculas.find(f).toArray());
  };
  registrar("AP-04-n1", "AP-04: datos de presentacion de 4 obras (2 libros y 2 peliculas) a partir de sus ids", "Dune | Dune | Historia de tu vida | La llegada",
    titulos(presentar([DUNE, id("b1", 4), DUNE21, id("f1", 5)], true)));
  registrar("AP-04-l1", "AP-04: una lista vacia de ids no devuelve nada", "0 obras", presentar([], true).length + " obras");
  registrar("AP-04-l2", "AP-04: una sola obra", "Historia de tu vida", titulos(presentar([id("b1", 4)], true)));
  registrar("AP-04-e1", "AP-04: un id que no existe se omite sin fallar", "Dune", titulos(presentar([DUNE, uid(9999)], true)));
  registrar("AP-04-e2", "AP-04: un visitante no recibe las fichas en borrador", "0 obras", presentar([NEUROMANTE, NEUROMANTE_P], true).length + " obras");
  registrar("AP-04-e3", "AP-04: el administrador si las recibe", "Neuromante | Neuromante", titulos(presentar([NEUROMANTE, NEUROMANTE_P], false)));
}

// ============================================================================== AP-05 (semilla)
{
  const existe = (coleccion, x) => { const d = APP.getCollection(coleccion).findOne({ _id: x }, { estado_publicacion: 1 }); return d ? "existe, " + d.estado_publicacion : "no existe"; };
  registrar("AP-05-n1", "AP-05: un libro publicado existe", "existe, publicada", existe("libros", DUNE));
  registrar("AP-05-l1", "AP-05: un libro en borrador existe y lo dice (Neuromante)", "existe, borrador", existe("libros", NEUROMANTE));
  registrar("AP-05-l2", "AP-05: una pelicula en borrador existe y lo dice (Neuromante)", "existe, borrador", existe("peliculas", NEUROMANTE_P));
  registrar("AP-05-e1", "AP-05: el id de un libro buscado en la coleccion de peliculas no existe", "no existe", existe("peliculas", DUNE));
  registrar("AP-05-e2", "AP-05: un id desconocido no existe", "no existe", existe("libros", uid(9999)));
}

// ============================================================================== AP-07 (escritura)
restaurar();
registrar("AP-07-n1", "AP-07: crear la ficha de un libro como borrador", "aceptado", intentar(() => db.libros.insertOne(libroNuevo(7001))));
registrar("AP-07-n2", "AP-07: la ficha queda en borrador: 0 visibles para el visitante, 1 para el administrador", "0 visibles; 1 para el admin",
  db.libros.countDocuments({ _id: uid(7001), estado_publicacion: "publicada" }) + " visibles; " + db.libros.countDocuments({ _id: uid(7001) }) + " para el admin");
{
  const l = libroNuevo(7002); l.ediciones = [edicionNueva(7003, "9780306406157")];
  registrar("AP-07-l1", "AP-07: crear el libro con su primera edicion", "aceptado", intentar(() => db.libros.insertOne(l)));
  const m = libroNuevo(7004); m.anio_publicacion_original = 2100;
  registrar("AP-07-l2", "AP-07: anio de publicacion en el limite superior (2100)", "aceptado", intentar(() => db.libros.insertOne(m)));
  const p = libroNuevo(7005); p.portada_url = "https://almacenamiento.ejemplo.com/portadas/7005.jpg";
  registrar("AP-07-l3", "AP-07: con portada_url valida (opcional)", "aceptado", intentar(() => db.libros.insertOne(p)));
  const a = libroNuevo(7006); delete a.titulo;
  registrar("AP-07-e1", "AP-07: sin titulo se rechaza", RECHAZO_VALIDADOR, intentar(() => db.libros.insertOne(a)));
  const b = libroNuevo(7007); b.estado_publicacion = "publicado";
  registrar("AP-07-e2", "AP-07: estado_publicacion fuera de la lista", RECHAZO_VALIDADOR, intentar(() => db.libros.insertOne(b)));
  const c = libroNuevo(7008); c._id = "ABCDEF12-0000-4000-8000-000000007008";
  registrar("AP-07-e3", "AP-07: _id en mayusculas", RECHAZO_VALIDADOR, intentar(() => db.libros.insertOne(c)));
  const d = libroNuevo(7009); d.anio_publicacion_original = 2101;
  registrar("AP-07-e4", "AP-07: anio de publicacion 2101 (fuera de rango)", RECHAZO_VALIDADOR, intentar(() => db.libros.insertOne(d)));
  const e = libroNuevo(7010); e.campo_inventado = 1;
  registrar("AP-07-e5", "AP-07: un campo no definido en el validador", RECHAZO_VALIDADOR, intentar(() => db.libros.insertOne(e)));
  registrar("AP-07-e6", "AP-07: el mismo _id dos veces", RECHAZO_DUPLICADO, intentar(() => db.libros.insertOne(libroNuevo(7001))));
}

// ============================================================================== AP-08 (escritura)
restaurar();
registrar("AP-08-n1", "AP-08: crear la ficha de una pelicula como borrador con el reparto vacio", "aceptado", intentar(() => db.peliculas.insertOne(peliculaNueva(7101))));
{
  const a = peliculaNueva(7102); a.duracion_min = 1; a.anio_estreno = 1888;
  registrar("AP-08-l1", "AP-08: duracion minima (1) y anio minimo (1888)", "aceptado", intentar(() => db.peliculas.insertOne(a)));
  const b = peliculaNueva(7103); b.duracion_min = 1000;
  registrar("AP-08-l2", "AP-08: duracion maxima (1000)", "aceptado", intentar(() => db.peliculas.insertOne(b)));
  const c = peliculaNueva(7104); c.datos_tecnicos = { idioma_original: "español", paises: ["México"] };
  registrar("AP-08-l3", "AP-08: datos_tecnicos solo con lo obligatorio (sin productoras ni clasificacion)", "aceptado", intentar(() => db.peliculas.insertOne(c)));
  const d = peliculaNueva(7105); d.duracion_min = 0;
  registrar("AP-08-e1", "AP-08: duracion 0", RECHAZO_VALIDADOR, intentar(() => db.peliculas.insertOne(d)));
  const e = peliculaNueva(7106); e.anio_estreno = 1887;
  registrar("AP-08-e2", "AP-08: anio de estreno 1887 (antes del cine)", RECHAZO_VALIDADOR, intentar(() => db.peliculas.insertOne(e)));
  const f = peliculaNueva(7107); delete f.datos_tecnicos.paises;
  registrar("AP-08-e3", "AP-08: datos_tecnicos sin paises", RECHAZO_VALIDADOR, intentar(() => db.peliculas.insertOne(f)));
  const g = peliculaNueva(7108); g.reparto = [actor(7109, 0, false)];
  registrar("AP-08-e4", "AP-08: un actor con orden 0", RECHAZO_VALIDADOR, intentar(() => db.peliculas.insertOne(g)));
  const h = peliculaNueva(7110); h.plataformas = [{ nombre: "X", url: "https://x.com" }];
  registrar("AP-08-e5", "AP-08: una plataforma con un campo url (D-26 la elimino)", RECHAZO_VALIDADOR, intentar(() => db.peliculas.insertOne(h)));
}

// ============================================================================== AP-09 (escritura)
restaurar();
const publicar = (coleccion, x) => upd(() => db.getCollection(coleccion).updateOne({ _id: x, estado_publicacion: "borrador" },
  { $set: { estado_publicacion: "publicada", actualizado_en: new Date() } }));
registrar("AP-09-n1", "AP-09: publicar una ficha en borrador (Neuromante, libro)", "coincidencias=1 modificados=1", publicar("libros", NEUROMANTE));
registrar("AP-09-n2", "AP-09: repetirla no tiene efecto ni falla (el filtro exige borrador)", "coincidencias=0 modificados=0", publicar("libros", NEUROMANTE));
registrar("AP-09-n3", "AP-09: la ficha queda publicada", "publicada", db.libros.findOne({ _id: NEUROMANTE }).estado_publicacion);
registrar("AP-09-l1", "AP-09: el validador NO impide publicar una pelicula con el reparto vacio: el minimo de D-24 lo exige la API antes de llamar a AP-09",
  "coincidencias=1 modificados=1; reparto=0", publicar("peliculas", NEUROMANTE_P) + "; reparto=" + db.peliculas.findOne({ _id: NEUROMANTE_P }).reparto.length);
registrar("AP-09-e1", "AP-09: publicar un id que no existe no hace nada", "coincidencias=0 modificados=0", publicar("libros", uid(9999)));
registrar("AP-09-e2", "AP-09: un estado fuera de la lista se rechaza", RECHAZO_VALIDADOR,
  upd(() => db.libros.updateOne({ _id: id("b1", 1) }, { $set: { estado_publicacion: "publicado" } })));

// ============================================================================== AP-10 (escritura)
restaurar();
registrar("AP-10-n1", "AP-10: corregir titulo y sinopsis", "coincidencias=1 modificados=1; Dune (edicion corregida)",
  upd(() => db.libros.updateOne({ _id: DUNE }, { $set: { titulo: "Dune (edicion corregida)", sinopsis: "Sinopsis corregida.", actualizado_en: new Date() } }))
  + "; " + db.libros.findOne({ _id: DUNE }).titulo);
registrar("AP-10-n2", "AP-10: agregar una portada a una ficha que no la tenia (Historia de tu vida)", "coincidencias=1 modificados=1",
  upd(() => db.libros.updateOne({ _id: id("b1", 4) }, { $set: { portada_url: "https://almacenamiento.ejemplo.com/portadas/b04.jpg" } })));
registrar("AP-10-l1", "AP-10: quitar la portada con $unset (el campo deja de existir)", "coincidencias=1 modificados=1; sin portada_url",
  upd(() => db.libros.updateOne({ _id: id("b1", 4) }, { $unset: { portada_url: "" } })) + "; " +
  (db.libros.findOne({ _id: id("b1", 4) }).portada_url === undefined ? "sin portada_url" : "con portada_url"));
registrar("AP-10-l2", "AP-10: corregir con el mismo valor no modifica nada", "coincidencias=1 modificados=0",
  upd(() => db.libros.updateOne({ _id: id("b1", 3) }, { $set: { titulo: APP.libros.findOne({ _id: id("b1", 3) }).titulo } })));
registrar("AP-10-e1", "AP-10: dejar el titulo vacio", RECHAZO_VALIDADOR, upd(() => db.libros.updateOne({ _id: DUNE }, { $set: { titulo: "" } })));
registrar("AP-10-e2", "AP-10: portada_url con http://", RECHAZO_VALIDADOR, upd(() => db.libros.updateOne({ _id: DUNE }, { $set: { portada_url: "http://ejemplo.com/p.jpg" } })));
registrar("AP-10-e3", "AP-10: un id que no existe", "coincidencias=0 modificados=0", upd(() => db.libros.updateOne({ _id: uid(9999) }, { $set: { titulo: "X" } })));
registrar("AP-10-e4", "AP-10: un campo no definido en el validador", RECHAZO_VALIDADOR, upd(() => db.libros.updateOne({ _id: DUNE }, { $set: { campo_inventado: 1 } })));

// ============================================================================== AP-11 (escritura)
restaurar();
const agregarEdicion = (libro, edicion) => upd(() => db.libros.updateOne(
  edicion.isbn ? { _id: libro, "ediciones.isbn": { $ne: edicion.isbn } } : { _id: libro }, { $push: { ediciones: edicion } }));
registrar("AP-11-n1", "AP-11: agregar una edicion con ISBN nuevo, sin cambiar el esquema", "coincidencias=1 modificados=1; 3 ediciones",
  agregarEdicion(DUNE, edicionNueva(7201, ISBN_LIBRE)) + "; " + db.libros.findOne({ _id: DUNE }).ediciones.length + " ediciones");
registrar("AP-11-n2", "AP-11: agregar una edicion sin ISBN (es opcional)", "coincidencias=1 modificados=1", agregarEdicion(DUNE, edicionNueva(7202)));
registrar("AP-11-l1", "AP-11: la primera edicion de un libro que no tenia ninguna (Neuromante)", "coincidencias=1 modificados=1",
  agregarEdicion(NEUROMANTE, edicionNueva(7203, "9781234567897")));
{
  db.libros.updateOne({ _id: NEUROMANTE }, { $set: { ediciones: Array.from({ length: 50 }, (_, i) => edicionNueva(7300 + i)) } });
  registrar("AP-11-l2", "AP-11: la edicion numero 51 (el maximo es 50)", RECHAZO_VALIDADOR, agregarEdicion(NEUROMANTE, edicionNueva(7251)));
}
registrar("AP-11-e1", "AP-11: un ISBN que el mismo libro ya tiene (filtro condicional de la API)", "coincidencias=0 modificados=0",
  agregarEdicion(DUNE, edicionNueva(7204, ISBN_DUNE)));
registrar("AP-11-e2", "AP-11: un ISBN que ya tiene OTRO libro (lo rechaza el indice unico sparse)", RECHAZO_DUPLICADO,
  agregarEdicion(DUNE, edicionNueva(7205, ISBN_OTRO)));
{
  const sinPaginas = edicionNueva(7206); delete sinPaginas.paginas;
  registrar("AP-11-e3", "AP-11: una edicion sin paginas", RECHAZO_VALIDADOR, agregarEdicion(DUNE, sinPaginas));
  registrar("AP-11-e4", "AP-11: un ISBN con guiones", RECHAZO_VALIDADOR, agregarEdicion(DUNE, edicionNueva(7207, "978-0-14-044913-6")));
}

// ============================================================================== AP-12 (escritura)
restaurar();
const corregirEdicion = (edicion, cambios, nuevoIsbn) => upd(() => db.libros.updateOne(
  Object.assign({ _id: DUNE, "ediciones.edicion_id": edicion }, nuevoIsbn ? { "ediciones.isbn": { $ne: nuevoIsbn } } : {}),
  cambios, { arrayFilters: [{ "e.edicion_id": edicion }] }));
registrar("AP-12-n1", "AP-12: corregir las paginas de una edicion", "coincidencias=1 modificados=1; 600",
  corregirEdicion(ED_SIN_ISBN, { $set: { "ediciones.$[e].paginas": 600 } }) + "; " + db.libros.findOne({ _id: DUNE }).ediciones.find(e => e.edicion_id === ED_SIN_ISBN).paginas);
registrar("AP-12-n2", "AP-12: ponerle un ISBN libre a la edicion que no lo tenia", "coincidencias=1 modificados=1",
  corregirEdicion(ED_SIN_ISBN, { $set: { "ediciones.$[e].isbn": ISBN_LIBRE } }, ISBN_LIBRE));
registrar("AP-12-l1", "AP-12: quitarle el ISBN a una edicion ($unset): el ISBN es opcional", "coincidencias=1 modificados=1",
  corregirEdicion(ED_CON_ISBN, { $unset: { "ediciones.$[e].isbn": "" } }));
registrar("AP-12-l2", "AP-12: una edicion que no existe no coincide con nada", "coincidencias=0 modificados=0",
  corregirEdicion(uid(9999), { $set: { "ediciones.$[e].paginas": 1 } }));
restaurar();
registrar("AP-12-e1", "AP-12: ISBN que ya tiene otra edicion del mismo libro (filtro condicional)", "coincidencias=0 modificados=0",
  corregirEdicion(ED_SIN_ISBN, { $set: { "ediciones.$[e].isbn": ISBN_DUNE } }, ISBN_DUNE));
registrar("AP-12-e2", "AP-12: ISBN que ya tiene OTRO libro", RECHAZO_DUPLICADO,
  corregirEdicion(ED_SIN_ISBN, { $set: { "ediciones.$[e].isbn": ISBN_OTRO } }, ISBN_OTRO));
registrar("AP-12-e3", "AP-12: paginas 0", RECHAZO_VALIDADOR, corregirEdicion(ED_SIN_ISBN, { $set: { "ediciones.$[e].paginas": 0 } }));

// ============================================================================== AP-13 (escritura)
restaurar();
registrar("AP-13-n1", "AP-13: quitar una edicion de un libro con dos", "coincidencias=1 modificados=1; 1 ediciones",
  upd(() => db.libros.updateOne({ _id: DUNE }, { $pull: { ediciones: { edicion_id: ED_SIN_ISBN } } })) + "; " + db.libros.findOne({ _id: DUNE }).ediciones.length + " ediciones");
registrar("AP-13-l1", "AP-13: quitar la ultima edicion deja el arreglo vacio y la ficha sigue siendo valida", "coincidencias=1 modificados=1; 0 ediciones",
  upd(() => db.libros.updateOne({ _id: DUNE }, { $pull: { ediciones: { edicion_id: ED_CON_ISBN } } })) + "; " + db.libros.findOne({ _id: DUNE }).ediciones.length + " ediciones");
registrar("AP-13-e1", "AP-13: quitar una edicion que no existe: coincide el libro pero no cambia nada", "coincidencias=1 modificados=0",
  upd(() => db.libros.updateOne({ _id: DUNE }, { $pull: { ediciones: { edicion_id: uid(9999) } } })));
registrar("AP-13-e2", "AP-13: un libro que no existe", "coincidencias=0 modificados=0",
  upd(() => db.libros.updateOne({ _id: uid(9999) }, { $pull: { ediciones: { edicion_id: ED_CON_ISBN } } })));

// ============================================================================== AP-14 a AP-16 (plataformas)
restaurar();
db.peliculas.updateOne({ _id: DUNE21 }, { $set: { plataformas: [{ nombre: "Plataforma A" }, { nombre: "Plataforma B" }] } });
const agregarPlataforma = (nombre) => upd(() => db.peliculas.updateOne({ _id: DUNE21, "plataformas.nombre": { $ne: nombre.nombre } }, { $push: { plataformas: nombre } }));
registrar("AP-14-n1", "AP-14: agregar una plataforma sin cambiar el esquema", "coincidencias=1 modificados=1; A,B,C",
  agregarPlataforma({ nombre: "Plataforma C" }) + "; " + db.peliculas.findOne({ _id: DUNE21 }).plataformas.map(p => p.nombre.slice(-1)).join(","));
registrar("AP-14-l1", "AP-14: un nombre con tilde y espacios", "coincidencias=1 modificados=1", agregarPlataforma({ nombre: "Cine en Casa Líder" }));
db.peliculas.updateOne({ _id: DUNE21 }, { $set: { plataformas: Array.from({ length: 30 }, (_, i) => ({ nombre: "P" + i })) } });
registrar("AP-14-l2", "AP-14: la plataforma numero 31 (el maximo es 30)", RECHAZO_VALIDADOR, agregarPlataforma({ nombre: "P31" }));
db.peliculas.updateOne({ _id: DUNE21 }, { $set: { plataformas: [{ nombre: "Plataforma A" }, { nombre: "Plataforma B" }] } });
registrar("AP-14-e1", "AP-14: un nombre que la pelicula ya tiene (filtro condicional)", "coincidencias=0 modificados=0", agregarPlataforma({ nombre: "Plataforma A" }));
registrar("AP-14-e2", "AP-14: una plataforma sin nombre", RECHAZO_VALIDADOR, upd(() => db.peliculas.updateOne({ _id: DUNE21 }, { $push: { plataformas: {} } })));
registrar("AP-14-e3", "AP-14: una plataforma con un campo url (D-26)", RECHAZO_VALIDADOR,
  upd(() => db.peliculas.updateOne({ _id: DUNE21 }, { $push: { plataformas: { nombre: "Z", url: "https://z.com" } } })));

const renombrar = (actual, nuevo) => upd(() => db.peliculas.updateOne(
  { _id: DUNE21, $and: [{ "plataformas.nombre": { $ne: nuevo } }, { "plataformas.nombre": actual }] },
  { $set: { "plataformas.$[p].nombre": nuevo } }, { arrayFilters: [{ "p.nombre": actual }] }));
registrar("AP-15-n1", "AP-15: renombrar una plataforma a un nombre libre", "coincidencias=1 modificados=1; Plataforma A,Plataforma Z",
  renombrar("Plataforma B", "Plataforma Z") + "; " + db.peliculas.findOne({ _id: DUNE21 }).plataformas.map(p => p.nombre).join(","));
registrar("AP-15-l1", "AP-15: renombrar una plataforma que no existe", "coincidencias=0 modificados=0", renombrar("No existe", "Otra"));
registrar("AP-15-l2", "AP-15: renombrar a su mismo nombre no coincide (el filtro exige un nombre distinto)", "coincidencias=0 modificados=0", renombrar("Plataforma A", "Plataforma A"));
registrar("AP-15-e1", "AP-15: renombrar a un nombre que la pelicula ya tiene", "coincidencias=0 modificados=0", renombrar("Plataforma Z", "Plataforma A"));
registrar("AP-15-e2", "AP-15: renombrar a un nombre vacio", RECHAZO_VALIDADOR, renombrar("Plataforma Z", ""));

registrar("AP-16-n1", "AP-16: quitar una plataforma", "coincidencias=1 modificados=1; Plataforma A",
  upd(() => db.peliculas.updateOne({ _id: DUNE21 }, { $pull: { plataformas: { nombre: "Plataforma Z" } } })) + "; " +
  db.peliculas.findOne({ _id: DUNE21 }).plataformas.map(p => p.nombre).join(","));
registrar("AP-16-l1", "AP-16: quitar la ultima plataforma deja el arreglo vacio y la ficha sigue siendo valida", "coincidencias=1 modificados=1; 0 plataformas",
  upd(() => db.peliculas.updateOne({ _id: DUNE21 }, { $pull: { plataformas: { nombre: "Plataforma A" } } })) + "; " + db.peliculas.findOne({ _id: DUNE21 }).plataformas.length + " plataformas");
registrar("AP-16-e1", "AP-16: quitar una plataforma que no existe", "coincidencias=1 modificados=0",
  upd(() => db.peliculas.updateOne({ _id: DUNE21 }, { $pull: { plataformas: { nombre: "No existe" } } })));
registrar("AP-16-e2", "AP-16: una pelicula que no existe", "coincidencias=0 modificados=0",
  upd(() => db.peliculas.updateOne({ _id: uid(9999) }, { $pull: { plataformas: { nombre: "A" } } })));

// ============================================================================== AP-17 (escritura)
restaurar();
const reemplazarReparto = (pelicula, reparto) => upd(() => db.peliculas.updateOne({ _id: pelicula }, { $set: { reparto, actualizado_en: new Date() } }));
registrar("AP-17-n1", "AP-17: reemplazar el reparto completo (2 actores, uno con foto y otro sin ella)", "coincidencias=1 modificados=1; 2 actores",
  reemplazarReparto(DUNE21, [actor(7401, 1, true), actor(7402, 2, false)]) + "; " + db.peliculas.findOne({ _id: DUNE21 }).reparto.length + " actores");
registrar("AP-17-l1", "AP-17: un reparto de un solo actor", "coincidencias=1 modificados=1", reemplazarReparto(DUNE21, [actor(7403, 1, false)]));
registrar("AP-17-l2", "AP-17: un reparto de exactamente 300 actores (el maximo)", "coincidencias=1 modificados=1",
  reemplazarReparto(DUNE21, Array.from({ length: 300 }, (_, i) => actor(7500 + i, i + 1, false))));
registrar("AP-17-l3", "AP-17: un reparto vacio (una ficha en borrador que aun no lo tiene)", "coincidencias=1 modificados=1; 0 actores",
  reemplazarReparto(DUNE21, []) + "; " + db.peliculas.findOne({ _id: DUNE21 }).reparto.length + " actores");
registrar("AP-17-e1", "AP-17: un reparto de 301 actores", RECHAZO_VALIDADOR, reemplazarReparto(DUNE21, Array.from({ length: 301 }, (_, i) => actor(7500 + i, i + 1, false))));
registrar("AP-17-e2", "AP-17: un actor con orden 0", RECHAZO_VALIDADOR, reemplazarReparto(DUNE21, [actor(7404, 0, false)]));
{
  const malaFoto = actor(7405, 1, false); malaFoto.foto_url = "http://ejemplo.com/f.jpg";
  registrar("AP-17-e3", "AP-17: foto_url con http://", RECHAZO_VALIDADOR, reemplazarReparto(DUNE21, [malaFoto]));
  const malId = actor(7406, 1, false); malId.persona_id = "no-es-un-uuid";
  registrar("AP-17-e4", "AP-17: persona_id que no es un UUID", RECHAZO_VALIDADOR, reemplazarReparto(DUNE21, [malId]));
}
registrar("AP-17-e5", "AP-17: una pelicula que no existe", "coincidencias=0 modificados=0", reemplazarReparto(uid(9999), [actor(7407, 1, false)]));

// ============================================================================== AP-18 (escritura)
restaurar();
registrar("AP-18-n1", "AP-18: publicar una comparativa", "aceptado", intentar(() => db.resenas_comparativas.insertOne(comparativaNueva(7601, uid(7701), DUNE, DUNE21))));
{
  const c = comparativaNueva(7602, uid(7702), DUNE, DUNE21);
  c.aspectos = [{ nombre: "Aspecto inventado por el usuario" }, { nombre: "Ritmo", puntuacion: 4, comentario: "Mas lento en el libro" }];
  registrar("AP-18-n2", "AP-18: aspectos de nombre libre, con y sin puntuacion (RF-16)", "aceptado", intentar(() => db.resenas_comparativas.insertOne(c)));
  const d = comparativaNueva(7603, uid(7703), DUNE, DUNE21);
  d.aspectos = Array.from({ length: 10 }, (_, i) => ({ nombre: "Aspecto " + i }));
  registrar("AP-18-l1", "AP-18: exactamente 10 aspectos (el maximo)", "aceptado", intentar(() => db.resenas_comparativas.insertOne(d)));
  const e = comparativaNueva(7604, uid(7704), DUNE, DUNE21);
  e.veredicto = { preferencia: "empate", comentario: "Las dos valen la pena" };
  registrar("AP-18-l2", "AP-18: veredicto 'empate' con comentario", "aceptado", intentar(() => db.resenas_comparativas.insertOne(e)));
  registrar("AP-18-e1", "AP-18: la misma pareja del mismo usuario otra vez (RN-05)", RECHAZO_DUPLICADO,
    intentar(() => db.resenas_comparativas.insertOne(comparativaNueva(7605, uid(7701), DUNE, DUNE21))));
  const f = comparativaNueva(7606, uid(7705), DUNE, DUNE21); f.aspectos = Array.from({ length: 11 }, (_, i) => ({ nombre: "A" + i }));
  registrar("AP-18-e2", "AP-18: 11 aspectos", RECHAZO_VALIDADOR, intentar(() => db.resenas_comparativas.insertOne(f)));
  const g = comparativaNueva(7607, uid(7706), DUNE, DUNE21); g.veredicto = { preferencia: "ambas" };
  registrar("AP-18-e3", "AP-18: preferencia fuera de la lista", RECHAZO_VALIDADOR, intentar(() => db.resenas_comparativas.insertOne(g)));
  const h = comparativaNueva(7608, uid(7707), DUNE, DUNE21); h.aspectos = [{ nombre: "Final", puntuacion: 6 }];
  registrar("AP-18-e4", "AP-18: puntuacion 6", RECHAZO_VALIDADOR, intentar(() => db.resenas_comparativas.insertOne(h)));
  const i = comparativaNueva(7609, uid(7708), DUNE, DUNE21); i.aspectos = [];
  registrar("AP-18-e5", "AP-18: sin aspectos", RECHAZO_VALIDADOR, intentar(() => db.resenas_comparativas.insertOne(i)));
  const j = comparativaNueva(7610, uid(7709), DUNE, DUNE21); j.oculta = "no";
  registrar("AP-18-e6", "AP-18: oculta como texto", RECHAZO_VALIDADOR, intentar(() => db.resenas_comparativas.insertOne(j)));
}

// ============================================================================== AP-19, AP-20, AP-21, AP-23 (lecturas de la semilla)
{
  const ap19 = (u, l, p) => { const c = APP.resenas_comparativas.findOne({ usuario_id: u, libro_id: l, pelicula_id: p }); return c ? "existe: " + corto(c._id) + (c.oculta ? " (oculta)" : "") : "no existe"; };
  registrar("AP-19-n1", "AP-19: la comparativa de Ana sobre Dune y Dune (2021)", "existe: 01", ap19(ANA, DUNE, DUNE21));
  registrar("AP-19-l1", "AP-19: su autora ve su propia comparativa oculta (Elena)", "existe: 05 (oculta)", ap19(ELENA, id("b1", 9), id("f1", 10)));
  registrar("AP-19-e1", "AP-19: Pedro no tiene comparativa sobre esa pareja (RN-05 permite crearla)", "no existe", ap19(id("c1", 5), DUNE, DUNE21));
  registrar("AP-19-e2", "AP-19: un usuario que no existe", "no existe", ap19(uid(9999), DUNE, DUNE21));

  const ver = (idc, filtroVisibilidad) => APP.resenas_comparativas.findOne(Object.assign({ _id: idc }, filtroVisibilidad || {}));
  const ca01 = ver(id("ca", 1)), ca05 = id("ca", 5);
  registrar("AP-20-n1", "AP-20: una comparativa por id", "preferencia=libro oculta=false", "preferencia=" + ca01.veredicto.preferencia + " oculta=" + ca01.oculta);
  registrar("AP-20-l1", "AP-20: la comparativa oculta NO la ve otro lector (filtro oculta=false)", "(no visible)",
    ver(ca05, { oculta: false }) ? "visible" : "(no visible)");
  registrar("AP-20-l2", "AP-20: su autora (Elena) si la ve", "visible",
    ver(ca05, { $or: [{ oculta: false }, { usuario_id: ELENA }] }) ? "visible" : "(no visible)");
  registrar("AP-20-l3", "AP-20: el administrador (sin filtro) la ve", "visible", ver(ca05) ? "visible" : "(no visible)");
  registrar("AP-20-e1", "AP-20: un id que no existe", "no existe", ver(uid(9999)) ? "existe" : "no existe");

  const ap21 = (l, p, admin, salto, limite) => {
    let c = APP.resenas_comparativas.find(Object.assign({ libro_id: l, pelicula_id: p }, admin ? {} : { oculta: false })).sort({ creado_en: -1 });
    if (salto) c = c.skip(salto);
    if (limite) c = c.limit(limite);
    const r = c.toArray();
    return r.length ? r.map(x => corto(x._id)).join(", ") : "0";
  };
  registrar("AP-21-n1", "AP-21: comparativas de una adaptacion, la mas reciente primero (Dune y Dune 2021: Marta, luego Ana)", "02, 01", ap21(DUNE, DUNE21, false));
  registrar("AP-21-l1", "AP-21: la comparativa oculta no se lista a un lector", "0", ap21(id("b1", 9), id("f1", 10), false));
  registrar("AP-21-l2", "AP-21: el administrador si la ve", "05", ap21(id("b1", 9), id("f1", 10), true));
  registrar("AP-21-l3", "AP-21: paginado (saltar 1, tomar 1)", "01", ap21(DUNE, DUNE21, false, 1, 1));
  registrar("AP-21-e1", "AP-21: una pareja sin comparativas (Dune y El marciano no son adaptacion una de la otra)", "0", ap21(DUNE, id("f1", 4), false));

  const ap23 = (u, esElAutorOAdmin, salto, limite) => {
    let c = APP.resenas_comparativas.find(Object.assign({ usuario_id: u }, esElAutorOAdmin ? {} : { oculta: false })).sort({ creado_en: -1 });
    if (salto) c = c.skip(salto);
    if (limite) c = c.limit(limite);
    const r = c.toArray();
    return r.length ? r.map(x => corto(x._id)).join(", ") : "0";
  };
  registrar("AP-23-n1", "AP-23: comparativas de un usuario, la mas reciente primero (Ana)", "01", ap23(ANA, false));
  registrar("AP-23-l1", "AP-23: otro lector no ve la comparativa oculta de Elena", "0", ap23(ELENA, false));
  registrar("AP-23-l2", "AP-23: su autora o el administrador si", "05", ap23(ELENA, true));
  registrar("AP-23-l3", "AP-23: paginado, primera pagina de 1 (Marta)", "02", ap23(id("c1", 4), false, 0, 1));
  registrar("AP-23-e1", "AP-23: un usuario sin comparativas (Sofia)", "0", ap23(id("c1", 6), false));
  registrar("AP-23-e2", "AP-23: un usuario que no existe", "0", ap23(uid(9999), false));
}

// ============================================================================== AP-24 (escritura)
restaurar();
const CA01 = id("ca", 1);
const editarComparativa = (comp, usuario, cambios) => upd(() => db.resenas_comparativas.updateOne({ _id: comp, usuario_id: usuario },
  { $set: Object.assign({ actualizado_en: new Date() }, cambios) }));
{
  const antesEdicion = db.resenas_comparativas.findOne({ _id: CA01 });
  registrar("AP-24-n1", "AP-24: editar veredicto y aspectos de una comparativa propia", "coincidencias=1 modificados=1",
    editarComparativa(CA01, ANA, { veredicto: { preferencia: "empate" }, aspectos: [{ nombre: "Ritmo", puntuacion: 4 }] }));
  const despues = db.resenas_comparativas.findOne({ _id: CA01 });
  registrar("AP-24-n2", "AP-24: no cambian usuario, libro ni pelicula y actualizado_en avanza", "mismo usuario, libro y pelicula; actualizado_en avanzo",
    (despues.usuario_id === antesEdicion.usuario_id && despues.libro_id === antesEdicion.libro_id && despues.pelicula_id === antesEdicion.pelicula_id ? "mismo usuario, libro y pelicula" : "cambio algo") +
    "; " + (despues.actualizado_en > antesEdicion.actualizado_en ? "actualizado_en avanzo" : "actualizado_en no avanzo"));
  registrar("AP-24-l1", "AP-24: editar con 10 aspectos (el maximo)", "coincidencias=1 modificados=1",
    editarComparativa(CA01, ANA, { aspectos: Array.from({ length: 10 }, (_, i) => ({ nombre: "A" + i })) }));
  registrar("AP-24-l2", "AP-24: guardar los mismos valores no modifica nada (sin tocar actualizado_en)", "coincidencias=1 modificados=0",
    upd(() => db.resenas_comparativas.updateOne({ _id: CA01, usuario_id: ANA }, { $set: { veredicto: { preferencia: "empate" } } })));
  registrar("AP-24-e1", "AP-24: puntuacion 7", RECHAZO_VALIDADOR, editarComparativa(CA01, ANA, { "aspectos.0.puntuacion": 7 }));
  registrar("AP-24-e2", "AP-24: editar la comparativa de OTRO usuario no cambia nada (RN-10)", "coincidencias=0 modificados=0",
    editarComparativa(CA01, LUIS, { veredicto: { preferencia: "pelicula" } }));
  registrar("AP-24-e3", "AP-24: preferencia fuera de la lista", RECHAZO_VALIDADOR, editarComparativa(CA01, ANA, { veredicto: { preferencia: "ambas" } }));
}

// ============================================================================== AP-25 (escritura)
restaurar();
registrar("AP-25-n1", "AP-25: eliminar una comparativa propia", "borrados=1", borrados(db.resenas_comparativas.deleteOne({ _id: CA01, usuario_id: ANA })));
registrar("AP-25-l1", "AP-25: tras eliminarla, el mismo usuario puede volver a comparar esa pareja", "aceptado",
  intentar(() => db.resenas_comparativas.insertOne(comparativaNueva(7801, ANA, DUNE, DUNE21))));
registrar("AP-25-e1", "AP-25: eliminar la comparativa de OTRO usuario no borra nada (RN-10)", "borrados=0; sigue existiendo",
  borrados(db.resenas_comparativas.deleteOne({ _id: id("ca", 2), usuario_id: LUIS })) + "; " +
  (db.resenas_comparativas.countDocuments({ _id: id("ca", 2) }) ? "sigue existiendo" : "ya no existe"));
registrar("AP-25-e2", "AP-25: un id que no existe", "borrados=0", borrados(db.resenas_comparativas.deleteOne({ _id: uid(9999), usuario_id: ANA })));

// ============================================================================== AP-26 (escritura)
restaurar();
registrar("AP-26-n1", "AP-26: ocultar una comparativa", "coincidencias=1 modificados=1; oculta=true",
  upd(() => db.resenas_comparativas.updateOne({ _id: CA01 }, { $set: { oculta: true } })) + "; oculta=" + db.resenas_comparativas.findOne({ _id: CA01 }).oculta);
registrar("AP-26-n2", "AP-26: volver a mostrarla", "coincidencias=1 modificados=1; oculta=false",
  upd(() => db.resenas_comparativas.updateOne({ _id: CA01 }, { $set: { oculta: false } })) + "; oculta=" + db.resenas_comparativas.findOne({ _id: CA01 }).oculta);
registrar("AP-26-l1", "AP-26: ocultar una que ya esta oculta no cambia nada", "coincidencias=1 modificados=0",
  upd(() => db.resenas_comparativas.updateOne({ _id: id("ca", 5) }, { $set: { oculta: true } })));
{
  const antes26 = db.resenas_comparativas.findOne({ _id: CA01 }).actualizado_en.getTime();
  db.resenas_comparativas.updateOne({ _id: CA01 }, { $set: { oculta: true } });
  registrar("AP-26-l2", "AP-26: ocultar o mostrar no modifica actualizado_en (supuesto 5)", "actualizado_en igual",
    db.resenas_comparativas.findOne({ _id: CA01 }).actualizado_en.getTime() === antes26 ? "actualizado_en igual" : "actualizado_en cambio");
}
registrar("AP-26-e1", "AP-26: oculta como texto", RECHAZO_VALIDADOR, upd(() => db.resenas_comparativas.updateOne({ _id: CA01 }, { $set: { oculta: "si" } })));
registrar("AP-26-e2", "AP-26: un id que no existe", "coincidencias=0 modificados=0", upd(() => db.resenas_comparativas.updateOne({ _id: uid(9999) }, { $set: { oculta: true } })));

// ============================================================================== AP-27 (escritura)
restaurar();
registrar("AP-27-n1", "AP-27: eliminar una comparativa por moderacion", "borrados=1; quedan 4", borrados(db.resenas_comparativas.deleteOne({ _id: id("ca", 2) })) + "; quedan " + db.resenas_comparativas.countDocuments());
registrar("AP-27-l1", "AP-27: eliminar una comparativa que estaba oculta", "borrados=1; quedan 3", borrados(db.resenas_comparativas.deleteOne({ _id: id("ca", 5) })) + "; quedan " + db.resenas_comparativas.countDocuments());
registrar("AP-27-e1", "AP-27: un id que no existe", "borrados=0", borrados(db.resenas_comparativas.deleteOne({ _id: uid(9999) })));

// ============================================================================== AP-28 (escritura)
restaurar();
for (let i = 0; i < 3; i++) db.resenas_comparativas.insertOne(comparativaNueva(7900 + i, uid(7950), DUNE, i === 0 ? DUNE21 : id("f1", 2 + i)));
registrar("AP-28-n1", "AP-28: borrar todas las comparativas de un usuario (3)", "borrados=3; quedan 5 de los demas",
  borrados(db.resenas_comparativas.deleteMany({ usuario_id: uid(7950) })) + "; quedan " + db.resenas_comparativas.countDocuments() + " de los demas");
registrar("AP-28-l1", "AP-28: repetirlo no falla y no borra nada", "borrados=0", borrados(db.resenas_comparativas.deleteMany({ usuario_id: uid(7950) })));
registrar("AP-28-l2", "AP-28: un usuario con una sola comparativa (Ana)", "borrados=1", borrados(db.resenas_comparativas.deleteMany({ usuario_id: ANA })));
registrar("AP-28-e1", "AP-28: un usuario sin comparativas (Sofia)", "borrados=0", borrados(db.resenas_comparativas.deleteMany({ usuario_id: id("c1", 6) })));
registrar("AP-28-e2", "AP-28: las comparativas de los demas no se tocan", "4", String(db.resenas_comparativas.countDocuments()));

// ============================================================================== AP-29, AP-30, AP-32, AP-33 (lecturas de reconciliacion)
{
  const lote = (coleccion, salto, tam) => APP.getCollection(coleccion).find({ estado_publicacion: "publicada" }, { _id: 1 }).sort({ _id: 1 }).skip(salto).limit(tam).toArray().length;
  registrar("AP-29-n1", "AP-29: fichas publicadas de libros y de peliculas (10 y 11 de las 23 fichas)", "libros=10 peliculas=11",
    "libros=" + lote("libros", 0, 1000) + " peliculas=" + lote("peliculas", 0, 1000));
  registrar("AP-29-n2", "AP-29: recorrido por lotes de 5 en peliculas", "5, 5, 1", [lote("peliculas", 0, 5), lote("peliculas", 5, 5), lote("peliculas", 10, 5)].join(", "));
  registrar("AP-29-l1", "AP-29: un lote mas alla del final esta vacio", "0", String(lote("peliculas", 11, 5)));
  registrar("AP-29-l2", "AP-29: los borradores no entran", "libros 10 de 11; peliculas 11 de 12",
    "libros " + lote("libros", 0, 1000) + " de " + APP.libros.countDocuments() + "; peliculas " + lote("peliculas", 0, 1000) + " de " + APP.peliculas.countDocuments());
  db.libros.deleteMany({});
  registrar("AP-29-e1", "AP-29: una coleccion vacia (en dlbp_pruebas) no devuelve nada y no falla", "0",
    String(db.libros.find({ estado_publicacion: "publicada" }, { _id: 1 }).toArray().length));

  const borradoresViejos = (umbral) => {
    const l = APP.libros.find({ estado_publicacion: "borrador", creado_en: { $lt: umbral } }, { creado_en: 1 }).toArray().map(d => "libro " + corto(d._id));
    const p = APP.peliculas.find({ estado_publicacion: "borrador", creado_en: { $lt: umbral } }, { creado_en: 1 }).toArray().map(d => "pelicula " + corto(d._id));
    const r = l.concat(p);
    return r.length ? r.join(", ") : "(ninguno)";
  };
  registrar("AP-30-n1", "AP-30: borradores creados antes del umbral (umbral de prueba 2026-11-06; el umbral real no esta definido, supuesto 7)", "libro 11, pelicula 12",
    borradoresViejos(new Date("2026-11-06T00:00:00Z")));
  registrar("AP-30-l1", "AP-30: un umbral igual a la fecha exacta de creacion no incluye esa ficha (la comparacion es estricta)", "(ninguno)",
    borradoresViejos(new Date("2026-11-05T09:00:00Z")));
  registrar("AP-30-l2", "AP-30: un umbral entre las dos fechas solo incluye la mas antigua", "libro 11", borradoresViejos(new Date("2026-11-05T09:05:00Z")));
  registrar("AP-30-e1", "AP-30: un umbral anterior a todas las fichas no devuelve nada", "(ninguno)", borradoresViejos(new Date("2026-01-01T00:00:00Z")));

  const reparto = (salto, tam) => APP.peliculas.find({ estado_publicacion: "publicada" }, { _id: 1, reparto: 1 }).sort({ _id: 1 }).skip(salto).limit(tam).toArray();
  const todas = reparto(0, 1000);
  registrar("AP-32-n1", "AP-32: el reparto de todas las peliculas publicadas, para compararlo con actuo_en", "11 peliculas, 18 personas",
    todas.length + " peliculas, " + todas.reduce((s, d) => s + d.reparto.length, 0) + " personas");
  registrar("AP-32-l1", "AP-32: un lote de 5", "5 peliculas", reparto(0, 5).length + " peliculas");
  registrar("AP-32-l2", "AP-32: la ficha en borrador (sin reparto) no entra", "11 de 12 peliculas", todas.length + " de " + APP.peliculas.countDocuments() + " peliculas");
  db.peliculas.deleteMany({});
  registrar("AP-32-e1", "AP-32: una coleccion vacia (en dlbp_pruebas) no devuelve nada y no falla", "0",
    String(db.peliculas.find({ estado_publicacion: "publicada" }, { _id: 1, reparto: 1 }).toArray().length));

  registrar("AP-33-n1", "AP-33: los usuarios distintos que tienen comparativas", "02, 04, 05, 07, 08",
    APP.resenas_comparativas.distinct("usuario_id").map(corto).sort().join(", "));
  const ap33 = APP.runCommand({ explain: { distinct: "resenas_comparativas", key: "usuario_id" }, verbosity: "executionStats" });
  registrar("AP-33-l1", "AP-33: recorre solo el indice IX-04, sin leer documentos", "ix_comp_unica, 0 documentos leidos",
    (plan(ap33).includes('"indexName":"ix_comp_unica"') ? "ix_comp_unica" : "otro plan") + ", " + ap33.executionStats.totalDocsExamined + " documentos leidos");
  restaurar();
  db.resenas_comparativas.deleteMany({ usuario_id: ANA });
  registrar("AP-33-l2", "AP-33: tras borrar las comparativas de un usuario (en dlbp_pruebas) ya no aparece", "04, 05, 07, 08",
    db.resenas_comparativas.distinct("usuario_id").map(corto).sort().join(", "));
  db.resenas_comparativas.deleteMany({});
  registrar("AP-33-e1", "AP-33: sin comparativas no hay usuarios y no falla", "0 usuarios", db.resenas_comparativas.distinct("usuario_id").length + " usuarios");
}

// ============================================================================== comprobacion final
registrar("DOC-99", "La base de la aplicacion (dlbp) no cambio: mismos 11 libros, 12 peliculas y 5 comparativas, y sin ids de prueba", antes + "; 0 ids de prueba",
  [APP.libros.countDocuments(), APP.peliculas.countDocuments(), APP.resenas_comparativas.countDocuments()].join(", ") + "; " +
  (APP.libros.countDocuments({ _id: /^00000000-/ }) + APP.peliculas.countDocuments({ _id: /^00000000-/ }) + APP.resenas_comparativas.countDocuments({ _id: /^00000000-/ })) + " ids de prueba");

// ============================================================================== resultados
print("\nCatalogo documental  (MongoDB " + db.version() + ")\n");
for (const r of RESULTADOS) {
  print((r.ok ? "PASA  " : "FALLA ") + r.prueba.padEnd(10) + r.descripcion);
  print("            esperado: " + r.esperado);
  print("            obtenido: " + r.obtenido);
}
const fallan = RESULTADOS.filter(r => !r.ok).length;
print("\nPasan " + (RESULTADOS.length - fallan) + " de " + RESULTADOS.length + ", fallan " + fallan + ".");
const porAP = {};
for (const r of RESULTADOS) {
  const m = /^(AP-\d+)-([nle])\d+$/.exec(r.prueba);
  if (!m) continue;
  porAP[m[1]] = porAP[m[1]] || { n: 0, l: 0, e: 0 };
  porAP[m[1]][m[2]]++;
}
print("\nCasos por patron (normales / limite / error):");
for (const ap of Object.keys(porAP).sort()) print("  " + ap + "  " + porAP[ap].n + " / " + porAP[ap].l + " / " + porAP[ap].e);
db.dropDatabase();                                   // la base de pruebas no se conserva
quit(fallan === 0 ? 0 : 1);
