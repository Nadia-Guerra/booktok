-- =============================================================================
-- 02-indices.sql: índices de la base relacional.
-- Diseño y justificación de cada uno: docs/modelado/relacional/03-indices.md.
-- Las claves primarias y los UNIQUE ya crean su propio índice (01-esquema.sql).
-- I3 se descartó en el diseño; su número no se reutiliza.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- I1: reseñas de una obra, más recientes primero; recálculo del promedio (trigger);
--     cubre la FK resena.obra_id.
CREATE INDEX idx_resena_obra_fecha ON resena (obra_id, creado_en DESC);

-- I2: reseñas de un usuario, más recientes primero (perfil y feed, RF-22).
CREATE INDEX idx_resena_usuario_fecha ON resena (usuario_id, creado_en DESC);

-- I4: quién sigue a un usuario; localiza los seguimientos en la cascada de RF-04.
CREATE INDEX idx_seguimiento_seguido ON seguimiento (seguido_id);

-- I5: listas de un usuario; localiza las listas en la cascada de RF-04.
CREATE INDEX idx_lista_usuario ON lista (usuario_id);

-- I6: eventos pendientes de propagar, en orden. PARCIAL (D-33, D-34): solo contiene
--     las filas pendientes, que son pocas aunque la tabla acumule eventos procesados.
CREATE INDEX idx_outbox_pendientes ON sync_outbox (evento_id) WHERE estado = 'pendiente';

-- I7: sesiones de un usuario; la cascada de RF-04 las localiza con él (D-35).
--     PostgreSQL no indexa solo las llaves foráneas.
CREATE INDEX idx_sesion_usuario ON sesion (usuario_id);

COMMIT;
