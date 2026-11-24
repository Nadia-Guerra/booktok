-- =============================================================================
-- Prueba 14: la transacción de RF-13 / O7 (publicar reseña) es todo o nada.
-- Fuente: docs/modelado/relacional/02-restricciones-integridad.md, sección 9, y
--         04-operaciones.md, O7.
--
-- O7 hace: (1) insertar reseña (el trigger actualiza el promedio), (2) leer el estado
-- con bloqueo, (3) insertar/actualizar estado_obra a 'terminada', (4) insertar el evento
-- 'obra_leida', (5) confirmar. Se provoca un fallo en el paso 3 y otro en el paso 4 y se
-- comprueba que no queda reseña, ni estado, ni evento, ni promedio. Un tercer caso sin
-- fallo confirma que la misma secuencia SÍ queda guardada (control positivo).
--
-- Aquí hay COMMIT reales, así que la prueba limpia al final lo que creó.
-- Ejecutar con: psql -q -f 02-transaccion.sql   (sin ON_ERROR_STOP: los errores son el objeto de la prueba)
-- =============================================================================

\set ON_ERROR_STOP off
\pset null '(nulo)'
SET client_min_messages = warning;

\ir 00-ayudas.sql

\o /dev/null

-- Preparación confirmada: un usuario y una obra
INSERT INTO usuario (usuario_id, correo, password_hash, nombre)
VALUES (pg_temp.uid(701), 'rollback@ejemplo.test', 'hash', 'Prueba rollback');
INSERT INTO obra_resumen (obra_id, tipo) VALUES (pg_temp.uid(801), 'libro');

-- Fotografía de lo que debe quedar intacto tras un fallo
CREATE FUNCTION pg_temp.huella() RETURNS TEXT LANGUAGE sql AS $$
    SELECT 'resenas=' || (SELECT count(*) FROM resena      WHERE usuario_id = pg_temp.uid(701)) ||
           ' estados=' || (SELECT count(*) FROM estado_obra WHERE usuario_id = pg_temp.uid(701)) ||
           ' eventos=' || (SELECT count(*) FROM sync_outbox WHERE payload->>'usuario_id' = pg_temp.uid(701)::text) ||
           ' ' || pg_temp.resumen(pg_temp.uid(801))
$$;

SELECT pg_temp.registrar('14-antes', 'Punto de partida', 'resenas=0 estados=0 eventos=0 total=0 promedio=(nulo)', pg_temp.huella());

-- ---- Caso A: falla el paso 3 (estado fuera del ENUM) -----------------------
BEGIN;
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion)
VALUES (pg_temp.uid(901), pg_temp.uid(701), pg_temp.uid(801), 5);                       -- paso 1
SELECT estado FROM estado_obra WHERE usuario_id = pg_temp.uid(701) AND obra_id = pg_temp.uid(801) FOR UPDATE;   -- paso 2
INSERT INTO estado_obra (usuario_id, obra_id, estado)
VALUES (pg_temp.uid(701), pg_temp.uid(801), 'terminado_mal');                           -- paso 3: ERROR
INSERT INTO sync_outbox (tipo_evento, payload)
VALUES ('obra_leida', jsonb_build_object('usuario_id', pg_temp.uid(701), 'obra_id', pg_temp.uid(801)));   -- se ignora: la transacción ya falló
COMMIT;   -- en una transacción abortada, COMMIT equivale a ROLLBACK

SELECT pg_temp.registrar('14a', 'Fallo en el paso 3: no queda reseña, estado, evento ni promedio',
    'resenas=0 estados=0 eventos=0 total=0 promedio=(nulo)', pg_temp.huella());

-- ---- Caso B: falla el paso 4 (evento con tipo desconocido) -----------------
BEGIN;
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion)
VALUES (pg_temp.uid(902), pg_temp.uid(701), pg_temp.uid(801), 4);                       -- paso 1
INSERT INTO estado_obra (usuario_id, obra_id, estado)
VALUES (pg_temp.uid(701), pg_temp.uid(801), 'terminada');                               -- paso 3: bien
INSERT INTO sync_outbox (tipo_evento, payload)
VALUES ('obra_leida_mal', jsonb_build_object('usuario_id', pg_temp.uid(701), 'obra_id', pg_temp.uid(801)));  -- paso 4: ERROR
COMMIT;

SELECT pg_temp.registrar('14b', 'Fallo en el paso 4: tampoco queda la reseña ni el estado, que sí se habían insertado',
    'resenas=0 estados=0 eventos=0 total=0 promedio=(nulo)', pg_temp.huella());

-- ---- Caso C (control positivo): la misma secuencia sin fallo se confirma ----
BEGIN;
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion)
VALUES (pg_temp.uid(903), pg_temp.uid(701), pg_temp.uid(801), 4);
INSERT INTO estado_obra (usuario_id, obra_id, estado)
VALUES (pg_temp.uid(701), pg_temp.uid(801), 'terminada');
INSERT INTO sync_outbox (tipo_evento, payload)
VALUES ('obra_leida', jsonb_build_object('usuario_id', pg_temp.uid(701), 'obra_id', pg_temp.uid(801)));
COMMIT;

SELECT pg_temp.registrar('14c', 'Control: sin fallo, reseña, estado, evento y promedio quedan guardados',
    'resenas=1 estados=1 eventos=1 total=1 promedio=4.00', pg_temp.huella());

-- ---- Limpieza de lo confirmado ---------------------------------------------
DELETE FROM sync_outbox WHERE payload->>'usuario_id' = pg_temp.uid(701)::text;
DELETE FROM usuario WHERE usuario_id = pg_temp.uid(701);        -- la cascada borra reseña y estado
DELETE FROM obra_resumen WHERE obra_id = pg_temp.uid(801);

SELECT pg_temp.registrar('14-limpieza', 'La prueba no deja datos', 'usuarios=0 obras=0',
    'usuarios=' || (SELECT count(*) FROM usuario      WHERE usuario_id = pg_temp.uid(701)) ||
    ' obras='   || (SELECT count(*) FROM obra_resumen WHERE obra_id    = pg_temp.uid(801)));

-- ---------------------------------------------------------------- resultados
\o
SELECT prueba, descripcion, esperado, obtenido, CASE WHEN ok THEN 'PASA' ELSE 'FALLA' END AS resultado
FROM resultado ORDER BY orden;

SELECT count(*) FILTER (WHERE ok)     AS pasan,
       count(*) FILTER (WHERE NOT ok) AS fallan,
       count(*)                       AS total
FROM resultado;

\set ON_ERROR_STOP on
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM resultado WHERE NOT ok) THEN
        RAISE EXCEPTION 'Hay pruebas de transacción fallidas';
    END IF;
END $$;
