#!/bin/sh
# Construye las tres bases con los datos de ejemplo y CAMBIA la contrasena de todos sus usuarios por
# CLAVE_SEMILLA del .env: la del repositorio es publica y no puede servir en un servidor.
# BORRA lo que hubiera en las bases del proyecto. Requiere haber ejecutado antes deploy/levantar.sh.
#   sh deploy/cargar-datos.sh           pide confirmacion
#   sh deploy/cargar-datos.sh --si      sin preguntar
set -eu
cd "$(dirname "$0")/.."

ENTORNO="${COMPOSE_ENV_FILES:-.env}"
CLAVE_SEMILLA="$(grep '^CLAVE_SEMILLA=' "$ENTORNO" | cut -d= -f2-)"
if [ "${#CLAVE_SEMILLA}" -lt 8 ]; then
    echo "Falta CLAVE_SEMILLA (8 caracteres o mas) en $ENTORNO." >&2
    exit 1
fi
export CLAVE_SEMILLA

if [ "${1:-}" != "--si" ]; then
    printf 'Esto BORRA los datos de las tres bases y carga los de ejemplo. Escribe SI: '
    read -r respuesta
    [ "$respuesta" = "SI" ] || { echo "Cancelado."; exit 1; }
fi

# La API no debe estar sincronizando mientras se vacian las bases.
docker compose --profile api stop api

echo "== PostgreSQL"
docker compose exec -T postgres sh /db/relacional/construir.sh

# Las claves nuevas se calculan con bcrypt, como las que crea la API (D-61), en un contenedor de un solo uso.
HASH="$(docker compose --profile api run --rm --no-deps -T -e CLAVE_SEMILLA api \
    node -e "import('bcrypt').then(async ({default: b}) => process.stdout.write(await b.hash(process.env.CLAVE_SEMILLA, 10)))" \
    </dev/null)"
case "$HASH" in
    '$2'*) ;;
    *) echo "No se pudo calcular la clave nueva; la API queda detenida." >&2; exit 1 ;;
esac
printf '%s\n' "UPDATE usuario SET password_hash = :'hash';" |
    docker compose exec -T -e HASH="$HASH" postgres sh -c \
        'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -v hash="$HASH"'

echo "== MongoDB"
docker compose exec -T mongo sh /db/documental/construir.sh </dev/null
echo "== Neo4j"
docker compose --profile herramientas run --rm --no-deps -T neo4j-cliente /db/grafo/construir.sh </dev/null

docker compose --profile api up -d --wait api
echo "Datos cargados. La contrasena de los usuarios de ejemplo es CLAVE_SEMILLA de $ENTORNO."
