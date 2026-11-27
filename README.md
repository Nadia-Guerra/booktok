# DuoBook

Reseñas de libros y de sus adaptaciones al cine. App Android, API REST y tres bases de datos (PostgreSQL, MongoDB y Neo4j). El diseño está en `docs/`, las bases en `db/` (ver `db/README.md`) y las pruebas en `test/`.

| Carpeta | Contenido |
|---|---|
| `backend/` | API (Express 5, TypeScript sobre Node 24): `src/rutas`, `servicios` y `repositorios`; pruebas en `test/` |
| `frontend/` | App Android (Expo) |
| `shared/` | Esquemas Zod y tipos que usan las dos |
| `db/` | Esquemas, semilla, consultas y pruebas de cada base |
| `docs/` | Requerimientos, modelado, arquitectura, decisiones y contrato de la API (`docs/api/`) |
| `test/` | Plan de pruebas, resultados, evidencias y medición de rendimiento |

## Requisitos

| Qué | Para qué | Cómo comprobarlo |
|---|---|---|
| Windows 10 u 11 con PowerShell 5.1 | Los scripts de las bases son de PowerShell | |
| Git | Clonar el repositorio | `git --version` |
| **Node 24** (no sirve una versión anterior) | API, app y pruebas | `node --version` |
| Docker Desktop, abierto | Las tres bases y la API | `docker version` |
| `cloudflared` | Llegar desde el teléfono | `cloudflared --version` |
| Expo Go al día (compatible con Expo SDK 58) en un teléfono Android | La app | |

Se desarrolló con 6 GB de RAM, de los que Docker usa unos 3 GB. La primera vez se descargan las imágenes de Docker y las dependencias, así que tarda.

## Instalación (una sola vez)

1. Clona el repositorio y entra en su carpeta:

```powershell
git clone https://github.com/Nadia-Guerra/booktok.git
```

```powershell
cd booktok
```

2. Si Windows no deja ejecutar scripts (`la ejecución de scripts está deshabilitada`), permítelo **solo en esa ventana**:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

3. Crea tu configuración y cambia las claves del archivo `.env` (no se versiona):

```powershell
Copy-Item .env.example .env
```

4. Instala las dependencias:

```powershell
npm ci
```

5. Crea las tres bases y carga los datos de prueba. **Borra lo que hubiera en las bases de este proyecto** (no toca otros contenedores) y pide confirmación:

```powershell
.\db\scripts\reconstruir.ps1 -SinPruebas
```

Sin `-SinPruebas` además corre las pruebas de cada base (unos 4 minutos en total). El script reescribe su evidencia en `db/evidencias/reconstruccion/`. Los usuarios de prueba y su contraseña están en `db/semilla/README.md`.

6. Levanta la API y compruébala. Debe responder `"estado":"ok"` con las tres bases:

```powershell
docker compose --profile api up -d --wait --build
```

```powershell
curl.exe http://127.0.0.1:3000/api/v1/salud
```

## Uso diario

Las bases se levantan **de una en una**, y después la API:

```powershell
docker compose --profile postgres up -d --wait
```

```powershell
docker compose --profile mongo up -d --wait
```

```powershell
docker compose --profile neo4j up -d --wait
```

```powershell
docker compose --profile api up -d --wait
```

Para desarrollar, en lugar del contenedor puede usarse `npm run api` (reinicia al guardar). No uses los dos a la vez: ocupan el mismo puerto y solo debe haber una copia de la API.

La API lleva dentro el *worker* que copia los cambios a las otras bases (`sync_outbox`). Si Neo4j no responde, los eventos esperan y se aplican cuando vuelve. Uno que falla por sí mismo cinco veces queda como `fallido`.

## Llegar desde el teléfono

Abre el túnel y copia la dirección `https://….trycloudflare.com` que imprime. Cambia cada vez que se abre. Mientras esté abierto, la API es accesible desde internet: ciérralo con `Ctrl+C` al terminar.

```powershell
cloudflared tunnel --url http://localhost:3000
```

En otra terminal, arranca la app y abre el código QR con Expo Go (teléfono y computadora en la misma red):

```powershell
npm run app
```

En la app, entra en **Perfil → Conexión con la API**, pega la dirección del túnel y toca **Guardar y probar**.

## Despliegue

El proyecto se despliega en local: los pasos de arriba levantan las tres bases y la API en Docker, y la app se abre desde un teléfono.

## Pruebas

El plan y los resultados están en [test/plan-de-pruebas.md](test/plan-de-pruebas.md) y [test/resultados.md](test/resultados.md).

Sin bases (sirven recién clonado):

```powershell
npm run typecheck
```

```powershell
npm test --workspace frontend
```

```powershell
npm run test:unitarias --workspace backend
```

Todas las de la API. Necesitan las tres bases levantadas con la semilla y la API detenida, porque su *worker* se llevaría los eventos de las pruebas:

```powershell
docker compose stop api
```

```powershell
npm test
```

```powershell
docker compose --profile api up -d --wait
```

Con las bases y la API levantadas:

| Qué | Comando |
|---|---|
| Coherencia entre las tres bases | `.\db\scripts\coherencia.ps1` |
| Diferencias entre PostgreSQL y el grafo (`-- --corregir` las repara) | `npm run reconciliar --workspace backend` |
| Tiempos de los flujos principales | `node test/rendimiento/medir.mjs` |

## Problemas frecuentes

| Síntoma | Qué hacer |
|---|---|
| Expo dice que Node está desactualizado, o las pruebas `.ts` no arrancan | `node --version` no es 24 en esa terminal |
| La app no llega a la API | La dirección del túnel cambió: ábrelo de nuevo y guárdala en la app |
| La primera búsqueda de recomendaciones tarda varios segundos | Neo4j recién arrancado; las siguientes son rápidas |
| `coherencia.ps1` falla después de probar las bases | `.\db\scripts\cargar-semilla.ps1` (vacía y recarga las tres) |
| Docker se reinicia o va muy lento | Falta memoria: cierra otros proyectos y levanta las bases de una en una |
