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
    portada_url: "https://covers.openlibrary.org/b/id/11481354-L.jpg",
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
    portada_url: "https://covers.openlibrary.org/b/id/207515-L.jpg",
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
    portada_url: "https://covers.openlibrary.org/b/id/11447888-L.jpg",
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
    portada_url: "https://covers.openlibrary.org/b/id/524046-L.jpg",
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
    portada_url: "https://covers.openlibrary.org/b/id/12882940-L.jpg",
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
    portada_url: "https://covers.openlibrary.org/b/id/14627509-L.jpg",
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
    portada_url: "https://covers.openlibrary.org/b/id/15173637-L.jpg",
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
    portada_url: "https://covers.openlibrary.org/b/id/14617366-L.jpg",
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
    portada_url: "https://covers.openlibrary.org/b/id/8381043-L.jpg",
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
    portada_url: "https://covers.openlibrary.org/b/id/11100465-L.jpg",
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
  },
  {
    _id: "b1000000-0000-4000-8000-000000000012",
    titulo: "El nombre de la rosa",
    sinopsis: "En una abadía medieval, fray Guillermo de Baskerville investiga una serie de muertes que giran en torno a una biblioteca prohibida.",
    portada_url: "https://covers.openlibrary.org/b/id/15023290-L.jpg",
    generos: ["misterio", "histórico"],
    anio_publicacion_original: 1980,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000013",
        isbn: "9780544176560",
        paginas: 579,
        editorial: "Mariner Books",
        idioma: "inglés",
        anio: 2014
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T09:10:00Z"),
    actualizado_en: new Date("2026-11-20T09:40:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000013",
    titulo: "El padrino",
    sinopsis: "La familia Corleone defiende su poder en Nueva York mientras el hijo menor, que quería otra vida, termina heredando el mando.",
    portada_url: "https://covers.openlibrary.org/b/id/6507069-L.jpg",
    generos: ["crimen", "drama"],
    anio_publicacion_original: 1969,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000014",
        isbn: "9780451205766",
        paginas: 450,
        editorial: "Berkley",
        idioma: "inglés",
        anio: 2019
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T09:11:00Z"),
    actualizado_en: new Date("2026-11-20T09:41:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000014",
    titulo: "El club de la lucha",
    sinopsis: "Un oficinista insomne conoce a un vendedor de jabón y juntos fundan un club clandestino que pronto se sale de control.",
    portada_url: "https://covers.openlibrary.org/b/id/7890578-L.jpg",
    generos: ["drama", "suspense"],
    anio_publicacion_original: 1996,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000015",
        isbn: "9780393327342",
        paginas: 224,
        editorial: "W. W. Norton",
        idioma: "inglés",
        anio: 2005
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T09:12:00Z"),
    actualizado_en: new Date("2026-11-20T09:42:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000015",
    titulo: "Perdida",
    sinopsis: "El día de su quinto aniversario, Amy desaparece y las sospechas caen sobre su marido, cuyas versiones no terminan de encajar.",
    portada_url: "https://covers.openlibrary.org/b/id/8368314-L.jpg",
    generos: ["suspense", "misterio"],
    anio_publicacion_original: 2012,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000016",
        isbn: "9780307588371",
        paginas: 422,
        editorial: "Broadway Books",
        idioma: "inglés",
        anio: 2014
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T09:13:00Z"),
    actualizado_en: new Date("2026-11-20T09:43:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000016",
    titulo: "El resplandor",
    sinopsis: "Un escritor acepta cuidar durante el invierno un hotel aislado en la montaña, donde su hijo percibe lo que el lugar esconde.",
    portada_url: "https://covers.openlibrary.org/b/id/12376585-L.jpg",
    generos: ["terror", "suspense"],
    anio_publicacion_original: 1977,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000017",
        isbn: "9780307743657",
        paginas: 688,
        editorial: "Anchor Books",
        idioma: "inglés",
        anio: 2012
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T09:14:00Z"),
    actualizado_en: new Date("2026-11-20T09:44:00Z")
  },
  {
    _id: "b1000000-0000-4000-8000-000000000017",
    titulo: "El silencio de los corderos",
    sinopsis: "Una aprendiz del FBI busca la ayuda de un psiquiatra encarcelado y peligroso para atrapar a un asesino en serie.",
    portada_url: "https://covers.openlibrary.org/b/id/8580475-L.jpg",
    generos: ["suspense", "policíaco"],
    anio_publicacion_original: 1988,
    ediciones: [
      {
        edicion_id: "e1000000-0000-4000-8000-000000000018",
        isbn: "9780312924584",
        paginas: 367,
        editorial: "St. Martin's Paperbacks",
        idioma: "inglés",
        anio: 1999
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T09:15:00Z"),
    actualizado_en: new Date("2026-11-20T09:45:00Z")
  }
]);

db.peliculas.insertMany([
  {
    _id: "f1000000-0000-4000-8000-000000000001",
    titulo: "Dune",
    sinopsis: "Paul Atreides viaja a Arrakis para proteger a su familia y a un pueblo del desierto de las ambiciones de las grandes casas.",
    portada_url: "https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_%282021_film%29.jpg",
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
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg/500px-Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000018",
        nombre: "Rebecca Ferguson",
        personaje: "Lady Jessica",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg/500px-Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg",
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
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg/500px-Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000018",
        nombre: "Rebecca Ferguson",
        personaje: "Lady Jessica",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg/500px-Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/9/9f/Blade_Runner_%281982_poster%29.png",
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
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Harrison_Ford_-_Televerse_2025-03.jpg/500px-Harrison_Ford_-_Televerse_2025-03.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/c/cd/The_Martian_film_poster.jpg",
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
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/MattDamon-byPhilipRomano2.jpg/500px-MattDamon-byPhilipRomano2.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/d/df/Arrival%2C_Movie_Poster.jpg",
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
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Amy_Adams_at_the_2024_Toronto_International_Film_Festival._03_%28cropped%29.jpg/500px-Amy_Adams_at_the_2024_Toronto_International_Film_Festival._03_%28cropped%29.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/e/e7/Jurassic_Park_poster.jpg",
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
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Sam_Neill_2010.jpg/500px-Sam_Neill_2010.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/b/b3/The_Hobbit-_An_Unexpected_Journey.jpeg",
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
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Martin_Freeman-5341.jpg/500px-Martin_Freeman-5341.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000024",
        nombre: "Ian McKellen",
        personaje: "Gandalf",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/SDCC13_-_Ian_McKellen.jpg/500px-SDCC13_-_Ian_McKellen.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg",
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
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Elijah_Wood_%2855223197178%29_%28cropped%29.jpg/500px-Elijah_Wood_%2855223197178%29_%28cropped%29.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000024",
        nombre: "Ian McKellen",
        personaje: "Gandalf",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/SDCC13_-_Ian_McKellen.jpg/500px-SDCC13_-_Ian_McKellen.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/0/03/Prideandprejudiceposter.jpg",
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
        foto_url: "https://upload.wikimedia.org/wikipedia/commons/b/b1/KeiraKnightleyByAndreaRaffin2011_%28cropped%29.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000027",
        nombre: "Matthew Macfadyen",
        personaje: "Señor Darcy",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Matthew_Macfadyen_2019.jpg/500px-Matthew_Macfadyen_2019.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/e/e4/Atonement_UK_poster.jpg",
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
        foto_url: "https://upload.wikimedia.org/wikipedia/commons/b/b1/KeiraKnightleyByAndreaRaffin2011_%28cropped%29.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000028",
        nombre: "James McAvoy",
        personaje: "Robbie Turner",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/James_McAvoy_at_2026_Toronto_Film_Festival_%28cropped%29.jpg/500px-James_McAvoy_at_2026_Toronto_Film_Festival_%28cropped%29.jpg"
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
    portada_url: "https://upload.wikimedia.org/wikipedia/en/b/bd/Murder_on_the_Orient_Express_teaser_poster.jpg",
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
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Kenneth_Branagh_portrait_at_TIFF_2026.jpg/500px-Kenneth_Branagh_portrait_at_TIFF_2026.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000029",
        nombre: "Penélope Cruz",
        personaje: "Pilar Estravados",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Pen%C3%A9lope_Cruz_%40_2010_Academy_Awards_%28cropped%29.jpg/500px-Pen%C3%A9lope_Cruz_%40_2010_Academy_Awards_%28cropped%29.jpg"
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
  },
  {
    _id: "f1000000-0000-4000-8000-000000000013",
    titulo: "El nombre de la rosa",
    sinopsis: "Un monje franciscano y su novicio siguen el rastro de varios crímenes dentro de un monasterio que guarda sus secretos bajo llave.",
    portada_url: "https://upload.wikimedia.org/wikipedia/en/c/c4/Name_of_rose_movieposter.jpg",
    generos: ["misterio", "histórico"],
    anio_estreno: 1986,
    duracion_min: 130,
    plataformas: [
      { nombre: "Plataforma B" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Italia", "Francia", "Alemania"],
      productoras: ["Constantin Film"],
      clasificacion: "R"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000041",
        nombre: "Sean Connery",
        personaje: "Guillermo de Baskerville",
        orden: 1,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Sean_Connery_as_James_Bond_at_Switzerland_1964_%28two_thirds_crop%29.jpg/500px-Sean_Connery_as_James_Bond_at_Switzerland_1964_%28two_thirds_crop%29.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T11:10:00Z"),
    actualizado_en: new Date("2026-11-20T11:40:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000014",
    titulo: "El padrino",
    sinopsis: "El patriarca de los Corleone sobrevive a un atentado y su hijo Michael entra en el negocio familiar del que se había mantenido lejos.",
    portada_url: "https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg",
    generos: ["crimen", "drama"],
    anio_estreno: 1972,
    duracion_min: 175,
    plataformas: [
      { nombre: "Plataforma A" },
      { nombre: "Plataforma B" }
    ],
    datos_tecnicos: { idioma_original: "inglés", paises: ["Estados Unidos"], productoras: ["Paramount Pictures"], clasificacion: "R" },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000042",
        nombre: "Marlon Brando",
        personaje: "Vito Corleone",
        orden: 1,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Marlon_Brando_publicity_for_One-Eyed_Jacks.png/500px-Marlon_Brando_publicity_for_One-Eyed_Jacks.png"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000043",
        nombre: "Al Pacino",
        personaje: "Michael Corleone",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Al_Pacino_-_Killing_Castro_-_Q%26A_-_Tribeca_2026_-_by_%40JJxFile-23_%28cropped%29.jpg/500px-Al_Pacino_-_Killing_Castro_-_Q%26A_-_Tribeca_2026_-_by_%40JJxFile-23_%28cropped%29.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T11:11:00Z"),
    actualizado_en: new Date("2026-11-20T11:41:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000015",
    titulo: "El club de la lucha",
    sinopsis: "Dos hombres convierten las peleas de sótano en una organización secreta que crece más allá de lo que uno de ellos puede controlar.",
    portada_url: "https://upload.wikimedia.org/wikipedia/en/f/fc/Fight_Club_poster.jpg",
    generos: ["drama", "suspense"],
    anio_estreno: 1999,
    duracion_min: 139,
    plataformas: [
      { nombre: "Plataforma A" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Estados Unidos"],
      productoras: ["Fox 2000 Pictures", "Regency Enterprises"],
      clasificacion: "R"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000044",
        nombre: "Brad Pitt",
        personaje: "Tyler Durden",
        orden: 1,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Brad_Pitt-69858.jpg/500px-Brad_Pitt-69858.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T11:12:00Z"),
    actualizado_en: new Date("2026-11-20T11:42:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000016",
    titulo: "Perdida",
    sinopsis: "La desaparición de una mujer convierte su matrimonio en un espectáculo mediático donde nada es lo que parece.",
    portada_url: "https://upload.wikimedia.org/wikipedia/en/0/05/Gone_Girl_Poster.jpg",
    generos: ["suspense", "misterio"],
    anio_estreno: 2014,
    duracion_min: 149,
    plataformas: [
      { nombre: "Plataforma B" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Estados Unidos"],
      productoras: ["20th Century Fox", "Regency Enterprises"],
      clasificacion: "R"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000045",
        nombre: "Ben Affleck",
        personaje: "Nick Dunne",
        orden: 1,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Ben_Affleck_at_83rd_Venice_International_Film_Festival-1_%28cropped%29.jpg/500px-Ben_Affleck_at_83rd_Venice_International_Film_Festival-1_%28cropped%29.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000046",
        nombre: "Rosamund Pike",
        personaje: "Amy Dunne",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/2026_Rosamund_Pike_%28cropped%29.jpg/500px-2026_Rosamund_Pike_%28cropped%29.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T11:13:00Z"),
    actualizado_en: new Date("2026-11-20T11:43:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000017",
    titulo: "El resplandor",
    sinopsis: "Aislada por la nieve, una familia ve cómo el padre se transforma dentro de un hotel con un pasado violento.",
    portada_url: "https://upload.wikimedia.org/wikipedia/en/1/1d/The_Shining_%281980%29_U.K._release_poster_-_The_tide_of_terror_that_swept_America_IS_HERE.jpg",
    generos: ["terror"],
    anio_estreno: 1980,
    duracion_min: 146,
    plataformas: [
      { nombre: "Plataforma A" }
    ],
    datos_tecnicos: {
      idioma_original: "inglés",
      paises: ["Reino Unido", "Estados Unidos"],
      productoras: ["Warner Bros."],
      clasificacion: "R"
    },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000047",
        nombre: "Jack Nicholson",
        personaje: "Jack Torrance",
        orden: 1,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Jack_Nicholson_2002.jpg/500px-Jack_Nicholson_2002.jpg"
      }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T11:14:00Z"),
    actualizado_en: new Date("2026-11-20T11:44:00Z")
  },
  {
    _id: "f1000000-0000-4000-8000-000000000018",
    titulo: "El silencio de los corderos",
    sinopsis: "Clarice Starling intercambia confidencias por pistas con Hannibal Lecter para llegar a tiempo hasta una joven secuestrada.",
    portada_url: "https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg",
    generos: ["suspense", "policíaco"],
    anio_estreno: 1991,
    duracion_min: 118,
    plataformas: [],
    datos_tecnicos: { idioma_original: "inglés", paises: ["Estados Unidos"], productoras: ["Orion Pictures"], clasificacion: "R" },
    reparto: [
      {
        persona_id: "a1000000-0000-4000-8000-000000000048",
        nombre: "Jodie Foster",
        personaje: "Clarice Starling",
        orden: 1,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Jodie_Foster_Taxi_Driver_Tribeca_Festival_2026-20_%28cropped%29.jpg/500px-Jodie_Foster_Taxi_Driver_Tribeca_Festival_2026-20_%28cropped%29.jpg"
      },
      {
        persona_id: "a1000000-0000-4000-8000-000000000049",
        nombre: "Anthony Hopkins",
        personaje: "Hannibal Lecter",
        orden: 2,
        foto_url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Anthony_Hopkins_Red_Sea_Festival_2025_Portrait_%28cropped%29.jpg/500px-Anthony_Hopkins_Red_Sea_Festival_2025_Portrait_%28cropped%29.jpg"
      },
      { persona_id: "a1000000-0000-4000-8000-000000000050", nombre: "Ted Levine", personaje: "Jame Gumb", orden: 3 }
    ],
    estado_publicacion: "publicada",
    creado_en: new Date("2026-11-20T11:15:00Z"),
    actualizado_en: new Date("2026-11-20T11:45:00Z")
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
  },
  {
    _id: "ca000000-0000-4000-8000-000000000006",
    usuario_id: "c1000000-0000-4000-8000-000000000003",
    libro_id: "b1000000-0000-4000-8000-000000000014",
    pelicula_id: "f1000000-0000-4000-8000-000000000015",
    veredicto: { preferencia: "pelicula", comentario: "La película ordena mejor las ideas del libro." },
    aspectos: [
      { nombre: "Fidelidad", puntuacion: 4 },
      { nombre: "Final", puntuacion: 3, comentario: "Distinto al de la novela." }
    ],
    oculta: false,
    creado_en: new Date("2026-11-25T20:00:00Z"),
    actualizado_en: new Date("2026-11-25T20:00:00Z")
  }
]);

print("Semilla cargada en la base '" + db.getName() + "': " + db.libros.countDocuments() + " libros, " + db.peliculas.countDocuments() +
      " peliculas, " + db.resenas_comparativas.countDocuments() + " comparativas.");
