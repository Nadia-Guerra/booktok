-- =============================================================================
-- Verificación de índices con EXPLAIN (docs/modelado/relacional/03-indices.md, sección 6).
-- Cada consulta documentada debe usar el índice esperado y no un recorrido completo.
--
-- Se cargan datos de volumen en una transacción que termina en ROLLBACK (sin datos el
-- planificador elige siempre un recorrido secuencial, porque es más barato). Se
-- desactiva el trigger del promedio solo para la carga masiva; también se revierte.
-- Ejecutar con: psql -q -v ON_ERROR_STOP=1 -f 04-indices.sql
-- =============================================================================

\set ON_ERROR_STOP on
\pset null '(nulo)'
SET client_min_messages = warning;

BEGIN;
\ir 00-ayudas.sql
\o /dev/null

-- ---- Carga de volumen (300 usuarios, 40 obras, 6 000 reseñas, 20 000 eventos...) ----
ALTER TABLE resena DISABLE TRIGGER trg_resena_promedio;

-- 5 000 usuarios: con unos cientos la tabla cabe en pocas páginas y el planificador,
-- con razón, prefiere recorrerla entera. Solo los 300 primeros reseñan, siguen, etc.
INSERT INTO usuario (usuario_id, correo, password_hash, nombre)
SELECT md5('u' || i)::uuid, 'usuario' || i || '@ejemplo.test', 'hash', 'Usuario ' || i
FROM generate_series(1, 5000) i;

INSERT INTO obra_resumen (obra_id, tipo)
SELECT md5('o' || i)::uuid, CASE WHEN i <= 30 THEN 'libro'::tipo_obra ELSE 'pelicula'::tipo_obra END
FROM generate_series(1, 40) i;

-- Cada usuario reseña 20 obras distintas (6 000 reseñas, unas 150 por obra)
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion, creado_en)
SELECT md5('r' || u || '-' || k)::uuid, md5('u' || u)::uuid, md5('o' || ((u + k) % 40 + 1))::uuid,
       1 + (u + k) % 5, now() - ((u * k) % 1000) * interval '1 hour'
FROM generate_series(1, 300) u, generate_series(1, 20) k;

INSERT INTO estado_obra (usuario_id, obra_id, estado)
SELECT md5('u' || u)::uuid, md5('o' || ((u + k) % 40 + 1))::uuid,
       (ARRAY['pendiente', 'en_curso', 'terminada'])[1 + (u + k) % 3]::estado_lectura
FROM generate_series(1, 300) u, generate_series(1, 20) k;

INSERT INTO seguimiento (seguidor_id, seguido_id)
SELECT md5('u' || u)::uuid, md5('u' || ((u + k) % 300 + 1))::uuid
FROM generate_series(1, 300) u, generate_series(1, 12) k WHERE ((u + k) % 300 + 1) <> u;

INSERT INTO lista (lista_id, usuario_id, nombre)
SELECT md5('l' || u || '-' || k)::uuid, md5('u' || u)::uuid, 'Lista ' || k
FROM generate_series(1, 300) u, generate_series(1, 3) k;

INSERT INTO sesion (token_hash, usuario_id, expira_en)
SELECT md5('s' || u || '-' || k) || md5('t' || u || '-' || k), md5('u' || u)::uuid, now() + interval '30 days'
FROM generate_series(1, 300) u, generate_series(1, 2) k;

-- 20 000 eventos: casi todos procesados y 100 pendientes (los últimos)
INSERT INTO sync_outbox (tipo_evento, payload, estado)
SELECT 'seguimiento_creado', '{}'::jsonb, CASE WHEN i > 19900 THEN 'pendiente'::estado_evento ELSE 'procesado'::estado_evento END
FROM generate_series(1, 20000) i;

ANALYZE;

-- ---- Ayuda: texto del plan de una consulta ----
CREATE FUNCTION pg_temp.plan(consulta TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE linea TEXT; resultado TEXT := '';
BEGIN
    FOR linea IN EXECUTE 'EXPLAIN ' || consulta LOOP resultado := resultado || linea || E'\n'; END LOOP;
    RETURN resultado;
END $$;

-- 'usa <índice>' si el plan lo menciona; si no, 'NO usa <índice>; plan: <primer nodo>'
CREATE FUNCTION pg_temp.usa(consulta TEXT, indice TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE p TEXT := pg_temp.plan(consulta);
BEGIN
    IF position(indice IN p) > 0 THEN RETURN 'usa ' || indice; END IF;
    RETURN 'NO usa ' || indice || '; plan: ' || replace(split_part(p, E'\n', 1) || ' / ' || split_part(p, E'\n', 2), '  ', ' ');
END $$;

-- ---- Datos de apoyo para las consultas ----
CREATE TEMP TABLE ids AS
SELECT md5('u150')::uuid AS usuario, md5('o7')::uuid AS obra,
       'usuario150@ejemplo.test'::text AS correo, md5('s150-1') || md5('t150-1') AS token;

SELECT pg_temp.registrar('I-01', 'Usuario por correo (inicio de sesión)', 'usa uq_usuario_correo',
    pg_temp.usa('SELECT * FROM usuario WHERE correo = ' || quote_literal((SELECT correo FROM ids)), 'uq_usuario_correo'));

SELECT pg_temp.registrar('I-02', 'Reseñas de una obra, recientes primero (I1)', 'usa idx_resena_obra_fecha',
    pg_temp.usa('SELECT * FROM resena WHERE obra_id = ' || quote_literal((SELECT obra FROM ids)) ||
                ' AND NOT oculta ORDER BY creado_en DESC LIMIT 20', 'idx_resena_obra_fecha'));

SELECT pg_temp.registrar('I-03', 'Recálculo del promedio de una obra, el del trigger (I1)', 'usa idx_resena_obra_fecha',
    pg_temp.usa('SELECT count(*), round(avg(calificacion), 2) FROM resena WHERE obra_id = ' ||
                quote_literal((SELECT obra FROM ids)) || ' AND NOT oculta', 'idx_resena_obra_fecha'));

SELECT pg_temp.registrar('I-04', 'Reseñas de un usuario, recientes primero (I2)', 'usa idx_resena_usuario_fecha',
    pg_temp.usa('SELECT * FROM resena WHERE usuario_id = ' || quote_literal((SELECT usuario FROM ids)) ||
                ' AND NOT oculta ORDER BY creado_en DESC LIMIT 20', 'idx_resena_usuario_fecha'));

SELECT pg_temp.registrar('I-05', 'Obras terminadas de un usuario', 'usa pk_estado_obra',
    pg_temp.usa('SELECT obra_id FROM estado_obra WHERE usuario_id = ' || quote_literal((SELECT usuario FROM ids)) ||
                ' AND estado = ''terminada''', 'pk_estado_obra'));

SELECT pg_temp.registrar('I-06', 'RF-26 paso 1 (O18): estados terminados unidos con reseñas del mismo usuario', 'usa pk_estado_obra',
    pg_temp.usa('SELECT e.obra_id FROM estado_obra e JOIN resena r ON r.usuario_id = e.usuario_id AND r.obra_id = e.obra_id
                 JOIN obra_resumen o ON o.obra_id = e.obra_id
                 WHERE e.usuario_id = ' || quote_literal((SELECT usuario FROM ids)) ||
                ' AND e.estado = ''terminada'' AND o.tipo = ''libro'' AND r.calificacion >= 4 AND r.oculta = false
                 ORDER BY r.calificacion DESC, r.actualizado_en DESC LIMIT 20', 'pk_estado_obra'));
SELECT pg_temp.registrar('I-06b', 'RF-26 paso 1 (O18): la unión con reseñas usa el UNIQUE (usuario, obra)', 'usa uq_resena_usuario_obra',
    pg_temp.usa('SELECT e.obra_id FROM estado_obra e JOIN resena r ON r.usuario_id = e.usuario_id AND r.obra_id = e.obra_id
                 JOIN obra_resumen o ON o.obra_id = e.obra_id
                 WHERE e.usuario_id = ' || quote_literal((SELECT usuario FROM ids)) ||
                ' AND e.estado = ''terminada'' AND o.tipo = ''libro'' AND r.calificacion >= 4 AND r.oculta = false
                 ORDER BY r.calificacion DESC, r.actualizado_en DESC LIMIT 20', 'uq_resena_usuario_obra'));

SELECT pg_temp.registrar('I-07', 'Seguidores de un usuario (I4)', 'usa idx_seguimiento_seguido',
    pg_temp.usa('SELECT seguidor_id FROM seguimiento WHERE seguido_id = ' || quote_literal((SELECT usuario FROM ids)),
                'idx_seguimiento_seguido'));

SELECT pg_temp.registrar('I-07b', 'A quién sigue un usuario', 'usa pk_seguimiento',
    pg_temp.usa('SELECT seguido_id FROM seguimiento WHERE seguidor_id = ' || quote_literal((SELECT usuario FROM ids)),
                'pk_seguimiento'));

SELECT pg_temp.registrar('I-08', 'Listas de un usuario (I5)', 'usa idx_lista_usuario',
    pg_temp.usa('SELECT * FROM lista WHERE usuario_id = ' || quote_literal((SELECT usuario FROM ids)), 'idx_lista_usuario'));

SELECT pg_temp.registrar('I-09', 'Eventos pendientes en orden (I6, parcial)', 'usa idx_outbox_pendientes',
    pg_temp.usa('SELECT * FROM sync_outbox WHERE estado = ''pendiente'' ORDER BY evento_id LIMIT 50', 'idx_outbox_pendientes'));

SELECT pg_temp.registrar('I-10', 'Validar la sesión de una petición (O22): por clave primaria de sesion', 'usa pk_sesion',
    pg_temp.usa('SELECT u.usuario_id, u.rol FROM sesion s JOIN usuario u ON u.usuario_id = s.usuario_id
                 WHERE s.token_hash = ' || quote_literal((SELECT token FROM ids)) || ' AND s.expira_en > now()', 'pk_sesion'));
SELECT pg_temp.registrar('I-10b', 'Validar la sesión (O22): y por clave primaria de usuario', 'usa pk_usuario',
    pg_temp.usa('SELECT u.usuario_id, u.rol FROM sesion s JOIN usuario u ON u.usuario_id = s.usuario_id
                 WHERE s.token_hash = ' || quote_literal((SELECT token FROM ids)) || ' AND s.expira_en > now()', 'pk_usuario'));

SELECT pg_temp.registrar('I-11', 'Sesiones de un usuario, la cascada de RF-04 (I7)', 'usa idx_sesion_usuario',
    pg_temp.usa('SELECT * FROM sesion WHERE usuario_id = ' || quote_literal((SELECT usuario FROM ids)), 'idx_sesion_usuario'));

-- I6 es parcial de verdad (D-08/D-33/D-34): definición y tamaño
SELECT pg_temp.registrar('I-12', 'I6 está definido como parcial sobre estado = pendiente', 'parcial',
    (SELECT CASE WHEN indexdef LIKE '%WHERE%estado%pendiente%' THEN 'parcial' ELSE 'completo: ' || indexdef END
       FROM pg_indexes WHERE indexname = 'idx_outbox_pendientes'));
SELECT pg_temp.registrar('I-13', 'I6 pesa menos de una décima parte que el índice completo de la clave primaria', 'menor',
    (SELECT CASE WHEN pg_relation_size('idx_outbox_pendientes') * 10 < pg_relation_size('pk_sync_outbox') THEN 'menor'
            ELSE 'no menor: ' || pg_relation_size('idx_outbox_pendientes') || ' vs ' || pg_relation_size('pk_sync_outbox') || ' bytes' END));

-- ---------------------------------------------------------------- resultados
\o
SELECT prueba, descripcion, esperado, obtenido, CASE WHEN ok THEN 'PASA' ELSE 'FALLA' END AS resultado
FROM resultado ORDER BY orden;

SELECT count(*) FILTER (WHERE ok)     AS pasan,
       count(*) FILTER (WHERE NOT ok) AS fallan,
       count(*)                       AS total
FROM resultado;

SELECT 'Tamaño de índices del outbox (bytes)' AS dato,
       pg_relation_size('idx_outbox_pendientes') AS idx_outbox_pendientes_parcial,
       pg_relation_size('pk_sync_outbox')        AS pk_sync_outbox_completo;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM resultado WHERE NOT ok) THEN
        RAISE EXCEPTION 'Hay verificaciones de índices fallidas';
    END IF;
END $$;

ROLLBACK;
