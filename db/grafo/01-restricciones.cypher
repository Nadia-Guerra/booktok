// =============================================================================
// Del Libro a la Pantalla: grafo (Neo4j 5.26 Community)
// 01-restricciones.cypher: restricciones de unicidad e índice de búsqueda por nombre.
//
// Diseño: docs/modelado/grafo/04-restricciones.md (sección 6) y D-21, D-22.
// Se ejecuta con cypher-shell (ver grafo/cypher.sh). Es idempotente: IF NOT EXISTS.
// =============================================================================

// ---- Unicidad (todas las ediciones). Cada restricción crea además el índice de su id ----
CREATE CONSTRAINT persona_id_unico IF NOT EXISTS
  FOR (p:Persona) REQUIRE p.persona_id IS UNIQUE;
CREATE CONSTRAINT libro_obra_id_unico IF NOT EXISTS
  FOR (l:Libro) REQUIRE l.obra_id IS UNIQUE;
CREATE CONSTRAINT pelicula_obra_id_unico IF NOT EXISTS
  FOR (f:`Película`) REQUIRE f.obra_id IS UNIQUE;
CREATE CONSTRAINT usuario_id_unico IF NOT EXISTS
  FOR (u:Usuario) REQUIRE u.usuario_id IS UNIQUE;

// ---- Índice de búsqueda por nombre de Persona (CG-01 y CG-02) ------------------------
// Texto completo con el analizador 'standard-folding': busca palabras completas sin distinguir
// mayúsculas ni tildes, igual que los índices de texto del documental (IX-01, IX-02).
// 'timothee' encuentra "Timothée Chalamet"; 'chala' (un fragmento) no encuentra nada.
// Decisión D-41 (el diseño dejaba pendiente este índice).
CREATE FULLTEXT INDEX persona_nombre_texto IF NOT EXISTS
  FOR (p:Persona) ON EACH [p.nombre]
  OPTIONS {indexConfig: {`fulltext.analyzer`: 'standard-folding'}};

// ---- Restricciones de existencia y de tipo: NO se crean ---------------------------------
// Son solo de la edición Enterprise (D-22). Se probó en 5.26.34 Community y Neo4j las rechaza con
// "Property existence constraint requires Neo4j Enterprise Edition" (prueba R-07). La obligatoriedad
// y el tipo de estas propiedades los garantiza la API:
//
//   CREATE CONSTRAINT persona_id_existe FOR (p:Persona) REQUIRE p.persona_id IS NOT NULL;
//   CREATE CONSTRAINT persona_nombre_existe FOR (p:Persona) REQUIRE p.nombre IS NOT NULL;
//   CREATE CONSTRAINT libro_obra_id_existe FOR (l:Libro) REQUIRE l.obra_id IS NOT NULL;
//   CREATE CONSTRAINT pelicula_obra_id_existe FOR (f:`Película`) REQUIRE f.obra_id IS NOT NULL;
//   CREATE CONSTRAINT usuario_id_existe FOR (u:Usuario) REQUIRE u.usuario_id IS NOT NULL;
//   CREATE CONSTRAINT actuo_en_personaje_existe FOR ()-[r:`actuó_en`]-() REQUIRE r.personaje IS NOT NULL;
//   CREATE CONSTRAINT actuo_en_orden_existe FOR ()-[r:`actuó_en`]-() REQUIRE r.orden IS NOT NULL;
