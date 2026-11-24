#!/bin/sh
# =============================================================================
# Prueba 15 (y D-02): publicación concurrente de reseñas sobre la misma obra.
# Fuente: docs/modelado/relacional/02-restricciones-integridad.md, secciones 7 y 9.
#
# Se ejecuta DENTRO del contenedor de PostgreSQL, desde un solo script que lanza varias
# sesiones de psql a la vez (no muchos `docker exec`):
#   docker exec dlbp-postgres sh /db/relacional/pruebas/03-concurrencia.sh
#
# 15a  Dos sesiones solapadas a propósito: A inserta y retiene la transacción 3 s; B
#      empieza 1 s después. B debe ESPERAR el bloqueo (D-02) y, al terminar, total = 2 y
#      promedio = recálculo manual.
# 15b  Ráfaga: 8 sesiones publican a la vez sobre la misma obra. Sin errores y con
#      resultado = recálculo manual.
# 15c  CONTROL (informativo): el trigger SIN bloqueo, en un esquema aparte, pierde una
#      actualización. Demuestra que 15a detecta el problema que D-02 evita.
# 15d  CONTROL (informativo): el trigger con FOR UPDATE (la redacción original de D-02)
#      sufre interbloqueos en la ráfaga, porque el INSERT ya tomó FOR KEY SHARE sobre la
#      fila de la obra por la llave foránea. Por eso el trigger real usa FOR NO KEY UPDATE
#      (ver D-38 en docs/decisiones_tomadas.md).
#
# Las comprobaciones 15a y 15b deciden el código de salida (0 pasa, 1 falla); 15c y 15d
# solo informan.
# =============================================================================
set -u

PSQL="psql -q -X -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1"
PSQLV="psql -q -At -X -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1"
TMP=/tmp/conc15
mkdir -p "$TMP"

OBRA=ffffffff-0000-4000-8000-000000000001
uid() { printf 'ffffffff-0000-4000-8000-%012d' "$1"; }   # usuarios: 101..108
rid() { printf 'ffffffff-0000-4000-8000-%012d' "$1"; }   # reseñas: 201..208

FALLAS=0
informar() {   # informar PASA|FALLA|INFO id descripción [detalle]
    printf '%-6s %-9s %s\n' "$1" "$2" "$3"
    if [ -n "${4:-}" ]; then printf '                  %s\n' "$4"; fi
    if [ "$1" = "FALLA" ]; then FALLAS=$((FALLAS + 1)); fi
}

limpiar() {
    $PSQL -c "DROP SCHEMA IF EXISTS ctl_sin_bloqueo, ctl_for_update CASCADE" >/dev/null 2>&1
    $PSQL -c "DELETE FROM usuario WHERE usuario_id::text LIKE 'ffffffff-0000-4000-8000-%'" >/dev/null 2>&1
    $PSQL -c "DELETE FROM obra_resumen WHERE obra_id = '$OBRA'" >/dev/null 2>&1
    rm -rf "$TMP"
}
trap limpiar EXIT
limpiar
mkdir -p "$TMP"

# Resultado del trigger y recálculo manual, en el mismo formato. $1 = esquema.
leer_resumen()   { $PSQLV -c "SELECT 'total=' || total_resenas || ' promedio=' || coalesce(promedio::text, '(nulo)') FROM $1.obra_resumen WHERE obra_id = '$OBRA'"; }
leer_recalculo() { $PSQLV -c "SELECT 'total=' || count(*) || ' promedio=' || coalesce(round(avg(calificacion), 2)::text, '(nulo)') FROM $1.resena WHERE obra_id = '$OBRA' AND NOT oculta"; }

# Escribe los scripts de las sesiones A y B contra el esquema $1
escribir_ab() {
    cat > "$TMP/a.sql" <<EOF
BEGIN;
INSERT INTO $1.resena (resena_id, usuario_id, obra_id, calificacion) VALUES ('$(rid 201)', '$(uid 101)', '$OBRA', 5);
SELECT pg_sleep(3);
COMMIT;
EOF
    cat > "$TMP/b.sql" <<EOF
SELECT clock_timestamp() AS t0 \gset
BEGIN;
INSERT INTO $1.resena (resena_id, usuario_id, obra_id, calificacion) VALUES ('$(rid 202)', '$(uid 102)', '$OBRA', 2);
COMMIT;
SELECT round(extract(epoch FROM clock_timestamp() - :'t0'::timestamptz)::numeric, 1);
EOF
}

# Lanza A, espera 1 s, lanza B; deja la espera de B (s) en $TMP/espera
carrera_ab() {
    $PSQL -o /dev/null -f "$TMP/a.sql" &
    PID_A=$!
    sleep 1
    $PSQLV -f "$TMP/b.sql" > "$TMP/espera" &
    PID_B=$!
    wait $PID_A; wait $PID_B
}

# Ráfaga: 8 sesiones a la vez sobre el esquema $1. Los errores quedan en $TMP/rafaga.err
rafaga() {
    : > "$TMP/rafaga.err"
    PIDS=""
    i=0
    for n in 101 102 103 104 105 106 107 108; do
        i=$((i + 1))
        CAL=$(( (i * 2) % 5 + 1 ))      # calificaciones 3,5,2,4,1,3,5,2: mezcla variada
        cat > "$TMP/r$n.sql" <<EOF
BEGIN;
INSERT INTO $1.resena (resena_id, usuario_id, obra_id, calificacion) VALUES ('$(rid $((n + 100)))', '$(uid $n)', '$OBRA', $CAL);
SELECT pg_sleep(0.3);
COMMIT;
EOF
        $PSQL -o /dev/null -f "$TMP/r$n.sql" 2>> "$TMP/rafaga.err" &
        PIDS="$PIDS $!"
    done
    for p in $PIDS; do wait "$p"; done
}

# Copia del trigger en un esquema aparte, con la cláusula de bloqueo $2 (puede ir vacía).
# La copia lleva la llave foránea hacia su obra_resumen, porque el interbloqueo nace de ella.
crear_control() {
    cat <<'EOF' | sed -e "s/@ESQ@/$1/g" -e "s/@BLOQUEO@/$2/g" | $PSQL
CREATE SCHEMA @ESQ@;
CREATE TABLE @ESQ@.obra_resumen (LIKE public.obra_resumen INCLUDING ALL);
CREATE TABLE @ESQ@.resena (LIKE public.resena INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
ALTER TABLE @ESQ@.resena ADD CONSTRAINT fk_ctl_obra FOREIGN KEY (obra_id) REFERENCES @ESQ@.obra_resumen (obra_id);
CREATE FUNCTION @ESQ@.fn_recalcular_promedio() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    @BLOQUEO@
    UPDATE @ESQ@.obra_resumen o
       SET total_resenas = s.total, promedio = s.prom
      FROM (SELECT count(*)::int AS total, round(avg(calificacion), 2) AS prom
              FROM @ESQ@.resena WHERE obra_id = NEW.obra_id AND NOT oculta) s
     WHERE o.obra_id = NEW.obra_id;
    RETURN NULL;
END $$;
CREATE TRIGGER trg_ctl AFTER INSERT ON @ESQ@.resena
    FOR EACH ROW EXECUTE FUNCTION @ESQ@.fn_recalcular_promedio();
EOF
    $PSQL -c "INSERT INTO $1.obra_resumen (obra_id, tipo) VALUES ('$OBRA', 'libro')"
}

# ---------------------------------------------------------------- preparación
$PSQL -c "INSERT INTO obra_resumen (obra_id, tipo) VALUES ('$OBRA', 'libro')"
for n in 101 102 103 104 105 106 107 108; do
    $PSQL -c "INSERT INTO usuario (usuario_id, correo, password_hash, nombre)
              VALUES ('$(uid $n)', 'conc$n@ejemplo.test', 'hash', 'Concurrente $n')"
done

# ------------------------------------------------- 15a: dos sesiones solapadas
escribir_ab public
carrera_ab
ESPERA=$(tr -d ' \n' < "$TMP/espera")
OBTENIDO=$(leer_resumen public); ESPERADO=$(leer_recalculo public)
if [ "$OBTENIDO" = "total=2 promedio=3.50" ] && [ "$OBTENIDO" = "$ESPERADO" ]; then
    informar PASA 15a "Dos reseñas simultáneas: $OBTENIDO (= recálculo manual)"
else
    informar FALLA 15a "Dos reseñas simultáneas" "obtenido: $OBTENIDO | recálculo manual: $ESPERADO | esperado: total=2 promedio=3.50"
fi
# B empezó 1 s después de A y A retuvo 3 s: si B no esperó, el bloqueo de D-02 no está actuando.
if awk "BEGIN { exit !(${ESPERA:-0} >= 1.5) }"; then
    informar PASA 15a-espera "La sesión B esperó el bloqueo de la fila de obra_resumen" "B tardó ${ESPERA} s en confirmar (A retuvo la transacción 3 s)"
else
    informar FALLA 15a-espera "La sesión B no esperó el bloqueo" "B tardó ${ESPERA:-?} s; se esperaba 1,5 s o más"
fi

# ----------------------------------------------------- 15b: ráfaga de 8 sesiones
$PSQL -c "DELETE FROM resena WHERE obra_id = '$OBRA'"
rafaga public
OBTENIDO=$(leer_resumen public); ESPERADO=$(leer_recalculo public)
ERRORES=$(grep -c 'ERROR' "$TMP/rafaga.err")
if [ "$ERRORES" -eq 0 ] && [ "$OBTENIDO" = "$ESPERADO" ] && [ "${OBTENIDO#total=8 }" != "$OBTENIDO" ]; then
    informar PASA 15b "Ráfaga de 8 sesiones sobre la misma obra: $OBTENIDO (= recálculo manual), sin errores"
else
    informar FALLA 15b "Ráfaga de 8 sesiones" "obtenido: $OBTENIDO | recálculo manual: $ESPERADO | errores: $ERRORES (esperado: total=8, 0 errores)"
    grep -m2 'ERROR\|DETAIL' "$TMP/rafaga.err" | sed 's/^/                  /'
fi

# -------------------------------------------- 15c: control, trigger sin bloqueo
crear_control ctl_sin_bloqueo ''
escribir_ab ctl_sin_bloqueo
carrera_ab
CTL=$(leer_resumen ctl_sin_bloqueo)
if [ "$CTL" = "total=2 promedio=3.50" ]; then
    informar INFO 15c "Control sin bloqueo: esta vez el motor no perdió la actualización ($CTL)" "No invalida 15a ni 15b."
else
    informar INFO 15c "Control sin bloqueo: resultado INCORRECTO, como se preveía: $CTL" "Lo correcto sería total=2 promedio=3.50. Es lo que evita el bloqueo de D-02."
fi

# ------------------------------- 15d: control, trigger con FOR UPDATE (interbloqueo)
$PSQL -c "DELETE FROM ctl_sin_bloqueo.resena" >/dev/null
crear_control ctl_for_update 'PERFORM 1 FROM ctl_for_update.obra_resumen WHERE obra_id = NEW.obra_id FOR UPDATE;'
rafaga ctl_for_update
INTERBLOQUEOS=$(grep -c 'deadlock detected' "$TMP/rafaga.err")
CTL=$(leer_resumen ctl_for_update)
if [ "$INTERBLOQUEOS" -gt 0 ]; then
    informar INFO 15d "Control con FOR UPDATE: $INTERBLOQUEOS sesiones abortadas por interbloqueo en la ráfaga de 8" "Con FOR NO KEY UPDATE (el trigger real) la misma ráfaga termina sin errores (15b)."
else
    informar INFO 15d "Control con FOR UPDATE: esta vez no hubo interbloqueos ($CTL)" "El interbloqueo depende del solapamiento exacto; 15b sigue siendo la comprobación válida."
fi

echo
if [ "$FALLAS" -eq 0 ]; then echo "Prueba 15: PASA (15a, 15a-espera, 15b)"; exit 0; fi
echo "Prueba 15: FALLA ($FALLAS comprobaciones)"; exit 1
