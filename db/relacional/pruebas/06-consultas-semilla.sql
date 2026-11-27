-- =============================================================================
-- Consultas representativas del relacional sobre la SEMILLA, con resultado esperado.
-- Fuente de las consultas: docs/modelado/relacional/04-operaciones.md (O17, O18, O20, O22).
-- A diferencia de 05-consultas.sql (que crea sus propios datos y los revierte), esta prueba lee los datos de
-- demostración de 04-semilla.sql y los deja intactos: lo que escribe (una sesión, una reseña con el trigger
-- apagado, un cambio de rol) vive dentro de una transacción que termina en ROLLBACK.
-- Requiere la semilla cargada (db/scripts/cargar-semilla.ps1). Los datos: db/semilla/semilla.json.
-- Ejecutar con: sh /db/relacional/pruebas/psql.sh 06-consultas-semilla.sql
--
-- Ids de la semilla: usuarios c1000000-...-0000000000NN (01 admin, 02 Ana, 03 Luis, 04 Marta, 05 Pedro, 06 Sofía,
-- 07 Diego, 08 Elena), libros b1..., películas f1... (ver el encabezado de grafo/pruebas/semilla/01-consultas.cypher).
-- =============================================================================

\set ON_ERROR_STOP on
\pset null '(nulo)'
SET client_min_messages = warning;

BEGIN;
\ir 00-ayudas.sql
\o /dev/null

-- UUID de la semilla: id('b1', 4) = b1000000-0000-4000-8000-000000000004 (libro 4)
CREATE FUNCTION pg_temp.id(prefijo TEXT, n INT) RETURNS UUID LANGUAGE sql IMMUTABLE AS
$$ SELECT (prefijo || '000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;
-- Etiqueta corta de un id: b04 = libro 4, f05 = película 5, c02 = usuario 2
CREATE FUNCTION pg_temp.corto(UUID) RETURNS TEXT LANGUAGE sql IMMUTABLE AS
$$ SELECT left($1::text, 1) || right($1::text, 2) $$;

-- ---------------------------------------------------------------- la semilla está cargada
SELECT pg_temp.registrar('S-00a', 'Hay 8 usuarios, con un solo administrador (el primero se crea en la semilla)', '8 usuarios, 1 admin',
    (SELECT count(*) || ' usuarios, ' || count(*) FILTER (WHERE rol = 'admin') || ' admin' FROM usuario));
SELECT pg_temp.registrar('S-00b', 'Las 35 obras (17 libros y 18 películas) tienen su referencia en obra_resumen', '17 libros, 18 películas',
    (SELECT count(*) FILTER (WHERE tipo = 'libro') || ' libros, ' || count(*) FILTER (WHERE tipo = 'pelicula') || ' películas' FROM obra_resumen));
SELECT pg_temp.registrar('S-00c', 'Las contraseñas son hashes bcrypt de 60 caracteres, no texto', '8',
    (SELECT count(*)::text FROM usuario WHERE length(password_hash) = 60 AND password_hash LIKE '$2a$10$%'));
SELECT pg_temp.registrar('S-00d', 'RF-13: toda reseña tiene el estado "terminada" del mismo usuario y obra', '0 reseñas sin estado',
    (SELECT count(*) || ' reseñas sin estado' FROM resena r
       LEFT JOIN estado_obra e ON e.usuario_id = r.usuario_id AND e.obra_id = r.obra_id
      WHERE e.estado IS DISTINCT FROM 'terminada'));

-- ------------------------------------------------------------------------------- O17
-- Reseñas de una obra, la más reciente primero (la oculta no aparece)
SELECT pg_temp.registrar('S-O17a', 'O17: reseñas visibles de Dune (libro 1), la más reciente primero', 'c05 (4), c04 (4), c02 (5)',
    (SELECT string_agg(pg_temp.corto(usuario_id) || ' (' || calificacion || ')', ', ' ORDER BY creado_en DESC)
       FROM resena WHERE obra_id = pg_temp.id('b1', 1) AND NOT oculta));
SELECT pg_temp.registrar('S-O17b', 'O17: Expiación (libro 9) tiene 2 reseñas pero una está oculta: solo se lista la de Elena', 'c08 (2) de 2',
    (SELECT string_agg(pg_temp.corto(usuario_id) || ' (' || calificacion || ')', ', ') || ' de ' || (SELECT count(*) FROM resena WHERE obra_id = pg_temp.id('b1', 9))
       FROM resena WHERE obra_id = pg_temp.id('b1', 9) AND NOT oculta));
SELECT pg_temp.registrar('S-O17c', 'O17: promedio y total de Dune (5, 4 y 4)', 'total=3 promedio=4.33',
    pg_temp.resumen(pg_temp.id('b1', 1)));
SELECT pg_temp.registrar('S-O17d', 'O17: la reseña oculta (5) no cuenta: Expiación queda con total=1 promedio=2.00, no 3.50', 'total=1 promedio=2.00',
    pg_temp.resumen(pg_temp.id('b1', 9)));
SELECT pg_temp.registrar('S-O17e', 'O17: una obra sin reseñas tiene total 0 y sin promedio (Androides)', 'total=0 promedio=(nulo)',
    pg_temp.resumen(pg_temp.id('b1', 2)));
SELECT pg_temp.registrar('S-O17f', 'O17: la ficha en borrador (Neuromante) no tiene reseñas ni estados ni está en listas', '0 reseñas, 0 estados, 0 listas',
    (SELECT (SELECT count(*) FROM resena WHERE obra_id IN (pg_temp.id('b1', 11), pg_temp.id('f1', 12))) || ' reseñas, ' ||
            (SELECT count(*) FROM estado_obra WHERE obra_id IN (pg_temp.id('b1', 11), pg_temp.id('f1', 12))) || ' estados, ' ||
            (SELECT count(*) FROM elemento_lista WHERE obra_id IN (pg_temp.id('b1', 11), pg_temp.id('f1', 12))) || ' listas'));
SELECT pg_temp.registrar('S-O17g', 'O17: obras terminadas de Ana (4 libros y 2 películas) y sus estados en total', '6 terminadas de 8',
    (SELECT count(*) FILTER (WHERE estado = 'terminada') || ' terminadas de ' || count(*) FROM estado_obra WHERE usuario_id = pg_temp.id('c1', 2)));
SELECT pg_temp.registrar('S-O17h', 'O17: a quién sigue Sofía', 'c02, c05, c07',
    (SELECT string_agg(pg_temp.corto(seguido_id), ', ' ORDER BY seguido_id) FROM seguimiento WHERE seguidor_id = pg_temp.id('c1', 6)));
SELECT pg_temp.registrar('S-O17i', 'O17: quién sigue a Marta', 'c07, c08',
    (SELECT string_agg(pg_temp.corto(seguidor_id), ', ' ORDER BY seguidor_id) FROM seguimiento WHERE seguido_id = pg_temp.id('c1', 4)));
SELECT pg_temp.registrar('S-O17j', 'O17: la lista de Ana en su posición (no es el orden de las obras)', 'b04, f05, b02',
    (SELECT string_agg(pg_temp.corto(e.obra_id), ', ' ORDER BY e.posicion)
       FROM elemento_lista e JOIN lista l ON l.lista_id = e.lista_id WHERE l.usuario_id = pg_temp.id('c1', 2)));

-- ------------------------------------------------------------------------------- O18
-- Libros de partida para recomendar (RF-26, paso 1; texto de 04-operaciones.md, :sesion = $1, :limite = $2)
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
CREATE FUNCTION pg_temp.partida(UUID) RETURNS TEXT LANGUAGE sql AS $$
    SELECT coalesce(string_agg(pg_temp.corto(obra_id), ', '), '(vacío)') FROM pg_temp.o18($1, 20)
$$;

SELECT pg_temp.registrar('S-O18a', 'O18 Ana: Dune (5) y El marciano (4), el mejor calificado primero', 'b01, b03',
    pg_temp.partida(pg_temp.id('c1', 2)));
SELECT pg_temp.registrar('S-O18b', 'O18 Ana: quedan fuera El Hobbit (calificó 3), Orgullo y prejuicio (pendiente), Expiación (reseña oculta), Orient Express (en curso) y la película Orgullo y prejuicio', '0 de 5',
    (SELECT count(*) || ' de 5' FROM pg_temp.o18(pg_temp.id('c1', 2), 20) x
      WHERE x.obra_id IN (pg_temp.id('b1', 6), pg_temp.id('b1', 8), pg_temp.id('b1', 9), pg_temp.id('b1', 10), pg_temp.id('f1', 9))));
SELECT pg_temp.registrar('S-O18c', 'O18 Pedro: Historia de tu vida (5) antes que Dune (4)', 'b04, b01',
    pg_temp.partida(pg_temp.id('c1', 5)));
SELECT pg_temp.registrar('S-O18d', 'O18 Marta: igual calificación (4): primero la reseña más reciente (Orgullo y prejuicio)', 'b08, b01',
    pg_temp.partida(pg_temp.id('c1', 4)));
SELECT pg_temp.registrar('S-O18e', 'O18 Luis: solo el libro (Parque Jurásico); la película terminada no cuenta', 'b05',
    pg_temp.partida(pg_temp.id('c1', 3)));
SELECT pg_temp.registrar('S-O18f', 'O18 Elena: calificó 2 su libro terminado, no es partida', '(vacío)',
    pg_temp.partida(pg_temp.id('c1', 8)));
SELECT pg_temp.registrar('S-O18g', 'O18 Sofía: no terminó ningún libro', '(vacío)',
    pg_temp.partida(pg_temp.id('c1', 6)));
SELECT pg_temp.registrar('S-O18h', 'O18: :limite acota la lista', '1',
    (SELECT count(*)::text FROM pg_temp.o18(pg_temp.id('c1', 2), 1)));

-- ------------------------------------------------------------------------------- O20
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

SELECT pg_temp.registrar('S-O20a', 'O20: con los datos cargados por el trigger (RN-08) no hay obras con promedio incorrecto', '0',
    (SELECT count(*)::text FROM pg_temp.obras_con_promedio_incorrecto()));
SELECT pg_temp.registrar('S-O20b', 'O20: el promedio guardado coincide con el recalculado para cada obra con reseñas visibles (20 obras)', '20',
    (SELECT count(*)::text FROM obra_resumen o
      WHERE o.total_resenas > 0
        AND pg_temp.resumen(o.obra_id) = pg_temp.recalculo(o.obra_id)));
ALTER TABLE resena DISABLE TRIGGER trg_resena_promedio;       -- simula un desvío: el trigger no corrió
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion, creado_en)
    VALUES (pg_temp.id('d1', 99), pg_temp.id('c1', 7), pg_temp.id('b1', 10), 3, now());
ALTER TABLE resena ENABLE TRIGGER trg_resena_promedio;
SELECT pg_temp.registrar('S-O20c', 'O20: la consulta SÍ detecta una obra cuyo promedio no coincide (Orient Express, libro 10)',
    'b10: total=0 promedio=(nulo) vs total=1 promedio=3.00',
    (SELECT pg_temp.corto(obra_id) || ': ' || en_resumen || ' vs ' || recalculado FROM pg_temp.obras_con_promedio_incorrecto()));

-- ------------------------------------------------------------------------------- O22
-- Validar la sesión de una petición (texto idéntico al de 04-operaciones.md, :hash = $1)
CREATE FUNCTION pg_temp.o22(text) RETURNS TABLE (usuario_id UUID, rol rol_usuario) LANGUAGE sql AS $$
    SELECT u.usuario_id, u.rol
    FROM sesion s
    JOIN usuario u ON u.usuario_id = s.usuario_id
    WHERE s.token_hash = $1
      AND s.expira_en > now();
$$;
INSERT INTO sesion (token_hash, usuario_id, creado_en, expira_en) VALUES
    (repeat('a', 64), pg_temp.id('c1', 1), now() - interval '1 day',   now() + interval '29 days'),   -- vigente: la del administrador
    (repeat('b', 64), pg_temp.id('c1', 2), now() - interval '40 days', now() - interval '10 days');   -- vencida: la de Ana

SELECT pg_temp.registrar('S-O22a', 'O22: la sesión vigente del administrador devuelve su usuario y rol', 'c01 admin',
    coalesce((SELECT pg_temp.corto(usuario_id) || ' ' || rol::text FROM pg_temp.o22(repeat('a', 64))), '(sin sesión)'));
SELECT pg_temp.registrar('S-O22b', 'O22: la sesión vencida de Ana no devuelve nada', '(sin sesión)',
    coalesce((SELECT pg_temp.corto(usuario_id) || ' ' || rol::text FROM pg_temp.o22(repeat('b', 64))), '(sin sesión)'));
SELECT pg_temp.registrar('S-O22c', 'O22: un token inexistente no devuelve nada', '(sin sesión)',
    coalesce((SELECT rol::text FROM pg_temp.o22(repeat('z', 64))), '(sin sesión)'));
UPDATE usuario SET rol = 'lector' WHERE usuario_id = pg_temp.id('c1', 1);
SELECT pg_temp.registrar('S-O22d', 'O22: tras quitarle el rol al administrador en usuario, su misma sesión ya trae "lector"', 'c01 lector',
    coalesce((SELECT pg_temp.corto(usuario_id) || ' ' || rol::text FROM pg_temp.o22(repeat('a', 64))), '(sin sesión)'));

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
