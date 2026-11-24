// =============================================================================
// Pruebas de validación documental: documentos válidos e inválidos.
// Fuente: docs/modelado/documental/04-validacion.md, sección 7 (pruebas 1 a 26) y extras.
// Se ejecuta con: docker exec dlbp-mongo sh /db/documental/mongo.sh pruebas/01-validacion.js
// Termina con código 1 si alguna prueba falla.
// =============================================================================
load("/db/documental/pruebas/00-ayudas.js");

const LIBRO = "6f1d7a52-3c0e-4b8a-9a1e-0b2c4d5e6f01";
const PELI = "9a8c3e17-5b2d-4f60-8e3a-1c7d9b0a2f02";
const COMP = "e7b19d44-2c6a-4d0f-a1b5-3e8c5f7a9d04";
const ED_ESP = "8d4a1f63-0c2b-47e9-a5d8-3b6c1e9f2a12";      // edición sin ISBN
const URL_LARGA = "https://" + "a".repeat(493);               // 501 caracteres

// ---- 1: los documentos de ejemplo se aceptan --------------------------------
vaciar();
registrar("1", "Insertar los documentos de ejemplo de libros, peliculas y resenas_comparativas",
  "aceptado, aceptado, aceptado",
  [intentar(() => db.libros.insertOne(libroBase())),
   intentar(() => db.peliculas.insertOne(peliculaBase())),
   intentar(() => db.resenas_comparativas.insertOne(comparativaBase()))].join(", "));

// ---- 2: campo obligatorio ausente --------------------------------------------
casoInsertar("2a", "Libro sin titulo", "libros", libroBase, d => { delete d.titulo; });
casoInsertar("2b", "Película sin datos_tecnicos.paises", "peliculas", peliculaBase, d => { delete d.datos_tecnicos.paises; });
casoInsertar("2c", "Comparativa sin usuario_id", "resenas_comparativas", comparativaBase, d => { delete d.usuario_id; });

// ---- 3: formato de UUID -------------------------------------------------------
casoInsertar("3a", "_id en mayúsculas", "libros", libroBase, d => { d._id = d._id.toUpperCase(); });
casoInsertar("3b", "Reparto con persona_id inválido", "peliculas", peliculaBase, d => { d.reparto[0].persona_id = "no-es-un-uuid"; });

// ---- 4: enum de estado --------------------------------------------------------
casoInsertar("4", "estado_publicacion distinto de borrador y publicada", "libros", libroBase, d => { d.estado_publicacion = "archivada"; });

// ---- 5: géneros ---------------------------------------------------------------
casoInsertar("5a", "Libro con generos vacío", "libros", libroBase, d => { d.generos = []; });
casoInsertar("5b", "Libro con géneros repetidos", "libros", libroBase, d => { d.generos = ["aventura", "aventura"]; });

// ---- 6: rangos ----------------------------------------------------------------
casoInsertar("6a", "Libro con año de publicación 3000", "libros", libroBase, d => { d.anio_publicacion_original = 3000; });
casoInsertar("6b", "Película con año de estreno 1700", "peliculas", peliculaBase, d => { d.anio_estreno = 1700; });
casoInsertar("6c", "Película con duración 0", "peliculas", peliculaBase, d => { d.duracion_min = 0; });

// ---- 7: campos desconocidos ---------------------------------------------------
casoInsertar("7a", "Libro con un campo no definido", "libros", libroBase, d => { d.foto = "x"; });
vaciar(); db.libros.insertOne(libroBase());
registrar("7b", "Agregar una edición con un campo no definido", RECHAZO_VALIDADOR,
  intentar(() => db.libros.updateOne({ _id: LIBRO }, { $push: { ediciones: {
    edicion_id: uid(13), paginas: 1, editorial: "x", idioma: "es", anio: 2000, extra: "z" } } })));

// ---- 8: formato de ISBN -------------------------------------------------------
casoInsertar("8", "Edición con ISBN con guiones", "libros", libroBase, d => { d.ediciones[0].isbn = "978-0-441-17271-9"; });

// ---- 9: elementos embebidos incompletos ---------------------------------------
casoInsertar("9a", "Edición sin paginas", "libros", libroBase, d => { delete d.ediciones[0].paginas; });
casoInsertar("9b", "Plataforma sin nombre", "peliculas", peliculaBase, d => { d.plataformas = [{}]; });
casoInsertar("9c", "Plataforma con un campo url (ya no existe, D-26)", "peliculas", peliculaBase,
  d => { d.plataformas = [{ nombre: "A", url: "https://a.example.com" }]; });
casoInsertar("9d", "Reparto con orden 0", "peliculas", peliculaBase, d => { d.reparto[0].orden = 0; });

// ---- 10: comparativas inválidas -----------------------------------------------
casoInsertar("10a", "Puntuación 0", "resenas_comparativas", comparativaBase, d => { d.aspectos[0].puntuacion = 0; });
casoInsertar("10b", "Puntuación 6", "resenas_comparativas", comparativaBase, d => { d.aspectos[0].puntuacion = 6; });
casoInsertar("10c", "Preferencia 'ambas'", "resenas_comparativas", comparativaBase, d => { d.veredicto.preferencia = "ambas"; });
casoInsertar("10d", "Sin aspectos", "resenas_comparativas", comparativaBase, d => { d.aspectos = []; });
casoInsertar("10e", "11 aspectos", "resenas_comparativas", comparativaBase,
  d => { d.aspectos = Array.from({ length: 11 }, (_, i) => ({ nombre: "Aspecto " + i })); });
casoInsertar("10f", "oculta como texto", "resenas_comparativas", comparativaBase, d => { d.oculta = "no"; });
casoInsertar("10g", "Comentario vacío en el veredicto", "resenas_comparativas", comparativaBase, d => { d.veredicto.comentario = ""; });

// ---- 11: documentos mínimos válidos -------------------------------------------
casoInsertar("11a", "Libro sin ediciones (arreglo vacío)", "libros", libroBase, d => { d.ediciones = []; }, "aceptado");
casoInsertar("11b", "Película en borrador con reparto vacío", "peliculas", peliculaBase,
  d => { d.estado_publicacion = "borrador"; d.reparto = []; }, "aceptado");
casoInsertar("11c", "Película sin productoras ni clasificacion", "peliculas", peliculaBase,
  d => { delete d.datos_tecnicos.productoras; delete d.datos_tecnicos.clasificacion; }, "aceptado");

// ---- 12: RF-09, el esquema no cambia al agregar ediciones o plataformas ---------
vaciar(); db.libros.insertOne(libroBase()); db.peliculas.insertOne(peliculaBase());
const validadorAntes = JSON.stringify([db.getCollectionInfos({ name: "libros" })[0].options.validator,
                                        db.getCollectionInfos({ name: "peliculas" })[0].options.validator]);
registrar("12a", "Agregar una edición válida con $push", "modificados=1",
  modificados(() => db.libros.updateOne({ _id: LIBRO }, { $push: { ediciones: {
    edicion_id: uid(14), isbn: "9780306406157", paginas: 300, editorial: "Nueva", idioma: "francés", anio: 2010 } } })));
registrar("12b", "Agregar una plataforma válida con $push", "modificados=1",
  modificados(() => db.peliculas.updateOne({ _id: PELI }, { $push: { plataformas: { nombre: "Plataforma C" } } })));
registrar("12c", "Reemplazar el reparto completo (AP-17)", "modificados=1",
  modificados(() => db.peliculas.updateOne({ _id: PELI }, { $set: { reparto: [
    { persona_id: uid(21), nombre: "Persona Nueva", personaje: "Personaje", orden: 1 } ] } })));
registrar("12d", "El validador no se modificó", "igual",
  JSON.stringify([db.getCollectionInfos({ name: "libros" })[0].options.validator,
                  db.getCollectionInfos({ name: "peliculas" })[0].options.validator]) === validadorAntes ? "igual" : "cambió");

// ---- 13 y 14: comparativas ----------------------------------------------------
casoInsertar("13", "Comparativa con un aspecto de nombre nuevo y sin puntuación (RF-16)", "resenas_comparativas",
  comparativaBase, d => { d.aspectos = [{ nombre: "Aspecto inventado por el usuario" }]; }, "aceptado");
vaciar(); db.resenas_comparativas.insertOne(comparativaBase());
registrar("14", "Ocultar una comparativa (AP-26)", "modificados=1",
  modificados(() => db.resenas_comparativas.updateOne({ _id: COMP }, { $set: { oculta: true } })));

// ---- 15 y 16: duplicados dentro del mismo documento (los evita la API con filtro condicional) --
vaciar(); db.libros.insertOne(libroBase()); db.peliculas.insertOne(peliculaBase());
registrar("15", "Agregar a un libro una edición con un ISBN que ya tiene, con el filtro condicional de la API", "modificados=0",
  modificados(() => db.libros.updateOne({ _id: LIBRO, "ediciones.isbn": { $ne: "9780441172719" } },
    { $push: { ediciones: { edicion_id: uid(15), isbn: "9780441172719", paginas: 1, editorial: "x", idioma: "es", anio: 2000 } } })));
registrar("16", "Agregar a una película una plataforma con un nombre que ya tiene, con el filtro condicional", "modificados=0",
  modificados(() => db.peliculas.updateOne({ _id: PELI, "plataformas.nombre": { $ne: "Plataforma A" } },
    { $push: { plataformas: { nombre: "Plataforma A" } } })));

// ---- 17: el nivel estricto valida también las actualizaciones -------------------
vaciar(); db.libros.insertOne(libroBase()); db.resenas_comparativas.insertOne(comparativaBase());
registrar("17a", "Actualizar un libro válido dejando el título vacío", RECHAZO_VALIDADOR,
  intentar(() => db.libros.updateOne({ _id: LIBRO }, { $set: { titulo: "" } })));
registrar("17b", "Actualizar una comparativa válida con puntuación 7", RECHAZO_VALIDADOR,
  intentar(() => db.resenas_comparativas.updateOne({ _id: COMP }, { $set: { "aspectos.0.puntuacion": 7 } })));

// ---- 18 y 19: corregir el ISBN de una edición (AP-12) --------------------------
// Preparación: el libro tiene dos ediciones con ISBN (ISBN_A en ED_ACE e ISBN_B en ED_ESP) y otro libro tiene ISBN_C.
const ISBN_A = "9780441172719", ISBN_B = "9780306406157", ISBN_LIBRE = "9780140449136", ISBN_C = "9781234567897";
function prepararIsbn() {
  vaciar();
  const libro = libroBase(); libro.ediciones[1].isbn = ISBN_B;
  db.libros.insertOne(libro);
  const otro = libroBase(); otro._id = uid(2);
  otro.ediciones = [{ edicion_id: uid(22), isbn: ISBN_C, paginas: 100, editorial: "Otra", idioma: "es", anio: 1999 }];
  db.libros.insertOne(otro);
}
// La corrección de AP-12: filtro con "$ne" sobre el ISBN nuevo + arrayFilters por edicion_id
const corregirIsbn = (nuevo, conFiltro) => () => db.libros.updateOne(
  Object.assign({ _id: LIBRO, "ediciones.edicion_id": ED_ESP }, conFiltro ? { "ediciones.isbn": { $ne: nuevo } } : {}),
  { $set: { "ediciones.$[e].isbn": nuevo } }, { arrayFilters: [{ "e.edicion_id": ED_ESP }] });

prepararIsbn();
registrar("18", "Corregir el ISBN a uno que ya tiene otra edición del mismo libro, con el filtro condicional", "modificados=0",
  modificados(corregirIsbn(ISBN_A, true)));
prepararIsbn();
registrar("19a", "Corregir el ISBN a uno libre", "modificados=1", modificados(corregirIsbn(ISBN_LIBRE, true)));
registrar("19b", "Corregir otro campo de la edición (paginas) sin filtro de ISBN", "modificados=1",
  modificados(() => db.libros.updateOne({ _id: LIBRO }, { $set: { "ediciones.$[e].paginas": 600 } },
    { arrayFilters: [{ "e.edicion_id": ED_ESP }] })));
prepararIsbn();
registrar("19c", "Corregir el ISBN a uno que ya tiene OTRO libro", RECHAZO_DUPLICADO, modificados(corregirIsbn(ISBN_C, true)));

// ---- 20 y 21: renombrar una plataforma (AP-15) ---------------------------------
// Un objeto JS no admite dos veces la misma clave, así que los dos filtros sobre el nombre van en $and.
const renombrar = (actual, nuevo) => () => db.peliculas.updateOne(
  { _id: PELI, $and: [{ "plataformas.nombre": { $ne: nuevo } }, { "plataformas.nombre": actual }] },
  { $set: { "plataformas.$[p].nombre": nuevo } }, { arrayFilters: [{ "p.nombre": actual }] });
vaciar(); db.peliculas.insertOne(peliculaBase());
registrar("20", "Renombrar una plataforma a un nombre que ya tiene la película, con el filtro condicional", "modificados=0",
  modificados(renombrar("Plataforma B", "Plataforma A")));
registrar("21", "Renombrar una plataforma a un nombre libre", "modificados=1",
  modificados(renombrar("Plataforma B", "Plataforma Z")));
registrar("21b", "Tras renombrar, la película tiene A y Z (y ya no B)", "Plataforma A,Plataforma Z",
  db.peliculas.findOne({ _id: PELI }).plataformas.map(p => p.nombre).join(","));

// ---- 22 a 24: portada_url (D-25) ------------------------------------------------
vaciar();
const libroSinPortada = libroBase(); delete libroSinPortada.portada_url;
const peliSinPortada = peliculaBase(); delete peliSinPortada.portada_url;
registrar("22a", "Libro y película con portada_url válida", "aceptado, aceptado",
  [intentar(() => db.libros.insertOne(libroBase())), intentar(() => db.peliculas.insertOne(peliculaBase()))].join(", "));
vaciar();
registrar("22b", "Libro y película sin portada_url", "aceptado, aceptado",
  [intentar(() => db.libros.insertOne(libroSinPortada)), intentar(() => db.peliculas.insertOne(peliSinPortada))].join(", "));
const portadasMalas = { "http://": "http://ejemplo.com/p.jpg", "vacía": "", "con espacios": "https://ejemplo.com/mi portada.jpg", "de 501 caracteres": URL_LARGA };
for (const [que, valor] of Object.entries(portadasMalas)) {
  casoInsertar("23", "portada_url " + que + ": libro y película", "libros", libroBase, d => { d.portada_url = valor; });
  const libro = RESULTADOS.pop();
  casoInsertar("23", "", "peliculas", peliculaBase, d => { d.portada_url = valor; });
  const peli = RESULTADOS.pop();
  registrar("23", "portada_url " + que + ": libro y película", RECHAZO_VALIDADOR + ", " + RECHAZO_VALIDADOR, libro.obtenido + ", " + peli.obtenido);
}
vaciar(); db.libros.insertOne(libroSinPortada);
registrar("24a", "Agregar portada_url a una ficha existente (AP-10)", "modificados=1",
  modificados(() => db.libros.updateOne({ _id: LIBRO }, { $set: { portada_url: "https://ejemplo.com/p.jpg" } })));
registrar("24b", "Quitarla después con $unset", "modificados=1",
  modificados(() => db.libros.updateOne({ _id: LIBRO }, { $unset: { portada_url: "" } })));
registrar("24c", "Tras el $unset el campo no existe", "sin portada_url",
  "portada_url" in db.libros.findOne({ _id: LIBRO }) ? "sigue existiendo" : "sin portada_url");

// ---- 25 y 26: reparto[].foto_url (D-27) -----------------------------------------
vaciar();
registrar("25a", "Película con un actor con foto_url válida y otro sin ella", "aceptado",
  intentar(() => db.peliculas.insertOne(peliculaBase())));
registrar("25b", "Reemplazar el reparto cambiando una foto y quitando la otra (AP-17)", "modificados=1",
  modificados(() => db.peliculas.updateOne({ _id: PELI }, { $set: { reparto: [
    { persona_id: uid(31), nombre: "Actor Uno", personaje: "P1", orden: 1, foto_url: "https://ejemplo.com/nueva.jpg" },
    { persona_id: uid(32), nombre: "Actor Dos", personaje: "P2", orden: 2 } ] } })));
const fotosMalas = { "http://": "http://ejemplo.com/f.jpg", "vacía": "", "con espacios": "https://ejemplo.com/mi foto.jpg", "de 501 caracteres": URL_LARGA };
for (const [que, valor] of Object.entries(fotosMalas)) {
  casoInsertar("26", "reparto[].foto_url " + que, "peliculas", peliculaBase, d => { d.reparto[0].foto_url = valor; });
}

// ---- Extras --------------------------------------------------------------------
registrar("E1", "Las tres colecciones tienen validationLevel strict y validationAction error", "strict/error x3",
  ["libros", "peliculas", "resenas_comparativas"].map(n => {
    const o = db.getCollectionInfos({ name: n })[0].options; return o.validationLevel + "/" + o.validationAction;
  }).every(x => x === "strict/error") ? "strict/error x3" : "distinto");
casoInsertar("E2", "Puntuación decimal 4.0 (Double): el cliente debe enviar enteros", "resenas_comparativas", comparativaBase,
  d => { d.aspectos[0].puntuacion = Double(4.0); });
casoInsertar("E3", "Fecha como texto en creado_en", "libros", libroBase, d => { d.creado_en = "2026-11-19T10:00:00Z"; });

terminar("Pruebas de validación documental");
