#!/bin/sh
# Ejecuta un archivo .js de db/documental con mongosh, con las credenciales del contenedor.
# Se ejecuta DENTRO del contenedor de MongoDB, donde ./db está montado en /db:
#   docker exec dlbp-mongo sh /db/documental/mongo.sh 01-colecciones.js
#   docker exec dlbp-mongo sh /db/documental/mongo.sh pruebas/01-validacion.js
# Un solo proceso mongosh por archivo: cada uno es un Node entero y el contenedor tiene tope de 512 MB.
# Termina con el código de mongosh (las pruebas hacen quit(1) si alguna falla).
set -eu
exec mongosh --quiet \
    -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin \
    "$MONGO_INITDB_DATABASE" --file "/db/documental/$1"
