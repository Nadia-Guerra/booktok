-- =============================================================================
-- Entregable 5, catalogo relacional: casos normales (n), limite (l) y de error (e) de las 22 operaciones
-- vigentes de docs/modelado/relacional/04-operaciones.md (O1 a O5, O7 a O23; O6 esta retirada).
--
-- Cada operacion es una funcion temporal (pg_temp) que ejecuta los pasos del documento, en el mismo orden y con la
-- misma transaccion. NO es la API: es el SQL que la API ejecutara. Los permisos (RN-09, RN-10) y la comparacion de la
-- contrasena los comprueba la API; aqui se ve la condicion SQL (por ejemplo, usuario_id = :sesion).
--
-- Todo corre dentro de UNA transaccion que termina en ROLLBACK, sobre la semilla ya cargada: la semilla queda intacta.
-- Las lecturas (O17, O18, O20, O22) usan los datos de la semilla; las escrituras usan usuarios y obras de prueba que
-- el propio script crea (ids 00000000-0000-4000-8000-0000000009NN), salvo O4-n1, que borra a Ana de la semilla y va al final.
-- El esperado de cada caso esta escrito aqui; el obtenido lo produce el motor. Una columna "resultado" los compara.
--
-- Ejecutar con: sh /db/relacional/pruebas/psql.sh 07-catalogo.sql
-- Nota: la identidad de sync_outbox (evento_id) no se revierte con el ROLLBACK: el siguiente evento real tendra un
-- numero mayor. Es el comportamiento normal de una secuencia de PostgreSQL y no afecta a ningun dato.
-- =============================================================================

\set ON_ERROR_STOP on
\pset null '(nulo)'
SET client_min_messages = warning;

BEGIN;
\ir 00-ayudas.sql
\o /dev/null

-- ------------------------------------------------------------------ ayudas propias
-- UUID de la semilla: id('b1', 4) = b1000000-0000-4000-8000-000000000004 (libro 4)
CREATE FUNCTION pg_temp.id(prefijo TEXT, n INT) RETURNS UUID LANGUAGE sql IMMUTABLE AS
$$ SELECT (prefijo || '000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;
-- Etiqueta corta de un id: b04 = libro 4, f05 = pelicula 5, c02 = usuario 2
CREATE FUNCTION pg_temp.corto(UUID) RETURNS TEXT LANGUAGE sql IMMUTABLE AS
$$ SELECT left($1::text, 1) || right($1::text, 2) $$;
-- Eventos pendientes, en orden de aplicacion
CREATE FUNCTION pg_temp.eventos() RETURNS TEXT LANGUAGE sql AS
$$ SELECT coalesce(string_agg(tipo_evento, ', ' ORDER BY evento_id), '(ninguno)') FROM sync_outbox WHERE estado = 'pendiente' $$;
-- Resultado de un intento sobre lo que devuelve una consulta (para casos que no deben fallar)
CREATE FUNCTION pg_temp.vaciar_outbox() RETURNS VOID LANGUAGE sql AS $$ DELETE FROM sync_outbox $$;
-- Lee un valor con una consulta NUEVA: una subconsulta escrita en linea junto a la operacion usaria la instantanea
-- de la sentencia que la contiene y no veria lo que la operacion acaba de escribir; EXECUTE toma una instantanea nueva.
-- Obras cuyo promedio o total guardado no coincide con el recalculo desde las resenas no ocultas (O20, RNF-03)
CREATE FUNCTION pg_temp.discrepantes() RETURNS TABLE (obra_id UUID) LANGUAGE sql AS $$
    SELECT o.obra_id
    FROM obra_resumen o
    LEFT JOIN (SELECT r.obra_id, count(*)::int AS total, round(avg(r.calificacion), 2) AS prom
               FROM resena r WHERE NOT r.oculta GROUP BY r.obra_id) s ON s.obra_id = o.obra_id
    WHERE o.total_resenas IS DISTINCT FROM coalesce(s.total, 0) OR o.promedio IS DISTINCT FROM s.prom
$$;
CREATE FUNCTION pg_temp.val(p_sql TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE r TEXT;
BEGIN EXECUTE p_sql INTO r; RETURN coalesce(r, '(nulo)'); END $$;

-- ------------------------------------------------------------------ las operaciones (04-operaciones.md)
-- O1. Registrar usuario: usuario + evento usuario_creado (una transaccion).
CREATE FUNCTION pg_temp.o1(p_id UUID, p_correo TEXT, p_nombre TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES (p_id, p_correo, repeat('x', 60), p_nombre);
    INSERT INTO sync_outbox (tipo_evento, payload) VALUES ('usuario_creado', jsonb_build_object('usuario_id', p_id));
END $$;

-- O2. Iniciar sesion: leer el usuario por correo normalizado e insertar la sesion (hash SHA-256 del token).
CREATE FUNCTION pg_temp.o2(p_correo TEXT, p_hash TEXT, p_vigencia INTERVAL) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_usuario UUID;
BEGIN
    SELECT usuario_id INTO v_usuario FROM usuario WHERE correo = lower(p_correo);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'credenciales invalidas' USING ERRCODE = '28000';    -- la misma respuesta que con contrasena mala
    END IF;
    INSERT INTO sesion (token_hash, usuario_id, creado_en, expira_en) VALUES (p_hash, v_usuario, now(), now() + p_vigencia);
    RETURN v_usuario;
END $$;

-- O3. Editar perfil: solo nombre y biografia, solo del usuario de la sesion. Devuelve las filas cambiadas.
CREATE FUNCTION pg_temp.o3(p_sesion UUID, p_nombre TEXT, p_biografia TEXT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    UPDATE usuario SET nombre = p_nombre, biografia = p_biografia WHERE usuario_id = p_sesion;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;

-- O4. Eliminar cuenta: evento usuario_eliminado y borrado con cascada, en una transaccion.
CREATE FUNCTION pg_temp.o4(p_sesion UUID) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO sync_outbox (tipo_evento, payload) VALUES ('usuario_eliminado', jsonb_build_object('usuario_id', p_sesion));
    DELETE FROM usuario WHERE usuario_id = p_sesion;
    IF NOT FOUND THEN RAISE EXCEPTION 'el usuario no existe'; END IF;      -- revierte tambien el evento
END $$;

-- O5. Registrar obra: idempotente (si ya existe no hace nada ni falla). Devuelve las filas insertadas.
CREATE FUNCTION pg_temp.o5(p_obra UUID, p_tipo TEXT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    INSERT INTO obra_resumen (obra_id, tipo) VALUES (p_obra, p_tipo::tipo_obra) ON CONFLICT (obra_id) DO NOTHING;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;

-- O7. Publicar resena: resena (el trigger recalcula el promedio) + estado terminada + evento obra_leida si el estado
-- anterior no era terminada. Devuelve el estado anterior.
CREATE FUNCTION pg_temp.o7(p_sesion UUID, p_obra UUID, p_calificacion INT, p_texto TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_antes estado_lectura;
BEGIN
    INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion, texto)
    VALUES (gen_random_uuid(), p_sesion, p_obra, p_calificacion, p_texto);
    SELECT estado INTO v_antes FROM estado_obra WHERE usuario_id = p_sesion AND obra_id = p_obra FOR UPDATE;
    INSERT INTO estado_obra (usuario_id, obra_id, estado) VALUES (p_sesion, p_obra, 'terminada')
    ON CONFLICT (usuario_id, obra_id) DO UPDATE SET estado = 'terminada', actualizado_en = now();
    IF v_antes IS DISTINCT FROM 'terminada' THEN
        INSERT INTO sync_outbox (tipo_evento, payload)
        VALUES ('obra_leida', jsonb_build_object('usuario_id', p_sesion, 'obra_id', p_obra));
    END IF;
    RETURN coalesce(v_antes::text, 'sin estado');
END $$;

-- O8. Editar resena propia. actualizado_en usa clock_timestamp() para que se vea distinto de creado_en dentro de una
-- misma transaccion (now() no cambia mientras dura la transaccion).
CREATE FUNCTION pg_temp.o8(p_sesion UUID, p_resena UUID, p_calificacion INT, p_texto TEXT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    UPDATE resena SET calificacion = p_calificacion, texto = p_texto, actualizado_en = clock_timestamp()
    WHERE resena_id = p_resena AND usuario_id = p_sesion;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;

-- O9. Eliminar resena propia (el estado de la obra no cambia).
CREATE FUNCTION pg_temp.o9(p_sesion UUID, p_resena UUID) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    DELETE FROM resena WHERE resena_id = p_resena AND usuario_id = p_sesion;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;

-- O10. Moderar resena (la comprobacion del rol admin es de la API): 'ocultar', 'mostrar' o 'eliminar'.
CREATE FUNCTION pg_temp.o10(p_resena UUID, p_accion TEXT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    IF p_accion = 'eliminar' THEN
        DELETE FROM resena WHERE resena_id = p_resena;
    ELSE
        UPDATE resena SET oculta = (p_accion = 'ocultar') WHERE resena_id = p_resena;
    END IF;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;

-- O11. Marcar estado de una obra: leer el anterior con bloqueo, insertar o actualizar, y escribir el evento que corresponda.
CREATE FUNCTION pg_temp.o11(p_sesion UUID, p_obra UUID, p_estado estado_lectura) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE v_antes estado_lectura;
BEGIN
    SELECT estado INTO v_antes FROM estado_obra WHERE usuario_id = p_sesion AND obra_id = p_obra FOR UPDATE;
    INSERT INTO estado_obra (usuario_id, obra_id, estado) VALUES (p_sesion, p_obra, p_estado)
    ON CONFLICT (usuario_id, obra_id) DO UPDATE SET estado = EXCLUDED.estado, actualizado_en = now();
    IF p_estado = 'terminada' AND v_antes IS DISTINCT FROM 'terminada' THEN
        INSERT INTO sync_outbox (tipo_evento, payload)
        VALUES ('obra_leida', jsonb_build_object('usuario_id', p_sesion, 'obra_id', p_obra));
    ELSIF v_antes = 'terminada' AND p_estado <> 'terminada' THEN
        INSERT INTO sync_outbox (tipo_evento, payload)
        VALUES ('obra_no_leida', jsonb_build_object('usuario_id', p_sesion, 'obra_id', p_obra));
    END IF;
END $$;

-- O12. Listas: crear, renombrar y eliminar (solo las propias).
CREATE FUNCTION pg_temp.o12_crear(p_sesion UUID, p_lista UUID, p_nombre TEXT) RETURNS VOID LANGUAGE sql AS
$$ INSERT INTO lista (lista_id, usuario_id, nombre) VALUES (p_lista, p_sesion, p_nombre) $$;
CREATE FUNCTION pg_temp.o12_renombrar(p_sesion UUID, p_lista UUID, p_nombre TEXT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    UPDATE lista SET nombre = p_nombre WHERE lista_id = p_lista AND usuario_id = p_sesion;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;
CREATE FUNCTION pg_temp.o12_eliminar(p_sesion UUID, p_lista UUID) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    DELETE FROM lista WHERE lista_id = p_lista AND usuario_id = p_sesion;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;

-- O13. Agregar (posicion = ultima + 1, solo a una lista propia) y quitar (sin renumerar). Devuelven las filas afectadas.
CREATE FUNCTION pg_temp.o13_agregar(p_sesion UUID, p_lista UUID, p_obra UUID) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    INSERT INTO elemento_lista (lista_id, obra_id, posicion)
    SELECT l.lista_id, p_obra, coalesce((SELECT max(posicion) FROM elemento_lista WHERE lista_id = l.lista_id), 0) + 1
    FROM lista l WHERE l.lista_id = p_lista AND l.usuario_id = p_sesion;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;
CREATE FUNCTION pg_temp.o13_quitar(p_sesion UUID, p_lista UUID, p_obra UUID) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    DELETE FROM elemento_lista e USING lista l
    WHERE e.lista_id = l.lista_id AND l.usuario_id = p_sesion AND e.lista_id = p_lista AND e.obra_id = p_obra;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;

-- O14. Reordenar: reasigna posicion 1..n en el orden recibido, en una transaccion. Exige que el orden recibido sea
-- exactamente el conjunto de elementos de la lista (si no, revierte).
CREATE FUNCTION pg_temp.o14(p_sesion UUID, p_lista UUID, p_orden UUID[]) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM lista WHERE lista_id = p_lista AND usuario_id = p_sesion) THEN
        RAISE EXCEPTION 'la lista no es del usuario';
    END IF;
    UPDATE elemento_lista e SET posicion = t.pos
    FROM unnest(p_orden) WITH ORDINALITY AS t(obra_id, pos)
    WHERE e.lista_id = p_lista AND e.obra_id = t.obra_id;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n <> coalesce(array_length(p_orden, 1), 0) OR v_n <> (SELECT count(*) FROM elemento_lista WHERE lista_id = p_lista) THEN
        RAISE EXCEPTION 'el orden recibido no coincide con los elementos de la lista';
    END IF;
    RETURN v_n;
END $$;

-- O15 y O16. Seguir y dejar de seguir, cada una con su evento en la misma transaccion.
CREATE FUNCTION pg_temp.o15(p_sesion UUID, p_seguido UUID) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO seguimiento (seguidor_id, seguido_id) VALUES (p_sesion, p_seguido);
    INSERT INTO sync_outbox (tipo_evento, payload)
    VALUES ('seguimiento_creado', jsonb_build_object('seguidor_id', p_sesion, 'seguido_id', p_seguido));
END $$;
CREATE FUNCTION pg_temp.o16(p_sesion UUID, p_seguido UUID) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    DELETE FROM seguimiento WHERE seguidor_id = p_sesion AND seguido_id = p_seguido;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n > 0 THEN
        INSERT INTO sync_outbox (tipo_evento, payload)
        VALUES ('seguimiento_eliminado', jsonb_build_object('seguidor_id', p_sesion, 'seguido_id', p_seguido));
    END IF;
    RETURN v_n;
END $$;

-- O18. Libros de partida para recomendar (texto de 04-operaciones.md; :sesion = $1, :limite = $2)
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
CREATE FUNCTION pg_temp.o18_texto(UUID, INT) RETURNS TEXT LANGUAGE sql AS $$
    SELECT coalesce(string_agg(pg_temp.corto(obra_id), ', '), '(vacio)') FROM (SELECT obra_id FROM pg_temp.o18($1, $2)) q
$$;

-- O19 (SIMULADO: no existe el worker; solo se ejecuta la parte de PostgreSQL). Tomar un lote, marcar procesado o fallo.
CREATE FUNCTION pg_temp.o19_lote(p_limite INT) RETURNS TEXT LANGUAGE sql AS $$
    SELECT coalesce(string_agg(tipo_evento, ', ' ORDER BY evento_id), '(vacio)')
    FROM (SELECT evento_id, tipo_evento FROM sync_outbox WHERE estado = 'pendiente' ORDER BY evento_id LIMIT p_limite) q
$$;
CREATE FUNCTION pg_temp.o19_procesado(p_evento BIGINT) RETURNS VOID LANGUAGE sql AS
$$ UPDATE sync_outbox SET estado = 'procesado', procesado_en = now() WHERE evento_id = p_evento $$;
CREATE FUNCTION pg_temp.o19_fallo(p_evento BIGINT, p_error TEXT, p_limite_intentos INT) RETURNS VOID LANGUAGE sql AS $$
    UPDATE sync_outbox SET intentos = intentos + 1, error = p_error,
           estado = CASE WHEN intentos + 1 >= p_limite_intentos THEN 'fallido'::estado_evento ELSE estado END
    WHERE evento_id = p_evento
$$;

-- O21. Purgar eventos procesados con mas de 30 dias y sesiones vencidas. Devuelve cuantas filas borro de cada tabla.
CREATE FUNCTION pg_temp.o21() RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_e INT; v_s INT;
BEGIN
    DELETE FROM sync_outbox WHERE estado = 'procesado' AND procesado_en < now() - interval '30 days';
    GET DIAGNOSTICS v_e = ROW_COUNT;
    DELETE FROM sesion WHERE expira_en < now();
    GET DIAGNOSTICS v_s = ROW_COUNT;
    RETURN v_e || ' eventos, ' || v_s || ' sesiones';
END $$;

-- O22. Validar la sesion de una peticion (texto de 04-operaciones.md, :hash = $1)
CREATE FUNCTION pg_temp.o22(TEXT) RETURNS TABLE (usuario_id UUID, rol rol_usuario) LANGUAGE sql AS $$
    SELECT u.usuario_id, u.rol
    FROM sesion s
    JOIN usuario u ON u.usuario_id = s.usuario_id
    WHERE s.token_hash = $1
      AND s.expira_en > now();
$$;
CREATE FUNCTION pg_temp.o22_texto(TEXT) RETURNS TEXT LANGUAGE sql AS
$$ SELECT coalesce((SELECT rol::text FROM pg_temp.o22($1)), '(sin sesion)') $$;

-- O23. Cerrar sesion: borrar la fila del token de la peticion.
CREATE FUNCTION pg_temp.o23(p_hash TEXT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    DELETE FROM sesion WHERE token_hash = p_hash;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;

-- Ids de prueba: usuarios 9001..9005, obras 9101 (libro A), 9102 (libro B), 9103 (pelicula), 9104 (libro C), listas 9201..9202
-- Etiqueta de una obra de prueba en las listas: A, B, C
CREATE FUNCTION pg_temp.letra(UUID) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE $1 WHEN pg_temp.uid(9101) THEN 'A' WHEN pg_temp.uid(9102) THEN 'B' WHEN pg_temp.uid(9104) THEN 'C' ELSE '?' END $$;
CREATE FUNCTION pg_temp.posiciones(p_lista UUID) RETURNS TEXT LANGUAGE sql AS $$
    SELECT coalesce(string_agg(pg_temp.letra(obra_id) || '=' || posicion, ', ' ORDER BY posicion), '(vacia)')
    FROM elemento_lista WHERE lista_id = p_lista $$;

-- =============================================================================================== LECTURAS (sobre la semilla)
-- ---------------------------------------------------------------------------------------------- O17
-- Las 11 consultas de lectura de 04-operaciones.md, seccion 8.
SELECT pg_temp.registrar('O17-n1', 'O17: promedio y total de una obra (Dune: 5, 4 y 4)', 'total=3 promedio=4.33',
    pg_temp.resumen(pg_temp.id('b1', 1)));
SELECT pg_temp.registrar('O17-n2', 'O17: resenas no ocultas de una obra, recientes primero (Dune)', 'c05 (4), c04 (4), c02 (5)',
    (SELECT string_agg(pg_temp.corto(usuario_id) || ' (' || calificacion || ')', ', ' ORDER BY creado_en DESC)
       FROM resena WHERE obra_id = pg_temp.id('b1', 1) AND NOT oculta));
SELECT pg_temp.registrar('O17-n3', 'O17: resenas no ocultas de un usuario, recientes primero (Ana: su resena oculta no sale)', 'f09 (5), b06 (3), b03 (4), b01 (5)',
    (SELECT string_agg(pg_temp.corto(obra_id) || ' (' || calificacion || ')', ', ' ORDER BY creado_en DESC)
       FROM resena WHERE usuario_id = pg_temp.id('c1', 2) AND NOT oculta));
SELECT pg_temp.registrar('O17-n4', 'O17: obras de un usuario por estado (Luis)', 'pendiente: 1, terminada: 2',
    (SELECT string_agg(estado::text || ': ' || n, ', ' ORDER BY estado)
       FROM (SELECT estado, count(*) AS n FROM estado_obra WHERE usuario_id = pg_temp.id('c1', 3) GROUP BY estado) q));
SELECT pg_temp.registrar('O17-n5', 'O17: listas de un usuario (Ana)', '1 lista(s): Por ver este año',
    (SELECT count(*) || ' lista(s): ' || string_agg(nombre, ', ') FROM lista WHERE usuario_id = pg_temp.id('c1', 2)));
SELECT pg_temp.registrar('O17-n6', 'O17: obras de una lista en su posicion (no es el orden de insercion)', 'b04, f05, b02',
    (SELECT string_agg(pg_temp.corto(e.obra_id), ', ' ORDER BY e.posicion)
       FROM elemento_lista e JOIN lista l ON l.lista_id = e.lista_id WHERE l.usuario_id = pg_temp.id('c1', 2)));
SELECT pg_temp.registrar('O17-n7', 'O17: a quien sigue un usuario (Sofia)', 'c02, c05, c07',
    (SELECT string_agg(pg_temp.corto(seguido_id), ', ' ORDER BY seguido_id) FROM seguimiento WHERE seguidor_id = pg_temp.id('c1', 6)));
SELECT pg_temp.registrar('O17-n8', 'O17: quien sigue a un usuario (Ana)', 'c03, c04, c06',
    (SELECT string_agg(pg_temp.corto(seguidor_id), ', ' ORDER BY seguidor_id) FROM seguimiento WHERE seguido_id = pg_temp.id('c1', 2)));
SELECT pg_temp.registrar('O17-n9', 'O17: perfil de un usuario (Ana)', 'Ana Lectora | ana@ejemplo.test | lector',
    (SELECT nombre || ' | ' || correo || ' | ' || rol::text FROM usuario WHERE usuario_id = pg_temp.id('c1', 2)));
SELECT pg_temp.registrar('O17-n10', 'O17: estado que Ana dio a Dune (para mostrarlo en la ficha)', 'terminada',
    (SELECT estado::text FROM estado_obra WHERE usuario_id = pg_temp.id('c1', 2) AND obra_id = pg_temp.id('b1', 1)));
SELECT pg_temp.registrar('O17-n11', 'O17: resena de Ana sobre Dune (para editarla o saber si ya reseno)', '5',
    (SELECT calificacion::text FROM resena WHERE usuario_id = pg_temp.id('c1', 2) AND obra_id = pg_temp.id('b1', 1)));
SELECT pg_temp.registrar('O17-l1', 'O17: una obra sin resenas tiene total 0 y promedio nulo (Androides)', 'total=0 promedio=(nulo)',
    pg_temp.resumen(pg_temp.id('b1', 2)));
SELECT pg_temp.registrar('O17-l2', 'O17: Expiacion tiene 2 resenas, una oculta: cuenta solo la visible', 'total=1 promedio=2.00',
    pg_temp.resumen(pg_temp.id('b1', 9)));
SELECT pg_temp.registrar('O17-e1', 'O17: perfil de un usuario que no existe: sin fila', '(sin fila)',
    coalesce((SELECT nombre FROM usuario WHERE usuario_id = pg_temp.uid(9999)), '(sin fila)'));
SELECT pg_temp.registrar('O17-e2', 'O17: promedio de una obra que no existe: sin fila', '(sin fila)',
    coalesce(pg_temp.resumen(pg_temp.uid(9999)), '(sin fila)'));
SELECT pg_temp.registrar('O17-e3', 'O17: resena de un usuario que no ha resenado esa obra (Pedro y Androides): sin fila', '(sin fila)',
    coalesce((SELECT calificacion::text FROM resena WHERE usuario_id = pg_temp.id('c1', 5) AND obra_id = pg_temp.id('b1', 2)), '(sin fila)'));

-- ---------------------------------------------------------------------------------------------- O18
SELECT pg_temp.registrar('O18-n1', 'O18: Ana, libros terminados con calificacion >= 4 y resena visible, mejor calificado primero', 'b01, b03',
    pg_temp.o18_texto(pg_temp.id('c1', 2), 20));
SELECT pg_temp.registrar('O18-n2', 'O18: Ana, quedan fuera El Hobbit (3), Orgullo y prejuicio (pendiente), Expiacion (resena oculta), Orient Express (en curso) y la pelicula Orgullo y prejuicio', '0 de b06 b08 b09 b10 f09',
    (SELECT count(*) || ' de b06 b08 b09 b10 f09' FROM pg_temp.o18(pg_temp.id('c1', 2), 20)
      WHERE obra_id IN (pg_temp.id('b1', 6), pg_temp.id('b1', 8), pg_temp.id('b1', 9), pg_temp.id('b1', 10), pg_temp.id('f1', 9))));
SELECT pg_temp.registrar('O18-n3', 'O18: Pedro, Historia de tu vida (5) antes que Dune (4)', 'b04, b01',
    pg_temp.o18_texto(pg_temp.id('c1', 5), 20));
SELECT pg_temp.registrar('O18-l1', 'O18: Marta, igual calificacion (4): primero la resena mas reciente', 'b08, b01',
    pg_temp.o18_texto(pg_temp.id('c1', 4), 20));
SELECT pg_temp.registrar('O18-l2', 'O18: :limite 1 acota la lista a la mejor', 'b01',
    pg_temp.o18_texto(pg_temp.id('c1', 2), 1));
SELECT pg_temp.registrar('O18-e1', 'O18: Elena califico 2 su unico libro terminado: no es de partida', '(vacio)',
    pg_temp.o18_texto(pg_temp.id('c1', 8), 20));
SELECT pg_temp.registrar('O18-e2', 'O18: Sofia no termino ningun libro: lista vacia', '(vacio)',
    pg_temp.o18_texto(pg_temp.id('c1', 6), 20));
SELECT pg_temp.registrar('O18-e3', 'O18: un usuario que no existe: lista vacia, sin error', '(vacio)',
    pg_temp.o18_texto(pg_temp.uid(9999), 20));

-- ---------------------------------------------------------------------------------------------- O20
-- Datos para la reconciliacion (cada lista es la consulta que el script de reconciliacion necesita).
SELECT pg_temp.registrar('O20-n1', 'O20: todos los seguimientos', '10 pares',
    (SELECT count(*) || ' pares' FROM (SELECT seguidor_id, seguido_id FROM seguimiento) q));
SELECT pg_temp.registrar('O20-n2', 'O20: estados terminada de obras de tipo libro (D-16: las peliculas no cuentan)', '12 pares',
    (SELECT count(*) || ' pares' FROM estado_obra e JOIN obra_resumen o ON o.obra_id = e.obra_id
      WHERE e.estado = 'terminada' AND o.tipo = 'libro'));
SELECT pg_temp.registrar('O20-n3', 'O20: todos los obra_id de obra_resumen', '23 obras (11 libros, 12 peliculas)',
    (SELECT count(*) || ' obras (' || count(*) FILTER (WHERE tipo = 'libro') || ' libros, ' || count(*) FILTER (WHERE tipo = 'pelicula') || ' peliculas)' FROM obra_resumen));
SELECT pg_temp.registrar('O20-n4', 'O20: todos los usuario_id de usuario', '8 usuarios',
    (SELECT count(*) || ' usuarios' FROM usuario));
SELECT pg_temp.registrar('O20-l1', 'O20: sin eventos fallidos no hay nada que reconciliar', '0 fallidos',
    (SELECT count(*) || ' fallidos' FROM sync_outbox WHERE estado = 'fallido'));
INSERT INTO sync_outbox (tipo_evento, payload, estado, intentos, error)
VALUES ('obra_leida', jsonb_build_object('usuario_id', pg_temp.id('c1', 2), 'obra_id', pg_temp.id('b1', 1)), 'fallido', 5, 'destino no responde');
SELECT pg_temp.registrar('O20-n5', 'O20: lista los eventos fallidos (aqui uno insertado a mano en la transaccion)', '1 fallidos: obra_leida (5 intentos)',
    (SELECT count(*) || ' fallidos: ' || string_agg(tipo_evento || ' (' || intentos || ' intentos)', ', ') FROM sync_outbox WHERE estado = 'fallido'));
DELETE FROM sync_outbox;
SELECT pg_temp.registrar('O20-n6', 'O20: verificacion del promedio: ninguna obra con promedio distinto del recalculado', '0 discrepancias',
    (SELECT count(*) || ' discrepancias' FROM pg_temp.discrepantes()));
ALTER TABLE resena DISABLE TRIGGER trg_resena_promedio;
INSERT INTO resena (resena_id, usuario_id, obra_id, calificacion) VALUES (gen_random_uuid(), pg_temp.id('c1', 8), pg_temp.id('b1', 10), 3);
ALTER TABLE resena ENABLE TRIGGER trg_resena_promedio;
SELECT pg_temp.registrar('O20-e1', 'O20: con el trigger apagado la consulta SI detecta un promedio incorrecto (Orient Express)', 'b10: total=0 promedio=(nulo) vs total=1 promedio=3.00',
    (SELECT pg_temp.corto(d.obra_id) || ': ' || pg_temp.resumen(d.obra_id) || ' vs ' || pg_temp.recalculo(d.obra_id)
       FROM pg_temp.discrepantes() d));
DELETE FROM resena WHERE usuario_id = pg_temp.id('c1', 8) AND obra_id = pg_temp.id('b1', 10);

-- ---------------------------------------------------------------------------------------------- O19 (SIMULADO)
-- Solo la parte de PostgreSQL de O19: tomar el lote, marcar procesado o fallo. La aplicacion de cada evento al grafo
-- (MERGE) no se ejecuta aqui porque no existe el worker.
DELETE FROM sync_outbox;
INSERT INTO sync_outbox (tipo_evento, payload) VALUES
    ('seguimiento_creado',    '{"n":1}'), ('obra_leida', '{"n":2}'), ('seguimiento_eliminado', '{"n":3}');
SELECT pg_temp.registrar('O19-n1', 'O19 (simulado): el lote sale en orden de evento_id y solo con pendientes', 'seguimiento_creado, obra_leida, seguimiento_eliminado',
    pg_temp.o19_lote(50));
SELECT pg_temp.o19_procesado((SELECT min(evento_id) FROM sync_outbox));
SELECT pg_temp.registrar('O19-n2', 'O19 (simulado): al marcar procesado, el evento sale del lote y queda con su fecha', 'lote=obra_leida, seguimiento_eliminado; procesado_en=si',
    'lote=' || pg_temp.o19_lote(50) || '; procesado_en=' ||
    (SELECT CASE WHEN procesado_en IS NOT NULL THEN 'si' ELSE 'no' END FROM sync_outbox WHERE estado = 'procesado'));
SELECT pg_temp.o19_fallo((SELECT min(evento_id) FROM sync_outbox WHERE estado = 'pendiente'), 'destino no responde', 5);
SELECT pg_temp.registrar('O19-e1', 'O19 (simulado): un fallo suma 1 a intentos, guarda el error y el evento sigue pendiente', 'intentos=1 estado=pendiente error=destino no responde',
    (SELECT 'intentos=' || intentos || ' estado=' || estado || ' error=' || error FROM sync_outbox WHERE payload->>'n' = '2'));
SELECT pg_temp.o19_fallo((SELECT evento_id FROM sync_outbox WHERE payload->>'n' = '2'), 'destino no responde', 5) FROM generate_series(1, 4);
SELECT pg_temp.registrar('O19-e2', 'O19 (simulado): al 5.o intento queda fallido y NO bloquea al siguiente', 'estado=fallido intentos=5; lote=seguimiento_eliminado',
    (SELECT 'estado=' || estado || ' intentos=' || intentos FROM sync_outbox WHERE payload->>'n' = '2') || '; lote=' || pg_temp.o19_lote(50));
SELECT pg_temp.o19_procesado((SELECT evento_id FROM sync_outbox WHERE payload->>'n' = '3'));
SELECT pg_temp.registrar('O19-l1', 'O19 (simulado): con la bandeja vacia el lote no trae nada', '(vacio)',
    pg_temp.o19_lote(50));
INSERT INTO sync_outbox (tipo_evento, payload)
SELECT 'obra_leida', jsonb_build_object('n', g) FROM generate_series(1, 5) g;
SELECT pg_temp.registrar('O19-l2', 'O19 (simulado): con 5 pendientes, un lote de 2 trae solo los 2 primeros', 'obra_leida, obra_leida',
    pg_temp.o19_lote(2));
SELECT pg_temp.registrar('O19-l3', 'O19 (simulado): el indice parcial I6 existe sobre estado = pendiente', 'parcial',
    (SELECT CASE WHEN pg_get_indexdef(indexrelid) LIKE '%WHERE%pendiente%' THEN 'parcial' ELSE 'completo' END
       FROM pg_index WHERE indexrelid = 'idx_outbox_pendientes'::regclass));
DELETE FROM sync_outbox;

-- ---------------------------------------------------------------------------------------------- O21
DELETE FROM sesion;
INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES (pg_temp.uid(9001), 'o21@ejemplo.test', repeat('x', 60), 'O21');
INSERT INTO sync_outbox (tipo_evento, payload, estado, creado_en, procesado_en) VALUES
    ('obra_leida', '{"n":"A"}', 'procesado', now() - interval '31 days', now() - interval '31 days'),   -- A: procesado hace 31 dias
    ('obra_leida', '{"n":"B"}', 'procesado', now() - interval '29 days', now() - interval '29 days'),   -- B: procesado hace 29 dias
    ('obra_leida', '{"n":"C"}', 'pendiente', now() - interval '40 days', NULL),                         -- C: pendiente muy viejo
    ('obra_leida', '{"n":"D"}', 'fallido',   now() - interval '40 days', NULL),                         -- D: fallido muy viejo
    ('obra_leida', '{"n":"E"}', 'procesado', now() - interval '31 days', now() - interval '30 days');   -- E: justo 30 dias
INSERT INTO sesion (token_hash, usuario_id, creado_en, expira_en) VALUES
    (repeat('1', 64), pg_temp.uid(9001), now() - interval '31 days', now() - interval '1 day'),        -- vencida
    (repeat('2', 64), pg_temp.uid(9001), now() - interval '1 day',   now() + interval '29 days'),      -- vigente
    (repeat('3', 64), pg_temp.uid(9001), now() - interval '1 day',   now());                            -- vence exactamente ahora
SELECT pg_temp.registrar('O21-n1', 'O21: borra el procesado de hace 31 dias y la sesion vencida', '1 eventos, 1 sesiones',
    pg_temp.o21());
SELECT pg_temp.registrar('O21-n2', 'O21: lo vigente se conserva (procesado de hace 29 dias, sesion vigente)', 'B y sesion 2',
    CASE WHEN EXISTS (SELECT 1 FROM sync_outbox WHERE payload->>'n' = 'B')
          AND EXISTS (SELECT 1 FROM sesion WHERE token_hash = repeat('2', 64)) THEN 'B y sesion 2' ELSE 'falta algo' END);
SELECT pg_temp.registrar('O21-l1', 'O21: el borde exacto de 30 dias se conserva (la regla es "mas de 30 dias")', 'E se conserva',
    CASE WHEN EXISTS (SELECT 1 FROM sync_outbox WHERE payload->>'n' = 'E') THEN 'E se conserva' ELSE 'E se borro' END);
SELECT pg_temp.registrar('O21-l2', 'O21: una sesion que vence exactamente ahora se conserva (la regla es expira_en < ahora)', 'sesion 3 se conserva',
    CASE WHEN EXISTS (SELECT 1 FROM sesion WHERE token_hash = repeat('3', 64)) THEN 'sesion 3 se conserva' ELSE 'sesion 3 se borro' END);
SELECT pg_temp.registrar('O21-l3', 'O21: repetir la purga no borra nada mas', '0 eventos, 0 sesiones',
    pg_temp.o21());
SELECT pg_temp.registrar('O21-e1', 'O21: un evento pendiente y uno fallido, aunque sean viejos, no se purgan (solo los procesados)', 'C y D se conservan',
    CASE WHEN (SELECT count(*) FROM sync_outbox WHERE payload->>'n' IN ('C', 'D')) = 2 THEN 'C y D se conservan' ELSE 'se borro alguno' END);
DELETE FROM sync_outbox;
DELETE FROM sesion;
DELETE FROM usuario WHERE usuario_id = pg_temp.uid(9001);

-- ---------------------------------------------------------------------------------------------- O22 y O23
INSERT INTO sesion (token_hash, usuario_id, creado_en, expira_en) VALUES
    (repeat('a', 64), pg_temp.id('c1', 1), now() - interval '1 day',   now() + interval '29 days'),   -- vigente: administrador
    (repeat('b', 64), pg_temp.id('c1', 2), now() - interval '40 days', now() - interval '10 days'),   -- vencida: Ana
    (repeat('c', 64), pg_temp.id('c1', 4), now() - interval '1 day',   now()),                         -- vence exactamente ahora: Marta
    (repeat('d', 64), pg_temp.id('c1', 1), now() - interval '2 days',  now() + interval '28 days');   -- otra del administrador
SELECT pg_temp.registrar('O22-n1', 'O22: una sesion vigente devuelve el usuario y su rol', 'admin',
    pg_temp.o22_texto(repeat('a', 64)));
SELECT pg_temp.registrar('O22-l1', 'O22: una sesion que vence exactamente ahora ya no es valida (expira_en > ahora)', '(sin sesion)',
    pg_temp.o22_texto(repeat('c', 64)));
SELECT pg_temp.registrar('O22-e1', 'O22: una sesion vencida no devuelve nada', '(sin sesion)',
    pg_temp.o22_texto(repeat('b', 64)));
SELECT pg_temp.registrar('O22-e2', 'O22: un token inexistente no devuelve nada', '(sin sesion)',
    pg_temp.o22_texto(repeat('z', 64)));
UPDATE usuario SET rol = 'lector' WHERE usuario_id = pg_temp.id('c1', 1);
SELECT pg_temp.registrar('O22-n2', 'O22: tras cambiar el rol en usuario, la misma sesion ya trae el rol nuevo', 'lector',
    pg_temp.o22_texto(repeat('a', 64)));
UPDATE usuario SET rol = 'admin' WHERE usuario_id = pg_temp.id('c1', 1);

SELECT pg_temp.registrar('O23-n1', 'O23: cerrar sesion borra la fila y la sesion deja de ser valida', '1 fila; (sin sesion)',
    (pg_temp.o23(repeat('a', 64)) || ' fila; ' || pg_temp.o22_texto(repeat('a', 64))));
SELECT pg_temp.registrar('O23-l1', 'O23: las demas sesiones del mismo usuario siguen validas', 'admin',
    pg_temp.o22_texto(repeat('d', 64)));
SELECT pg_temp.registrar('O23-e1', 'O23: cerrar un token que no existe no falla y no borra nada', '0 filas',
    pg_temp.o23(repeat('z', 64)) || ' filas');
DELETE FROM sesion;

-- =============================================================================================== ESCRITURAS (usuarios y obras de prueba)
-- ---------------------------------------------------------------------------------------------- O1
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o1(pg_temp.uid(9001), 't1@ejemplo.test', 'Test Uno');
SELECT pg_temp.registrar('O1-n1', 'O1: registrar crea el usuario con rol lector y el evento usuario_creado', 'lector / usuario_creado',
    (SELECT rol::text FROM usuario WHERE usuario_id = pg_temp.uid(9001)) || ' / ' || pg_temp.eventos());
SELECT pg_temp.registrar('O1-n2', 'O1: el evento lleva el usuario_id', pg_temp.uid(9001)::text,
    (SELECT payload->>'usuario_id' FROM sync_outbox WHERE tipo_evento = 'usuario_creado'));
SELECT pg_temp.registrar('O1-l1', 'O1: un correo de exactamente 254 caracteres se acepta', 'sin_error',
    pg_temp.intentar('SELECT pg_temp.o1(pg_temp.uid(9006), repeat(''a'', 241) || ''@ejemplo.test'', ''Largo'')'));
SELECT pg_temp.registrar('O1-l2', 'O1: un correo de 255 caracteres se rechaza', '22001',
    pg_temp.intentar('SELECT pg_temp.o1(pg_temp.uid(9007), repeat(''a'', 242) || ''@ejemplo.test'', ''Largo'')'));
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O1-e1', 'O1: correo ya registrado: rechaza con UNIQUE y no deja evento', '23505 uq_usuario_correo / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o1(pg_temp.uid(9008), ''t1@ejemplo.test'', ''Repetido'')') || ' / ' || pg_temp.eventos());
SELECT pg_temp.registrar('O1-e2', 'O1: correo con mayusculas: rechaza con el CHECK', '23514 ck_usuario_correo_minusculas',
    pg_temp.intentar('SELECT pg_temp.o1(pg_temp.uid(9008), ''T9@Ejemplo.test'', ''Mayusculas'')'));
SELECT pg_temp.registrar('O1-e3', 'O1: nombre nulo: rechaza (NOT NULL)', '23502',
    pg_temp.intentar('SELECT pg_temp.o1(pg_temp.uid(9008), ''t9@ejemplo.test'', NULL)'));
DELETE FROM usuario WHERE usuario_id IN (pg_temp.uid(9006), pg_temp.uid(9007));
SELECT pg_temp.o1(pg_temp.uid(9002), 't2@ejemplo.test', 'Test Dos');
SELECT pg_temp.o1(pg_temp.uid(9003), 't3@ejemplo.test', 'Test Tres');
SELECT pg_temp.o1(pg_temp.uid(9004), 't4@ejemplo.test', 'Test Cuatro');

-- ---------------------------------------------------------------------------------------------- O5
SELECT pg_temp.registrar('O5-n1', 'O5: registrar una obra la crea sin resenas', '1 fila; total=0 promedio=(nulo)',
    pg_temp.o5(pg_temp.uid(9101), 'libro') || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O5-l1', 'O5: repetir el alta es idempotente: 0 filas nuevas, sigue habiendo una', '0 filas nuevas; 1 en obra_resumen',
    pg_temp.o5(pg_temp.uid(9101), 'libro') || ' filas nuevas; ' || pg_temp.val($q$SELECT count(*) FROM obra_resumen WHERE obra_id = pg_temp.uid(9101)$q$) || ' en obra_resumen');
SELECT pg_temp.registrar('O5-e1', 'O5: un tipo fuera de la lista se rechaza', '22P02',
    pg_temp.intentar('SELECT pg_temp.o5(pg_temp.uid(9199), ''serie'')'));
SELECT pg_temp.registrar('O5-e2', 'O5: un id nulo se rechaza', '23502',
    pg_temp.intentar('SELECT pg_temp.o5(NULL, ''libro'')'));
SELECT pg_temp.o5(pg_temp.uid(9102), 'libro');
SELECT pg_temp.o5(pg_temp.uid(9103), 'pelicula');
SELECT pg_temp.o5(pg_temp.uid(9104), 'libro');

-- ---------------------------------------------------------------------------------------------- O2
SELECT pg_temp.o2('T1@Ejemplo.TEST', encode(sha256('token-de-prueba-1'::bytea), 'hex'), interval '30 days');
SELECT pg_temp.registrar('O2-n1', 'O2: iniciar sesion guarda la sesion con vigencia de 30 dias (el correo se normaliza a minusculas)', '30 days',
    (SELECT (expira_en - creado_en)::text FROM sesion WHERE token_hash = encode(sha256('token-de-prueba-1'::bytea), 'hex')));
SELECT pg_temp.registrar('O2-n2', 'O2: se guarda el hash SHA-256 (64 hexadecimales), nunca el token', 'true',
    (SELECT (token_hash ~ '^[0-9a-f]{64}$')::text FROM sesion WHERE usuario_id = pg_temp.uid(9001)));
SELECT pg_temp.o2('t1@ejemplo.test', encode(sha256('token-de-prueba-2'::bytea), 'hex'), interval '1 second');
SELECT pg_temp.registrar('O2-l1', 'O2: una sesion de 1 segundo ya es valida al crearse (expira_en > creado_en)', 'lector',
    pg_temp.o22_texto(encode(sha256('token-de-prueba-2'::bytea), 'hex')));
SELECT pg_temp.registrar('O2-e1', 'O2: correo inexistente: la misma respuesta que con contrasena mala (28000)', '28000',
    pg_temp.intentar('SELECT pg_temp.o2(''nadie@ejemplo.test'', repeat(''9'', 64), interval ''30 days'')'));
SELECT pg_temp.registrar('O2-e2', 'O2: una sesion que nace vencida se rechaza', '23514 ck_sesion_vigencia',
    pg_temp.intentar('SELECT pg_temp.o2(''t1@ejemplo.test'', repeat(''8'', 64), interval ''0 seconds'')'));
SELECT pg_temp.registrar('O2-e3', 'O2: un token repetido choca con la clave primaria', '23505 pk_sesion',
    pg_temp.intentar('SELECT pg_temp.o2(''t1@ejemplo.test'', encode(sha256(''token-de-prueba-1''::bytea), ''hex''), interval ''30 days'')'));
DELETE FROM sesion;

-- ---------------------------------------------------------------------------------------------- O3
SELECT pg_temp.registrar('O3-n1', 'O3: editar el perfil cambia nombre y biografia del usuario de la sesion', '1 fila; Nombre Nuevo | Mi biografia',
    pg_temp.o3(pg_temp.uid(9001), 'Nombre Nuevo', 'Mi biografia') || ' fila; ' ||
    pg_temp.val($q$SELECT nombre || ' | ' || biografia FROM usuario WHERE usuario_id = pg_temp.uid(9001)$q$));
SELECT pg_temp.registrar('O3-l1', 'O3: una biografia de exactamente 500 caracteres se acepta', 'sin_error',
    pg_temp.intentar('SELECT pg_temp.o3(pg_temp.uid(9001), ''Nombre'', repeat(''b'', 500))'));
SELECT pg_temp.registrar('O3-l2', 'O3: la biografia puede quedar nula', '1 fila; (nulo)',
    pg_temp.o3(pg_temp.uid(9001), 'Nombre', NULL) || ' fila; ' ||
    pg_temp.val($q$SELECT coalesce(biografia, '(nulo)') FROM usuario WHERE usuario_id = pg_temp.uid(9001)$q$));
SELECT pg_temp.registrar('O3-e1', 'O3: nombre nulo se rechaza', '23502',
    pg_temp.intentar('SELECT pg_temp.o3(pg_temp.uid(9001), NULL, ''x'')'));
SELECT pg_temp.registrar('O3-e2', 'O3: una biografia de 501 caracteres se rechaza', '22001',
    pg_temp.intentar('SELECT pg_temp.o3(pg_temp.uid(9001), ''Nombre'', repeat(''b'', 501))'));
SELECT pg_temp.registrar('O3-e3', 'O3: un usuario que no existe no cambia ninguna fila', '0 filas',
    pg_temp.o3(pg_temp.uid(9999), 'Nadie', 'x') || ' filas');

-- ---------------------------------------------------------------------------------------------- O7
-- Usuarios 9001, 9002 y 9003; obras A (9101, libro), B (9102, libro) y la pelicula (9103).
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O7-n1', 'O7: publicar una resena crea resena, promedio, estado terminada y el evento obra_leida', 'previo=sin estado; total=1 promedio=5.00; estado=terminada; obra_leida',
    'previo=' || pg_temp.o7(pg_temp.uid(9002), pg_temp.uid(9101), 5, 'muy buena') || '; ' || pg_temp.resumen(pg_temp.uid(9101)) ||
    '; estado=' || pg_temp.val($q$SELECT estado::text FROM estado_obra WHERE usuario_id = pg_temp.uid(9002) AND obra_id = pg_temp.uid(9101)$q$) || '; ' || pg_temp.eventos());
SELECT pg_temp.registrar('O7-n2', 'O7: una segunda resena de otro usuario recalcula el promedio (5 y 3)', 'total=2 promedio=4.00',
    (SELECT CASE WHEN pg_temp.o7(pg_temp.uid(9003), pg_temp.uid(9101), 3, 'regular') IS NOT NULL THEN pg_temp.resumen(pg_temp.uid(9101)) END));
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o11(pg_temp.uid(9001), pg_temp.uid(9102), 'terminada');
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O7-n3', 'O7: si el estado ya era terminada, la resena no genera un segundo evento', 'previo=terminada; total=1 promedio=4.00; (ninguno)',
    'previo=' || pg_temp.o7(pg_temp.uid(9001), pg_temp.uid(9102), 4, 'bien') || '; ' || pg_temp.resumen(pg_temp.uid(9102)) || '; ' || pg_temp.eventos());
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o7(pg_temp.uid(9001), pg_temp.uid(9101), 1, NULL);
SELECT pg_temp.registrar('O7-l1', 'O7: calificacion minima (1) y texto nulo se aceptan; promedio de 5, 3 y 1', 'total=3 promedio=3.00; texto=(nulo)',
    pg_temp.resumen(pg_temp.uid(9101)) || '; texto=' ||
    (SELECT coalesce(texto, '(nulo)') FROM resena WHERE usuario_id = pg_temp.uid(9001) AND obra_id = pg_temp.uid(9101)));
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o7(pg_temp.uid(9002), pg_temp.uid(9103), 5, 'peli');
SELECT pg_temp.registrar('O7-l2', 'O7: la resena de una PELICULA tambien genera obra_leida (el worker la descartara, D-16)', 'obra_leida',
    pg_temp.eventos());
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O7-e1', 'O7: segunda resena del mismo usuario y obra: RN-01; no cambia nada', '23505 uq_resena_usuario_obra / total=3 promedio=3.00 / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o7(pg_temp.uid(9002), pg_temp.uid(9101), 2, ''otra'')') || ' / ' || pg_temp.resumen(pg_temp.uid(9101)) || ' / ' || pg_temp.eventos());
SELECT pg_temp.registrar('O7-e2', 'O7: calificacion 6: RN-02; no queda resena, estado ni evento', '23514 ck_resena_calificacion / estados=0 / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o7(pg_temp.uid(9003), pg_temp.uid(9102), 6, ''x'')') || ' / estados=' ||
    (SELECT count(*) FROM estado_obra WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9102)) || ' / ' || pg_temp.eventos());
SELECT pg_temp.registrar('O7-e3', 'O7: obra inexistente: llave foranea; no queda estado ni evento', '23503 fk_resena_obra / estados=0 / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o7(pg_temp.uid(9003), pg_temp.uid(9999), 4, ''x'')') || ' / estados=' ||
    (SELECT count(*) FROM estado_obra WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9999)) || ' / ' || pg_temp.eventos());

-- ---------------------------------------------------------------------------------------------- O8
-- Obra A: 9002 (5), 9003 (3), 9001 (1).
SELECT pg_temp.registrar('O8-n1', 'O8: editar la calificacion (3 -> 5) recalcula el promedio de la obra (5, 5 y 1)', '1 fila; total=3 promedio=3.67',
    pg_temp.o8(pg_temp.uid(9003), (SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9101)), 5, 'cambie de opinion')
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O8-n2', 'O8: la edicion actualiza actualizado_en y deja creado_en igual', 'true',
    (SELECT (actualizado_en > creado_en)::text FROM resena WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9101)));
SELECT pg_temp.registrar('O8-l1', 'O8: editar solo el texto (misma calificacion) deja el promedio igual', '1 fila; total=3 promedio=3.67',
    pg_temp.o8(pg_temp.uid(9003), (SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9101)), 5, 'solo el texto')
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O8-l2', 'O8: calificacion minima (1): promedio de 5, 1 y 1', '1 fila; total=3 promedio=2.33',
    pg_temp.o8(pg_temp.uid(9003), (SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9101)), 1, 'mala')
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O8-e1', 'O8: calificacion 6 se rechaza y el promedio no cambia', '23514 ck_resena_calificacion / total=3 promedio=2.33',
    pg_temp.intentar('SELECT pg_temp.o8(pg_temp.uid(9003), (SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9101)), 6, ''x'')')
    || ' / ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O8-e2', 'O8: editar la resena de OTRO usuario no cambia ninguna fila (RN-10)', '0 filas; total=3 promedio=2.33',
    pg_temp.o8(pg_temp.uid(9001), (SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9002) AND obra_id = pg_temp.uid(9101)), 1, 'intruso')
    || ' filas; ' || pg_temp.resumen(pg_temp.uid(9101)));

-- ---------------------------------------------------------------------------------------------- O9
-- Obra A: 9002 (5), 9003 (1), 9001 (1). Obra B: 9001 (4).
SELECT pg_temp.registrar('O9-n1', 'O9: eliminar la propia resena recalcula el promedio (5 y 1) y el estado sigue terminada', '1 fila; total=2 promedio=3.00; estado=terminada',
    pg_temp.o9(pg_temp.uid(9001), (SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9001) AND obra_id = pg_temp.uid(9101)))
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)) || '; estado=' ||
    pg_temp.val($q$SELECT estado::text FROM estado_obra WHERE usuario_id = pg_temp.uid(9001) AND obra_id = pg_temp.uid(9101)$q$));
SELECT pg_temp.registrar('O9-e1', 'O9: eliminar la resena de otro usuario no borra nada (RN-10)', '0 filas; total=2 promedio=3.00',
    pg_temp.o9(pg_temp.uid(9001), (SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9002) AND obra_id = pg_temp.uid(9101)))
    || ' filas; ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O9-e2', 'O9: una resena que no existe no borra nada', '0 filas',
    pg_temp.o9(pg_temp.uid(9001), gen_random_uuid()) || ' filas');
SELECT pg_temp.registrar('O9-l1', 'O9: eliminar la unica resena de una obra deja total 0 y promedio nulo (obra B)', '1 fila; total=0 promedio=(nulo)',
    pg_temp.o9(pg_temp.uid(9001), (SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9001) AND obra_id = pg_temp.uid(9102)))
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9102)));

-- ---------------------------------------------------------------------------------------------- O10
-- Obra A: 9002 (5), 9003 (1).
SELECT pg_temp.registrar('O10-n1', 'O10: ocultar una resena la saca del promedio', '1 fila; total=1 promedio=5.00',
    pg_temp.o10((SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9101)), 'ocultar')
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O10-n2', 'O10: volver a mostrarla la devuelve al promedio', '1 fila; total=2 promedio=3.00',
    pg_temp.o10((SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9101)), 'mostrar')
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O10-n3', 'O10: eliminar por moderacion borra la fila y recalcula', '1 fila; total=1 promedio=5.00; resenas del usuario=0',
    pg_temp.o10((SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9101)), 'eliminar')
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)) || '; resenas del usuario=' ||
    pg_temp.val($q$SELECT count(*) FROM resena WHERE usuario_id = pg_temp.uid(9003) AND obra_id = pg_temp.uid(9101)$q$));
SELECT pg_temp.registrar('O10-l1', 'O10: ocultar la unica resena vigente deja total 0 y promedio nulo', '1 fila; total=0 promedio=(nulo)',
    pg_temp.o10((SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9002) AND obra_id = pg_temp.uid(9101)), 'ocultar')
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O10-l2', 'O10: ocultar una resena que ya esta oculta es idempotente', '1 fila; total=0 promedio=(nulo)',
    pg_temp.o10((SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9002) AND obra_id = pg_temp.uid(9101)), 'ocultar')
    || ' fila; ' || pg_temp.resumen(pg_temp.uid(9101)));
SELECT pg_temp.registrar('O10-e1', 'O10: moderar una resena que no existe no cambia nada', '0 filas',
    pg_temp.o10(gen_random_uuid(), 'ocultar') || ' filas');
SELECT pg_temp.o10((SELECT resena_id FROM resena WHERE usuario_id = pg_temp.uid(9002) AND obra_id = pg_temp.uid(9101)), 'mostrar');

-- ---------------------------------------------------------------------------------------------- O11
-- Usuario 9004 y la obra C (9103 es la pelicula; la obra C es el libro 9104).
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o11(pg_temp.uid(9004), pg_temp.uid(9104), 'pendiente');
SELECT pg_temp.registrar('O11-n1', 'O11: primer estado (pendiente) no genera evento', '(ninguno)', pg_temp.eventos());
SELECT pg_temp.o11(pg_temp.uid(9004), pg_temp.uid(9104), 'en_curso');
SELECT pg_temp.registrar('O11-n2', 'O11: pendiente -> en_curso no genera evento', '(ninguno)', pg_temp.eventos());
SELECT pg_temp.o11(pg_temp.uid(9004), pg_temp.uid(9104), 'terminada');
SELECT pg_temp.registrar('O11-n3', 'O11: en_curso -> terminada genera obra_leida', 'obra_leida', pg_temp.eventos());
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o11(pg_temp.uid(9004), pg_temp.uid(9104), 'en_curso');
SELECT pg_temp.registrar('O11-n4', 'O11: terminada -> en_curso genera obra_no_leida', 'obra_no_leida', pg_temp.eventos());
SELECT pg_temp.o11(pg_temp.uid(9004), pg_temp.uid(9104), 'terminada');
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o11(pg_temp.uid(9004), pg_temp.uid(9104), 'terminada');
SELECT pg_temp.registrar('O11-l1', 'O11: marcar terminada algo que ya esta terminada no genera evento', '(ninguno)', pg_temp.eventos());
SELECT pg_temp.o11(pg_temp.uid(9004), pg_temp.uid(9103), 'terminada');
SELECT pg_temp.registrar('O11-l2', 'O11: una PELICULA terminada tambien genera obra_leida (el worker la descartara, D-16)', 'obra_leida', pg_temp.eventos());
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O11-e1', 'O11: un estado fuera de la lista se rechaza', '22P02',
    pg_temp.intentar('SELECT pg_temp.o11(pg_temp.uid(9004), pg_temp.uid(9104), ''leido'')'));
SELECT pg_temp.registrar('O11-e2', 'O11: una obra inexistente se rechaza y no deja evento', '23503 fk_estado_obra / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o11(pg_temp.uid(9004), pg_temp.uid(9999), ''terminada'')') || ' / ' || pg_temp.eventos());

-- ---------------------------------------------------------------------------------------------- O12
SELECT pg_temp.o12_crear(pg_temp.uid(9004), pg_temp.uid(9201), 'Mis pendientes');
SELECT pg_temp.registrar('O12-n1', 'O12: crear una lista', '1 lista: Mis pendientes',
    (SELECT count(*) || ' lista: ' || min(nombre) FROM lista WHERE usuario_id = pg_temp.uid(9004)));
SELECT pg_temp.registrar('O12-n2', 'O12: renombrar una lista propia', '1 fila; Para leer',
    pg_temp.o12_renombrar(pg_temp.uid(9004), pg_temp.uid(9201), 'Para leer') || ' fila; ' ||
    pg_temp.val($q$SELECT nombre FROM lista WHERE lista_id = pg_temp.uid(9201)$q$));
SELECT pg_temp.registrar('O12-l1', 'O12: un nombre de exactamente 100 caracteres se acepta', 'sin_error',
    pg_temp.intentar('SELECT pg_temp.o12_crear(pg_temp.uid(9004), pg_temp.uid(9203), repeat(''n'', 100))'));
SELECT pg_temp.o12_crear(pg_temp.uid(9004), pg_temp.uid(9204), 'Para leer');
SELECT pg_temp.registrar('O12-l2', 'O12: dos listas del mismo usuario pueden tener el mismo nombre', '2 listas llamadas Para leer',
    (SELECT count(*) || ' listas llamadas Para leer' FROM lista WHERE usuario_id = pg_temp.uid(9004) AND nombre = 'Para leer'));
DELETE FROM lista WHERE lista_id IN (pg_temp.uid(9203), pg_temp.uid(9204));
SELECT pg_temp.registrar('O12-e1', 'O12: un nombre de 101 caracteres se rechaza', '22001',
    pg_temp.intentar('SELECT pg_temp.o12_crear(pg_temp.uid(9004), pg_temp.uid(9203), repeat(''n'', 101))'));
SELECT pg_temp.registrar('O12-e2', 'O12: un nombre nulo se rechaza', '23502',
    pg_temp.intentar('SELECT pg_temp.o12_crear(pg_temp.uid(9004), pg_temp.uid(9203), NULL)'));
SELECT pg_temp.registrar('O12-e3', 'O12: renombrar la lista de OTRO usuario no cambia nada (RN-10)', '0 filas; Para leer',
    pg_temp.o12_renombrar(pg_temp.uid(9001), pg_temp.uid(9201), 'Intruso') || ' filas; ' ||
    pg_temp.val($q$SELECT nombre FROM lista WHERE lista_id = pg_temp.uid(9201)$q$));
SELECT pg_temp.registrar('O12-e4', 'O12: eliminar la lista de OTRO usuario no borra nada', '0 filas; la lista sigue',
    pg_temp.o12_eliminar(pg_temp.uid(9001), pg_temp.uid(9201)) || ' filas; ' ||
    pg_temp.val($q$SELECT CASE WHEN EXISTS (SELECT 1 FROM lista WHERE lista_id = pg_temp.uid(9201)) THEN 'la lista sigue' ELSE 'la lista se borro' END$q$));
-- n3 (eliminar con elementos) va tras O13, que es quien agrega los elementos.

-- ---------------------------------------------------------------------------------------------- O13
SELECT pg_temp.registrar('O13-l1', 'O13: agregar a una lista vacia da posicion 1', '1 fila; A=1',
    pg_temp.o13_agregar(pg_temp.uid(9004), pg_temp.uid(9201), pg_temp.uid(9101)) || ' fila; ' || pg_temp.posiciones(pg_temp.uid(9201)));
SELECT pg_temp.o13_agregar(pg_temp.uid(9004), pg_temp.uid(9201), pg_temp.uid(9102));
SELECT pg_temp.registrar('O13-n1', 'O13: agregar da posicion = ultima + 1', 'A=1, B=2, C=3',
    (SELECT CASE WHEN pg_temp.o13_agregar(pg_temp.uid(9004), pg_temp.uid(9201), pg_temp.uid(9104)) = 1 THEN pg_temp.posiciones(pg_temp.uid(9201)) END));
SELECT pg_temp.registrar('O13-n2', 'O13: quitar una obra no renumera las demas (B desaparece, quedan 1 y 3)', '1 fila; A=1, C=3',
    pg_temp.o13_quitar(pg_temp.uid(9004), pg_temp.uid(9201), pg_temp.uid(9102)) || ' fila; ' || pg_temp.posiciones(pg_temp.uid(9201)));
SELECT pg_temp.registrar('O13-l2', 'O13: al volver a agregar, la posicion es maximo + 1 (4), no la primera libre', 'A=1, C=3, B=4',
    (SELECT CASE WHEN pg_temp.o13_agregar(pg_temp.uid(9004), pg_temp.uid(9201), pg_temp.uid(9102)) = 1 THEN pg_temp.posiciones(pg_temp.uid(9201)) END));
SELECT pg_temp.registrar('O13-e1', 'O13: la misma obra dos veces en una lista: RN-04', '23505 pk_elemento_lista',
    pg_temp.intentar('SELECT pg_temp.o13_agregar(pg_temp.uid(9004), pg_temp.uid(9201), pg_temp.uid(9101))'));
SELECT pg_temp.registrar('O13-e2', 'O13: una obra inexistente se rechaza', '23503 fk_elemento_obra',
    pg_temp.intentar('SELECT pg_temp.o13_agregar(pg_temp.uid(9004), pg_temp.uid(9201), pg_temp.uid(9999))'));
SELECT pg_temp.registrar('O13-e3', 'O13: agregar a la lista de OTRO usuario no inserta nada (RN-10)', '0 filas',
    pg_temp.o13_agregar(pg_temp.uid(9001), pg_temp.uid(9201), pg_temp.uid(9103)) || ' filas');
SELECT pg_temp.registrar('O13-e4', 'O13: quitar una obra que no esta en la lista no borra nada', '0 filas',
    pg_temp.o13_quitar(pg_temp.uid(9004), pg_temp.uid(9201), pg_temp.uid(9103)) || ' filas');

-- ---------------------------------------------------------------------------------------------- O14
-- Lista 9201: A=1, C=3, B=4.
SELECT pg_temp.registrar('O14-n1', 'O14: reordenar reasigna posiciones 1..n en el orden recibido (tambien las compacta)', '3 filas; B=1, A=2, C=3',
    pg_temp.o14(pg_temp.uid(9004), pg_temp.uid(9201), ARRAY[pg_temp.uid(9102), pg_temp.uid(9101), pg_temp.uid(9104)]) || ' filas; ' || pg_temp.posiciones(pg_temp.uid(9201)));
SELECT pg_temp.o12_crear(pg_temp.uid(9004), pg_temp.uid(9202), 'Una sola');
SELECT pg_temp.o13_agregar(pg_temp.uid(9004), pg_temp.uid(9202), pg_temp.uid(9101));
UPDATE elemento_lista SET posicion = 7 WHERE lista_id = pg_temp.uid(9202);
SELECT pg_temp.registrar('O14-l1', 'O14: una lista de un solo elemento queda en la posicion 1 (venia en la 7)', '1 filas; A=1',
    pg_temp.o14(pg_temp.uid(9004), pg_temp.uid(9202), ARRAY[pg_temp.uid(9101)]) || ' filas; ' || pg_temp.posiciones(pg_temp.uid(9202)));
DELETE FROM elemento_lista WHERE lista_id = pg_temp.uid(9202);
SELECT pg_temp.registrar('O14-l2', 'O14: una lista vacia con orden vacio no falla', '0 filas',
    pg_temp.o14(pg_temp.uid(9004), pg_temp.uid(9202), ARRAY[]::UUID[]) || ' filas');
SELECT pg_temp.registrar('O14-e1', 'O14: un orden con una obra ajena a la lista se rechaza y deja las posiciones como estaban', 'P0001 / B=1, A=2, C=3',
    pg_temp.intentar('SELECT pg_temp.o14(pg_temp.uid(9004), pg_temp.uid(9201), ARRAY[pg_temp.uid(9103), pg_temp.uid(9101), pg_temp.uid(9104)])')
    || ' / ' || pg_temp.posiciones(pg_temp.uid(9201)));
SELECT pg_temp.registrar('O14-e2', 'O14: un orden incompleto (falta un elemento) se rechaza y no cambia nada', 'P0001 / B=1, A=2, C=3',
    pg_temp.intentar('SELECT pg_temp.o14(pg_temp.uid(9004), pg_temp.uid(9201), ARRAY[pg_temp.uid(9104), pg_temp.uid(9101)])')
    || ' / ' || pg_temp.posiciones(pg_temp.uid(9201)));
SELECT pg_temp.registrar('O14-e3', 'O14: reordenar la lista de OTRO usuario se rechaza', 'P0001',
    pg_temp.intentar('SELECT pg_temp.o14(pg_temp.uid(9001), pg_temp.uid(9201), ARRAY[pg_temp.uid(9101)])'));

-- O12-n3 (la lista 9201 tiene 3 elementos)
SELECT pg_temp.registrar('O12-n3', 'O12: eliminar una lista borra sus elementos en cascada', '1 fila; 0 elementos',
    pg_temp.o12_eliminar(pg_temp.uid(9004), pg_temp.uid(9201)) || ' fila; ' ||
    pg_temp.val($q$SELECT count(*) FROM elemento_lista WHERE lista_id = pg_temp.uid(9201)$q$) || ' elementos');

-- ---------------------------------------------------------------------------------------------- O15 y O16
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o15(pg_temp.uid(9002), pg_temp.uid(9003));
SELECT pg_temp.registrar('O15-n1', 'O15: seguir crea el seguimiento y el evento seguimiento_creado', '1 seguimiento; seguimiento_creado',
    (SELECT count(*) || ' seguimiento; ' FROM seguimiento WHERE seguidor_id = pg_temp.uid(9002) AND seguido_id = pg_temp.uid(9003)) || pg_temp.eventos());
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o15(pg_temp.uid(9002), pg_temp.id('c1', 1));
SELECT pg_temp.registrar('O15-l1', 'O15: seguir a un usuario de la semilla que ya tiene seguidores (el administrador)', '2 seguidores; seguimiento_creado',
    (SELECT count(*) || ' seguidores; ' FROM seguimiento WHERE seguido_id = pg_temp.id('c1', 1)) || pg_temp.eventos());
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O15-e1', 'O15: seguirse a si mismo: RN-03; no deja evento', '23514 ck_seguimiento_no_propio / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o15(pg_temp.uid(9002), pg_temp.uid(9002))') || ' / ' || pg_temp.eventos());
SELECT pg_temp.registrar('O15-e2', 'O15: seguir dos veces: RN-03; no deja evento', '23505 pk_seguimiento / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o15(pg_temp.uid(9002), pg_temp.uid(9003))') || ' / ' || pg_temp.eventos());
SELECT pg_temp.registrar('O15-e3', 'O15: seguir a un usuario que no existe: llave foranea; no deja evento', '23503 fk_seguimiento_seguido / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o15(pg_temp.uid(9002), pg_temp.uid(9999))') || ' / ' || pg_temp.eventos());

SELECT pg_temp.registrar('O16-n1', 'O16: dejar de seguir borra el seguimiento y escribe seguimiento_eliminado', '1 fila; seguimiento_eliminado',
    pg_temp.o16(pg_temp.uid(9002), pg_temp.uid(9003)) || ' fila; ' || pg_temp.eventos());
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O16-l1', 'O16: dejar de seguir a quien no se seguia no hace nada ni escribe evento', '0 filas; (ninguno)',
    pg_temp.o16(pg_temp.uid(9002), pg_temp.uid(9003)) || ' filas; ' || pg_temp.eventos());
SELECT pg_temp.o15(pg_temp.uid(9002), pg_temp.uid(9003));
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O16-l2', 'O16: se puede volver a seguir despues de dejar de seguir', '1 fila; seguimiento_eliminado; 0 seguimientos',
    pg_temp.o16(pg_temp.uid(9002), pg_temp.uid(9003)) || ' fila; ' || pg_temp.eventos() || '; ' ||
    pg_temp.val($q$SELECT count(*) FROM seguimiento WHERE seguidor_id = pg_temp.uid(9002) AND seguido_id = pg_temp.uid(9003)$q$) || ' seguimientos');
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O16-e1', 'O16: dejar de seguir a un usuario que no existe no hace nada ni escribe evento', '0 filas; (ninguno)',
    pg_temp.o16(pg_temp.uid(9002), pg_temp.uid(9999)) || ' filas; ' || pg_temp.eventos());

-- ---------------------------------------------------------------------------------------------- O4 (las de usuarios de prueba)
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o1(pg_temp.uid(9005), 't5@ejemplo.test', 'Sin datos');
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o4(pg_temp.uid(9005));
SELECT pg_temp.registrar('O4-l1', 'O4: un usuario sin datos se elimina igual y deja su evento', '0 usuarios; usuario_eliminado',
    (SELECT count(*) || ' usuarios; ' FROM usuario WHERE usuario_id = pg_temp.uid(9005)) || pg_temp.eventos());
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.registrar('O4-e1', 'O4: un usuario que no existe: error, y el evento tambien se revierte', 'P0001 / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o4(pg_temp.uid(9998))') || ' / ' || pg_temp.eventos());
-- Fallo forzado DESPUES del borrado: un trigger de prueba (temporal) hace fallar el DELETE de un usuario llamado 'Falla forzada'.
CREATE FUNCTION pg_temp.falla() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'falla forzada de la prueba'; END $$;
INSERT INTO usuario (usuario_id, correo, password_hash, nombre) VALUES (pg_temp.uid(9009), 'falla@ejemplo.test', repeat('x', 60), 'Falla forzada');
CREATE TRIGGER trg_prueba_falla AFTER DELETE ON usuario FOR EACH ROW WHEN (OLD.nombre = 'Falla forzada') EXECUTE FUNCTION pg_temp.falla();
SELECT pg_temp.registrar('O4-e2', 'O4: si el borrado falla, el evento se deshace con el y el usuario sigue existiendo', 'P0001 / 1 usuarios / (ninguno)',
    pg_temp.intentar('SELECT pg_temp.o4(pg_temp.uid(9009))') || ' / ' ||
    pg_temp.val($q$SELECT count(*) FROM usuario WHERE usuario_id = pg_temp.uid(9009)$q$) || ' usuarios / ' || pg_temp.eventos());
DROP TRIGGER trg_prueba_falla ON usuario;
DELETE FROM usuario WHERE usuario_id = pg_temp.uid(9009);

-- ---------------------------------------------------------------------------------------------- O4-n1: Ana, de la semilla (va al final)
-- Se limpian antes los datos de prueba para que las cuentas de abajo sean solo las de la semilla.
DELETE FROM usuario WHERE usuario_id::text LIKE '00000000-0000-4000-8000-0000000090%';
DELETE FROM obra_resumen WHERE obra_id::text LIKE '00000000-0000-4000-8000-0000000091%';
SELECT pg_temp.vaciar_outbox();
SELECT pg_temp.o4(pg_temp.id('c1', 2));
SELECT pg_temp.registrar('O4-n1', 'O4: eliminar a Ana borra todo lo suyo y el trigger recalcula las 5 obras que habia resenado (la oculta tambien dispara el recalculo)',
    'b01 total=2 promedio=4.00; b03 total=1 promedio=5.00; b06 total=0 promedio=(nulo); b09 total=1 promedio=2.00; f09 total=0 promedio=(nulo)',
    (SELECT string_agg(pg_temp.corto(o.obra_id) || ' ' || pg_temp.resumen(o.obra_id), '; ' ORDER BY o.obra_id)
       FROM obra_resumen o WHERE o.obra_id IN (pg_temp.id('b1', 1), pg_temp.id('b1', 3), pg_temp.id('b1', 6), pg_temp.id('b1', 9), pg_temp.id('f1', 9))));
SELECT pg_temp.registrar('O4-n2', 'O4: no queda ninguna fila de Ana en ninguna tabla', 'resena=0 estado=0 lista=0 elemento=0 seguimiento=0 sesion=0',
    'resena=' || (SELECT count(*) FROM resena WHERE usuario_id = pg_temp.id('c1', 2)) ||
    ' estado=' || (SELECT count(*) FROM estado_obra WHERE usuario_id = pg_temp.id('c1', 2)) ||
    ' lista=' || (SELECT count(*) FROM lista WHERE usuario_id = pg_temp.id('c1', 2)) ||
    ' elemento=' || (SELECT count(*) FROM elemento_lista WHERE lista_id = pg_temp.id('11', 1)) ||
    ' seguimiento=' || (SELECT count(*) FROM seguimiento WHERE pg_temp.id('c1', 2) IN (seguidor_id, seguido_id)) ||
    ' sesion=' || (SELECT count(*) FROM sesion WHERE usuario_id = pg_temp.id('c1', 2)));
SELECT pg_temp.registrar('O4-n3', 'O4: lo ajeno sobrevive: 13 resenas y 6 seguimientos entre los demas usuarios de la semilla; 7 usuarios', '7 usuarios; 13 resenas; 6 seguimientos',
    (SELECT count(*) FROM usuario) || ' usuarios; ' || (SELECT count(*) FROM resena) || ' resenas; ' || (SELECT count(*) FROM seguimiento) || ' seguimientos');
SELECT pg_temp.registrar('O4-n4', 'O4: queda el evento usuario_eliminado con el id de Ana', 'usuario_eliminado ' || pg_temp.id('c1', 2)::text,
    (SELECT tipo_evento || ' ' || (payload->>'usuario_id') FROM sync_outbox WHERE tipo_evento = 'usuario_eliminado'));
SELECT pg_temp.registrar('O4-n5', 'O4: el promedio guardado coincide con el recalculo en todas las obras', '0 discrepancias',
    (SELECT count(*) || ' discrepancias' FROM pg_temp.discrepantes()));

-- ---------------------------------------------------------------- resultados
\o
SELECT prueba AS caso, descripcion, esperado, obtenido, CASE WHEN ok THEN 'PASA' ELSE 'FALLA' END AS resultado
FROM resultado ORDER BY orden;

SELECT count(*) FILTER (WHERE ok)     AS pasan,
       count(*) FILTER (WHERE NOT ok) AS fallan,
       count(*)                       AS total
FROM resultado;

SELECT operacion, count(*) AS casos,
       count(*) FILTER (WHERE prueba ~ '-n[0-9]+$') AS normales,
       count(*) FILTER (WHERE prueba ~ '-l[0-9]+$') AS limite,
       count(*) FILTER (WHERE prueba ~ '-e[0-9]+$') AS error
FROM (SELECT split_part(prueba, '-', 1) AS operacion, prueba FROM resultado) q
GROUP BY operacion ORDER BY substring(operacion from 2)::int;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM resultado WHERE NOT ok) THEN
        RAISE EXCEPTION 'Hay casos con resultado distinto del esperado';
    END IF;
END $$;

ROLLBACK;
