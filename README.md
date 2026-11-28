# DuoBook

Reseñas de libros y de sus adaptaciones al cine. Una aplicación Android, una API y tres bases de datos (PostgreSQL, MongoDB y Neo4j).

Esta guía lleva desde una computadora recién preparada hasta usar la aplicación en un teléfono. Sigue los pasos **en orden**.

- [Qué vas a tener al final](#qué-vas-a-tener-al-final)
- [Paso 0. Instalar los programas](#paso-0-instalar-los-programas-una-sola-vez)
- [Parte 1. Levantar las bases y la API](#parte-1-levantar-las-bases-y-la-api-terminal-1)
- [Parte 2. Abrir el puente para el teléfono](#parte-2-abrir-el-puente-para-el-teléfono-terminal-2)
- [Parte 3. Abrir la aplicación](#parte-3-abrir-la-aplicación-terminal-3)
- [Parte 4. Probarla](#parte-4-probarla)
- [Apagar todo](#apagar-todo) y [volver a usarlo](#volver-a-usarlo-otro-día)
- [Pruebas](#pruebas), [problemas frecuentes](#problemas-frecuentes) y [qué hay en cada carpeta](#qué-hay-en-cada-carpeta)

## Qué vas a tener al final

Vas a usar **tres terminales** (ventanas de PowerShell) abiertas a la vez:

| Terminal | Para qué | ¿Se queda ocupada? |
|---|---|---|
| 1 | Instalar y levantar las bases y la API | No, después puedes seguir escribiendo en ella |
| 2 | El puente entre el teléfono y la API | **Sí. No la cierres** |
| 3 | La aplicación (Expo) | **Sí. No la cierres** |

```
teléfono (Expo Go) --internet--> puente (terminal 2) --> API (Docker) --> PostgreSQL | MongoDB | Neo4j
teléfono (Expo Go) --tu red Wi-Fi--> Expo (terminal 3), que le entrega la aplicación
```

## Paso 0. Instalar los programas (una sola vez)

Necesitas una computadora con **Windows 10 u 11**, unos 6 GB de RAM y varios GB libres en disco, y un **teléfono Android**.

**Cómo abrir una terminal:** pulsa la tecla Windows, escribe `PowerShell` y pulsa `Enter`. Se abre una ventana donde se escriben los comandos. En esta guía, cada recuadro es un comando: cópialo, pégalo en la terminal (clic derecho pega) y pulsa `Enter`. **Espera a que termine antes de escribir el siguiente.**

Instala lo que te falte:

| Programa | Cómo instalarlo |
|---|---|
| Git | En la terminal: `winget install --id Git.Git` |
| **Node.js 24** | Desde [nodejs.org](https://nodejs.org/en/download), eligiendo la **versión 24** y el instalador para Windows |
| Docker Desktop | En la terminal: `winget install --id Docker.DockerDesktop`. Puede pedir reiniciar |
| cloudflared | En la terminal: `winget install --id Cloudflare.cloudflared` |
| Expo Go | En el teléfono, desde Google Play. Debe estar actualizado |

Después de instalar, **cierra todas las terminales y abre una nueva**. Comprueba que los cuatro responden con un número de versión:

```powershell
git --version
```

```powershell
node --version
```

Debe empezar con `v24`. Con una versión anterior el proyecto no funciona.

```powershell
docker --version
```

```powershell
cloudflared --version
```

## Parte 1. Levantar las bases y la API (terminal 1)

### 1.1 Abre Docker Desktop

Búscalo en el menú de Windows y ábrelo. La primera vez acepta los términos. **Espera hasta que abajo a la izquierda diga `Engine running`.** Déjalo abierto mientras uses el proyecto.

### 1.2 Abre la terminal 1 y permite ejecutar scripts

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

No muestra nada. Solo vale para esa ventana: **repítelo en cada terminal nueva.** Sin esto, Windows puede negarse a ejecutar `npm` y los scripts del proyecto.

### 1.3 Descarga el proyecto

Elige una carpeta, por ejemplo Documentos:

```powershell
cd $HOME\Documents
```

```powershell
git clone https://github.com/Nadia-Guerra/booktok.git
```

Entra en la carpeta que se creó. **Todos los comandos siguientes se escriben desde aquí:**

```powershell
cd booktok
```

### 1.4 Crea el archivo de configuración

```powershell
Copy-Item .env.example .env
```

Ese archivo `.env` guarda las claves de las bases y no se sube a Git. Para probar en tu computadora puedes dejarlo como está. Si quieres cambiar las claves, hazlo **ahora**, antes de crear las bases:

```powershell
notepad .env
```

### 1.5 Instala las dependencias

```powershell
npm ci
```

Tarda unos minutos. Termina con un mensaje como `added 644 packages`.

### 1.6 Crea las tres bases y carga los datos de ejemplo

```powershell
.\db\scripts\reconstruir.ps1 -SinPruebas
```

El script avisa que **borra lo que hubiera en las bases de este proyecto** (no toca otros contenedores de Docker). Escribe `SI`, en mayúsculas, y pulsa `Enter`.

La primera vez descarga PostgreSQL, MongoDB y Neo4j, así que tarda bastante (con ellas ya descargadas, unos 3 minutos). El script guarda además sus registros en `db/evidencias/`, así que Git mostrará archivos cambiados ahí: es normal y no afecta al funcionamiento. Al final debe decir:

```
Reconstruccion completa. Las tres bases quedan levantadas y con la semilla cargada.
```

Si algún paso dice `FALLA`, mira [problemas frecuentes](#problemas-frecuentes).

### 1.7 Levanta la API

```powershell
docker compose --profile api up -d --wait --build
```

Al terminar, cada contenedor debe aparecer como `Healthy`.

### 1.8 Comprueba que todo responde

```powershell
curl.exe http://127.0.0.1:3000/api/v1/salud
```

Debe responder exactamente esto:

```
{"estado":"ok","api":"ok","bases":{"postgres":"ok","mongo":"ok","neo4j":"ok"}}
```

Si lo ves, la parte del servidor está lista.

## Parte 2. Abrir el puente para el teléfono (terminal 2)

Android solo permite conexiones seguras (`https`), y la API está en tu computadora. El puente le da una dirección segura y temporal.

**Abre otra terminal** (deja la primera como está) y escribe:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Aparecen muchas líneas. Busca un recuadro con una dirección parecida a esta:

```
https://palabras-al-azar-aqui.trycloudflare.com
```

**Cópiala**, la usarás en la parte 3. Para comprobarla, ábrela en el navegador agregando `/api/v1/salud` al final: debe mostrar el mismo `"estado":"ok"`.

- No cierres esta terminal: si la cierras, el puente desaparece.
- La dirección **cambia cada vez** que abres el puente.
- Mientras esté abierto, cualquiera que conozca la dirección puede llegar a tu API. Ciérralo al terminar.

## Parte 3. Abrir la aplicación (terminal 3)

El teléfono y la computadora deben estar en **la misma red Wi-Fi**.

**Abre una tercera terminal** y escribe, uno por uno:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

```powershell
cd $HOME\Documents\booktok
```

```powershell
npm run app
```

Tarda un poco y muestra un **código QR**. Si Windows pregunta si permite a Node usar la red, acepta para redes privadas.

En el teléfono:

1. Abre **Expo Go** y toca **Scan QR code**.
2. Escanea el código de la terminal 3. La primera carga tarda uno o varios minutos.
3. Cuando abra la aplicación, ve a **Perfil → Conexión con la API**.
4. Pega la dirección que copiaste en la parte 2 (puedes mandártela por mensaje a ti).
5. Toca **Guardar y probar**. Deben aparecer **API, PostgreSQL, MongoDB y Neo4j** como disponibles.

### Sobre la pantalla "Conexión con la API"

Esa pantalla existe **solo para trabajar en local**, porque la dirección del puente cambia cada vez. Si el proyecto se quisiera escalar a usuarios reales, habría que moverla a donde el usuario no la vea: la dirección se fijaría al compilar la aplicación (variable `EXPO_PUBLIC_API_URL`) y el estado de las bases se consultaría desde una herramienta del equipo.

## Parte 4. Probarla

Se puede buscar y leer sin iniciar sesión. Para lo demás, crea una cuenta o usa una de ejemplo en **Perfil → Entrar o crear cuenta**.

| Cuenta de ejemplo | Para ver |
|---|---|
| `sofia@ejemplo.test` | Recomendaciones de películas según lo que leen las personas que sigue |
| `ana@ejemplo.test` | Recomendaciones de libros según lo que le gustó |
| `admin@ejemplo.test` | Las opciones de administración y moderación |

Todas comparten una contraseña de prueba que está en [db/semilla/README.md](db/semilla/README.md#usuarios-de-prueba).

Un recorrido corto:

1. Sin sesión, busca `Dune` y abre el libro.
2. En la ficha, entra a **Comparar** para ver el libro contra su película.
3. Entra con una cuenta y publica una reseña: cambia el promedio.
4. En **Inicio**, con el buscador vacío, toca **Explorar conexiones** y elige `Herbert` y `Villeneuve`.
5. Con la cuenta de administrador, oculta una reseña.

Algunas imágenes pueden no aparecer: están en sitios de terceros que limitan las peticiones. En su lugar se ve el título o las iniciales.

## Apagar todo

1. En la terminal 3 (aplicación), pulsa `Ctrl+C`.
2. En la terminal 2 (puente), pulsa `Ctrl+C`.
3. En la terminal 1, detén los contenedores. **Los datos se conservan:**

```powershell
docker compose --profile todas stop
```

## Volver a usarlo otro día

No hay que instalar ni cargar nada otra vez. Abre Docker Desktop, abre la terminal 1, entra en la carpeta del proyecto y levanta las bases **de una en una**, y después la API:

```powershell
cd $HOME\Documents\booktok
```

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

Después repite las partes 2 y 3. La dirección del puente será otra: cámbiala en la aplicación.

Para volver a dejar los datos de ejemplo como al principio (**borra lo que hayas creado** en las tres bases):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

```powershell
.\db\scripts\cargar-semilla.ps1
```

## Despliegue

El proyecto se despliega en local: los pasos de arriba levantan las tres bases y la API en Docker, y la aplicación se abre desde un teléfono.

## Notas para desarrollar

- Para cambiar el código de la API, en lugar del contenedor puede usarse `npm run api` (se reinicia al guardar). Antes detén el contenedor con `docker compose stop api`: ocupan el mismo puerto y **solo debe haber una copia de la API**.
- La API lleva dentro el *worker* que copia los cambios a las otras bases (`sync_outbox`). Si Neo4j no responde, los eventos esperan y se aplican cuando vuelve. Uno que falla por sí mismo cinco veces queda como `fallido`.

## Pruebas

El plan y los resultados están en [test/plan-de-pruebas.md](test/plan-de-pruebas.md) y [test/resultados.md](test/resultados.md). Los comandos se escriben en la terminal 1, dentro de la carpeta del proyecto.

Estas no necesitan las bases (sirven recién descargado el proyecto):

```powershell
npm run typecheck
```

```powershell
npm test --workspace frontend
```

```powershell
npm run test:unitarias --workspace backend
```

Todas las de la API. Necesitan las tres bases levantadas con los datos de ejemplo y **la API detenida**, porque su *worker* se llevaría los cambios que las pruebas observan:

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

| Qué ves | Qué hacer |
|---|---|
| `git`, `node`, `docker` o `cloudflared` "no se reconoce" | Cierra la terminal y abre otra. Si sigue, reinstala ese programa |
| "La ejecución de scripts está deshabilitada" | Escribe en esa terminal `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| "Docker no responde" | Abre Docker Desktop y espera a `Engine running` |
| "port is already allocated" | Otro programa usa ese puerto. Cambia en `.env` el que diga el mensaje (`POSTGRES_HOST_PORT`, `MONGO_HOST_PORT`, `NEO4J_HTTP_HOST_PORT`, `NEO4J_BOLT_HOST_PORT` o `API_PORT`). Si cambias `API_PORT`, usa ese número en el `curl.exe` y en el puente |
| Errores de autenticación en las bases | Cambiaste claves en `.env` después de crearlas. Vuelve a ejecutar el paso 1.6 |
| Docker se reinicia o va muy lento | Falta memoria: cierra navegadores y otros programas, y levanta las bases de una en una |
| Expo dice que Node está desactualizado, o las pruebas `.ts` no arrancan | `node --version` no es 24 en esa terminal |
| Expo se cierra con `out of memory` | Cierra otros programas y en la terminal 3 usa `cd frontend` y después `npx expo start --max-workers 1` |
| El teléfono no carga el código QR | Misma red Wi-Fi en ambos. Algunas redes de escuela o trabajo lo impiden: comparte internet desde el teléfono a la computadora y repite la parte 3 |
| La aplicación no llega a la API | La dirección del puente cambió o se cerró: repite la parte 2 y guarda la nueva |
| La primera recomendación tarda varios segundos | Neo4j recién arrancado; las siguientes son rápidas |
| `coherencia.ps1` falla después de probar las bases | `.\db\scripts\cargar-semilla.ps1` |

## Qué hay en cada carpeta

| Carpeta | Contenido |
|---|---|
| `backend/` | API (Express 5, TypeScript sobre Node 24): `src/rutas`, `servicios` y `repositorios`; pruebas en `test/` |
| `frontend/` | Aplicación Android (Expo) |
| `shared/` | Esquemas Zod y tipos que usan las dos |
| `db/` | Esquemas, datos de ejemplo, consultas y pruebas de cada base (ver [db/README.md](db/README.md)) |
| `docs/` | Requerimientos, modelado, arquitectura, decisiones, contrato de la API (`docs/api/`) y reportes |
| `test/` | Plan de pruebas, resultados, evidencias y medición de rendimiento |
