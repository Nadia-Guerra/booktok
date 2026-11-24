#!/bin/sh
# Construye el esquema relacional: tablas, índices y trigger (y la semilla si existe).
# Se ejecuta DENTRO del contenedor de PostgreSQL, donde ./db está montado en /db:
#   docker exec dlbp-postgres sh /db/relacional/construir.sh
# Usa las variables POSTGRES_USER y POSTGRES_DB que el contenedor ya tiene.
set -eu

DIR=/db/relacional
PSQL="psql -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1 -q"

for f in 01-esquema.sql 02-indices.sql 03-trigger.sql 04-semilla.sql; do
    if [ -f "$DIR/$f" ]; then
        echo "-> $f"
        $PSQL -f "$DIR/$f"
    fi
done
echo "Esquema relacional construido."
