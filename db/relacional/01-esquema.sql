-- =============================================================================
-- Del Libro a la Pantalla: base relacional (PostgreSQL 18.7)
-- 01-esquema.sql: tipos, tablas, claves, restricciones.
--
-- Diseño: docs/modelado/relacional/01-tablas-campos-llaves-relaciones.md y
--         02-restricciones-integridad.md. Aquí solo se implementa.
-- Se puede ejecutar más de una vez: empieza borrando lo que crea.
-- Los índices están en 02-indices.sql y el trigger del promedio en 03-trigger.sql.
-- =============================================================================

\set ON_ERROR_STOP on
SET client_min_messages = warning;   -- sin avisos de "no existe, se omite" del DROP IF EXISTS

BEGIN;

-- ---------------------------------------------------------------- limpieza
DROP TABLE IF EXISTS sesion, sync_outbox, seguimiento, elemento_lista, lista,
                     estado_obra, resena, obra_resumen, usuario CASCADE;
DROP FUNCTION IF EXISTS fn_recalcular_promedio() CASCADE;
DROP TYPE IF EXISTS rol_usuario, tipo_obra, estado_lectura, estado_evento CASCADE;

-- ------------------------------------------------- dominios cerrados (ENUM)
CREATE TYPE rol_usuario    AS ENUM ('lector', 'admin');
CREATE TYPE tipo_obra      AS ENUM ('libro', 'pelicula');
CREATE TYPE estado_lectura AS ENUM ('pendiente', 'en_curso', 'terminada');
CREATE TYPE estado_evento  AS ENUM ('pendiente', 'procesado', 'fallido');

-- ----------------------------------------------------------------- usuario
-- usuario_id es el mismo UUID de las tres bases (RNF-08, D-11): lo genera la
-- aplicación, por eso no lleva DEFAULT.
CREATE TABLE usuario (
    usuario_id    UUID          NOT NULL,
    correo        VARCHAR(254)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    nombre        VARCHAR(100)  NOT NULL,
    biografia     VARCHAR(500),
    rol           rol_usuario   NOT NULL DEFAULT 'lector',
    creado_en     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT pk_usuario PRIMARY KEY (usuario_id),
    CONSTRAINT uq_usuario_correo UNIQUE (correo),
    -- D-03: la API normaliza el correo y la base lo exige.
    CONSTRAINT ck_usuario_correo_minusculas CHECK (correo = LOWER(correo))
);

-- ------------------------------------------------------------ obra_resumen
-- Referencia local de cada obra. promedio y total_resenas son datos derivados
-- que mantiene el trigger de 03-trigger.sql (RN-08).
CREATE TABLE obra_resumen (
    obra_id       UUID          NOT NULL,
    tipo          tipo_obra     NOT NULL,
    promedio      NUMERIC(3,2),
    total_resenas INTEGER       NOT NULL DEFAULT 0,
    CONSTRAINT pk_obra_resumen PRIMARY KEY (obra_id),
    CONSTRAINT ck_obra_promedio_rango    CHECK (promedio BETWEEN 1 AND 5),
    CONSTRAINT ck_obra_total_no_negativo CHECK (total_resenas >= 0),
    -- Sin reseñas vigentes no hay promedio, y con reseñas siempre lo hay.
    CONSTRAINT ck_obra_coherencia        CHECK ((total_resenas = 0) = (promedio IS NULL))
);

-- ------------------------------------------------------------------ resena
CREATE TABLE resena (
    resena_id      UUID         NOT NULL,
    usuario_id     UUID         NOT NULL,
    obra_id        UUID         NOT NULL,
    calificacion   SMALLINT     NOT NULL,
    texto          TEXT,
    oculta         BOOLEAN      NOT NULL DEFAULT false,
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT pk_resena PRIMARY KEY (resena_id),
    -- RN-01: una reseña por usuario y obra.
    CONSTRAINT uq_resena_usuario_obra UNIQUE (usuario_id, obra_id),
    -- RN-02: calificación de 1 a 5.
    CONSTRAINT ck_resena_calificacion CHECK (calificacion BETWEEN 1 AND 5),
    -- RF-04: al borrar la cuenta se borran sus reseñas (el trigger corrige el promedio).
    CONSTRAINT fk_resena_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (usuario_id) ON DELETE CASCADE,
    -- No hay baja de obras: si alguien lo intenta con reseñas, la base lo impide.
    CONSTRAINT fk_resena_obra FOREIGN KEY (obra_id)
        REFERENCES obra_resumen (obra_id) ON DELETE RESTRICT
);

--------------------------------------------------------------- estado_obra
CREATE TABLE estado_obra (
    usuario_id     UUID            NOT NULL,
    obra_id        UUID            NOT NULL,
    estado         estado_lectura  NOT NULL,
    actualizado_en TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT pk_estado_obra PRIMARY KEY (usuario_id, obra_id),
    CONSTRAINT fk_estado_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_estado_obra FOREIGN KEY (obra_id)
        REFERENCES obra_resumen (obra_id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------- lista
CREATE TABLE lista (
    lista_id   UUID          NOT NULL,
    usuario_id UUID          NOT NULL,
    nombre     VARCHAR(100)  NOT NULL,
    creado_en  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT pk_lista PRIMARY KEY (lista_id),
    CONSTRAINT fk_lista_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (usuario_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------- elemento_lista
CREATE TABLE elemento_lista (
    lista_id    UUID         NOT NULL,
    obra_id     UUID         NOT NULL,
    posicion    INTEGER      NOT NULL,
    agregado_en TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- RN-04: una obra una sola vez por lista.
    CONSTRAINT pk_elemento_lista PRIMARY KEY (lista_id, obra_id),
    CONSTRAINT ck_elemento_posicion CHECK (posicion >= 1),
    CONSTRAINT fk_elemento_lista FOREIGN KEY (lista_id)
        REFERENCES lista (lista_id) ON DELETE CASCADE,
    CONSTRAINT fk_elemento_obra FOREIGN KEY (obra_id)
        REFERENCES obra_resumen (obra_id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------- seguimiento
CREATE TABLE seguimiento (
    seguidor_id UUID         NOT NULL,
    seguido_id  UUID         NOT NULL,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- RN-03 (parte 2): no se sigue dos veces a la misma persona.
    CONSTRAINT pk_seguimiento PRIMARY KEY (seguidor_id, seguido_id),
    -- RN-03 (parte 1): nadie se sigue a sí mismo.
    CONSTRAINT ck_seguimiento_no_propio CHECK (seguidor_id <> seguido_id),
    CONSTRAINT fk_seguimiento_seguidor FOREIGN KEY (seguidor_id)
        REFERENCES usuario (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_seguimiento_seguido FOREIGN KEY (seguido_id)
        REFERENCES usuario (usuario_id) ON DELETE CASCADE
);

-- -------------------------------------------------------------- sync_outbox
-- Cola técnica: no se relaciona con ninguna tabla a propósito.
CREATE TABLE sync_outbox (
    evento_id    BIGINT        GENERATED ALWAYS AS IDENTITY,
    tipo_evento  VARCHAR(40)   NOT NULL,
    payload      JSONB         NOT NULL,
    estado       estado_evento NOT NULL DEFAULT 'pendiente',
    intentos     INTEGER       NOT NULL DEFAULT 0,
    error        TEXT,
    creado_en    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    procesado_en TIMESTAMPTZ,
    CONSTRAINT pk_sync_outbox PRIMARY KEY (evento_id),
    CONSTRAINT ck_outbox_tipo_evento CHECK (tipo_evento IN (
        'usuario_creado', 'usuario_eliminado',
        'seguimiento_creado', 'seguimiento_eliminado',
        'obra_leida', 'obra_no_leida'))
);

-- ------------------------------------------------------------------ sesion
-- D-35: se guarda el hash SHA-256 del token (64 hexadecimales), nunca el token.
CREATE TABLE sesion (
    token_hash CHAR(64)     NOT NULL,
    usuario_id UUID         NOT NULL,
    creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expira_en  TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_sesion PRIMARY KEY (token_hash),
    -- Una sesión no nace vencida.
    CONSTRAINT ck_sesion_vigencia CHECK (expira_en > creado_en),
    -- RF-04: al borrar la cuenta se cierran todas sus sesiones.
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (usuario_id) ON DELETE CASCADE
);

COMMIT;
