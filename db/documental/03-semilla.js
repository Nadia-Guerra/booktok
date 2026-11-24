// =============================================================================
// ARCHIVO GENERADO: no lo edites a mano.
// Fuente unica: db/semilla/semilla.json. Regenerar con: powershell -File db\semilla\generar.ps1
// Descripcion y escenarios: db/semilla/README.md
// Se puede repetir: vacia las tres colecciones y vuelve a cargar. Requiere 01-colecciones.js y 02-indices.js.
// El reparto de cada pelicula es la copia de las relaciones actuo_en del grafo (D-12, D-27).
// =============================================================================

db.libros.deleteMany({});
db.peliculas.deleteMany({});
db.resenas_comparativas.deleteMany({});

db.libros.insertMany([
  {
    _id: "b1000000-0000-4000-8000-000000000001",
    titulo: "Dune",
    sinopsis: "En el planeta desértico Arrakis, el joven Paul Atreides se ve arrastrado a una lucha por el control de la especia, el recurso más valioso del universo.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/libro-dune.jpg",
    generos: ["ciencia ficción", "aventura"],
    anio_publicacion_original: 1965,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000001",
        isbn: "9780441172719",
        paginas: 535,
        editorial: "Ace",
        idioma: "inglés",
        anio: 2005
      },
      {
        edicion_id: "e1000000-0000-4000-8000-000000000002",
        paginas: 704,
        editorial: "Editorial de ejemplo",
        idioma: "español",
        anio: 1983
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T09:00:00Z"),
    actualizado_en: new Date("2026-11-01T09:30:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000002",
    titulo: "¿Sueñan los androides con ovejas eléctricas?",
    sinopsis: "En una Tierra devastada, un cazador de recompensas persigue androides que se hacen pasar por humanos y se pregunta qué nos hace humanos.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/libro-androides.jpg",
    generos: ["ciencia ficción", "distopía"],
    anio_publicacion_original: 1968,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000003",
        isbn: "9780345404473",
        paginas: 244,
        editorial: "Del Rey",
        idioma: "inglés",
        anio: 1996
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T09:10:00Z"),
    actualizado_en: new Date("2026-11-01T09:40:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000003",
    titulo: "El marciano",
    sinopsis: "Un astronauta queda abandonado en Marte tras una tormenta y debe sobrevivir con ingenio y ciencia hasta que alguien pueda rescatarlo.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/libro-marciano.jpg",
    generos: ["ciencia ficción", "aventura"],
    anio_publicacion_original: 2011,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000004",
        isbn: "9788030123456",
        paginas: 369,
        editorial: "Editorial de ejemplo",
        idioma: "español",
        anio: 2014
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T09:20:00Z"),
    actualizado_en: new Date("2026-11-01T09:50:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000004",
    titulo: "Historia de tu vida",
    sinopsis: "Una lingüista aprende el idioma de unos visitantes extraterrestres y, con él, una nueva forma de percibir el tiempo.",
    generos: ["ciencia ficción", "drama"],
    anio_publicacion_original: 1998,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000005",
        paginas: 352,
        editorial: "Editorial de ejemplo",
        idioma: "español",
        anio: 2017
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T09:30:00Z"),
    actualizado_en: new Date("2026-11-01T10:00:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000005",
    titulo: "Parque Jurásico",
    sinopsis: "Un parque temático de dinosaurios clonados escapa al control de sus creadores y los visitantes deben sobrevivir a la isla.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/libro-parque-jurasico.jpg",
    generos: ["ciencia ficción", "aventura", "suspense"],
    anio_publicacion_original: 1990,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000006",
        isbn: "9780345418975",
        paginas: 466,
        editorial: "Ballantine",
        idioma: "inglés",
        anio: 1990
      },
      {
        edicion_id: "e1000000-0000-4000-8000-000000000007",
        paginas: 480,
        editorial: "Editorial de ejemplo",
        idioma: "español",
        anio: 1993
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T09:40:00Z"),
    actualizado_en: new Date("2026-11-01T10:10:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000006",
    titulo: "El Hobbit",
    sinopsis: "Bilbo Bolsón, un hobbit tranquilo, es arrastrado por un mago y trece enanos a recuperar un tesoro custodiado por un dragón.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/libro-hobbit.jpg",
    generos: ["fantasía", "aventura"],
    anio_publicacion_original: 1937,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000008",
        isbn: "9780618082513",
        paginas: 300,
        editorial: "Houghton Mifflin",
        idioma: "inglés",
        anio: 2001
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T09:50:00Z"),
    actualizado_en: new Date("2026-11-01T10:20:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000007",
    titulo: "La Comunidad del Anillo",
    sinopsis: "Frodo hereda un anillo de poder y emprende, junto a una compañía de nueve, un viaje para destruirlo en el fuego donde fue forjado.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/libro-comunidad-anillo.jpg",
    generos: ["fantasía", "aventura"],
    anio_publicacion_original: 1954,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000009",
        isbn: "9780618251261",
        paginas: 423,
        editorial: "Houghton Mifflin",
        idioma: "inglés",
        anio: 2002
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T10:00:00Z"),
    actualizado_en: new Date("2026-11-01T10:30:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000008",
    titulo: "Orgullo y prejuicio",
    sinopsis: "Elizabeth Bennet y el reservado señor Darcy superan sus prejuicios mutuos en la Inglaterra rural de principios del siglo XIX.",
    generos: ["romance", "clásico"],
    anio_publicacion_original: 1813,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000010",
        paginas: 432,
        editorial: "Editorial de ejemplo",
        idioma: "español",
        anio: 2010
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T10:10:00Z"),
    actualizado_en: new Date("2026-11-01T10:40:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000009",
    titulo: "Expiación",
    sinopsis: "Una acusación falsa de una niña de trece años destruye el amor de su hermana y cambia para siempre la vida de los tres.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/libro-expiacion.jpg",
    generos: ["drama", "romance"],
    anio_publicacion_original: 2001,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000011",
        isbn: "9780385721790",
        paginas: 351,
        editorial: "Anchor",
        idioma: "inglés",
        anio: 2003
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T10:20:00Z"),
    actualizado_en: new Date("2026-11-01T10:50:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000010",
    titulo: "Asesinato en el Orient Express",
    sinopsis: "El detective Hercule Poirot investiga un crimen cometido en un tren detenido por la nieve, donde todos los pasajeros tienen algo que ocultar.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/libro-orient-express.jpg",
    generos: ["misterio", "policíaco"],
    anio_publicacion_original: 1934,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000012",
        isbn: "9780062073501",
        paginas: 288,
        editorial: "Harper",
        idioma: "inglés",
        anio: 2011
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T10:30:00Z"),
    actualizado_en: new Date("2026-11-01T11:00:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000011",
    titulo: "Neuromante",
    sinopsis: "Un pirata informático castigado por sus antiguos empleadores recibe una última oportunidad de volver a entrar en el ciberespacio.",
    generos: ["ciencia ficción", "cyberpunk"],
    anio_publicacion_original: 1984,
    ediciones: [],
    estado_publicacion: "borrador",
    creado_en: new Date("2026-11-05T09:00:00Z"),
    actualizado_en: new Date("2026-11-05T09:00:00Z")
  }
]);

db.peliculas.insertMany([
  {
    _id: "f1000000-0000-4000-8000-000000000001",
    titulo: "Dune",
    sinopsis: "Paul Atreides viaja a Arrakis para proteger a su familia y a un pueblo del desierto de las ambiciones de las grandes casas.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/pelicula-dune-2021.jpg",
    generos: ["ciencia ficción", "aventura"],
    anio_estreno: 2021,
    duracion_min: 155,
    plataformas: [
      { nombre: "Plataforma A" },
      { nombre: "Plataforma B" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Estados Unidos", "Canadá"],
      productoras: ["Legendary Pictures", "Warner Bros. Pictures"],
      clasificacion: "PG-13"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000017",
        nombre: "Timothée Chalamet",
        personaje: "Paul Atreides",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000017.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000018",
        nombre: "Rebecca Ferguson",
        personaje: "Lady Jessica",
        orden: 2,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000018.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T11:00:00Z"),
    actualizado_en: new Date("2026-11-01T11:30:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000002",
    titulo: "Dune: Parte dos",
    sinopsis: "Paul Atreides se une a los fremen para vengar a su familia y evitar el futuro terrible que ha visto.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/pelicula-dune-parte-dos.jpg",
    generos: ["ciencia ficción", "aventura"],
    anio_estreno: 2024,
    duracion_min: 166,
    plataformas: [
      { nombre: "Plataforma A" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Estados Unidos", "Canadá"],
      productoras: ["Legendary Pictures"],
      clasificacion: "PG-13"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000017",
        nombre: "Timothée Chalamet",
        personaje: "Paul Atreides",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000017.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000018",
        nombre: "Rebecca Ferguson",
        personaje: "Lady Jessica",
        orden: 2,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000018.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T11:10:00Z"),
    actualizado_en: new Date("2026-11-01T11:40:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000003",
    titulo: "Blade Runner",
    sinopsis: "En un Los Ángeles futurista, un expolicía debe dar caza a cuatro replicantes que han vuelto a la Tierra.",
    generos: ["ciencia ficción", "neo-noir"],
    anio_estreno: 1982,
    duracion_min: 117,
    plataformas: [],
    datos_tecnicos: { idioma_original: "inglés", paises: ["Estados Unidos"], productoras: ["The Ladd Company"], clasificacion: "R" },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000019",
        nombre: "Harrison Ford",
        personaje: "Rick Deckard",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000019.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T11:20:00Z"),
    actualizado_en: new Date("2026-11-01T11:50:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000004",
    titulo: "El marciano",
    sinopsis: "Un botánico dado por muerto en Marte improvisa su supervivencia mientras la Tierra prepara una misión de rescate.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/pelicula-marciano.jpg",
    generos: ["ciencia ficción", "aventura"],
    anio_estreno: 2015,
    duracion_min: 144,
    plataformas: [
      { nombre: "Plataforma B" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Estados Unidos", "Reino Unido"],
      productoras: ["Scott Free Productions"],
      clasificacion: "PG-13"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000020",
        nombre: "Matt Damon",
        personaje: "Mark Watney",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000020.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T11:30:00Z"),
    actualizado_en: new Date("2026-11-01T12:00:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000005",
    titulo: "La llegada",
    sinopsis: "Doce naves aparecen sobre la Tierra y una lingüista intenta descifrar el idioma de los visitantes antes de que estalle un conflicto.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/pelicula-la-llegada.jpg",
    generos: ["ciencia ficción", "drama"],
    anio_estreno: 2016,
    duracion_min: 116,
    plataformas: [
      { nombre: "Plataforma A" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Estados Unidos", "Canadá"],
      productoras: ["FilmNation Entertainment"],
      clasificacion: "PG-13"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000021",
        nombre: "Amy Adams",
        personaje: "Louise Banks",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000021.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T11:40:00Z"),
    actualizado_en: new Date("2026-11-01T12:10:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000006",
    titulo: "Parque Jurásico",
    sinopsis: "Un grupo de expertos visita un parque con dinosaurios clonados justo cuando falla su sistema de seguridad.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/pelicula-parque-jurasico.jpg",
    generos: ["ciencia ficción", "aventura"],
    anio_estreno: 1993,
    duracion_min: 127,
    plataformas: [
      { nombre: "Plataforma B" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Estados Unidos"],
      productoras: ["Amblin Entertainment"],
      clasificacion: "PG-13"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000022",
        nombre: "Sam Neill",
        personaje: "Alan Grant",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000022.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T11:50:00Z"),
    actualizado_en: new Date("2026-11-01T12:20:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000007",
    titulo: "El Hobbit: un viaje inesperado",
    sinopsis: "Bilbo Bolsón se une a trece enanos y al mago Gandalf para recuperar el reino de Erebor del dragón Smaug.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/pelicula-hobbit-viaje-inesperado.jpg",
    generos: ["fantasía", "aventura"],
    anio_estreno: 2012,
    duracion_min: 169,
    plataformas: [
      { nombre: "Plataforma A" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Nueva Zelanda", "Estados Unidos"],
      productoras: ["New Line Cinema"],
      clasificacion: "PG-13"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000023",
        nombre: "Martin Freeman",
        personaje: "Bilbo Bolsón",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000023.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000024",
        nombre: "Ian McKellen",
        personaje: "Gandalf",
        orden: 2,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000024.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T12:00:00Z"),
    actualizado_en: new Date("2026-11-01T12:30:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000008",
    titulo: "El Señor de los Anillos: La Comunidad del Anillo",
    sinopsis: "Un joven hobbit recibe un anillo maldito y parte con una compañía de nueve para destruirlo en el Monte del Destino.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/pelicula-comunidad-anillo.jpg",
    generos: ["fantasía", "aventura"],
    anio_estreno: 2001,
    duracion_min: 178,
    plataformas: [
      { nombre: "Plataforma A" },
      { nombre: "Plataforma B" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Nueva Zelanda", "Estados Unidos"],
      productoras: ["New Line Cinema"],
      clasificacion: "PG-13"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000025",
        nombre: "Elijah Wood",
        personaje: "Frodo Bolsón",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000025.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000024",
        nombre: "Ian McKellen",
        personaje: "Gandalf",
        orden: 2,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000024.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T12:10:00Z"),
    actualizado_en: new Date("2026-11-01T12:40:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000009",
    titulo: "Orgullo y prejuicio",
    sinopsis: "Elizabeth Bennet, segunda de cinco hermanas, se enfrenta a las convenciones sociales y a su propio orgullo.",
    generos: ["romance", "drama"],
    anio_estreno: 2005,
    duracion_min: 129,
    plataformas: [],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Reino Unido", "Francia"],
      productoras: ["Working Title Films"],
      clasificacion: "PG"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000026",
        nombre: "Keira Knightley",
        personaje: "Elizabeth Bennet",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000026.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000027",
        nombre: "Matthew Macfadyen",
        personaje: "Señor Darcy",
        orden: 2
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T12:20:00Z"),
    actualizado_en: new Date("2026-11-01T12:50:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000010",
    titulo: "Expiación",
    sinopsis: "En 1935, la mentira de una niña separa a dos enamorados; años después intenta reparar el daño.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/pelicula-expiacion.jpg",
    generos: ["drama", "romance"],
    anio_estreno: 2007,
    duracion_min: 123,
    plataformas: [
      { nombre: "Plataforma B" }
    ],
    datos_tecnicos: { idioma_original: "inglés", paises: ["Reino Unido"], productoras: ["Working Title Films"], clasificacion: "R" },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000026",
        nombre: "Keira Knightley",
        personaje: "Cecilia Tallis",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000026.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000028",
        nombre: "James McAvoy",
        personaje: "Robbie Turner",
        orden: 2,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000028.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T12:30:00Z"),
    actualizado_en: new Date("2026-11-01T13:00:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000011",
    titulo: "Asesinato en el Orient Express",
    sinopsis: "Hercule Poirot debe resolver un asesinato a bordo de un lujoso tren atrapado por una avalancha.",
    portada_url: "https://almacenamiento.ejemplo.com/portadas/pelicula-orient-express.jpg",
    generos: ["misterio", "policíaco"],
    anio_estreno: 2017,
    duracion_min: 114,
    plataformas: [
      { nombre: "Plataforma A" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Estados Unidos", "Malta"],
      productoras: ["Scott Free Productions", "Kinberg Genre"],
      clasificacion: "PG-13"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000016",
        nombre: "Kenneth Branagh",
        personaje: "Hercule Poirot",
        orden: 1,
        foto_url: "https://almacenamiento.ejemplo.com/personas/a1000000-0000-4000-8000-000000000016.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000029",
        nombre: "Penélope Cruz",
        personaje: "Pilar Estravados",
        orden: 2
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-01T12:40:00Z"),
    actualizado_en: new Date("2026-11-01T13:10:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000012",
    titulo: "Neuromante",
    sinopsis: "Alta incompleta: la ficha se creó, pero todavía no tiene director ni reparto.",
    generos: ["ciencia ficción"],
    anio_estreno: 2027,
    duracion_min: 100,
    plataformas: [],
    datos_tecnicos: { idioma_original: "inglés", paises: ["Estados Unidos"] },
    reparto: [],
    estado_publicacion: "borrador",
    creado_en: new Date("2026-11-05T09:10:00Z"),
    actualizado_en: new Date("2026-11-05T09:10:00Z")
  }
]);

db.resenas_comparativas.insertMany([
  {
    _id: "ca000000-0000-4000-8000-000000000001",
    usuario_id: "c1000000-0000-4000-8000-000000000002",
    libro_id: "b1000000-0000-4000-8000-000000000001",
    pelicula_id: "f1000000-0000-4000-8000-000000000001",
    veredicto: {
      preferencia: "libro",
      comentario: "La película es espectacular, pero el libro da más espacio a la política y a los personajes."
    },
    aspectos: [
      { nombre: "Fidelidad", puntuacion: 4, comentario: "Respeta la trama principal." },
      { nombre: "Ritmo", puntuacion: 3 },
      { nombre: "Ambientación visual", puntuacion: 5 }
    ],
    oculta: false,
    creado_en: new Date("2026-11-10T20:00:00Z"),
    actualizado_en: new Date("2026-11-10T20:00:00Z")
  },
  {
    _id: "ca000000-0000-4000-8000-000000000002",
    usuario_id: "c1000000-0000-4000-8000-000000000004",
    libro_id: "b1000000-0000-4000-8000-000000000001",
    pelicula_id: "f1000000-0000-4000-8000-000000000001",
    veredicto: { preferencia: "pelicula", comentario: "La película aclara lo que en el libro se vuelve confuso." },
    aspectos: [
      { nombre: "Ritmo", puntuacion: 4 },
      { nombre: "Banda sonora", puntuacion: 5, comentario: "Imposible de ignorar." }
    ],
    oculta: false,
    creado_en: new Date("2026-11-12T20:00:00Z"),
    actualizado_en: new Date("2026-11-12T20:00:00Z")
  },
  {
    _id: "ca000000-0000-4000-8000-000000000003",
    usuario_id: "c1000000-0000-4000-8000-000000000005",
    libro_id: "b1000000-0000-4000-8000-000000000001",
    pelicula_id: "f1000000-0000-4000-8000-000000000002",
    veredicto: { preferencia: "empate" },
    aspectos: [
      { nombre: "Fidelidad", puntuacion: 4 },
      { nombre: "Final", comentario: "Cambia el final, pero conserva su espíritu." }
    ],
    oculta: false,
    creado_en: new Date("2026-11-14T20:00:00Z"),
    actualizado_en: new Date("2026-11-14T20:00:00Z")
  },
  {
    _id: "ca000000-0000-4000-8000-000000000004",
    usuario_id: "c1000000-0000-4000-8000-000000000007",
    libro_id: "b1000000-0000-4000-8000-000000000003",
    pelicula_id: "f1000000-0000-4000-8000-000000000004",
    veredicto: { preferencia: "pelicula", comentario: "La película resume bien la parte técnica sin perder el humor." },
    aspectos: [
      { nombre: "Humor", puntuacion: 4 },
      { nombre: "Fidelidad", puntuacion: 5 }
    ],
    oculta: false,
    creado_en: new Date("2026-11-15T20:00:00Z"),
    actualizado_en: new Date("2026-11-15T20:00:00Z")
  },
  {
    _id: "ca000000-0000-4000-8000-000000000005",
    usuario_id: "c1000000-0000-4000-8000-000000000008",
    libro_id: "b1000000-0000-4000-8000-000000000009",
    pelicula_id: "f1000000-0000-4000-8000-000000000010",
    veredicto: { preferencia: "libro", comentario: "Cuidado: este comentario revela el final de las dos obras." },
    aspectos: [
      { nombre: "Final", puntuacion: 2 }
    ],
    oculta: true,
    creado_en: new Date("2026-11-18T20:30:00Z"),
    actualizado_en: new Date("2026-11-18T20:30:00Z")
  }
]);

print("Semilla cargada en la base '" + db.getName() + "': " + db.libros.countDocuments() + " libros, " + db.peliculas.countDocuments() +
      " peliculas, " + db.resenas_comparativas.countDocuments() + " comparativas.");
