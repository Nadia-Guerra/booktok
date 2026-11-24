-- =============================================================================
-- 03-trigger.sql: trigger que mantiene promedio y total_resenas (RN-08).
-- Diseño: docs/modelado/relacional/02-restricciones-integridad.md, sección 7, y D-02.
--
-- Por qué existe: el promedio es un dato derivado de `resena`. La cascada de RF-04
-- borra reseñas sin pasar por la aplicación, así que solo un trigger lo corrige
-- en todos los casos.
--
-- D-02: PRIMERO bloquea la fila de obra_resumen y DESPUÉS recalcula. Son dos
-- sentencias distintas a propósito: en READ COMMITTED (el nivel por defecto) cada
-- sentencia de PL/pgSQL toma una instantánea nueva, así que el recálculo ve las
-- reseñas que la transacción anterior ya confirmó mientras esta esperaba el bloqueo.
-- Si se fusionaran en una sola, la segunda reseña usaría datos viejos.
--
-- El bloqueo es FOR NO KEY UPDATE y NO FOR UPDATE (corrección D-38, probada en el motor):
-- el INSERT en `resena` ya tomó FOR KEY SHARE sobre la fila de obra_resumen al comprobar
-- la llave foránea. FOR UPDATE choca con FOR KEY SHARE, así que dos reseñas simultáneas
-- de la misma obra quedaban cada una esperando a la otra (interbloqueo; 6 de 8 sesiones
-- abortadas en la prueba 15b). FOR NO KEY UPDATE no choca con KEY SHARE, pero sí con otro
-- NO KEY UPDATE, de modo que las reseñas se serializan sin interbloqueo. Bloquea lo mismo
-- que necesita este trigger: el UPDATE posterior solo toca columnas que no son la clave.
-- =============================================================================

\set ON_ERROR_STOP on
SET client_min_messages = warning;

CREATE OR REPLACE FUNCTION fn_recalcular_promedio() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_obra UUID;
BEGIN
    -- usuario_id y obra_id de una reseña no cambian nunca (ids inmutables),
    -- así que en UPDATE OLD.obra_id = NEW.obra_id.
    v_obra := CASE WHEN TG_OP = 'DELETE' THEN OLD.obra_id ELSE NEW.obra_id END;

    -- 1) Bloquear la fila de la obra. Una segunda reseña de la misma obra espera aquí.
    PERFORM 1 FROM obra_resumen WHERE obra_id = v_obra FOR NO KEY UPDATE;

    -- 2) Recalcular desde las reseñas vigentes (no ocultas), nunca por incremento.
    UPDATE obra_resumen o
       SET total_resenas = s.total,
           promedio      = s.prom
      FROM (SELECT count(*)::int                   AS total,
                   round(avg(calificacion), 2)     AS prom
              FROM resena
             WHERE obra_id = v_obra AND NOT oculta) s
     WHERE o.obra_id = v_obra;

    RETURN NULL;   -- trigger AFTER: el valor de retorno se ignora
END;
$$;

DROP TRIGGER IF EXISTS trg_resena_promedio ON resena;

-- Se ejecuta por cada fila, después de la operación. En UPDATE solo si cambia la
-- calificación o `oculta`. Los DELETE que llegan por cascada (RF-04) también lo disparan.
CREATE TRIGGER trg_resena_promedio
    AFTER INSERT OR DELETE OR UPDATE OF calificacion, oculta ON resena
    FOR EACH ROW EXECUTE FUNCTION fn_recalcular_promedio();
