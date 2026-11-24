-- =============================================================================
-- Pruebas de integridad relacional: 1, 1b, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17
-- Fuente: docs/modelado/relacional/02-restricciones-integridad.md, sección 9.
-- (La 14 es 02-transaccion.sql y la 15, 03-concurrencia.sh: necesitan transacciones reales.)
--
-- Ejecutar con: psql -q -v ON_ERROR_STOP=1 -f 01-integridad.sql
-- Todo corre dentro de una transacción que termina en ROLLBACK: la base queda como estaba.
-- Cada prueba que debe fallar se ejecuta con pg_temp.intentar(), que captura el error en
-- una subtransacción y devuelve "SQLSTATE nombre_de_la_restricción". Así se comprueba no
-- solo que hubo rechazo, sino QUE restricción lo hizo.
-- El script termina con error (código distinto de 0) si alguna prueba falla.
-- =============================================================================

\set ON_ERROR_STOP on
\pset null '(nulo)'
SET client_min_messages = warning;

BEGIN;

-- Ayudas comunes: tabla de resultados, uid(), intentar(), registrar(), resumen(), recalculo()
\ir 00-ayudas.sql

-- Las llamadas a registrar() y las sentencias de preparación no se muestran:
-- solo la tabla final de resultados (se vuelve a activar con \o antes de ella).
\o /dev/null

-- ----------------------------------------------------------------- fixture
INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES
    (pg_temp.uid(1), 'u1@ejemplo.test', 'hash', 'Usuario 1'),
    (pg_temp.uid(2), 'u2@ejemplo.test', 'hash', 'Usuario 2'),
    (pg_temp.uid(3), 'u3@ejemplo.test', 'hash', 'Usuario 3'),
    (pg_temp.uid(4), 'u4@ejemplo.test', 'hash', 'Usuario 4');

INSERT INTO obra_resumen (obra_id, tipo) VALUES
    (pg_temp.uid(101), 'libro'), (pg_temp.uid(102), 'libro'), (pg_temp.uid(103), 'pelicula'),
    (pg_temp.uid(104), 'libro'), (pg_temp.uid(105), 'libro');

INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion) VALUES
    (pg_temp.uid(301), pg_temp.uid(1), pg_temp.uid(103), 4);        -- base para la prueba 2

INSERT INTO lista (lista_id, usuario_id, nombre) VALUES (pg_temp.uid(201), pg_temp.uid(1), 'Lista base');
INSERT INTO elemento_lista (lista_id, obra_id, posicion) VALUES (pg_temp.uid(201), pg_temp.uid(101), 1);
INSERT INTO seguimiento (seguidor_id, seguido_id) VALUES (pg_temp.uid(1), pg_temp.uid(2));

-- ----------------------------------------------------------------- pruebas
-- 1: mismo correo
SELECT pg_temp.registrar('1', 'Dos usuarios con el mismo correo', '23505 uq_usuario_correo',
    pg_temp.intentar($q$INSERT INTO usuario (usuario_id, correo, password_hash, nombre)
        VALUES (pg_temp.uid(90), 'u1@ejemplo.test', 'hash', 'Repetido')$q$));

-- 1b: correo con mayúsculas
SELECT pg_temp.registrar('1b', 'Correo con mayúsculas', '23514 ck_usuario_correo_minusculas',
    pg_temp.intentar($q$INSERT INTO usuario (usuario_id, correo, password_hash, nombre)
        VALUES (pg_temp.uid(91), 'Mayus@Ejemplo.test', 'hash', 'Mayúsculas')$q$));

-- 2: segunda reseña del mismo usuario sobre la misma obra (RN-01)
SELECT pg_temp.registrar('2', 'Segunda reseña del mismo usuario y obra', '23505 uq_resena_usuario_obra',
    pg_temp.intentar($q$INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion)
        VALUES (pg_temp.uid(302), pg_temp.uid(1), pg_temp.uid(103), 5)$q$));

-- 3: calificación 0 y 6 (RN-02)
SELECT pg_temp.registrar('3a', 'Calificación 0', '23514 ck_resena_calificacion',
    pg_temp.intentar($q$INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion)
        VALUES (pg_temp.uid(303), pg_temp.uid(2), pg_temp.uid(103), 0)$q$));
SELECT pg_temp.registrar('3b', 'Calificación 6', '23514 ck_resena_calificacion',
    pg_temp.intentar($q$INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion)
        VALUES (pg_temp.uid(304), pg_temp.uid(2), pg_temp.uid(103), 6)$q$));

-- 4: seguirse a sí mismo (RN-03)
SELECT pg_temp.registrar('4', 'Seguimiento de un usuario a sí mismo', '23514 ck_seguimiento_no_propio',
    pg_temp.intentar($q$INSERT INTO seguimiento (seguidor_id, seguido_id)
        VALUES (pg_temp.uid(3), pg_temp.uid(3))$q$));

-- 5: mismo seguimiento dos veces (RN-03)
SELECT pg_temp.registrar('5', 'Mismo seguimiento dos veces', '23505 pk_seguimiento',
    pg_temp.intentar($q$INSERT INTO seguimiento (seguidor_id, seguido_id)
        VALUES (pg_temp.uid(1), pg_temp.uid(2))$q$));

-- 6: misma obra dos veces en una lista (RN-04)
SELECT pg_temp.registrar('6', 'Misma obra dos veces en una lista', '23505 pk_elemento_lista',
    pg_temp.intentar($q$INSERT INTO elemento_lista (lista_id, obra_id, posicion)
        VALUES (pg_temp.uid(201), pg_temp.uid(101), 2)$q$));

-- 7: obra inexistente en reseña, estado y elemento de lista
SELECT pg_temp.registrar('7a', 'Reseña con obra inexistente', '23503 fk_resena_obra',
    pg_temp.intentar($q$INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion)
        VALUES (pg_temp.uid(305), pg_temp.uid(2), pg_temp.uid(999), 3)$q$));
SELECT pg_temp.registrar('7b', 'Estado con obra inexistente', '23503 fk_estado_obra',
    pg_temp.intentar($q$INSERT INTO estado_obra (usuario_id, obra_id, estado)
        VALUES (pg_temp.uid(2), pg_temp.uid(999), 'pendiente')$q$));
SELECT pg_temp.registrar('7c', 'Elemento de lista con obra inexistente', '23503 fk_elemento_obra',
    pg_temp.intentar($q$INSERT INTO elemento_lista (lista_id, obra_id, posicion)
        VALUES (pg_temp.uid(201), pg_temp.uid(999), 3)$q$));

-- 8: valores fuera de su ENUM (22P02 = texto no válido para el tipo; el ENUM no tiene nombre de restricción)
SELECT pg_temp.registrar('8a', 'Estado de lectura fuera de la lista', '22P02',
    pg_temp.intentar($q$INSERT INTO estado_obra (usuario_id, obra_id, estado)
        VALUES (pg_temp.uid(2), pg_temp.uid(101), 'leyendo')$q$));
SELECT pg_temp.registrar('8b', 'Rol fuera de la lista', '22P02',
    pg_temp.intentar($q$INSERT INTO usuario (usuario_id, correo, password_hash, nombre, rol)
        VALUES (pg_temp.uid(92), 'rol@ejemplo.test', 'hash', 'Rol malo', 'superadmin')$q$));
SELECT pg_temp.registrar('8c', 'Tipo de obra fuera de la lista', '22P02',
    pg_temp.intentar($q$INSERT INTO obra_resumen (obra_id, tipo) VALUES (pg_temp.uid(993), 'serie')$q$));

-- 9: borrar una obra con reseñas (RESTRICT)
SELECT pg_temp.registrar('9', 'Borrar una obra con reseñas', '23001 fk_resena_obra',
    pg_temp.intentar($q$DELETE FROM obra_resumen WHERE obra_id = pg_temp.uid(103)$q$));

-- 10 y 11: eliminar una cuenta con datos en todas las tablas (RF-04) y revisar el promedio
-- Usuario 5: reseñas en 101 (4) y 102 (2), estados, una lista con dos obras,
--            seguimientos en ambos sentidos y dos sesiones.
-- Otros: usuario 1 reseña 101 (5); usuario 3 reseña 101 (3) y 102 (5).
INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES
    (pg_temp.uid(5), 'u5@ejemplo.test', 'hash', 'Usuario 5');
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion) VALUES
    (pg_temp.uid(310), pg_temp.uid(5), pg_temp.uid(101), 4),
    (pg_temp.uid(311), pg_temp.uid(5), pg_temp.uid(102), 2),
    (pg_temp.uid(312), pg_temp.uid(1), pg_temp.uid(101), 5),
    (pg_temp.uid(313), pg_temp.uid(3), pg_temp.uid(101), 3),
    (pg_temp.uid(314), pg_temp.uid(3), pg_temp.uid(102), 5);
INSERT INTO estado_obra (usuario_id, obra_id, estado) VALUES
    (pg_temp.uid(5), pg_temp.uid(101), 'terminada'), (pg_temp.uid(5), pg_temp.uid(102), 'en_curso'),
    (pg_temp.uid(1), pg_temp.uid(101), 'terminada');
INSERT INTO lista (lista_id, usuario_id, nombre) VALUES (pg_temp.uid(210), pg_temp.uid(5), 'Lista del usuario 5');
INSERT INTO elemento_lista (lista_id, obra_id, posicion) VALUES
    (pg_temp.uid(210), pg_temp.uid(101), 1), (pg_temp.uid(210), pg_temp.uid(102), 2);
INSERT INTO seguimiento (seguidor_id, seguido_id) VALUES
    (pg_temp.uid(5), pg_temp.uid(1)),     -- el usuario 5 sigue a otro
    (pg_temp.uid(3), pg_temp.uid(5)),     -- otro sigue al usuario 5
    (pg_temp.uid(1), pg_temp.uid(3));     -- ajeno al usuario 5: debe sobrevivir
INSERT INTO sesion (token_hash, usuario_id, expira_en) VALUES
    (repeat('a', 64), pg_temp.uid(5), now() + interval '30 days'),
    (repeat('b', 64), pg_temp.uid(5), now() + interval '30 days'),
    (repeat('c', 64), pg_temp.uid(1), now() + interval '30 days');   -- ajena: debe sobrevivir

SELECT pg_temp.registrar('10-antes', 'Antes de borrar: promedio de la obra 101 (4, 5 y 3)',
    'total=3 promedio=4.00', pg_temp.resumen(pg_temp.uid(101)));

DELETE FROM usuario WHERE usuario_id = pg_temp.uid(5);

SELECT pg_temp.registrar('10a', 'No queda ninguna fila del usuario borrado (todas las tablas)',
    'resena=0 estado=0 lista=0 elemento=0 seguimiento=0 sesion=0',
    'resena='      || (SELECT count(*) FROM resena      WHERE usuario_id = pg_temp.uid(5)) ||
    ' estado='     || (SELECT count(*) FROM estado_obra WHERE usuario_id = pg_temp.uid(5)) ||
    ' lista='      || (SELECT count(*) FROM lista       WHERE usuario_id = pg_temp.uid(5)) ||
    ' elemento='   || (SELECT count(*) FROM elemento_lista WHERE lista_id = pg_temp.uid(210)) ||
    ' seguimiento='|| (SELECT count(*) FROM seguimiento WHERE seguidor_id = pg_temp.uid(5) OR seguido_id = pg_temp.uid(5)) ||
    ' sesion='     || (SELECT count(*) FROM sesion      WHERE usuario_id = pg_temp.uid(5)));
SELECT pg_temp.registrar('10b', 'Lo ajeno sobrevive: reseñas de otros, seguimiento 1->3, sesión del usuario 1',
    'resena=3 seguimiento=1 sesion=1',
    'resena='       || (SELECT count(*) FROM resena      WHERE resena_id IN (pg_temp.uid(312), pg_temp.uid(313), pg_temp.uid(314))) ||
    ' seguimiento=' || (SELECT count(*) FROM seguimiento WHERE seguidor_id = pg_temp.uid(1) AND seguido_id = pg_temp.uid(3)) ||
    ' sesion='      || (SELECT count(*) FROM sesion      WHERE token_hash = repeat('c', 64)));

-- 11: el trigger corrigió el promedio de las obras que reseñaba el usuario borrado
SELECT pg_temp.registrar('11a', 'Tras borrar al usuario: obra 101 = reseñas de 5 y 3',
    'total=2 promedio=4.00', pg_temp.resumen(pg_temp.uid(101)));
SELECT pg_temp.registrar('11b', 'Tras borrar al usuario: obra 102 = reseña de 5',
    'total=1 promedio=5.00', pg_temp.resumen(pg_temp.uid(102)));
SELECT pg_temp.registrar('11c', 'Resumen = recálculo manual en 101 y 102',
    'iguales', CASE WHEN pg_temp.resumen(pg_temp.uid(101)) = pg_temp.recalculo(pg_temp.uid(101))
                     AND pg_temp.resumen(pg_temp.uid(102)) = pg_temp.recalculo(pg_temp.uid(102))
                    THEN 'iguales' ELSE 'distintos' END);

-- 12: insertar, editar calificación, ocultar y eliminar; tras cada paso, igual al recálculo manual
-- Obra 104 (sin reseñas). Usuarios 1 y 2.
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion) VALUES (pg_temp.uid(320), pg_temp.uid(1), pg_temp.uid(104), 5);
SELECT pg_temp.registrar('12a', 'Insertar reseña (5)', 'total=1 promedio=5.00', pg_temp.resumen(pg_temp.uid(104)));
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion) VALUES (pg_temp.uid(321), pg_temp.uid(2), pg_temp.uid(104), 2);
SELECT pg_temp.registrar('12b', 'Insertar segunda reseña (2)', 'total=2 promedio=3.50', pg_temp.resumen(pg_temp.uid(104)));
UPDATE resena SET calificacion = 4 WHERE resena_id = pg_temp.uid(320);
SELECT pg_temp.registrar('12c', 'Editar calificación 5 -> 4', 'total=2 promedio=3.00', pg_temp.resumen(pg_temp.uid(104)));
UPDATE resena SET oculta = true WHERE resena_id = pg_temp.uid(321);
SELECT pg_temp.registrar('12d', 'Ocultar la reseña de 2', 'total=1 promedio=4.00', pg_temp.resumen(pg_temp.uid(104)));
UPDATE resena SET oculta = false WHERE resena_id = pg_temp.uid(321);
SELECT pg_temp.registrar('12e', 'Volver a mostrarla', 'total=2 promedio=3.00', pg_temp.resumen(pg_temp.uid(104)));
DELETE FROM resena WHERE resena_id = pg_temp.uid(320);
SELECT pg_temp.registrar('12f', 'Eliminar la reseña de 4', 'total=1 promedio=2.00', pg_temp.resumen(pg_temp.uid(104)));
SELECT pg_temp.registrar('12g', 'Resumen = recálculo manual al final', 'iguales',
    CASE WHEN pg_temp.resumen(pg_temp.uid(104)) = pg_temp.recalculo(pg_temp.uid(104)) THEN 'iguales' ELSE 'distintos' END);
-- Redondeo: 5, 4 y 4 dan 4.333... -> 4.33
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion) VALUES
    (pg_temp.uid(322), pg_temp.uid(1), pg_temp.uid(104), 5), (pg_temp.uid(323), pg_temp.uid(3), pg_temp.uid(104), 4);
DELETE FROM resena WHERE resena_id = pg_temp.uid(321);
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion) VALUES (pg_temp.uid(324), pg_temp.uid(4), pg_temp.uid(104), 4);
SELECT pg_temp.registrar('12h', 'Redondeo a dos decimales: 5, 4 y 4', 'total=3 promedio=4.33', pg_temp.resumen(pg_temp.uid(104)));

-- 13: ocultar la única reseña de una obra
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion) VALUES (pg_temp.uid(330), pg_temp.uid(1), pg_temp.uid(105), 3);
SELECT pg_temp.registrar('13-antes', 'Una sola reseña vigente', 'total=1 promedio=3.00', pg_temp.resumen(pg_temp.uid(105)));
UPDATE resena SET oculta = true WHERE resena_id = pg_temp.uid(330);
SELECT pg_temp.registrar('13', 'Ocultar la única reseña de la obra', 'total=0 promedio=(nulo)', pg_temp.resumen(pg_temp.uid(105)));

-- 16: borrar un usuario con varias sesiones abiertas (D-35)
INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES (pg_temp.uid(6), 'u6@ejemplo.test', 'hash', 'Usuario 6');
INSERT INTO sesion (token_hash, usuario_id, expira_en) VALUES
    (repeat('d', 64), pg_temp.uid(6), now() + interval '30 days'),
    (repeat('e', 64), pg_temp.uid(6), now() + interval '30 days'),
    (repeat('f', 64), pg_temp.uid(6), now() + interval '30 days');
SELECT pg_temp.registrar('16-antes', 'Tres sesiones abiertas', '3',
    (SELECT count(*) FROM sesion WHERE usuario_id = pg_temp.uid(6))::text);
DELETE FROM usuario WHERE usuario_id = pg_temp.uid(6);
SELECT pg_temp.registrar('16', 'Tras borrar al usuario no queda ninguna sesión suya', '0',
    (SELECT count(*) FROM sesion WHERE usuario_id = pg_temp.uid(6))::text);

-- 17: sesión que nace vencida (D-35)
SELECT pg_temp.registrar('17a', 'Sesión con expira_en igual a creado_en', '23514 ck_sesion_vigencia',
    pg_temp.intentar($q$INSERT INTO sesion (token_hash, usuario_id, creado_en, expira_en)
        VALUES (repeat('1', 64), pg_temp.uid(1), '2026-01-01 10:00+00', '2026-01-01 10:00+00')$q$));
SELECT pg_temp.registrar('17b', 'Sesión con expira_en anterior a creado_en', '23514 ck_sesion_vigencia',
    pg_temp.intentar($q$INSERT INTO sesion (token_hash, usuario_id, creado_en, expira_en)
        VALUES (repeat('2', 64), pg_temp.uid(1), '2026-01-01 10:00+00', '2025-12-31 10:00+00')$q$));

-- Extras: reglas del diseño que las 17 pruebas no cubren de forma directa
SELECT pg_temp.registrar('E1', 'obra_resumen: promedio sin reseñas (ck_obra_coherencia)', '23514 ck_obra_coherencia',
    pg_temp.intentar($q$UPDATE obra_resumen SET promedio = 3.00 WHERE obra_id = pg_temp.uid(105)$q$));
SELECT pg_temp.registrar('E2', 'obra_resumen: promedio fuera de 1 a 5', '23514 ck_obra_promedio_rango',
    pg_temp.intentar($q$UPDATE obra_resumen SET promedio = 5.50, total_resenas = 1 WHERE obra_id = pg_temp.uid(105)$q$));
-- Con promedio 3.00 la regla de coherencia se cumple, así que solo falla el CHECK de total negativo.
SELECT pg_temp.registrar('E3', 'obra_resumen: total_resenas negativo', '23514 ck_obra_total_no_negativo',
    pg_temp.intentar($q$UPDATE obra_resumen SET total_resenas = -1, promedio = 3.00 WHERE obra_id = pg_temp.uid(105)$q$));
SELECT pg_temp.registrar('E4', 'elemento_lista: posición 0', '23514 ck_elemento_posicion',
    pg_temp.intentar($q$INSERT INTO elemento_lista (lista_id, obra_id, posicion)
        VALUES (pg_temp.uid(201), pg_temp.uid(102), 0)$q$));
SELECT pg_temp.registrar('E5', 'sync_outbox: tipo de evento desconocido', '23514 ck_outbox_tipo_evento',
    pg_temp.intentar($q$INSERT INTO sync_outbox (tipo_evento, payload) VALUES ('evento_inventado', '{}')$q$));
-- Obra 107: solo tiene un estado de lectura (sin reseñas), para aislar fk_estado_obra.
INSERT INTO obra_resumen (obra_id, tipo) VALUES (pg_temp.uid(107), 'libro');
INSERT INTO estado_obra (usuario_id, obra_id, estado) VALUES (pg_temp.uid(2), pg_temp.uid(107), 'pendiente');
SELECT pg_temp.registrar('E6', 'Borrar una obra que tiene estados de lectura (RESTRICT)', '23001 fk_estado_obra',
    pg_temp.intentar($q$DELETE FROM obra_resumen WHERE obra_id = pg_temp.uid(107)$q$));
-- Y una con solo un elemento de lista (sin reseñas ni estados)
INSERT INTO obra_resumen (obra_id, tipo) VALUES (pg_temp.uid(108), 'pelicula');
INSERT INTO elemento_lista (lista_id, obra_id, posicion) VALUES (pg_temp.uid(201), pg_temp.uid(108), 5);
SELECT pg_temp.registrar('E6b', 'Borrar una obra que está en una lista (RESTRICT)', '23001 fk_elemento_obra',
    pg_temp.intentar($q$DELETE FROM obra_resumen WHERE obra_id = pg_temp.uid(108)$q$));

-- E7: valores por defecto (rol, oculta, total_resenas, estado e intentos del evento)
INSERT INTO obra_resumen (obra_id, tipo) VALUES (pg_temp.uid(106), 'libro');
INSERT INTO sync_outbox (tipo_evento, payload) VALUES ('usuario_creado', '{"usuario_id": "x"}');
SELECT pg_temp.registrar('E7', 'Valores por defecto: rol, oculta, total_resenas, estado e intentos', 'lector falsa 0 pendiente 0',
    (SELECT rol::text FROM usuario WHERE usuario_id = pg_temp.uid(1)) || ' ' ||
    (SELECT CASE WHEN oculta THEN 'verdadera' ELSE 'falsa' END FROM resena WHERE resena_id = pg_temp.uid(301)) || ' ' ||
    (SELECT total_resenas::text FROM obra_resumen WHERE obra_id = pg_temp.uid(106)) || ' ' ||
    (SELECT estado::text || ' ' || intentos FROM sync_outbox ORDER BY evento_id DESC LIMIT 1));

-- ---------------------------------------------------------------- resultados
\o
SELECT prueba, descripcion, esperado, obtenido, CASE WHEN ok THEN 'PASA' ELSE 'FALLA' END AS resultado
FROM resultado ORDER BY orden;

SELECT count(*) FILTER (WHERE ok)     AS pasan,
       count(*) FILTER (WHERE NOT ok) AS fallan,
       count(*)                       AS total
FROM resultado;

-- Termina con error si algo falla, para que el script que llama lo vea.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM resultado WHERE NOT ok) THEN
        RAISE EXCEPTION 'Hay pruebas de integridad fallidas';
    END IF;
END $$;

ROLLBACK;
