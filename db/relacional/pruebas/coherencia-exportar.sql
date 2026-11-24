-- =============================================================================
-- Exporta de PostgreSQL lo que db/scripts/coherencia.ps1 compara con las otras dos bases.
-- Solo lee. Cada sección empieza con una línea "#nombre"; las filas van separadas por "|".
-- Ejecutar con: sh /db/relacional/pruebas/psql.sh coherencia-exportar.sql
-- =============================================================================

\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on
\pset fieldsep '|'
\pset null ''

\echo #usuarios
SELECT usuario_id, rol FROM usuario ORDER BY usuario_id;

\echo #obras
SELECT obra_id, tipo, promedio, total_resenas FROM obra_resumen ORDER BY obra_id;

\echo #recalculo
SELECT o.obra_id, count(r.resena_id), round(avg(r.calificacion), 2)
FROM obra_resumen o
LEFT JOIN resena r ON r.obra_id = o.obra_id AND NOT r.oculta
GROUP BY o.obra_id ORDER BY o.obra_id;

\echo #seguimiento
SELECT seguidor_id, seguido_id FROM seguimiento ORDER BY 1, 2;

\echo #leyo
SELECT e.usuario_id, e.obra_id
FROM estado_obra e JOIN obra_resumen o ON o.obra_id = e.obra_id
WHERE e.estado = 'terminada' AND o.tipo = 'libro'
ORDER BY 1, 2;

\echo #obras_con_actividad
SELECT DISTINCT obra_id FROM (
    SELECT obra_id FROM resena UNION ALL SELECT obra_id FROM estado_obra UNION ALL SELECT obra_id FROM elemento_lista
) x ORDER BY 1;

-- Todas las columnas UUID de la base, escritas como texto: ninguna debe tener mayúsculas ni otro formato.
\echo #ids_mal_formados
SELECT format('SELECT %L, count(*) FROM %I WHERE %I::text !~ %L',
              table_name || '.' || column_name, table_name, column_name,
              '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
FROM information_schema.columns
WHERE table_schema = 'public' AND data_type = 'uuid'
ORDER BY table_name, column_name
\gexec
