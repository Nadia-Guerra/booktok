# Resultados de las pruebas (entregable 8)

El plan está en [plan-de-pruebas.md](plan-de-pruebas.md). Aquí solo se anota lo que se ejecutó.

| Etapa | Qué | Estado |
|---|---|---|
| 1 | Pruebas que ya existían | **Hecha (2026-11-26)** |
| 2 | Rendimiento | **Hecha (2026-11-26)** |
| 3 | Unitarias del backend | **Hecha (2026-11-26)** |
| 4 | Reconciliación reducida | **Hecha (2026-11-26)** |
| 5 | Instalación limpia y documentación | **Hecha (2026-11-26)** |
| 6 | Funcionales en el teléfono | **Hecha en parte (2026-11-27), con Expo Go** |

## Condiciones

Windows 11, 6 GB de RAM (Docker ve unos 3 GB). Node 24.14.0, PostgreSQL 18.7, MongoDB 9.0.4 y Neo4j 5.26.34 Community, con la semilla cargada. Código de la rama `testing` (parte de `905bbbe`).

**La semilla creció después de las etapas 1 a 5.** Sus conteos y tiempos corresponden a la anterior (11 libros, 12 películas). Lo repetido con la nueva está en [Semilla ampliada](#semilla-ampliada-2026-11-26).

## Etapa 1: pruebas que ya existían (2026-11-26)

### Resumen

| Prueba | Resultado | Evidencia |
|---|---|---|
| Coherencia entre bases, antes | 13 de 13 | [antes](evidencias/etapa1-coherencia-antes.txt) |
| Tipos de `shared`, `backend` y `frontend` | Sin errores | [tipos](evidencias/etapa1-tipos.txt) |
| Unitarias de la app | 8 de 8 | [unitarias](evidencias/etapa1-unitarias-app.txt) |
| API, tanda 1 | 48 de 48 (65 s) | [tanda 1](evidencias/etapa1-api-tanda1.txt) |
| API, tanda 2 | 52 de 52 (83 s) | [tanda 2](evidencias/etapa1-api-tanda2.txt) |
| Coherencia entre bases, después | 13 de 13 | [después](evidencias/etapa1-coherencia-despues.txt) |

La coherencia antes y después da los mismos conteos (8 usuarios, 23 obras, 10 seguimientos, 5 comparativas): las pruebas limpiaron lo que crearon.

### Qué demuestra, según los tipos de la guía

| Tipo | Archivos de `backend/test/` | Casos que lo muestran |
|---|---|---|
| Conectividad | `salud` | Responde 200 con las tres bases; una base caída da 503 |
| Funcional | `cuentas`, `catalogo`, `resenas`, `social`, `listas`, `comparativas`, `descubrimiento`, `administracion` | Los casos de uso por HTTP, con permisos y validación |
| Integridad | `resenas`, `listas`, `comparativas` | Una reseña y una comparativa por pareja; el promedio no se descuadra con peticiones simultáneas |
| Integración | `descubrimiento`, `eliminar-cuenta` | Reseñar y seguir cambia las recomendaciones; eliminar una cuenta la borra en las tres bases |
| Consistencia | `sincronizacion`, `orden-eventos` | Repetir un evento no duplica; los eventos quedan en el orden de los cambios |
| Errores | `salud`, `sincronizacion`, `resenas`, `administracion` | 400, 401, 403, 404, 409 y 503; una transacción a medias no deja nada; destino caído sin perder eventos; alta a medias |

### Cómo repetirla

Con las tres bases levantadas. La API se detiene porque su *worker* se llevaría los eventos de las pruebas.

```powershell
docker compose stop api
```

```powershell
npm test
```

```powershell
docker compose --profile api up -d --wait
```

Se corrió en dos tandas para no agotar la memoria; `npm test` ejecuta lo mismo de una vez.

### Qué no se hizo en esta etapa

- No se repitieron las pruebas de cada base en esta etapa. Se repitieron después, con la [reconstrucción desde cero](#bases-desde-cero-y-pruebas-de-cada-base).
- Las pantallas no tienen pruebas automáticas: se cubren en la etapa 6.

## Etapa 2: rendimiento (2026-11-26)

### Cómo se midió

El script [medir.mjs](rendimiento/medir.mjs) llama a la API por HTTP, hace 5 llamadas de calentamiento y mide 50 por flujo. Se corrió dos veces seguidas.

| Condición | Valor |
|---|---|
| Equipo | AMD Ryzen 5 3550H (8 hilos), 5,9 GB de RAM, unos 0,5 GB libres al empezar |
| Contenedores | API (tope 384 MB), PostgreSQL 18.7, MongoDB 9.0.4, Neo4j 5.26.34 |
| Datos | La semilla: 8 usuarios, 23 obras, 60 nodos y 5 comparativas |
| Carga | Una llamada a la vez, desde la misma máquina |

**p95** (percentil 95): 95 de cada 100 llamadas tardan eso o menos. **Mediana:** la mitad tarda eso o menos.

### Resultados

Metas: p95 de 1 s para consultas y escrituras, y de 2 s para las que recorren el grafo.

| Flujo | Mediana (1.ª / 2.ª) | p95 (1.ª / 2.ª) | Meta | Cumple |
|---|---|---|---|---|
| Salud (EP-01) | 7 / 5 ms | 13 / 7 ms | 1 s | Sí |
| Iniciar sesión (EP-03) | 67 / 66 ms | 78 / 84 ms | 1 s | Sí |
| Buscar por título (EP-08) | 6 / 5 ms | 11 / 10 ms | 1 s | Sí |
| Buscar por persona (EP-08) | 27 / 18 ms | 43 / 24 ms | 2 s | Sí |
| Ficha de libro (EP-09) | 31 / 23 ms | 49 / 37 ms | 1 s | Sí |
| Ficha de película (EP-09) | 28 / 24 ms | 56 / 34 ms | 1 s | Sí |
| Reseñas de una obra (EP-10) | 8 / 8 ms | 14 / 10 ms | 1 s | Sí |
| Publicar una reseña (EP-11) | 13 / 12 ms | 18 / 18 ms | 1 s | Sí |
| Recomendaciones de libros (EP-18) | 23 / 23 ms | 37 / 37 ms | 2 s | Sí |
| Recomendaciones de películas (EP-18) | 17 / 14 ms | 22 / 20 ms | 2 s | Sí |
| Caminos entre dos personas (EP-16) | 19 / 17 ms | 27 / 22 ms | 2 s | Sí |
| Autores de un director (EP-17) | 19 / 19 ms | 33 / 35 ms | 2 s | Sí |

Iniciar sesión es el más lento a propósito: comprobar la contraseña con *bcrypt* cuesta tiempo. La ficha une las tres bases y aun así queda por debajo de 60 ms.

Salidas completas: [primera](evidencias/etapa2-rendimiento.txt) y [segunda](evidencias/etapa2-rendimiento-repeticion.txt).

### Con Neo4j recién reiniciado

Se reinició Neo4j dos veces y se midió la primera llamada.

| Flujo | Primera llamada (dos reinicios) | Segunda llamada |
|---|---|---|
| Recomendaciones de libros | 6,0 y 6,2 s | 61 y 91 ms |
| Caminos entre dos personas | 1,4 y 2,3 s | 27 y 103 ms |
| Autores de un director | 0,3 y 0,8 s | 33 y 46 ms |
| Buscar por persona | 0,7 y 1,8 s | 24 y 28 ms |

**La primera consulta de recomendaciones no cumple la meta de 2 s.** Lo probable (no comprobado) es que Neo4j esté preparando la consulta y cargando datos en memoria. Para la demostración basta con abrir las recomendaciones una vez antes de presentar.

La segunda de estas mediciones está guardada en [neo4j recién reiniciado](evidencias/etapa2-neo4j-recien-reiniciado.txt); la primera se vio en pantalla y no se guardó.

### Después de medir

La coherencia siguió en 13 de 13 ([evidencia](evidencias/etapa2-coherencia-despues.txt)). El script solo escribe con un lector de prueba, que elimina al terminar.

### Cómo repetirla

Con las bases y la API levantadas y la semilla cargada:

```powershell
node test/rendimiento/medir.mjs
```

Para la primera llamada, justo después de reiniciar Neo4j:

```powershell
node test/rendimiento/medir.mjs --frio
```

### Qué no se midió

- El tiempo desde el teléfono a través del túnel, que depende de la red.
- Varias personas usando la aplicación a la vez.
- Un catálogo grande: con tan pocos datos, estos tiempos no predicen cómo respondería con miles de obras.

## Etapa 3: unitarias del backend (2026-11-26)

Prueban una regla a la vez, **sin bases, sin red y sin `.env`**, así que sirven recién clonado el repositorio. Están en `backend/test/unitarias/`.

| Prueba | Resultado | Evidencia |
|---|---|---|
| Unitarias del backend | 16 de 16 | [salida](evidencias/etapa3-unitarias-backend.txt) |
| Tipos del backend, con los archivos nuevos | Sin errores | |

| Archivo | Qué comprueba |
|---|---|
| `esquemas.test.ts` (11) | Identificador y correo en minúsculas, contraseña mínima, calificación del 1 al 5, texto de reseña, imagen solo `https://`, búsqueda sin operadores de MongoDB, ISBN y reparto sin repetidos, límites de la comparativa |
| `api.test.ts` (5) | Cursor de paginación (conserva microsegundos y rechaza uno alterado), diferencia entre base caída y petición errónea, saneado de la búsqueda por persona |

Con las 8 de la app son **24 unitarias**. `npm test` también las incluye, así que desde ahora ejecuta 116 pruebas (las 100 de la etapa 1 y estas 16).

```powershell
npm run test:unitarias --workspace backend
```

## Etapa 4: reconciliación (2026-11-26)

La guía pide que lo replicado no quede contradictorio sin detectarlo. Ya existían la detección (`coherencia.ps1`) y el reintento (`sync_outbox`). Se agregó el **comando de reconciliación** del diseño (arquitectura 04, sección 8), en versión reducida.

### Qué hace

| Compara | Fuente | Copia que corrige |
|---|---|---|
| Seguimientos | `seguimiento` (PostgreSQL) | `sigue` (Neo4j) |
| Libros terminados | `estado_obra` (PostgreSQL) | `leyó` (Neo4j) |
| Eventos pendientes y fallidos | `sync_outbox` | Solo los informa |

Sin opciones solo informa. Con `--corregir` modifica **solo el grafo**. Si hay eventos pendientes no corrige, porque la diferencia puede ser un cambio que el *worker* todavía no copió.

```powershell
npm run reconciliar --workspace backend
```

```powershell
npm run reconciliar --workspace backend -- --corregir
```

**No cubre** el resto del diseño: fichas contra `obra_resumen` y nodos, reparto, promedios, huérfanos, borradores antiguos ni nombres repetidos. Lee los pares completos y no por lotes, suficiente para este volumen.

### Pruebas automáticas

`backend/test/reconciliacion.test.ts` (3 casos), con la API detenida: detecta sin tocar nada; corrige solo el grafo y repetirlo no encuentra nada; con eventos pendientes no corrige. Se corrió junto a las de sincronización y salud: **17 de 17** ([salida](evidencias/etapa4-reconciliacion-pruebas.txt)). Con ellas, `npm test` pasa a 119 pruebas.

### Escenario completo

Con dos lectores de prueba: uno sigue al otro y marca un libro como terminado; después se borran esas dos relaciones **solo en Neo4j**.

| Paso | Resultado | Evidencia |
|---|---|---|
| 1. `coherencia.ps1` | 2 de 13 fallan: C-06 (`sigue`) y C-07 (`leyó`) | [detecta](evidencias/etapa4-1-coherencia-detecta.txt) |
| 2. Reconciliar sin corregir | Informa que faltan 1 `sigue` y 1 `leyó` | [informe](evidencias/etapa4-2-reconciliar-informe.txt) |
| 3. Reconciliar con `--corregir` | Quedan 0 diferencias | [corrección](evidencias/etapa4-3-reconciliar-corregir.txt) |
| 4. `coherencia.ps1` | 13 de 13 | [después](evidencias/etapa4-4-coherencia-despues.txt) |

Los dos lectores se eliminaron al final y la coherencia volvió a 13 de 13 con los conteos de la semilla (8 usuarios, 10 seguimientos, 12 lecturas).

El escenario se preparó con un guion temporal que no está en el repositorio; lo que se puede repetir es la prueba automática.

## Etapa 5: instalación limpia y documentación (2026-11-26)

### Instalación desde una copia limpia

Se copiaron a una carpeta nueva solo los archivos del repositorio (404, sin `.env` ni `node_modules`) y se siguió la instalación. Resumen en [instalación limpia](evidencias/etapa5-instalacion-limpia.txt).

| Paso | Resultado |
|---|---|
| `npm ci` | Correcto: 647 paquetes en unos 5 minutos |
| `npm run typecheck` | Sin errores |
| Unitarias de la app y del backend, sin `.env` | 8 de 8 y 16 de 16 |
| `docker compose config` con `.env.example` | Válido |
| Construcción de la imagen de la API | Correcta |
| Empaquetado de la app para Android | Correcto, 1516 módulos |

Hallazgos:

- Con `npm ci --prefer-offline` la instalación **falla** si la caché local es antigua. A `package-lock.json` le faltan la dirección y la suma de comprobación de 550 de sus paquetes. Con `npm ci` normal, que es lo que dice el `README.md`, funciona. No se regeneró el archivo para no mover versiones a un día de la entrega.
- El `README.md` no decía cómo clonar, remitía a otros documentos para crear las bases y no avisaba del permiso para ejecutar scripts. Se reescribió.

**No se probó** en otra computadora.

### Bases desde cero y pruebas de cada base

Se borraron los volúmenes del proyecto y se reconstruyó todo con `.\db\scripts\reconstruir.ps1 -Forzar`: **13 de 13 pasos** en 3,9 minutos ([resumen](../db/evidencias/reconstruccion/resumen.txt)). Después se levantó la API como dice el `README.md` y `/salud` respondió `ok` con las tres bases.

| Prueba | Resultado | Evidencia |
|---|---|---|
| Relacional: integridad, transacción, concurrencia, índices y consultas | 5 de 5 grupos | [resumen](../db/evidencias/relacional/resumen.txt) |
| Documental: validadores, índices y controles negativos | 3 de 3 grupos | [resumen](../db/evidencias/documental/resumen.txt) |
| Grafo: restricciones, cardinalidad y consultas | 58, 54 y 25 pasos, todos | [resumen](../db/evidencias/grafo/resumen.txt) |
| Grafo: concurrencia de D-23 | Pasa | [salida](../db/evidencias/grafo/04-concurrencia-d23.txt) |
| Semilla: consultas representativas y coherencia | 13 de 13 | [coherencia](../db/evidencias/semilla/coherencia.txt) |

Se hizo en la carpeta de trabajo, con su `.env`, y con las pruebas de cada base. El `README.md` propone `-SinPruebas`, que ejecuta los mismos pasos sin ellas.

### Documentación

- `README.md`: requisitos, instalación, uso diario, teléfono, pruebas y problemas frecuentes.
- `docs/decisiones_tomadas.md`: D-64, la reconciliación reducida.

### Todas las pruebas juntas

| Prueba | Resultado | Evidencia |
|---|---|---|
| `npm test`, la suite completa de una vez | **119 de 119** en 8 min 13 s | [salida](evidencias/etapa5-npm-test-completo.txt) |
| Coherencia al terminar | 13 de 13, con 8 usuarios | [coherencia](evidencias/etapa5-coherencia-despues.txt) |

Un primer intento se cortó por el límite de 10 minutos con la máquina casi sin memoria, justo después del empaquetado de la app. No falló ninguna comprobación: `descubrimiento` aparecía en error porque se interrumpió a la mitad. La coherencia siguió en 13 de 13 y se repitió con más margen.

Las pruebas tardan según la memoria libre: en las etapas anteriores, cada mitad tardó menos de 2 minutos. Conviene correrlas sin Expo ni otros programas pesados.

## Semilla ampliada (2026-11-26)

**Estas son las cifras vigentes.** La semilla pasó a 17 libros, 18 películas, 50 personas (93 nodos en el grafo), 8 usuarios, 27 reseñas y 6 comparativas, con direcciones de imagen reales (`db/semilla/README.md`). Solo se agregaron datos, así que los escenarios de recomendaciones y caminos no cambiaron. Se actualizaron los resultados esperados que dependen de los conteos y de las fichas sin imagen.

### Pruebas

| Prueba | Resultado | Evidencia |
|---|---|---|
| Coherencia entre bases, antes | 13 de 13 | [antes](evidencias/semilla-nueva-coherencia-antes.txt) |
| Tipos de `shared`, `backend` y `frontend` | Sin errores | [salida](evidencias/semilla-nueva-tipos-y-unitarias.txt) |
| Unitarias de la app y del backend | 8 de 8 y 16 de 16 | [salida](evidencias/semilla-nueva-tipos-y-unitarias.txt) |
| `npm test`, la suite completa | **119 de 119** en 3 min 3 s | [salida](evidencias/semilla-nueva-npm-test.txt) |
| Consultas representativas de las tres bases | Todo pasa | [resumen](../db/evidencias/semilla/resumen.txt) |
| Coherencia entre bases, al terminar todo | 13 de 13 | [después](evidencias/semilla-nueva-coherencia-despues.txt) |

### Rendimiento

Mismo equipo y método que en la [etapa 2](#etapa-2-rendimiento-2026-11-26): 50 llamadas por flujo después de 5 de calentamiento, una a la vez, con 0,5 a 0,7 GB de RAM libres. Dos corridas seguidas.

| Flujo | Mediana (1.ª / 2.ª) | p95 (1.ª / 2.ª) | Meta | Cumple |
|---|---|---|---|---|
| Salud (EP-01) | 6 / 9 ms | 10 / 21 ms | 1 s | Sí |
| Iniciar sesión (EP-03) | 67 / 66 ms | 117 / 124 ms | 1 s | Sí |
| Buscar por título (EP-08) | 8 / 5 ms | 12 / 7 ms | 1 s | Sí |
| Buscar por persona (EP-08) | 19 / 16 ms | 27 / 42 ms | 2 s | Sí |
| Ficha de libro (EP-09) | 27 / 25 ms | 38 / 53 ms | 1 s | Sí |
| Ficha de película (EP-09) | 27 / 24 ms | 37 / 42 ms | 1 s | Sí |
| Reseñas de una obra (EP-10) | 9 / 8 ms | 16 / 11 ms | 1 s | Sí |
| Publicar una reseña (EP-11) | 13 / 14 ms | 20 / 68 ms | 1 s | Sí |
| Recomendaciones de libros (EP-18) | 28 / 25 ms | 48 / 55 ms | 2 s | Sí |
| Recomendaciones de películas (EP-18) | 18 / 16 ms | 43 / 27 ms | 2 s | Sí |
| Caminos entre dos personas (EP-16) | 18 / 19 ms | 26 / 27 ms | 2 s | Sí |
| Autores de un director (EP-17) | 16 / 15 ms | 34 / 23 ms | 2 s | Sí |

Salidas: [primera](evidencias/semilla-nueva-rendimiento.txt) y [segunda](evidencias/semilla-nueva-rendimiento-repeticion.txt).

Primera llamada tras reiniciar Neo4j ([salida](evidencias/semilla-nueva-neo4j-recien-reiniciado.txt)):

| Flujo | Primera (dos reinicios) | Segunda |
|---|---|---|
| Recomendaciones de libros | 11,5 y 4,2 s | 159 y 40 ms |
| Caminos entre dos personas | 3,5 y 1,2 s | 56 y 31 ms |
| Autores de un director | 0,9 y 0,3 s | 43 y 24 ms |
| Buscar por persona | 1,5 y 0,5 s | 28 y 33 ms |

**La primera consulta al grafo tras reiniciar puede no cumplir la meta de 2 s** (hasta 11,5 s en las recomendaciones). Antes de la demostración conviene abrir una vez las recomendaciones y los caminos.

### Reconciliación

Con dos lectores de prueba, borrando sus relaciones **solo en Neo4j**.

| Paso | Resultado | Evidencia |
|---|---|---|
| 1. `coherencia.ps1` | 2 de 13 fallan: C-06 y C-07 | [detecta](evidencias/semilla-nueva-reconciliacion-1-detecta.txt) |
| 2. Reconciliar sin corregir | Faltan 1 `sigue` y 1 `leyó` | [informe](evidencias/semilla-nueva-reconciliacion-2-informe.txt) |
| 3. Reconciliar con `--corregir` | 0 diferencias | [corrección](evidencias/semilla-nueva-reconciliacion-3-corregir.txt) |
| 4. `coherencia.ps1` | 13 de 13 | [después](evidencias/semilla-nueva-reconciliacion-4-despues.txt) |

Los dos lectores se eliminaron al final.

### Imágenes

Cargan en el navegador de la computadora. La app se identifica con un nombre propio al pedirlas, porque Wikimedia responde 403 al que Android usa por defecto.

### Qué no se repitió con la semilla nueva

- Las pruebas de cada base por separado y la reconstrucción desde cero, porque borran las bases. Las que hay son de la semilla anterior.
- La instalación desde una copia limpia, que no depende de los datos.
- Las imágenes y los casos funcionales en el teléfono, que se hicieron el día siguiente: ver [Etapa 6](#etapa-6-funcionales-en-el-teléfono-2026-11-27).

## Etapa 6: funcionales en el teléfono (2026-11-27)

Teléfono Android real con **Expo Go** (no el APK), API y bases en el equipo, túnel rápido, semilla ampliada, una cuenta de prueba nueva y la de administrador. Capturas en [docs/reportes/capturas](../docs/reportes/capturas/), con la dirección del túnel tapada.

| Caso | Resultado | Evidencia o lo que falta |
|---|---|---|
| CF-01 | Correcto | cf-01-a, cf-01-b |
| CF-02 | Correcto | cf-02 |
| CF-03 | Sin evidencia | Sin captura |
| CF-04 | Parcial | cf-04, cf-05 y cf-10-a: publicada y terminada. Falta el promedio nuevo |
| CF-05 | Correcto | cf-05 |
| CF-06 | Correcto | cf-06-a, b y c |
| CF-07 | Correcto | cf-07 |
| CF-08 | Parcial | cf-08-a y b: creada. Faltan la edición y el segundo intento |
| CF-09 | Parcial | cf-09: lista con una obra. Faltan ordenar y borrar |
| CF-10 | Correcto | cf-10-a y b; sin sesión, por HTTP ([salida](evidencias/telefono-api.txt)) |
| CF-11 | Correcto | cf-02 (perfil sin Administración) |
| CF-12 | Sin evidencia | Sin captura |
| CF-13 | Sin evidencia | Sin captura; la cuenta de prueba sigue existiendo |

Además, como administrador se registraron desde el teléfono personas, un libro y su película; ambas obras quedaron publicadas ([salida](evidencias/telefono-api.txt)).

Después del recorrido: coherencia **13 de 13** ([salida](evidencias/telefono-coherencia.txt)) y 16 eventos de sincronización procesados, ninguno pendiente ni fallido.

**Falla encontrada:** en el teléfono no cargan los pósteres de película ni las fotos de personas (Wikimedia); las portadas de libro sí. Desde el equipo, la misma dirección responde 200 con el identificador que envía la app y 403 con el que Android usa por defecto. La causa en el teléfono no se ha determinado.

Los datos creados (cuenta de prueba, su reseña oculta, comparativa, lista, y el libro y la película nuevos) siguen en las bases: la semilla ya no está limpia.
