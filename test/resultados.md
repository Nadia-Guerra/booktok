# Resultados de las pruebas (entregable 8)

El plan está en [plan-de-pruebas.md](plan-de-pruebas.md). Aquí solo se anota lo que se ejecutó.

| Etapa | Qué | Estado |
|---|---|---|
| 1 | Pruebas que ya existían | **Hecha (2026-11-26)** |
| 2 | Rendimiento | Pendiente |
| 3 | Unitarias del backend | Pendiente |
| 4 | Reconciliación reducida | Pendiente |
| 5 | Instalación limpia y documentación | Pendiente |
| 6 | Funcionales en el teléfono | Pendiente |

## Condiciones

Windows 11, 6 GB de RAM (Docker ve unos 3 GB). Node 24.14.0, PostgreSQL 18.7, MongoDB 9.0.4 y Neo4j 5.26.34 Community, con la semilla cargada. Código de la rama `testing` (parte de `905bbbe`).

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

- No se repitieron las pruebas de cada base. Valen las de `db/evidencias/` del 2026-11-24, anteriores a los cambios de `docker-compose.yml` del día 25. Se decide al final si repetirlas, porque la del grafo obliga a recargar la semilla.
- Las pantallas no tienen pruebas automáticas: se cubren en la etapa 6.
