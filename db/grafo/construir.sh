#!/bin/sh
# Construye el grafo: restricciones e índice (y la semilla si existe).
# Se ejecuta en el contenedor cliente:
#   docker compose run --rm --no-deps -T neo4j-cliente /db/grafo/construir.sh
# Un cypher-shell por archivo (cada uno es una JVM): se ejecutan en secuencia, nunca en paralelo.
set -eu

DIR=/db/grafo
for f in 01-restricciones.cypher 02-semilla.cypher; do
    if [ -f "$DIR/$f" ]; then
        echo "-> $f"
        sh "$DIR/cypher.sh" "$f"
    fi
done
echo "Grafo construido."
