#!/bin/sh
# Crea el .env del servidor con claves nuevas al azar. Ninguna sale del servidor ni va al repositorio.
#   sh deploy/generar-env.sh 3-90-1-2.sslip.io
# No sobrescribe un .env que ya exista: las bases ya creadas conservan sus claves.
set -eu
cd "$(dirname "$0")/.."

DOMINIO="${1:-}"
DESTINO="${2:-.env}"
if [ -z "$DOMINIO" ]; then
    echo "Uso: sh deploy/generar-env.sh <dominio> [archivo]" >&2
    exit 1
fi
if [ -e "$DESTINO" ]; then
    echo "$DESTINO ya existe: no se toca." >&2
    exit 1
fi

clave() { od -An -N24 -tx1 /dev/urandom | tr -d ' \n'; }

umask 077
cat > "$DESTINO" <<EOF
# Generado por deploy/generar-env.sh. No lo subas al repositorio.
COMPOSE_FILE=docker-compose.yml:deploy/compose.prod.yml
COMPOSE_PATH_SEPARATOR=:
DOMINIO=$DOMINIO
API_PORT=3000

POSTGRES_VERSION=18.7
MONGO_VERSION=9.0.4
NEO4J_VERSION=5.26.34-community
CADDY_VERSION=2.11.9

POSTGRES_USER=dlbp
POSTGRES_PASSWORD=$(clave)
POSTGRES_DB=dlbp
POSTGRES_HOST_PORT=5433

MONGO_USER=dlbp
MONGO_PASSWORD=$(clave)
MONGO_DB=dlbp
MONGO_HOST_PORT=27017

NEO4J_USER=neo4j
NEO4J_PASSWORD=$(clave)
NEO4J_HTTP_HOST_PORT=7474
NEO4J_BOLT_HOST_PORT=7687

# Contrasena de TODOS los usuarios de ejemplo en este servidor (admin incluido).
CLAVE_SEMILLA=$(od -An -N9 -tx1 /dev/urandom | tr -d ' \n')
EOF

echo "Creado $DESTINO. Para ver la clave de los usuarios de ejemplo:  grep CLAVE_SEMILLA $DESTINO"
