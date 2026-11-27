#!/bin/sh
# Levanta todo en el servidor, una base cada vez (D-48). Sirve tambien para actualizar tras un git pull.
#   sh deploy/levantar.sh
set -eu
cd "$(dirname "$0")/.."

for base in postgres mongo neo4j; do
    docker compose --profile "$base" up -d --wait
done
docker compose --profile api up -d --wait --build
docker compose --profile todas up -d --wait --no-deps caddy
docker compose --profile todas ps
