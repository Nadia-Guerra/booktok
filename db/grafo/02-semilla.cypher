// =============================================================================
// ARCHIVO GENERADO: no lo edites a mano.
// Fuente unica: db/semilla/semilla.json. Regenerar con: powershell -File db\semilla\generar.ps1
// Descripcion y escenarios: db/semilla/README.md
// Se puede repetir: borra el grafo entero y lo vuelve a crear. Requiere 01-restricciones.cypher.
// Ejecutar con cypher-shell (grafo/cypher.sh): un archivo, un proceso.
// leyo se deriva de los estados "terminada" de LIBROS (D-16); las peliculas terminadas no crean relacion.
// Las etiquetas y relaciones llevan su nombre con tilde, como en los documentos de diseno.
// =============================================================================

MATCH (n) DETACH DELETE n;

// ---- Nodos ----
UNWIND [
  {persona_id: 'a1000000-0000-4000-8000-000000000001', nombre: 'Frank Herbert', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Frank_Herbert_1984_%28square%29.jpg/500px-Frank_Herbert_1984_%28square%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000002', nombre: 'Philip K. Dick', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Philip_K_Dick_in_early_1960s_Arthur_Knight_%283x4_cropped%29.jpg/500px-Philip_K_Dick_in_early_1960s_Arthur_Knight_%283x4_cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000003', nombre: 'Andy Weir', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Andy_Weir_by_Gage_Skidmore.jpg/500px-Andy_Weir_by_Gage_Skidmore.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000004', nombre: 'Ted Chiang', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Ted_Chiang_at_World_Fantasy_Convention_2026.jpg/500px-Ted_Chiang_at_World_Fantasy_Convention_2026.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000005', nombre: 'Michael Crichton', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/MichaelCrichton_2.jpg/500px-MichaelCrichton_2.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000006', nombre: 'J. R. R. Tolkien', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/J._R._R._Tolkien%2C_ca._1925.jpg/500px-J._R._R._Tolkien%2C_ca._1925.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000007', nombre: 'Jane Austen', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/CassandraAusten-JaneAusten%28c.1810%29_hires.jpg/500px-CassandraAusten-JaneAusten%28c.1810%29_hires.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000008', nombre: 'Ian McEwan', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/IanMcEwan_EIBF2025_i481.jpg/500px-IanMcEwan_EIBF2025_i481.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000009', nombre: 'Agatha Christie', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Agatha_Christie_in_Nederland_%28detectiveschrijfster%29%2C_bij_aankomst_op_Schiphol_me%2C_Bestanddeelnr_916-8898_%28cropped%29.jpg/500px-Agatha_Christie_in_Nederland_%28detectiveschrijfster%29%2C_bij_aankomst_op_Schiphol_me%2C_Bestanddeelnr_916-8898_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000010', nombre: 'William Gibson', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/William_Gibson_60th_birthday_portrait_%283x4_cropped%29.jpg/500px-William_Gibson_60th_birthday_portrait_%283x4_cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000011', nombre: 'Denis Villeneuve', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/DVilleneuveRFH121024_%2812_of_23%29_%2854061976489%29_%28cropped%29.jpg/500px-DVilleneuveRFH121024_%2812_of_23%29_%2854061976489%29_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000012', nombre: 'Ridley Scott', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Ridley_Scott_At_BFI_-_BFI_Southbank_-_Saturday_4th_October_2025_%28cropped%29.jpg/500px-Ridley_Scott_At_BFI_-_BFI_Southbank_-_Saturday_4th_October_2025_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000013', nombre: 'Steven Spielberg', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/MKr25402_Steven_Spielberg_%28Berlinale_2023%29_%283x4_cropped%29.jpg/500px-MKr25402_Steven_Spielberg_%28Berlinale_2023%29_%283x4_cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000014', nombre: 'Peter Jackson', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Peter_Jackson_SDCC_2014.jpg/500px-Peter_Jackson_SDCC_2014.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000015', nombre: 'Joe Wright', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Joe_Wright_by_Gage_Skidmore.jpg/500px-Joe_Wright_by_Gage_Skidmore.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000016', nombre: 'Kenneth Branagh', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Kenneth_Branagh_portrait_at_TIFF_2026.jpg/500px-Kenneth_Branagh_portrait_at_TIFF_2026.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000017', nombre: 'Timothée Chalamet', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg/500px-Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000018', nombre: 'Rebecca Ferguson', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg/500px-Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000019', nombre: 'Harrison Ford', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Harrison_Ford_-_Televerse_2025-03.jpg/500px-Harrison_Ford_-_Televerse_2025-03.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000020', nombre: 'Matt Damon', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/MattDamon-byPhilipRomano2.jpg/500px-MattDamon-byPhilipRomano2.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000021', nombre: 'Amy Adams', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Amy_Adams_at_the_2024_Toronto_International_Film_Festival._03_%28cropped%29.jpg/500px-Amy_Adams_at_the_2024_Toronto_International_Film_Festival._03_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000022', nombre: 'Sam Neill', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Sam_Neill_2010.jpg/500px-Sam_Neill_2010.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000023', nombre: 'Martin Freeman', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Martin_Freeman-5341.jpg/500px-Martin_Freeman-5341.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000024', nombre: 'Ian McKellen', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/SDCC13_-_Ian_McKellen.jpg/500px-SDCC13_-_Ian_McKellen.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000025', nombre: 'Elijah Wood', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Elijah_Wood_%2855223197178%29_%28cropped%29.jpg/500px-Elijah_Wood_%2855223197178%29_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000026', nombre: 'Keira Knightley', foto_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/KeiraKnightleyByAndreaRaffin2011_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000027', nombre: 'Matthew Macfadyen', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Matthew_Macfadyen_2019.jpg/500px-Matthew_Macfadyen_2019.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000028', nombre: 'James McAvoy', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/James_McAvoy_at_2026_Toronto_Film_Festival_%28cropped%29.jpg/500px-James_McAvoy_at_2026_Toronto_Film_Festival_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000029', nombre: 'Penélope Cruz', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Pen%C3%A9lope_Cruz_%40_2010_Academy_Awards_%28cropped%29.jpg/500px-Pen%C3%A9lope_Cruz_%40_2010_Academy_Awards_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000030', nombre: 'Umberto Eco', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Italiaanse_schrijver_Umberto_Eco%2C_portret.jpg/500px-Italiaanse_schrijver_Umberto_Eco%2C_portret.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000031', nombre: 'Mario Puzo', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Mario_Puzo_1972_%28cropped%29.jpg/500px-Mario_Puzo_1972_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000032', nombre: 'Chuck Palahniuk', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Chuck_Palahniuk_%2821962%29_%28cropped%29.jpg/500px-Chuck_Palahniuk_%2821962%29_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000033', nombre: 'Gillian Flynn', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Gillian_Flynn_2014_%28cropped%29.jpg/500px-Gillian_Flynn_2014_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000034', nombre: 'Stephen King', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Stephen_King_at_the_2024_Toronto_International_Film_Festival_2_%28cropped%29.jpg/500px-Stephen_King_at_the_2024_Toronto_International_Film_Festival_2_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000035', nombre: 'Thomas Harris'},
  {persona_id: 'a1000000-0000-4000-8000-000000000036', nombre: 'Jean-Jacques Annaud', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Jean-Jacques_Annaud_par_Claude_Truong-Ngoc_f%C3%A9vrier_2015.jpg/500px-Jean-Jacques_Annaud_par_Claude_Truong-Ngoc_f%C3%A9vrier_2015.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000037', nombre: 'Francis Ford Coppola', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Lena_Herzog_Francis_Ford_Coppola_Wernder_Herzog_Venice_Film_Festival_%28cropped%29.jpg/500px-Lena_Herzog_Francis_Ford_Coppola_Wernder_Herzog_Venice_Film_Festival_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000038', nombre: 'David Fincher', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/TheKillerBFILFF051023_%288_of_22%29_%2853255176376%29_%28cropped2%29.jpg/500px-TheKillerBFILFF051023_%288_of_22%29_%2853255176376%29_%28cropped2%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000039', nombre: 'Stanley Kubrick', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/Stanley_Kubrick_in_Dr._Strangelove_Trailer_%284%29_Cropped.jpg/500px-Stanley_Kubrick_in_Dr._Strangelove_Trailer_%284%29_Cropped.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000040', nombre: 'Jonathan Demme', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Jonathan_Demme_%28May_2015_small%29.JPG/500px-Jonathan_Demme_%28May_2015_small%29.JPG'},
  {persona_id: 'a1000000-0000-4000-8000-000000000041', nombre: 'Sean Connery', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Sean_Connery_as_James_Bond_at_Switzerland_1964_%28two_thirds_crop%29.jpg/500px-Sean_Connery_as_James_Bond_at_Switzerland_1964_%28two_thirds_crop%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000042', nombre: 'Marlon Brando', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Marlon_Brando_publicity_for_One-Eyed_Jacks.png/500px-Marlon_Brando_publicity_for_One-Eyed_Jacks.png'},
  {persona_id: 'a1000000-0000-4000-8000-000000000043', nombre: 'Al Pacino', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Al_Pacino_-_Killing_Castro_-_Q%26A_-_Tribeca_2026_-_by_%40JJxFile-23_%28cropped%29.jpg/500px-Al_Pacino_-_Killing_Castro_-_Q%26A_-_Tribeca_2026_-_by_%40JJxFile-23_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000044', nombre: 'Brad Pitt', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Brad_Pitt-69858.jpg/500px-Brad_Pitt-69858.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000045', nombre: 'Ben Affleck', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Ben_Affleck_at_83rd_Venice_International_Film_Festival-1_%28cropped%29.jpg/500px-Ben_Affleck_at_83rd_Venice_International_Film_Festival-1_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000046', nombre: 'Rosamund Pike', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/2026_Rosamund_Pike_%28cropped%29.jpg/500px-2026_Rosamund_Pike_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000047', nombre: 'Jack Nicholson', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Jack_Nicholson_2002.jpg/500px-Jack_Nicholson_2002.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000048', nombre: 'Jodie Foster', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Jodie_Foster_Taxi_Driver_Tribeca_Festival_2026-20_%28cropped%29.jpg/500px-Jodie_Foster_Taxi_Driver_Tribeca_Festival_2026-20_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000049', nombre: 'Anthony Hopkins', foto_url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Anthony_Hopkins_Red_Sea_Festival_2025_Portrait_%28cropped%29.jpg/500px-Anthony_Hopkins_Red_Sea_Festival_2025_Portrait_%28cropped%29.jpg'},
  {persona_id: 'a1000000-0000-4000-8000-000000000050', nombre: 'Ted Levine'}
] AS fila
MERGE (p:Persona {persona_id: fila.persona_id})
SET p.nombre = fila.nombre, p.foto_url = fila.foto_url;

UNWIND [
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002',
  'b1000000-0000-4000-8000-000000000003',
  'b1000000-0000-4000-8000-000000000004',
  'b1000000-0000-4000-8000-000000000005',
  'b1000000-0000-4000-8000-000000000006',
  'b1000000-0000-4000-8000-000000000007',
  'b1000000-0000-4000-8000-000000000008',
  'b1000000-0000-4000-8000-000000000009',
  'b1000000-0000-4000-8000-000000000010',
  'b1000000-0000-4000-8000-000000000011',
  'b1000000-0000-4000-8000-000000000012',
  'b1000000-0000-4000-8000-000000000013',
  'b1000000-0000-4000-8000-000000000014',
  'b1000000-0000-4000-8000-000000000015',
  'b1000000-0000-4000-8000-000000000016',
  'b1000000-0000-4000-8000-000000000017'
] AS id
MERGE (:Libro {obra_id: id});

UNWIND [
  'f1000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000002',
  'f1000000-0000-4000-8000-000000000003',
  'f1000000-0000-4000-8000-000000000004',
  'f1000000-0000-4000-8000-000000000005',
  'f1000000-0000-4000-8000-000000000006',
  'f1000000-0000-4000-8000-000000000007',
  'f1000000-0000-4000-8000-000000000008',
  'f1000000-0000-4000-8000-000000000009',
  'f1000000-0000-4000-8000-000000000010',
  'f1000000-0000-4000-8000-000000000011',
  'f1000000-0000-4000-8000-000000000012',
  'f1000000-0000-4000-8000-000000000013',
  'f1000000-0000-4000-8000-000000000014',
  'f1000000-0000-4000-8000-000000000015',
  'f1000000-0000-4000-8000-000000000016',
  'f1000000-0000-4000-8000-000000000017',
  'f1000000-0000-4000-8000-000000000018'
] AS id
MERGE (:`Película` {obra_id: id});

UNWIND [
  'c1000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000002',
  'c1000000-0000-4000-8000-000000000003',
  'c1000000-0000-4000-8000-000000000004',
  'c1000000-0000-4000-8000-000000000005',
  'c1000000-0000-4000-8000-000000000006',
  'c1000000-0000-4000-8000-000000000007',
  'c1000000-0000-4000-8000-000000000008'
] AS id
MERGE (:Usuario {usuario_id: id});

// ---- Relaciones del catalogo (las crea el administrador, RF-10 y RF-11) ----
UNWIND [
  {persona: 'a1000000-0000-4000-8000-000000000001', libro: 'b1000000-0000-4000-8000-000000000001'},
  {persona: 'a1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000002'},
  {persona: 'a1000000-0000-4000-8000-000000000003', libro: 'b1000000-0000-4000-8000-000000000003'},
  {persona: 'a1000000-0000-4000-8000-000000000004', libro: 'b1000000-0000-4000-8000-000000000004'},
  {persona: 'a1000000-0000-4000-8000-000000000005', libro: 'b1000000-0000-4000-8000-000000000005'},
  {persona: 'a1000000-0000-4000-8000-000000000006', libro: 'b1000000-0000-4000-8000-000000000006'},
  {persona: 'a1000000-0000-4000-8000-000000000006', libro: 'b1000000-0000-4000-8000-000000000007'},
  {persona: 'a1000000-0000-4000-8000-000000000007', libro: 'b1000000-0000-4000-8000-000000000008'},
  {persona: 'a1000000-0000-4000-8000-000000000008', libro: 'b1000000-0000-4000-8000-000000000009'},
  {persona: 'a1000000-0000-4000-8000-000000000009', libro: 'b1000000-0000-4000-8000-000000000010'},
  {persona: 'a1000000-0000-4000-8000-000000000010', libro: 'b1000000-0000-4000-8000-000000000011'},
  {persona: 'a1000000-0000-4000-8000-000000000030', libro: 'b1000000-0000-4000-8000-000000000012'},
  {persona: 'a1000000-0000-4000-8000-000000000031', libro: 'b1000000-0000-4000-8000-000000000013'},
  {persona: 'a1000000-0000-4000-8000-000000000032', libro: 'b1000000-0000-4000-8000-000000000014'},
  {persona: 'a1000000-0000-4000-8000-000000000033', libro: 'b1000000-0000-4000-8000-000000000015'},
  {persona: 'a1000000-0000-4000-8000-000000000034', libro: 'b1000000-0000-4000-8000-000000000016'},
  {persona: 'a1000000-0000-4000-8000-000000000035', libro: 'b1000000-0000-4000-8000-000000000017'}
] AS r
MATCH (p:Persona {persona_id: r.persona}), (l:Libro {obra_id: r.libro})
MERGE (p)-[:escribió]->(l);

UNWIND [
  {libro: 'b1000000-0000-4000-8000-000000000001', pelicula: 'f1000000-0000-4000-8000-000000000001'},
  {libro: 'b1000000-0000-4000-8000-000000000001', pelicula: 'f1000000-0000-4000-8000-000000000002'},
  {libro: 'b1000000-0000-4000-8000-000000000002', pelicula: 'f1000000-0000-4000-8000-000000000003'},
  {libro: 'b1000000-0000-4000-8000-000000000003', pelicula: 'f1000000-0000-4000-8000-000000000004'},
  {libro: 'b1000000-0000-4000-8000-000000000004', pelicula: 'f1000000-0000-4000-8000-000000000005'},
  {libro: 'b1000000-0000-4000-8000-000000000005', pelicula: 'f1000000-0000-4000-8000-000000000006'},
  {libro: 'b1000000-0000-4000-8000-000000000006', pelicula: 'f1000000-0000-4000-8000-000000000007'},
  {libro: 'b1000000-0000-4000-8000-000000000007', pelicula: 'f1000000-0000-4000-8000-000000000008'},
  {libro: 'b1000000-0000-4000-8000-000000000008', pelicula: 'f1000000-0000-4000-8000-000000000009'},
  {libro: 'b1000000-0000-4000-8000-000000000009', pelicula: 'f1000000-0000-4000-8000-000000000010'},
  {libro: 'b1000000-0000-4000-8000-000000000010', pelicula: 'f1000000-0000-4000-8000-000000000011'},
  {libro: 'b1000000-0000-4000-8000-000000000011', pelicula: 'f1000000-0000-4000-8000-000000000012'},
  {libro: 'b1000000-0000-4000-8000-000000000012', pelicula: 'f1000000-0000-4000-8000-000000000013'},
  {libro: 'b1000000-0000-4000-8000-000000000013', pelicula: 'f1000000-0000-4000-8000-000000000014'},
  {libro: 'b1000000-0000-4000-8000-000000000014', pelicula: 'f1000000-0000-4000-8000-000000000015'},
  {libro: 'b1000000-0000-4000-8000-000000000015', pelicula: 'f1000000-0000-4000-8000-000000000016'},
  {libro: 'b1000000-0000-4000-8000-000000000016', pelicula: 'f1000000-0000-4000-8000-000000000017'},
  {libro: 'b1000000-0000-4000-8000-000000000017', pelicula: 'f1000000-0000-4000-8000-000000000018'}
] AS r
MATCH (l:Libro {obra_id: r.libro}), (f:`Película` {obra_id: r.pelicula})
MERGE (l)-[:adaptado_a]->(f);

UNWIND [
  {pelicula: 'f1000000-0000-4000-8000-000000000001', persona: 'a1000000-0000-4000-8000-000000000011'},
  {pelicula: 'f1000000-0000-4000-8000-000000000002', persona: 'a1000000-0000-4000-8000-000000000011'},
  {pelicula: 'f1000000-0000-4000-8000-000000000003', persona: 'a1000000-0000-4000-8000-000000000012'},
  {pelicula: 'f1000000-0000-4000-8000-000000000004', persona: 'a1000000-0000-4000-8000-000000000012'},
  {pelicula: 'f1000000-0000-4000-8000-000000000005', persona: 'a1000000-0000-4000-8000-000000000011'},
  {pelicula: 'f1000000-0000-4000-8000-000000000006', persona: 'a1000000-0000-4000-8000-000000000013'},
  {pelicula: 'f1000000-0000-4000-8000-000000000007', persona: 'a1000000-0000-4000-8000-000000000014'},
  {pelicula: 'f1000000-0000-4000-8000-000000000008', persona: 'a1000000-0000-4000-8000-000000000014'},
  {pelicula: 'f1000000-0000-4000-8000-000000000009', persona: 'a1000000-0000-4000-8000-000000000015'},
  {pelicula: 'f1000000-0000-4000-8000-000000000010', persona: 'a1000000-0000-4000-8000-000000000015'},
  {pelicula: 'f1000000-0000-4000-8000-000000000011', persona: 'a1000000-0000-4000-8000-000000000016'},
  {pelicula: 'f1000000-0000-4000-8000-000000000013', persona: 'a1000000-0000-4000-8000-000000000036'},
  {pelicula: 'f1000000-0000-4000-8000-000000000014', persona: 'a1000000-0000-4000-8000-000000000037'},
  {pelicula: 'f1000000-0000-4000-8000-000000000015', persona: 'a1000000-0000-4000-8000-000000000038'},
  {pelicula: 'f1000000-0000-4000-8000-000000000016', persona: 'a1000000-0000-4000-8000-000000000038'},
  {pelicula: 'f1000000-0000-4000-8000-000000000017', persona: 'a1000000-0000-4000-8000-000000000039'},
  {pelicula: 'f1000000-0000-4000-8000-000000000018', persona: 'a1000000-0000-4000-8000-000000000040'}
] AS r
MATCH (f:`Película` {obra_id: r.pelicula}), (p:Persona {persona_id: r.persona})
MERGE (f)-[:dirigida_por]->(p);

UNWIND [
  {persona: 'a1000000-0000-4000-8000-000000000017', pelicula: 'f1000000-0000-4000-8000-000000000001', personaje: 'Paul Atreides', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000018', pelicula: 'f1000000-0000-4000-8000-000000000001', personaje: 'Lady Jessica', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000017', pelicula: 'f1000000-0000-4000-8000-000000000002', personaje: 'Paul Atreides', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000018', pelicula: 'f1000000-0000-4000-8000-000000000002', personaje: 'Lady Jessica', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000019', pelicula: 'f1000000-0000-4000-8000-000000000003', personaje: 'Rick Deckard', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000020', pelicula: 'f1000000-0000-4000-8000-000000000004', personaje: 'Mark Watney', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000021', pelicula: 'f1000000-0000-4000-8000-000000000005', personaje: 'Louise Banks', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000022', pelicula: 'f1000000-0000-4000-8000-000000000006', personaje: 'Alan Grant', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000023', pelicula: 'f1000000-0000-4000-8000-000000000007', personaje: 'Bilbo Bolsón', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000024', pelicula: 'f1000000-0000-4000-8000-000000000007', personaje: 'Gandalf', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000025', pelicula: 'f1000000-0000-4000-8000-000000000008', personaje: 'Frodo Bolsón', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000024', pelicula: 'f1000000-0000-4000-8000-000000000008', personaje: 'Gandalf', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000026', pelicula: 'f1000000-0000-4000-8000-000000000009', personaje: 'Elizabeth Bennet', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000027', pelicula: 'f1000000-0000-4000-8000-000000000009', personaje: 'Señor Darcy', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000026', pelicula: 'f1000000-0000-4000-8000-000000000010', personaje: 'Cecilia Tallis', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000028', pelicula: 'f1000000-0000-4000-8000-000000000010', personaje: 'Robbie Turner', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000016', pelicula: 'f1000000-0000-4000-8000-000000000011', personaje: 'Hercule Poirot', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000029', pelicula: 'f1000000-0000-4000-8000-000000000011', personaje: 'Pilar Estravados', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000041', pelicula: 'f1000000-0000-4000-8000-000000000013', personaje: 'Guillermo de Baskerville', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000042', pelicula: 'f1000000-0000-4000-8000-000000000014', personaje: 'Vito Corleone', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000043', pelicula: 'f1000000-0000-4000-8000-000000000014', personaje: 'Michael Corleone', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000044', pelicula: 'f1000000-0000-4000-8000-000000000015', personaje: 'Tyler Durden', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000045', pelicula: 'f1000000-0000-4000-8000-000000000016', personaje: 'Nick Dunne', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000046', pelicula: 'f1000000-0000-4000-8000-000000000016', personaje: 'Amy Dunne', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000047', pelicula: 'f1000000-0000-4000-8000-000000000017', personaje: 'Jack Torrance', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000048', pelicula: 'f1000000-0000-4000-8000-000000000018', personaje: 'Clarice Starling', orden: 1},
  {persona: 'a1000000-0000-4000-8000-000000000049', pelicula: 'f1000000-0000-4000-8000-000000000018', personaje: 'Hannibal Lecter', orden: 2},
  {persona: 'a1000000-0000-4000-8000-000000000050', pelicula: 'f1000000-0000-4000-8000-000000000018', personaje: 'Jame Gumb', orden: 3}
] AS r
MATCH (p:Persona {persona_id: r.persona}), (f:`Película` {obra_id: r.pelicula})
MERGE (p)-[a:`actuó_en`]->(f)
SET a.personaje = r.personaje, a.orden = r.orden;

// ---- Relaciones que llegan desde el relacional (seguimiento y estado_obra) ----
UNWIND [
  {seguidor: 'c1000000-0000-4000-8000-000000000006', seguido: 'c1000000-0000-4000-8000-000000000002'},
  {seguidor: 'c1000000-0000-4000-8000-000000000006', seguido: 'c1000000-0000-4000-8000-000000000005'},
  {seguidor: 'c1000000-0000-4000-8000-000000000006', seguido: 'c1000000-0000-4000-8000-000000000007'},
  {seguidor: 'c1000000-0000-4000-8000-000000000003', seguido: 'c1000000-0000-4000-8000-000000000002'},
  {seguidor: 'c1000000-0000-4000-8000-000000000004', seguido: 'c1000000-0000-4000-8000-000000000002'},
  {seguidor: 'c1000000-0000-4000-8000-000000000004', seguido: 'c1000000-0000-4000-8000-000000000005'},
  {seguidor: 'c1000000-0000-4000-8000-000000000007', seguido: 'c1000000-0000-4000-8000-000000000004'},
  {seguidor: 'c1000000-0000-4000-8000-000000000008', seguido: 'c1000000-0000-4000-8000-000000000004'},
  {seguidor: 'c1000000-0000-4000-8000-000000000008', seguido: 'c1000000-0000-4000-8000-000000000001'},
  {seguidor: 'c1000000-0000-4000-8000-000000000002', seguido: 'c1000000-0000-4000-8000-000000000005'}
] AS r
MATCH (a:Usuario {usuario_id: r.seguidor}), (b:Usuario {usuario_id: r.seguido})
MERGE (a)-[:sigue]->(b);

UNWIND [
  {usuario: 'c1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000001'},
  {usuario: 'c1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000003'},
  {usuario: 'c1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000006'},
  {usuario: 'c1000000-0000-4000-8000-000000000002', libro: 'b1000000-0000-4000-8000-000000000009'},
  {usuario: 'c1000000-0000-4000-8000-000000000003', libro: 'b1000000-0000-4000-8000-000000000005'},
  {usuario: 'c1000000-0000-4000-8000-000000000004', libro: 'b1000000-0000-4000-8000-000000000001'},
  {usuario: 'c1000000-0000-4000-8000-000000000004', libro: 'b1000000-0000-4000-8000-000000000008'},
  {usuario: 'c1000000-0000-4000-8000-000000000005', libro: 'b1000000-0000-4000-8000-000000000001'},
  {usuario: 'c1000000-0000-4000-8000-000000000005', libro: 'b1000000-0000-4000-8000-000000000004'},
  {usuario: 'c1000000-0000-4000-8000-000000000007', libro: 'b1000000-0000-4000-8000-000000000005'},
  {usuario: 'c1000000-0000-4000-8000-000000000007', libro: 'b1000000-0000-4000-8000-000000000003'},
  {usuario: 'c1000000-0000-4000-8000-000000000008', libro: 'b1000000-0000-4000-8000-000000000009'},
  {usuario: 'c1000000-0000-4000-8000-000000000008', libro: 'b1000000-0000-4000-8000-000000000016'},
  {usuario: 'c1000000-0000-4000-8000-000000000003', libro: 'b1000000-0000-4000-8000-000000000014'}
] AS r
MATCH (u:Usuario {usuario_id: r.usuario}), (l:Libro {obra_id: r.libro})
MERGE (u)-[:leyó]->(l);

// ---- Resumen de lo cargado ----
MATCH (n) RETURN head(labels(n)) AS nodos, count(*) AS total ORDER BY nodos;
MATCH ()-[r]->() RETURN type(r) AS relacion, count(*) AS total ORDER BY relacion;
