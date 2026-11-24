-- =============================================================================
-- Consultas representativas del relacional, con resultado esperado.
-- Fuente: docs/modelado/relacional/04-operaciones.md (O17, O18, O20, O22).
-- Datos de la prueba propios y revertidos (ROLLBACK). Con la semilla del escalón 5 se
-- repiten estas mismas consultas sobre los datos de demostración.
-- Ejecutar con: psql -q -v ON_ERROR_STOP=1 -f 05-consultas.sql
-- =============================================================================

\set ON_ERROR_STOP on
\pset null '(nulo)'
SET client_min_messages = warning;

BEGIN;
\ir 00-ayudas.sql
\o /dev/null

-- ----------------------------------------------------------------- fixture
INSERT INTO usuario (usuario_id, correo, password_hash, nombre, rol) VALUES
    (pg_temp.uid(1), 'lectora@ejemplo.test', 'hash', 'Lectora', 'lector'),
    (pg_temp.uid(2), 'admin@ejemplo.test',   'hash', 'Admin',   'admin'),
    (pg_temp.uid(3), 'otro@ejemplo.test',    'hash', 'Otro',    'lector');

-- Obras: 1001 a 1006 libros; 1007 película
INSERT INTO obra_resumen (obra_id, tipo) VALUES
    (pg_temp.uid(1001), 'libro'), (pg_temp.uid(1002), 'libro'), (pg_temp.uid(1003), 'libro'),
    (pg_temp.uid(1004), 'libro'), (pg_temp.uid(1005), 'libro'), (pg_temp.uid(1006), 'libro'),
    (pg_temp.uid(1007), 'pelicula');

-- Reseñas de la usuaria 1 (RF-26) y estados, cubriendo dos casos positivos y cinco negativos:
--   1001 libro terminado, 4        -> SÍ
--   1002 libro terminado, 5        -> SÍ y primero (mejor calificado)
--   1003 libro terminado, 3        -> NO (calificación menor a 4)
--   1004 libro pendiente, 5        -> NO (no está terminado)
--   1005 libro terminado, 5 oculta -> NO (reseña oculta)
--   1006 libro terminado, sin reseña -> NO (sin calificación)
--   1007 película terminada, 5     -> NO (no es libro)
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion, oculta, creado_en, actualizado_en) VALUES
    (pg_temp.uid(2001), pg_temp.uid(1), pg_temp.uid(1001), 4, false, now() - interval '5 days', now() - interval '5 days'),
    (pg_temp.uid(2002), pg_temp.uid(1), pg_temp.uid(1002), 5, false, now() - interval '4 days', now() - interval '4 days'),
    (pg_temp.uid(2003), pg_temp.uid(1), pg_temp.uid(1003), 3, false, now() - interval '3 days', now() - interval '3 days'),
    (pg_temp.uid(2004), pg_temp.uid(1), pg_temp.uid(1004), 5, false, now() - interval '2 days', now() - interval '2 days'),
    (pg_temp.uid(2005), pg_temp.uid(1), pg_temp.uid(1005), 5, true,  now() - interval '1 days', now() - interval '1 days'),
    (pg_temp.uid(2007), pg_temp.uid(1), pg_temp.uid(1007), 5, false, now() - interval '6 days', now() - interval '6 days');
INSERT INTO estado_obra (usuario_id, obra_id, estado) VALUES
    (pg_temp.uid(1), pg_temp.uid(1001), 'terminada'), (pg_temp.uid(1), pg_temp.uid(1002), 'terminada'),
    (pg_temp.uid(1), pg_temp.uid(1003), 'terminada'), (pg_temp.uid(1), pg_temp.uid(1004), 'pendiente'),
    (pg_temp.uid(1), pg_temp.uid(1005), 'terminada'), (pg_temp.uid(1), pg_temp.uid(1006), 'terminada'),
    (pg_temp.uid(1), pg_temp.uid(1007), 'terminada');

-- Otra reseña (usuario 3) en la obra 1001 para probar el listado por obra
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion, creado_en) VALUES
    (pg_temp.uid(2010), pg_temp.uid(3), pg_temp.uid(1001), 2, now() - interval '1 hour');

-- Seguimientos, lista y sesiones
INSERT INTO seguimiento (seguidor_id, seguido_id) VALUES
    (pg_temp.uid(1), pg_temp.uid(2)), (pg_temp.uid(1), pg_temp.uid(3)), (pg_temp.uid(3), pg_temp.uid(2));
INSERT INTO lista (lista_id, usuario_id, nombre) VALUES (pg_temp.uid(3001), pg_temp.uid(1), 'Para este año');
INSERT INTO elemento_lista (lista_id, obra_id, posicion) VALUES
    (pg_temp.uid(3001), pg_temp.uid(1002), 3), (pg_temp.uid(3001), pg_temp.uid(1001), 1), (pg_temp.uid(3001), pg_temp.uid(1007), 2);
INSERT INTO sesion (token_hash, usuario_id, creado_en, expira_en) VALUES
    (repeat('a', 64), pg_temp.uid(2), now() - interval '1 day',   now() + interval '29 days'),   -- vigente (admin)
    (repeat('b', 64), pg_temp.uid(1), now() - interval '40 days', now() - interval '10 days');   -- vencida

-- ---------------------------------------------------------------- consultas
-- O22: validar la sesión de una petición (texto idéntico al de 04-operaciones.md, :hash = $1)
CREATE FUNCTION pg_temp.o22(text) RETURNS TABLE (usuario_id UUID, rol rol_usuario) LANGUAGE sql AS $$
    SELECT u.usuario_id, u.rol
    FROM sesion s
    JOIN usuario u ON u.usuario_id = s.usuario_id
    WHERE s.token_hash = $1
      AND s.expira_en > now();
$$;

SELECT pg_temp.registrar('Q-O22a', 'O22: sesión vigente devuelve el usuario y su rol actual', 'admin',
    coalesce((SELECT rol::text FROM pg_temp.o22(repeat('a', 64))), '(sin sesión)'));
SELECT pg_temp.registrar('Q-O22b', 'O22: sesión vencida no devuelve nada', '(sin sesión)',
    coalesce((SELECT rol::text FROM pg_temp.o22(repeat('b', 64))), '(sin sesión)'));
SELECT pg_temp.registrar('Q-O22c', 'O22: token inexistente no devuelve nada', '(sin sesión)',
    coalesce((SELECT rol::text FROM pg_temp.o22(repeat('z', 64))), '(sin sesión)'));
-- El rol se lee en cada petición: un cambio de rol surte efecto de inmediato
UPDATE usuario SET rol = 'lector' WHERE usuario_id = pg_temp.uid(2);
SELECT pg_temp.registrar('Q-O22d', 'O22: tras cambiar el rol en usuario, la misma sesión ya trae el rol nuevo', 'lector',
    coalesce((SELECT rol::text FROM pg_temp.o22(repeat('a', 64))), '(sin sesión)'));

-- O18: libros de partida para recomendar (RF-26, paso 1; texto de 04-operaciones.md, :sesion = $1, :limite = $2)
CREATE FUNCTION pg_temp.o18(UUID, INT) RETURNS TABLE (obra_id UUID) LANGUAGE sql AS $$
    SELECT e.obra_id
    FROM estado_obra e
    JOIN resena r        ON r.usuario_id = e.usuario_id AND r.obra_id = e.obra_id
    JOIN obra_resumen o  ON o.obra_id = e.obra_id
    WHERE e.usuario_id = $1
      AND e.estado = 'terminada'
      AND o.tipo = 'libro'
      AND r.calificacion >= 4
      AND r.oculta = false
    ORDER BY r.calificacion DESC, r.actualizado_en DESC
    LIMIT $2;
$$;

SELECT pg_temp.registrar('Q-O18a', 'O18: solo libros terminados con calificación >= 4 y reseña visible, mejor calificado primero',
    'obra 1002 (5), obra 1001 (4)',
    (SELECT string_agg('obra ' || (right(x.obra_id::text, 4)::int) || ' (' ||
        (SELECT calificacion FROM resena r WHERE r.usuario_id = pg_temp.uid(1) AND r.obra_id = x.obra_id) || ')', ', ')
       FROM pg_temp.o18(pg_temp.uid(1), 20) x));
SELECT pg_temp.registrar('Q-O18b', 'O18: excluye calificación 3, estado pendiente, película, reseña oculta y libro sin reseña',
    '0 de [1003, 1004, 1005, 1006, 1007]',
    (SELECT count(*) || ' de [1003, 1004, 1005, 1006, 1007]'
       FROM pg_temp.o18(pg_temp.uid(1), 20) x
      WHERE x.obra_id IN (pg_temp.uid(1003), pg_temp.uid(1004), pg_temp.uid(1005), pg_temp.uid(1006), pg_temp.uid(1007))));
SELECT pg_temp.registrar('Q-O18c', 'O18: :limite acota la lista', '1',
    (SELECT count(*)::text FROM pg_temp.o18(pg_temp.uid(1), 1)));

-- O17: consultas de lectura
SELECT pg_temp.registrar('Q-O17a', 'O17: reseñas de la obra 1001 no ocultas, la más reciente primero', 'usuario 3 (2), usuario 1 (4)',
    (SELECT string_agg('usuario ' || right(usuario_id::text, 1) || ' (' || calificacion || ')', ', ' ORDER BY creado_en DESC)
       FROM resena WHERE obra_id = pg_temp.uid(1001) AND NOT oculta));
SELECT pg_temp.registrar('Q-O17b', 'O17: la reseña oculta no aparece en el listado de su obra', '0',
    (SELECT count(*)::text FROM resena WHERE obra_id = pg_temp.uid(1005) AND NOT oculta));
SELECT pg_temp.registrar('Q-O17c', 'O17: promedio y total de la obra 1001 (reseñas 4 y 2)', 'total=2 promedio=3.00',
    pg_temp.resumen(pg_temp.uid(1001)));
SELECT pg_temp.registrar('Q-O17d', 'O17: obra con solo una reseña oculta: total 0 y sin promedio (1005)', 'total=0 promedio=(nulo)',
    pg_temp.resumen(pg_temp.uid(1005)));
SELECT pg_temp.registrar('Q-O17e', 'O17: obras terminadas de la usuaria 1 (1001, 1002, 1003, 1005, 1006 y 1007)', '6',
    (SELECT count(*)::text FROM estado_obra WHERE usuario_id = pg_temp.uid(1) AND estado = 'terminada'));
SELECT pg_temp.registrar('Q-O17f', 'O17: a quién sigue la usuaria 1', 'usuario 2, usuario 3',
    (SELECT string_agg('usuario ' || right(seguido_id::text, 1), ', ' ORDER BY seguido_id)
       FROM seguimiento WHERE seguidor_id = pg_temp.uid(1)));
SELECT pg_temp.registrar('Q-O17g', 'O17: quién sigue al usuario 2', 'usuario 1, usuario 3',
    (SELECT string_agg('usuario ' || right(seguidor_id::text, 1), ', ' ORDER BY seguidor_id)
       FROM seguimiento WHERE seguido_id = pg_temp.uid(2)));
SELECT pg_temp.registrar('Q-O17h', 'O17: obras de una lista en su posición (no es el orden de inserción)',
    '1001, 1007, 1002',
    (SELECT string_agg(right(obra_id::text, 4)::int::text, ', ' ORDER BY posicion)
       FROM elemento_lista WHERE lista_id = pg_temp.uid(3001)));

-- O20: verificación del promedio (error de integridad, no de sincronización)
CREATE FUNCTION pg_temp.obras_con_promedio_incorrecto() RETURNS TABLE (obra_id UUID, en_resumen TEXT, recalculado TEXT)
LANGUAGE sql AS $$
    SELECT o.obra_id,
           'total=' || o.total_resenas || ' promedio=' || coalesce(o.promedio::text, '(nulo)'),
           'total=' || count(r.*)      || ' promedio=' || coalesce(round(avg(r.calificacion), 2)::text, '(nulo)')
    FROM obra_resumen o
    LEFT JOIN resena r ON r.obra_id = o.obra_id AND NOT r.oculta
    GROUP BY o.obra_id, o.total_resenas, o.promedio
    HAVING o.total_resenas <> count(r.*)
        OR o.promedio IS DISTINCT FROM round(avg(r.calificacion), 2)
$$;

SELECT pg_temp.registrar('Q-O20a', 'O20: con datos creados solo por el trigger no hay obras con promedio incorrecto', '0',
    (SELECT count(*)::text FROM pg_temp.obras_con_promedio_incorrecto()));
ALTER TABLE resena DISABLE TRIGGER trg_resena_promedio;       -- simula un desvío: el trigger no corrió
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion) VALUES (pg_temp.uid(2020), pg_temp.uid(3), pg_temp.uid(1006), 1);
ALTER TABLE resena ENABLE TRIGGER trg_resena_promedio;
SELECT pg_temp.registrar('Q-O20b', 'O20: la consulta SÍ detecta una obra cuyo promedio no coincide (1006)',
    '1006: total=0 promedio=(nulo) vs total=1 promedio=1.00',
    (SELECT right(obra_id::text, 4)::int || ': ' || en_resumen || ' vs ' || recalculado FROM pg_temp.obras_con_promedio_incorrecto()));

-- ---------------------------------------------------------------- resultados
\o
SELECT prueba, descripcion, esperado, obtenido, CASE WHEN ok THEN 'PASA' ELSE 'FALLA' END AS resultado
FROM resultado ORDER BY orden;

SELECT count(*) FILTER (WHERE ok)     AS pasan,
       count(*) FILTER (WHERE NOT ok) AS fallan,
       count(*)                       AS total
FROM resultado;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM resultado WHERE NOT ok) THEN
        RAISE EXCEPTION 'Hay consultas con resultado distinto del esperado';
    END IF;
END $$;

ROLLBACK;
