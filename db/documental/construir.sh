#!/bin/sh
# Construye la base documental: colecciones con validador e índices (y la semilla si existe).
#   docker exec dlbp-mongo sh /db/documental/construir.sh
set -eu

DIR=/db/documental
for f in 01-colecciones.js 02-indices.js 03-semilla.js; do
    # SIN_SEMILLA=1 (docker exec -e SIN_SEMILLA=1 ...): crea colecciones e índices sin cargar datos (db/scripts/reconstruir.ps1).
    if [ "${SIN_SEMILLA:-}" = 1 ]; then
        case "$f" in *semilla*) echo "-> $f (omitido: SIN_SEMILLA=1)"; continue ;; esac
    fi
    if [ -f "$DIR/$f" ]; then
        echo "-> $f"
        sh "$DIR/mongo.sh" "$f"
    fi
done
echo "Base documental construida."
