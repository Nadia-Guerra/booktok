// =============================================================================
// Consultas CG-01 a CG-10 (y CG-21 a CG-23) sobre la SEMILLA del grafo, con su resultado esperado.
// Se ejecutan con:  .\db\scripts\probar-grafo.ps1 -Semilla     (no borran nada; solo leen)
// Requieren la semilla cargada (db/scripts/cargar-semilla.ps1). Los datos: db/semilla/semilla.json.
//
// Ids de la semilla (el final del UUID es el número que se ve):
//   personas  a1000000-0000-4000-8000-0000000000NN  01 Herbert, 04 Chiang, 06 Tolkien, 07 Austen, 10 Gibson, 11 Villeneuve,
//             12 Scott, 13 Spielberg, 14 Jackson, 15 Wright, 16 Branagh (dirige y actúa), 17 Chalamet, 24 McKellen, 28 McAvoy
//   libros    b1000000-0000-4000-8000-0000000000NN  01 Dune, 02 Androides, 03 El marciano, 04 Historia de tu vida,
//             05 Parque Jurásico, 06 El Hobbit, 07 La Comunidad, 08 Orgullo y prejuicio, 09 Expiación, 10 Orient Express, 11 Neuromante (borrador),
//             12 El nombre de la rosa, 13 El padrino, 14 El club de la lucha, 15 Perdida, 16 El resplandor, 17 El silencio de los corderos
//   películas f1000000-0000-4000-8000-0000000000NN  01 Dune 2021, 02 Dune parte dos, 03 Blade Runner, 04 El marciano,
//             05 La llegada, 06 Parque Jurásico, 07 El Hobbit, 08 La Comunidad, 09 Orgullo, 10 Expiación, 11 Orient Express, 12 Neuromante (borrador),
//             13 a 18 las adaptaciones de los libros 12 a 17, en el mismo orden
//   usuarios  c1000000-0000-4000-8000-0000000000NN  01 admin, 02 Ana, 03 Luis, 04 Marta, 05 Pedro, 06 Sofía, 07 Diego, 08 Elena
// =============================================================================

// ---- CG-01: obras por el nombre de una persona (RF-05) ----------------------------------------
// @prueba S-01 | CG-01 sobre la semilla
// @paso Villeneuve dirigió 3 películas (Dune 2021, Dune parte dos y La llegada)
// @param texto = "villeneuve"
CALL {
// @incluir CG-01.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT obra_id)) + '|' + head(collect(DISTINCT vinculo));
// @espera valor 3|3|dirigida_por
// @paso Branagh tiene dos roles en la misma película: 1 obra, 2 vínculos (dirigida_por y actuó_en)
// @param texto = "branagh"
CALL {
// @incluir CG-01.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT obra_id)) + '|' + toString(count(DISTINCT vinculo));
// @espera valor 2|1|2
// @paso 'TIMOTHEE' sin tilde y en mayúsculas encuentra a Chalamet: sus 2 películas por actuó_en
// @param texto = "TIMOTHEE"
// @incluir CG-01.cypher
// @espera filas 2
// @paso Herbert escribió un libro
// @param texto = "herbert"
CALL {
// @incluir CG-01.cypher
}
RETURN obra_id + '|' + tipo + '|' + vinculo;
// @espera valor b1000000-0000-4000-8000-000000000001|libro|escribió

// ---- CG-02: personas por nombre (RF-10) -------------------------------------------------------
// @prueba S-02 | CG-02 sobre la semilla
// @paso 'ian' encuentra a las dos personas llamadas Ian (McEwan y McKellen)
// @param texto = "ian"
// @incluir CG-02.cypher
// @espera filas 2
// @paso Rebecca Ferguson tiene foto
// @param texto = "ferguson"
CALL {
// @incluir CG-02.cypher
}
RETURN foto_url;
// @espera valor https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg/500px-Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg
// @paso Ted Levine no tiene foto: la propiedad no existe
// @param texto = "levine"
CALL {
// @incluir CG-02.cypher
}
RETURN foto_url IS NULL;
// @espera valor true

// ---- CG-03 y CG-04: adaptaciones y libro de origen (RF-23) ---------------------------------
// @prueba S-03 | CG-03 y CG-04 sobre la semilla
// @paso Dune tiene dos adaptaciones: las películas 01 y 02
// @param libro_id = "b1000000-0000-4000-8000-000000000001"
CALL {
// @incluir CG-03.cypher
}
RETURN reduce(s = '', x IN collect(right(obra_id, 2)) | s + CASE WHEN s = '' THEN '' ELSE ',' END + x);
// @espera valor 01,02
// @paso Androides tiene una: Blade Runner (03)
// @param libro_id = "b1000000-0000-4000-8000-000000000002"
CALL {
// @incluir CG-03.cypher
}
RETURN reduce(s = '', x IN collect(right(obra_id, 2)) | s + CASE WHEN s = '' THEN '' ELSE ',' END + x);
// @espera valor 03
// @paso Un id de película no tiene adaptaciones (se busca por etiqueta Libro)
// @param libro_id = "f1000000-0000-4000-8000-000000000001"
// @incluir CG-03.cypher
// @espera filas 0
// @paso El libro de origen de Dune parte dos es Dune
// @param pelicula_id = "f1000000-0000-4000-8000-000000000002"
// @incluir CG-04.cypher
// @espera valor b1000000-0000-4000-8000-000000000001
// @paso La película en borrador (Neuromante) ya tiene su libro de origen: el borrador del libro
// @param pelicula_id = "f1000000-0000-4000-8000-000000000012"
// @incluir CG-04.cypher
// @espera valor b1000000-0000-4000-8000-000000000011

// ---- CG-05: autores y directores (R-06, R-07) -------------------------------------------------
// @prueba S-04 | CG-05 sobre la semilla
// @paso Autor de Dune
// @param obra_id = "b1000000-0000-4000-8000-000000000001"
CALL {
// @incluir CG-05.cypher
}
RETURN nombre;
// @espera valor Frank Herbert
// @paso Director de Orient Express
// @param obra_id = "f1000000-0000-4000-8000-000000000011"
CALL {
// @incluir CG-05.cypher
}
RETURN nombre;
// @espera valor Kenneth Branagh
// @paso La película en borrador no tiene director todavía: por D-24 no podría publicarse
// @param obra_id = "f1000000-0000-4000-8000-000000000012"
// @incluir CG-05.cypher
// @espera filas 0

// ---- CG-06: caminos más cortos (RF-24) -------------------------------------------------------
// @prueba S-05 | CG-06 sobre la semilla (RF-24)
// @paso Herbert a Chalamet: 3 saltos y 2 rutas más cortas (por Dune 2021 y por Dune parte dos)
// @param origen_id = "a1000000-0000-4000-8000-000000000001"
// @param destino_id = "a1000000-0000-4000-8000-000000000017"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(min(size(relaciones))) + '|' + toString(max(size(relaciones)));
// @espera valor 2|3|3
// @paso Tolkien a McKellen: 3 saltos y 2 rutas (El Hobbit y La Comunidad del Anillo)
// @param origen_id = "a1000000-0000-4000-8000-000000000006"
// @param destino_id = "a1000000-0000-4000-8000-000000000024"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(min(size(relaciones))) + '|' + toString(max(size(relaciones)));
// @espera valor 2|3|3
// @paso Austen a McAvoy: 5 saltos y 2 rutas (por la actriz Knightley o por el director Wright)
// @param origen_id = "a1000000-0000-4000-8000-000000000007"
// @param destino_id = "a1000000-0000-4000-8000-000000000028"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(min(size(relaciones))) + '|' + toString(max(size(relaciones)));
// @espera valor 2|5|5
// @paso De un libro a otro: Dune a Historia de tu vida, por el director Villeneuve (4 saltos, 2 rutas: Dune 2021 o parte dos)
// @param origen_id = "b1000000-0000-4000-8000-000000000001"
// @param destino_id = "b1000000-0000-4000-8000-000000000004"
CALL {
// @incluir CG-06.cypher
}
RETURN toString(count(*)) + '|' + toString(min(size(relaciones))) + '|' + toString(max(size(relaciones)));
// @espera valor 2|4|4
// @paso Sin conexión: Gibson solo está unido a su libro y a su película en borrador, aislados del resto
// @param origen_id = "a1000000-0000-4000-8000-000000000010"
// @param destino_id = "a1000000-0000-4000-8000-000000000001"
// @incluir CG-06.cypher
// @espera filas 0

// ---- CG-07: autores adaptados por un mismo director (RF-25) ---------------------------------
// @prueba S-06 | CG-07 sobre la semilla (RF-25)
// @paso Villeneuve adaptó a 2 autores distintos (Herbert, con dos películas, y Chiang): 3 filas
// @param director_id = "a1000000-0000-4000-8000-000000000011"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 3|2
// @paso Scott adaptó a Dick y a Weir
// @param director_id = "a1000000-0000-4000-8000-000000000012"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 2|2
// @paso Wright adaptó a Austen y a McEwan
// @param director_id = "a1000000-0000-4000-8000-000000000015"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 2|2
// @paso Caso negativo: Jackson adaptó 2 libros pero de un solo autor (Tolkien): 2 filas, 1 autor
// @param director_id = "a1000000-0000-4000-8000-000000000014"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 2|1
// @paso Caso negativo: Spielberg adaptó un solo libro
// @param director_id = "a1000000-0000-4000-8000-000000000013"
CALL {
// @incluir CG-07.cypher
}
RETURN toString(count(*)) + '|' + toString(count(DISTINCT persona_id));
// @espera valor 1|1
// @paso Caso negativo: Chalamet no dirigió nada
// @param director_id = "a1000000-0000-4000-8000-000000000017"
// @incluir CG-07.cypher
// @espera filas 0

// ---- CG-08: recomendar libros por el mismo director (RF-26, paso 2) -------------------------
// La lista de partida es la que entrega O18 del relacional (db/relacional/pruebas/06-consultas-semilla.sql la comprueba).
// @prueba S-07 | CG-08 sobre la semilla (RF-26)
// @paso Ana: partida Dune (5) y El marciano (4). Recomienda Historia de tu vida (por Villeneuve) y Androides (por Scott)
// @param libros_partida = ["b1000000-0000-4000-8000-000000000001","b1000000-0000-4000-8000-000000000003"]
// @param usuario_id = "c1000000-0000-4000-8000-000000000002"
CALL {
// @incluir CG-08.cypher
}
RETURN toString(count(*)) + '|' + reduce(s = '', x IN collect(right(obra_id, 2) + '<' + right(partida_id, 2) + ':' + nombre) | s + CASE WHEN s = '' THEN '' ELSE ',' END + x);
// @espera valor 2|02<03:Ridley Scott,04<01:Denis Villeneuve
// @paso Con esa misma lista, La Comunidad del Anillo (07) NO se recomienda: viene de El Hobbit, que Ana calificó con 3 y no es partida
// @param libros_partida = ["b1000000-0000-4000-8000-000000000001","b1000000-0000-4000-8000-000000000003"]
// @param usuario_id = "c1000000-0000-4000-8000-000000000002"
CALL {
// @incluir CG-08.cypher
}
WITH * WHERE obra_id IN ['b1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000009']
RETURN count(*);
// @espera valor 0
// @paso Pedro: partida Dune y Historia de tu vida. Cada uno ya es el otro (ya leído y de partida): nada que recomendar
// @param libros_partida = ["b1000000-0000-4000-8000-000000000004","b1000000-0000-4000-8000-000000000001"]
// @param usuario_id = "c1000000-0000-4000-8000-000000000005"
// @incluir CG-08.cypher
// @espera filas 0
// @paso Ana, solo con Dune de partida: sale Historia de tu vida, que no ha leído (y no Dune, que es la partida)
// @param libros_partida = ["b1000000-0000-4000-8000-000000000001"]
// @param usuario_id = "c1000000-0000-4000-8000-000000000002"
CALL {
// @incluir CG-08.cypher
}
RETURN obra_id;
// @espera valor b1000000-0000-4000-8000-000000000004
// @paso Marta: partida Orgullo y prejuicio y Dune (ambos terminados con 4). Recomienda Expiación (por Wright) e Historia de tu vida (por Villeneuve)
// @param libros_partida = ["b1000000-0000-4000-8000-000000000008","b1000000-0000-4000-8000-000000000001"]
// @param usuario_id = "c1000000-0000-4000-8000-000000000004"
CALL {
// @incluir CG-08.cypher
}
RETURN toString(count(*)) + '|' + reduce(s = '', x IN collect(right(obra_id, 2) + '<' + right(partida_id, 2)) | s + CASE WHEN s = '' THEN '' ELSE ',' END + x);
// @espera valor 2|04<01,09<08
// @paso Spielberg adaptó un solo libro: Luis, con Parque Jurásico de partida, no recibe nada
// @param libros_partida = ["b1000000-0000-4000-8000-000000000005"]
// @param usuario_id = "c1000000-0000-4000-8000-000000000003"
// @incluir CG-08.cypher
// @espera filas 0
// @paso Lista de partida vacía: no devuelve nada
// @param libros_partida = []
// @param usuario_id = "c1000000-0000-4000-8000-000000000002"
// @incluir CG-08.cypher
// @espera filas 0

// ---- CG-09: películas de los libros que leyeron los seguidos (RF-27) -----------------------
// @prueba S-08 | CG-09 sobre la semilla (RF-27)
// @paso Sofía sigue a Ana, Pedro y Diego: 7 películas; las de Dune y El marciano las alcanzan 2 seguidos
// @param usuario_id = "c1000000-0000-4000-8000-000000000006"
CALL {
// @incluir CG-09.cypher
}
RETURN toString(count(*)) + '|' + toString(max(seguidos)) + '|' + toString(count(CASE WHEN seguidos = 2 THEN 1 END));
// @espera valor 7|2|3
// @paso D-20: Sofía ya vio Dune (2021) y aun así sale, con 2 seguidos que leyeron el libro
// @param usuario_id = "c1000000-0000-4000-8000-000000000006"
CALL {
// @incluir CG-09.cypher
}
WITH * WHERE obra_id = 'f1000000-0000-4000-8000-000000000001'
RETURN toString(seguidos) + '|' + libro_id;
// @espera valor 2|b1000000-0000-4000-8000-000000000001
// @paso Luis solo sigue a Ana: 5 películas, cada una por 1 seguido
// @param usuario_id = "c1000000-0000-4000-8000-000000000003"
CALL {
// @incluir CG-09.cypher
}
RETURN toString(count(*)) + '|' + toString(max(seguidos));
// @espera valor 5|1
// @paso Ana solo sigue a Pedro, que leyó Dune e Historia de tu vida: 3 películas
// @param usuario_id = "c1000000-0000-4000-8000-000000000002"
CALL {
// @incluir CG-09.cypher
}
RETURN toString(count(*)) + '|' + toString(max(seguidos));
// @espera valor 3|1
// @paso Caso negativo: Pedro no sigue a nadie
// @param usuario_id = "c1000000-0000-4000-8000-000000000005"
// @incluir CG-09.cypher
// @espera filas 0
// @paso Caso negativo: el administrador no sigue a nadie
// @param usuario_id = "c1000000-0000-4000-8000-000000000001"
// @incluir CG-09.cypher
// @espera filas 0

// ---- CG-10: ¿están unidos por una adaptación? (RN-06) ------------------------------------------
// @prueba S-09 | CG-10 sobre la semilla
// @paso Dune y Dune parte dos están unidos
// @param libro_id = "b1000000-0000-4000-8000-000000000001"
// @param pelicula_id = "f1000000-0000-4000-8000-000000000002"
// @incluir CG-10.cypher
// @espera valor true
// @paso Dune y El marciano (película) no lo están
// @param libro_id = "b1000000-0000-4000-8000-000000000001"
// @param pelicula_id = "f1000000-0000-4000-8000-000000000004"
// @incluir CG-10.cypher
// @espera valor false
// @paso Los ids al revés (película como libro y libro como película) no cuentan
// @param libro_id = "f1000000-0000-4000-8000-000000000001"
// @param pelicula_id = "b1000000-0000-4000-8000-000000000001"
// @incluir CG-10.cypher
// @espera valor false

// ---- CG-21, CG-22 y CG-23: lecturas de reconciliación ------------------------------------------
// @prueba S-10 | CG-21, CG-22 y CG-23 sobre la semilla
// @paso CG-21 devuelve las 18 películas (también la del borrador)
// @incluir CG-21.cypher
// @espera filas 18
// @paso CG-21: la película en borrador no tiene reparto (lista vacía)
CALL {
// @incluir CG-21.cypher
}
WITH * WHERE obra_id = 'f1000000-0000-4000-8000-000000000012'
RETURN size(reparto);
// @espera valor 0
// @paso CG-21: Dune 2021 tiene 2 actores, ordenados, con la foto de Chalamet
CALL {
// @incluir CG-21.cypher
}
WITH * WHERE obra_id = 'f1000000-0000-4000-8000-000000000001'
RETURN toString(size(reparto)) + '|' + reparto[0].nombre + '|' + reparto[0].personaje + '|' + toString(reparto[0].orden) + '|' + right(reparto[0].foto_url, 8);
// @espera valor 2|Timothée Chalamet|Paul Atreides|1|d%29.jpg
// @paso CG-21: en El silencio de los corderos, Ted Levine (3.º) no tiene foto
CALL {
// @incluir CG-21.cypher
}
WITH * WHERE obra_id = 'f1000000-0000-4000-8000-000000000018'
RETURN reparto[2].nombre + '|' + toString(reparto[2].foto_url IS NULL);
// @espera valor Ted Levine|true
// @paso CG-21: total de personas de reparto = 28 (las relaciones actuó_en)
CALL {
// @incluir CG-21.cypher
}
RETURN sum(size(reparto));
// @espera valor 28
// @paso CG-22: la única obra que no llega al mínimo de D-24 es la película en borrador
CALL {
// @incluir CG-22.cypher
}
WITH * WHERE (tipo = 'libro' AND (n1 < 1 OR n2 < 1)) OR (tipo = 'pelicula' AND (n1 <> 1 OR n2 < 1 OR n3 < 1 OR n3 > 300))
RETURN toString(count(*)) + '|' + head(collect(obra_id));
// @espera valor 1|f1000000-0000-4000-8000-000000000012
// @paso CG-23 devuelve los 8 usuarios (el administrador incluido, sin relaciones)
// @incluir CG-23.cypher
// @espera filas 8
// @paso CG-23: 10 pares sigue y 14 pares leyó en total
CALL {
// @incluir CG-23.cypher
}
RETURN toString(sum(size(sigue))) + '|' + toString(sum(size(leyo)));
// @espera valor 10|14
// @paso CG-23: Ana sigue a Pedro y leyó 4 libros (no las películas ni el que está en curso o pendiente)
CALL {
// @incluir CG-23.cypher
}
WITH * WHERE usuario_id = 'c1000000-0000-4000-8000-000000000002'
RETURN toString(size(sigue)) + '|' + toString(size(leyo));
// @espera valor 1|4
// @paso CG-23: el administrador no tiene relaciones sigue ni leyó
CALL {
// @incluir CG-23.cypher
}
WITH * WHERE usuario_id = 'c1000000-0000-4000-8000-000000000001'
RETURN toString(size(sigue)) + '|' + toString(size(leyo));
// @espera valor 0|0
