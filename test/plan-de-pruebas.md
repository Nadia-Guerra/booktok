# Plan de pruebas (entregable 8)

Fecha: 2026-11-26. Rama: `testing`, creada desde `feat/frontend` (que ya contiene todo el backend).

Cubre la sección 7.8 y las pruebas obligatorias de la sección 9 de la guía. **Es un plan: nada de lo marcado como pendiente se ha ejecutado.**

## 1. Qué es una prueba aquí

Cada prueba responde tres cosas: **qué se hace**, **qué debe pasar** y **qué evidencia queda**. Ejemplo: se publica una reseña de 5 estrellas (qué se hace); el promedio de la obra se recalcula y la obra queda como terminada (qué debe pasar); la salida de la prueba automática se guarda en un archivo (evidencia).

| Tipo | En palabras simples | Ejemplo en este proyecto |
|---|---|---|
| Unitaria | Una función sola, sin bases ni red | Un ISBN corto se rechaza |
| Por base | Las reglas que impone cada motor | PostgreSQL no admite dos reseñas del mismo usuario sobre una obra |
| Integración | Una operación que cruza dos o tres bases | Seguir a un lector cambia las recomendaciones de Neo4j |
| Funcional | Un caso de uso completo, como lo vive el usuario | Desde el teléfono, escribir una comparativa |
| Errores | Qué pasa cuando algo sale mal | Con una base caída la API responde 503, no un éxito |
| Consistencia | Las tres bases dicen lo mismo | `coherencia.ps1` en 13 de 13 |
| Rendimiento | Cuánto tarda | La ficha responde en menos de 1 segundo |

## 2. Qué hay y qué falta

| Pide la guía | Ya existe | Falta |
|---|---|---|
| Unitarias o de componentes | 8 de la app (`frontend/test/`) | Algunas del backend, sin bases |
| Cada base | `db/*/pruebas/` y salidas en `db/evidencias/` (24 de noviembre) | Nada obligatorio; repetirlas es opcional |
| Integración | `backend/test/` (sincronización, eliminar cuenta, caso integrado) | Volver a correrlas y guardar la salida |
| Funcionales | Pruebas de la API por HTTP (100 de 100 el 25 de noviembre) | La tabla de casos en el teléfono (3.4) |
| Errores | 400, 401, 403, 404, 409, 503, transacción a medias, alta a medias, base caída | Guardar la salida |
| Consistencia entre bases | `coherencia.ps1` y su prueba negativa | Escenario de reconciliación (3.5) |
| Rendimiento | Solo planes de consulta (`EXPLAIN`) | **Mediciones de los flujos (3.6)** |
| Instalación, carga y ejecución | `README.md`, `db/README.md`, `db/semilla/README.md` | Probar que otra persona pueda seguirlas (3.7) |
| Variables de ejemplo | `.env.example` | Nada |
| Repositorio y demostración | GitHub y la app | Dejar `master` con todo al final |

## 3. Las pruebas, una por una

### 3.1 Unitarias

No necesitan bases.

```powershell
npm test --workspace frontend
```

Por agregar en el backend (unas 10 a 15): los esquemas de `shared/` (identificador en minúsculas, correo en minúsculas, puntuación entera de 1 a 5, URL `https://`), el cursor de paginación y el saneado de la búsqueda por persona.

### 3.2 Por base

```powershell
.\db\scripts\probar-relacional.ps1
```

```powershell
.\db\scripts\probar-documental.ps1
```

```powershell
.\db\scripts\probar-grafo.ps1
```

**Cuidado:** `probar-grafo.ps1` vacía el grafo. Después hay que recargar la semilla (`cargar-semilla.ps1`), que borra las tres bases, incluidas las cuentas creadas desde la app. Como ya hay evidencias, solo conviene repetirlas al final.

### 3.3 Integración, errores y consistencia (API)

Necesitan las tres bases levantadas y la API detenida.

```powershell
docker compose stop api
```

```powershell
npm test
```

```powershell
docker compose --profile api up -d --wait
```

| Archivos en `backend/test/` | Qué demuestran |
|---|---|
| `salud` | Conectividad con los tres motores; base caída y errores sin detalles internos |
| `cuentas`, `catalogo`, `resenas`, `social`, `listas`, `comparativas`, `descubrimiento`, `administracion` | Casos de uso, validación y permisos |
| `sincronizacion`, `orden-eventos`, `eliminar-cuenta` | Integración y consistencia: reintentos, destino caído, borrado en las tres bases |

Algunas esperan los datos de la semilla. Si fallan por datos creados al usar la app, hay que recargar la semilla antes de dar el fallo por bueno.

### 3.4 Funcionales en el teléfono

Se marcan a mano, con una captura por caso.

| Caso | Qué haces | Qué debe pasar | Resultado |
|---|---|---|---|
| CF-01 | Sin sesión, buscar *Dune* y abrir la ficha | Se ve la ficha y no pide entrar | |
| CF-02 | Crear una cuenta y entrar | Entras y aparece tu perfil | |
| CF-03 | Entrar con contraseña equivocada | Mensaje que no dice si el correo existe | |
| CF-04 | Publicar una reseña | Aparece, cambia el promedio y la obra queda terminada | |
| CF-05 | Cambiar el estado de una obra | Aparece en Biblioteca | |
| CF-06 | Seguir a Pedro Ibarra | Aparecen recomendaciones de películas (RF-27) | |
| CF-07 | Explorar conexiones entre Herbert y Villeneuve | Muestra el camino entre ambos | |
| CF-08 | Crear una comparativa, editarla e intentar otra de la misma pareja | Se guarda y no permite la segunda | |
| CF-09 | Crear una lista, agregar dos obras, ordenar y borrar | Cada cambio se conserva al volver | |
| CF-10 | Como administrador, ocultar una reseña | Otros dejan de verla y cambia el promedio | |
| CF-11 | Como lector, revisar el perfil | No hay opciones de administración | |
| CF-12 | Cerrar el túnel y usar la app | Mensaje de error y opción de reintentar; no se cierra | |
| CF-13 | Eliminar la cuenta de prueba | No se puede volver a entrar | |

### 3.5 Consistencia y reconciliación

```powershell
.\db\scripts\coherencia.ps1
```

La guía pide un "escenario de actualización y reconciliación". La detección existe (`coherencia.ps1` y los eventos `fallido`), y el reintento también. El **comando de reconciliación está diseñado** (arquitectura 04, sección 8) **pero no construido**.

Propuesta: construir una versión reducida que compare `seguimiento` contra `sigue` y los libros terminados contra `leyó`, y corrija solo el grafo. Escenario de prueba: borrar a mano una relación, ver que se detecta, reconciliar y comprobar que vuelve.

### 3.6 Rendimiento

Por construir: un script que llame 50 veces a cada flujo (después de 5 de calentamiento) y calcule la mediana, el percentil 95 y el máximo.

| Flujo | Por qué | Objetivo propuesto (p95) |
|---|---|---|
| Buscar y abrir ficha | Lo más usado; RNF-04 | 1 s |
| Reseñas de una obra | Paginación en PostgreSQL | 1 s |
| Publicar reseña | Escritura con transacción | 1 s |
| Recomendaciones y caminos | Recorridos del grafo; RNF-05 | 2 s |

Se anotan las condiciones: equipo (6 GB de RAM, Docker con unos 3 GB), versiones, datos (los de la semilla), llamadas en la misma máquina y una a la vez. La primera consulta tras reiniciar Neo4j es lenta y se informa aparte. Con tan pocos datos, el resultado vale para el alcance del curso y no predice un volumen grande.

### 3.7 Instalación por otra persona

Es el criterio de aceptación. Clonar el repositorio en una carpeta nueva y seguir el `README.md` al pie de la letra, anotando cada paso que falle o falte. Requisito que se olvida: **Node 24** (`node --version`). Lo ideal es que lo haga otra persona en otra computadora.

## 4. Orden de trabajo

| Paso | Qué | Quién | Borra datos |
|---|---|---|---|
| 1 | Unitarias, `npm test` y `coherencia.ps1`; guardar salidas | Claude | Solo sus datos de prueba |
| 2 | Medición de rendimiento | Claude | Solo sus datos de prueba |
| 3 | Pruebas unitarias del backend | Claude | No |
| 4 | Reconciliación reducida y su escenario (si se aprueba) | Claude | No |
| 5 | Casos en el teléfono | Usuario | Solo lo que cree |
| 6 | Instalación limpia y documentación | Ambos | Según la prueba |
| 7 | Pruebas por base (opcional) y recarga de la semilla | Claude, con permiso | **Sí** |
| 8 | Llevar `testing` a `master` | Usuario | No |

No conviene correr los pasos 1, 2 ni 7 justo antes de la demostración: detienen la API o cambian datos.

## 5. Evidencias

En `docs/pruebas/evidencias/`: una salida por tanda (unitarias, API, coherencia, rendimiento), las capturas del teléfono y un `resultados.md` con la fecha, las condiciones, qué pasó, qué falló y qué no se probó. Las de las bases siguen en `db/evidencias/`. Ninguna debe incluir contraseñas, tokens ni la dirección del túnel.

## 6. Organización del repositorio

La guía dice que la estructura **puede adaptarse al stack**. No se mueven carpetas: los scripts dependen de sus rutas.

| En la guía | En este repositorio |
|---|---|
| `database/relational`, `document`, `graph` | `db/relacional`, `db/documental`, `db/grafo` |
| `backend/controllers`, `services`, `repositories` | `backend/src/rutas`, `servicios`, `repositorios` |
| `tests/unit`, `integration`, `e2e` | `frontend/test`, `backend/test`, casos de la sección 3.4 |
| `docs/pruebas` | `docs/pruebas` |
