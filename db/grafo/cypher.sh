#!/bin/sh
# Ejecuta un archivo .cypher de db/grafo con cypher-shell contra el servidor Neo4j.
# Se ejecuta en el contenedor cliente (neo4j-cliente), que tiene su propio tope de memoria:
#   docker compose run --rm --no-deps -T neo4j-cliente /db/grafo/cypher.sh 01-restricciones.cypher
# Se detiene en el primer error y termina con código distinto de 0.
set -eu
exec cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" --format plain -f "/db/grafo/$1"
