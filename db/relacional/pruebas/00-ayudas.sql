-- =============================================================================
-- Ayudas comunes de las pruebas relacionales. Se incluyen con \ir desde cada prueba.
-- Todo es temporal (pg_temp): vive solo en la sesión de psql que lo carga.
-- =============================================================================

CREATE TEMP TABLE IF NOT EXISTS resultado (
    orden       SERIAL,
    prueba      TEXT,
    descripcion TEXT,
    esperado    TEXT,
    obtenido    TEXT,
    ok          BOOLEAN
);

-- UUID legible y reproducible: uid(7) = 00000000-0000-4000-8000-000000000007
CREATE FUNCTION pg_temp.uid(n INT) RETURNS UUID LANGUAGE sql IMMUTABLE AS
$$ SELECT ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;

-- Ejecuta una sentencia; devuelve 'sin_error' o 'SQLSTATE restricción'.
CREATE FUNCTION pg_temp.intentar(sentencia TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_restriccion TEXT;
BEGIN
    EXECUTE sentencia;
    RETURN 'sin_error';
EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_restriccion = CONSTRAINT_NAME;
    RETURN trim(SQLSTATE || ' ' || coalesce(v_restriccion, ''));
END $$;

CREATE FUNCTION pg_temp.registrar(p_prueba TEXT, p_desc TEXT, p_esperado TEXT, p_obtenido TEXT)
RETURNS VOID LANGUAGE sql AS $$
    INSERT INTO resultado (prueba, descripcion, esperado, obtenido, ok)
    VALUES (p_prueba, p_desc, p_esperado, p_obtenido, p_esperado IS NOT DISTINCT FROM p_obtenido)
$$;

-- Estado de una obra en el formato 'total=N promedio=X'
CREATE FUNCTION pg_temp.resumen(p_obra UUID) RETURNS TEXT LANGUAGE sql AS $$
    SELECT 'total=' || total_resenas || ' promedio=' || coalesce(promedio::text, '(nulo)')
    FROM obra_resumen WHERE obra_id = p_obra
$$;

-- Recálculo manual, independiente del trigger, en el mismo formato
CREATE FUNCTION pg_temp.recalculo(p_obra UUID) RETURNS TEXT LANGUAGE sql AS $$
    SELECT 'total=' || count(*) || ' promedio=' || coalesce(round(avg(calificacion), 2)::text, '(nulo)')
    FROM resena WHERE obra_id = p_obra AND NOT oculta
$$;
