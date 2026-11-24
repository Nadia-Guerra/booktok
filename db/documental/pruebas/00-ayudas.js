// =============================================================================
// Ayudas comunes de las pruebas documentales. Se cargan con load() desde cada prueba.
//
// Las pruebas NO tocan la base de la aplicación: crean una base aparte (dlbp_pruebas) y le
// cargan los mismos 01-colecciones.js y 02-indices.js que se entregan, así que prueban
// exactamente las definiciones reales.
// =============================================================================

db = db.getSiblingDB("dlbp_pruebas");
load("/db/documental/01-colecciones.js");
load("/db/documental/02-indices.js");

const RESULTADOS = [];
const RECHAZO_VALIDADOR = "rechazado 121";      // DocumentValidationFailure
const RECHAZO_DUPLICADO = "rechazado 11000";    // DuplicateKey

function registrar(prueba, descripcion, esperado, obtenido) {
  RESULTADOS.push({ prueba, descripcion, esperado, obtenido, ok: esperado === obtenido });
}

// Ejecuta una escritura: 'aceptado' o 'rechazado <código>' (121 validador, 11000 clave duplicada).
function intentar(escritura) {
  try { escritura(); return "aceptado"; }
  catch (e) { return "rechazado " + (e.code !== undefined ? e.code : e.message); }
}

// Ejecuta un updateOne y resume cuántos documentos modificó (para las actualizaciones condicionales).
function modificados(actualizacion) {
  try { return "modificados=" + actualizacion().modifiedCount; }
  catch (e) { return "rechazado " + (e.code !== undefined ? e.code : e.message); }
}

function vaciar() {
  db.libros.deleteMany({});
  db.peliculas.deleteMany({});
  db.resenas_comparativas.deleteMany({});
}

// UUID legible y reproducible: uid(7) = 00000000-0000-4000-8000-000000000007
function uid(n) { return "00000000-0000-4000-8000-" + String(n).padStart(12, "0"); }

const AHORA = new Date("2026-11-19T10:00:00Z");

// Los tres documentos de ejemplo de docs/modelado/documental/03-colecciones.md (sección 3).
// Cada llamada devuelve una copia nueva, para que una prueba pueda modificarla.
function libroBase() {
  return {
    _id: "6f1d7a52-3c0e-4b8a-9a1e-0b2c4d5e6f01",
    titulo: "Dune",
    sinopsis: "En el planeta desértico Arrakis, el joven Paul Atreides se ve arrastrado a una lucha por el control de la especia.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/dune-libro.jpg",
    generos: ["ciencia ficción", "aventura"],
    anio_publicacion_original: 1965,
    ediciones: [
      { edicion_id: "2b7e5c10-8a3d-4f19-b6c2-5d0e9a1c7f11", isbn: "9780441172719", paginas: 535,
        editorial: "Ace", idioma: "inglés", anio: 2005 },
      { edicion_id: "8d4a1f63-0c2b-47e9-a5d8-3b6c1e9f2a12", paginas: 704,
        editorial: "Editorial de ejemplo", idioma: "español", anio: 1983 }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-19T10:00:00Z"),
    actualizado_en: new Date("2026-11-19T10:00:00Z")
  };
}

function peliculaBase() {
  return {
    _id: "9a8c3e17-5b2d-4f60-8e3a-1c7d9b0a2f02",
    titulo: "Dune",
    sinopsis: "Paul Atreides viaja a Arrakis para proteger a su familia y a un pueblo del desierto.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/dune-pelicula.jpg",
    generos: ["ciencia ficción", "aventura"],
    anio_estreno: 2021,
    duracion_min: 155,
    plataformas: [{ nombre: "Plataforma A" }, { nombre: "Plataforma B" }],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Estados Unidos", "Canadá"],
      productoras: ["Legendary Pictures", "Warner Bros. Pictures"],
      clasificacion: "PG-13"
    },
    reparto: [
      { persona_id: "d1e2f3a4-0001-4b5c-8d6e-7f8a9b0c1d21", nombre: "Timothée Chalamet",
        personaje: "Paul Atreides", orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/d1e2f3a4-0001-4b5c-8d6e-7f8a9b0c1d21.jpg" },
      { persona_id: "d1e2f3a4-0002-4b5c-8d6e-7f8a9b0c1d22", nombre: "Rebecca Ferguson",
        personaje: "Lady Jessica", orden: 2 }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-19T10:05:00Z"),
    actualizado_en: new Date("2026-11-19T10:20:00Z")
  };
}

function comparativaBase() {
  return {
    _id: "e7b19d44-2c6a-4d0f-a1b5-3e8c5f7a9d04",
    usuario_id: "c4e2b7d9-1a3f-4c58-b6e0-7f9a2d3c4b03",
    libro_id: "6f1d7a52-3c0e-4b8a-9a1e-0b2c4d5e6f01",
    pelicula_id: "9a8c3e17-5b2d-4f60-8e3a-1c7d9b0a2f02",
    veredicto: {
      preferencia: "libro",
      comentario: "La película es espectacular, pero el libro da más espacio a la política y a los personajes."
    },
    aspectos: [
      { nombre: "Fidelidad", puntuacion: 4, comentario: "Respeta la trama principal." },
      { nombre: "Ritmo", puntuacion: 3 },
      { nombre: "Final", comentario: "La película termina a mitad de la historia." },
      { nombre: "Ambientación visual", puntuacion: 5 }
    ],
    oculta: false,
    creado_en: new Date("2026-11-19T11:00:00Z"),
    actualizado_en: new Date("2026-11-19T11:00:00Z")
  };
}

// Vacía las colecciones, aplica `mutar` a una copia del documento base y lo inserta.
// Registra el resultado de la inserción contra el esperado.
function casoInsertar(prueba, descripcion, coleccion, base, mutar, esperado) {
  vaciar();
  const doc = base();
  mutar(doc);
  registrar(prueba, descripcion, esperado === undefined ? RECHAZO_VALIDADOR : esperado,
            intentar(() => db.getCollection(coleccion).insertOne(doc)));
}

// Imprime la tabla de resultados y termina con código 1 si alguna prueba falla.
function terminar(titulo) {
  print("\n" + titulo + "  (MongoDB " + db.version() + ")\n");
  for (const r of RESULTADOS) {
    print((r.ok ? "PASA  " : "FALLA ") + r.prueba.padEnd(8) + r.descripcion);
    if (!r.ok) print("      esperado: " + r.esperado + "\n      obtenido: " + r.obtenido);
  }
  const fallan = RESULTADOS.filter(r => !r.ok).length;
  print("\nPasan " + (RESULTADOS.length - fallan) + " de " + RESULTADOS.length + ", fallan " + fallan + ".");
  db.dropDatabase();      // la base de pruebas no se conserva
  quit(fallan === 0 ? 0 : 1);
}
