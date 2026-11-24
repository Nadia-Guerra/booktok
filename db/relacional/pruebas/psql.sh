#!/bin/sh
# Ejecuta un archivo SQL de esta carpeta con las credenciales del contenedor.
# Uso (dentro del contenedor): sh /db/relacional/pruebas/psql.sh 01-integridad.sql
# Termina con el código de psql: 3 si una prueba falla (RAISE EXCEPTION al final del archivo).
set -eu
exec psql -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f "/db/relacional/pruebas/$1"
