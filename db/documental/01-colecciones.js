// =============================================================================
// Del Libro a la Pantalla: base documental (MongoDB 9.0.4)
// 01-colecciones.js: crea libros, peliculas y resenas_comparativas con su validador.
//
// Diseño: docs/modelado/documental/03-colecciones.md y 04-validacion.md (sección 8).
// Opera sobre la base `db` actual: la base de datos de la aplicación al ejecutarlo con
// documental/mongo.sh, o una base de pruebas cuando lo carga una prueba.
// Se puede ejecutar más de una vez: borra y vuelve a crear cada colección (sin sus datos).
// Los índices están en 02-indices.js.
// =============================================================================

const UUID = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
const INT = ["int", "long"];
const texto = (min, max) => ({ bsonType: "string", minLength: min, maxLength: max });
const listaTextos = (minItems, maxItems, max) => ({
  bsonType: "array", minItems, maxItems, uniqueItems: true, items: texto(1, max)
});
const urlImagen = { bsonType: "string", maxLength: 500, pattern: "^https://\\S+$" };

const libros = {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "titulo", "sinopsis", "generos", "anio_publicacion_original", "ediciones",
               "estado_publicacion", "creado_en", "actualizado_en"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "string", pattern: UUID },
      titulo: texto(1, 200),
      sinopsis: texto(1, 3000),
      portada_url: urlImagen,
      generos: listaTextos(1, 5, 40),
      anio_publicacion_original: { bsonType: INT, minimum: -3000, maximum: 2100 },
      ediciones: {
        bsonType: "array", maxItems: 50,
        items: {
          bsonType: "object",
          required: ["edicion_id", "paginas", "editorial", "idioma", "anio"],
          additionalProperties: false,
          properties: {
            edicion_id: { bsonType: "string", pattern: UUID },
            isbn: { bsonType: "string", pattern: "^[0-9]{13}$" },
            paginas: { bsonType: INT, minimum: 1, maximum: 10000 },
            editorial: texto(1, 100),
            idioma: texto(1, 40),
            anio: { bsonType: INT, minimum: 1, maximum: 2100 }
          }
        }
      },
      estado_publicacion: { enum: ["borrador", "publicada"] },
      creado_en: { bsonType: "date" },
      actualizado_en: { bsonType: "date" }
    }
  }
};

const peliculas = {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "titulo", "sinopsis", "generos", "anio_estreno", "duracion_min", "plataformas",
               "datos_tecnicos", "reparto", "estado_publicacion", "creado_en", "actualizado_en"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "string", pattern: UUID },
      titulo: texto(1, 200),
      sinopsis: texto(1, 3000),
      portada_url: urlImagen,
      generos: listaTextos(1, 5, 40),
      anio_estreno: { bsonType: INT, minimum: 1888, maximum: 2100 },
      duracion_min: { bsonType: INT, minimum: 1, maximum: 1000 },
      plataformas: {
        bsonType: "array", maxItems: 30,
        items: {
          bsonType: "object",
          required: ["nombre"],
          additionalProperties: false,
          properties: {
            nombre: texto(1, 100)
          }
        }
      },
      datos_tecnicos: {
        bsonType: "object",
        required: ["idioma_original", "paises"],
        additionalProperties: false,
        properties: {
          idioma_original: texto(1, 40),
          paises: listaTextos(1, 10, 60),
          productoras: listaTextos(0, 20, 100),
          clasificacion: texto(1, 20)
        }
      },
      reparto: {
        bsonType: "array", maxItems: 300,
        items: {
          bsonType: "object",
          required: ["persona_id", "nombre", "personaje", "orden"],
          additionalProperties: false,
          properties: {
            persona_id: { bsonType: "string", pattern: UUID },
            nombre: texto(1, 150),
            personaje: texto(1, 150),
            orden: { bsonType: INT, minimum: 1 },
            foto_url: urlImagen
          }
        }
      },
      estado_publicacion: { enum: ["borrador", "publicada"] },
      creado_en: { bsonType: "date" },
      actualizado_en: { bsonType: "date" }
    }
  }
};

const resenas_comparativas = {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "usuario_id", "libro_id", "pelicula_id", "veredicto", "aspectos", "oculta",
               "creado_en", "actualizado_en"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "string", pattern: UUID },
      usuario_id: { bsonType: "string", pattern: UUID },
      libro_id: { bsonType: "string", pattern: UUID },
      pelicula_id: { bsonType: "string", pattern: UUID },
      veredicto: {
        bsonType: "object",
        required: ["preferencia"],
        additionalProperties: false,
        properties: {
          preferencia: { enum: ["libro", "pelicula", "empate"] },
          comentario: texto(1, 2000)
        }
      },
      aspectos: {
        bsonType: "array", minItems: 1, maxItems: 10,
        items: {
          bsonType: "object",
          required: ["nombre"],
          additionalProperties: false,
          properties: {
            nombre: texto(1, 60),
            puntuacion: { bsonType: INT, minimum: 1, maximum: 5 },
            comentario: texto(1, 1000)
          }
        }
      },
      oculta: { bsonType: "bool" },
      creado_en: { bsonType: "date" },
      actualizado_en: { bsonType: "date" }
    }
  }
};

const definiciones = { libros, peliculas, resenas_comparativas };
for (const [nombre, validator] of Object.entries(definiciones)) {
  if (db.getCollectionNames().includes(nombre)) db.getCollection(nombre).drop();
  db.createCollection(nombre, { validator, validationLevel: "strict", validationAction: "error" });
}
print("Colecciones creadas en la base '" + db.getName() + "': " + Object.keys(definiciones).join(", "));
