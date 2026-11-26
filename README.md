# Del Libro a la Pantalla

Reseñas de libros y de sus adaptaciones al cine. App Android, API REST y tres bases de datos (PostgreSQL, MongoDB y Neo4j). El diseño está en `docs/` y las bases en `db/` (ver `db/README.md`).

| Carpeta | Contenido |
|---|---|
| `backend/` | API (Express 5, TypeScript sobre Node 24) |
| `frontend/` | App Android (Expo) |
| `shared/` | Esquemas Zod y tipos que usan las dos |

## Requisitos

Node 24, Docker Desktop, `cloudflared` y, en el teléfono, la app Expo Go.

## Puesta en marcha

1. Copia `.env.example` como `.env` y cambia las claves.
2. Instala las dependencias:

```powershell
npm install
```

3. Levanta las bases, de una en una:

```powershell
docker compose --profile postgres up -d --wait
```

```powershell
docker compose --profile mongo up -d --wait
```

```powershell
docker compose --profile neo4j up -d --wait
```

4. La primera vez, crea los esquemas y carga la semilla como explican `db/README.md` y `db/semilla/README.md`.
5. Levanta la API y compruébala:

```powershell
docker compose --profile api up -d --wait --build
```

```powershell
curl.exe http://127.0.0.1:3000/api/v1/salud
```

Para desarrollar, en lugar del contenedor puede usarse `npm run api` (reinicia al guardar). No uses los dos a la vez: ocupan el mismo puerto y solo debe haber una copia de la API.

La API lleva dentro el *worker* que copia los cambios a las otras bases (`sync_outbox`). Si Neo4j no responde, los eventos esperan y se aplican cuando vuelve. Uno que falla por sí mismo cinco veces queda como `fallido`.

## Llegar desde el teléfono

Abre el túnel y copia la dirección `https://….trycloudflare.com` que imprime. Mientras esté abierto, la API es accesible desde internet.

```powershell
cloudflared tunnel --url http://localhost:3000
```

Arranca la app y abre el código QR con Expo Go (teléfono y computadora en la misma red). En la app, entra en **Perfil → Conexión con la API**, pega la dirección del túnel y toca **Guardar y probar**.

```powershell
npm run app
```

## Comprobaciones

```powershell
npm run typecheck
```

Las pruebas de la app no necesitan las bases:

```powershell
npm test --workspace frontend
```

Las pruebas de la API necesitan las tres bases levantadas y la API detenida, porque su *worker* se llevaría los eventos de las pruebas:

```powershell
docker compose stop api
```

```powershell
npm test
```

```powershell
.\db\scripts\coherencia.ps1
```
