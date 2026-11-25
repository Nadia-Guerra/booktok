# API de Del Libro a la Pantalla. Se construye desde la raíz del repositorio (ver docker-compose.yml).
# Node 24 ejecuta TypeScript directamente (quita los tipos), así que no hay paso de compilación.
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
# npm exige conocer todos los workspaces del lockfile, aunque la app no se instale aquí.
COPY frontend/package.json frontend/
RUN npm ci --omit=dev --no-audit --no-fund --workspace @dlbp/backend --workspace @dlbp/shared

COPY shared/src shared/src
COPY backend/src backend/src
# El Cypher se lee de sus archivos: una sola copia para las pruebas de las bases y para la API.
COPY db/grafo/consultas db/grafo/consultas

USER node
EXPOSE 3000
# D-36: montículo de Node de 256 MB dentro de un contenedor de 384 MB.
CMD ["node", "--max-old-space-size=256", "backend/src/servidor.ts"]
