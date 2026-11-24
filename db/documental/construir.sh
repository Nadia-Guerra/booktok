#!/bin/sh
# Construye la base documental: colecciones con validador e índices (y la semilla si existe).
#   docker exec dlbp-mongo sh /db/documental/construir.sh
set -eu

DIR=/db/documental
for f in 01-colecciones.js 02-indices.js 03-semilla.js; do
    if [ -f "$DIR/$f" ]; then
        echo "-> $f"
        sh "$DIR/mongo.sh" "$f"
    fi
done
echo "Base documental construida."
