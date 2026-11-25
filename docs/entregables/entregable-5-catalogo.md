# Entregable 5. Catálogo de operaciones y consultas

_Del Libro a la Pantalla · Proyecto integrador de bases de datos_

Evidencia ejecutada el 2026-11-24 17:12:31 (PostgreSQL 18.7, MongoDB 9.0.4, Neo4j 5.26.34 Community).

Este archivo **se genera** con `db/scripts/generar-catalogo.ps1` a partir de `docs/entregables/catalogo-operaciones.json` (propósito, bases, parámetros y resultado esperado de cada operación) y de la salida real guardada en `db/evidencias/catalogo/` (casos y resultados obtenidos). No se edita a mano: si cambia una operación o se vuelve a ejecutar la evidencia, se regenera.

## Cómo leer este catálogo

- Cada operación es una **ficha** con los seis puntos que pide la guía del curso (sección 7.5): identificador y propósito; bases que intervienen; parámetros de entrada y validaciones; resultado esperado y formato de salida; casos normales, límite y de error; y evidencia de ejecución con el resultado obtenido.
- **Identificadores.** `O` = relacional (`docs/modelado/relacional/04-operaciones.md`), `AP` = documental (`docs/modelado/documental/01-patrones-de-acceso.md`), `CG` = grafo (`docs/modelado/grafo/01-consultas-y-entidades.md`) e `INT` = integrada (varias bases). Los números retirados (O6, AP-06, AP-22, AP-31 y CG-12) no se reutilizan ni aparecen.
- **Casos.** Cada caso se llama `<operación>-<tipo><número>`: `n` normal, `l` límite y `e` error. Por ejemplo `O7-e2` es el segundo caso de error de O7. Así se pueden citar.
- **Resultado obtenido.** Es el texto que imprimió el motor al ejecutar el caso, copiado tal cual del archivo de evidencia. El **esperado** está escrito en el script de cada base y el resultado `PASA` significa que ambos coinciden. Las consultas no se copian aquí: cada ficha enlaza el documento de diseño y el archivo que la contiene.
- **Real y simulado.** Todavía no existen la API ni el worker de sincronización (Entregables 6 y 7). Las operaciones integradas se ejecutan con un script que hace de API; lo que dependería del worker se marca **SIMULADO** (ver la sección 6).

## 1. Resumen de cobertura

| Grupo | Operaciones | Casos | Normales | Límite | Error | Resultado |
|---|---|---|---|---|---|---|
| Relacional (PostgreSQL) | 22 | 148 | 59 | 38 | 51 | 148 de 148 PASA |
| Documental (MongoDB) | 30 | 178 | 41 | 61 | 76 | 178 de 178 PASA |
| Grafo (Neo4j) | 24 | 153 | 45 | 54 | 54 | 153 de 153 PASA |
| Integradas (varias bases) | 5 | 35 | 10 | 11 | 14 | 35 de 35 PASA |
| **Total** | **81** | **514** | **155** | **164** | **195** | **514 de 514 PASA** |

Cada operación del catálogo tiene al menos un caso normal, uno límite y uno de error, y todos pasan. El detalle por operación:

| Operación | Nombre | Bases | Normales | Límite | Error | Resultado |
|---|---|---|---|---|---|---|
| [O1](#o1) | Registrar usuario | PostgreSQL | 2 | 2 | 3 | 7 de 7 PASA |
| [O2](#o2) | Iniciar sesión | PostgreSQL | 2 | 1 | 3 | 6 de 6 PASA |
| [O3](#o3) | Editar perfil | PostgreSQL | 1 | 2 | 3 | 6 de 6 PASA |
| [O4](#o4) | Eliminar cuenta | PostgreSQL | 5 | 1 | 2 | 8 de 8 PASA |
| [O5](#o5) | Registrar obra | PostgreSQL | 1 | 1 | 2 | 4 de 4 PASA |
| [O7](#o7) | Publicar reseña | PostgreSQL | 3 | 2 | 3 | 8 de 8 PASA |
| [O8](#o8) | Editar reseña | PostgreSQL | 2 | 2 | 2 | 6 de 6 PASA |
| [O9](#o9) | Eliminar reseña | PostgreSQL | 1 | 1 | 2 | 4 de 4 PASA |
| [O10](#o10) | Moderar reseña | PostgreSQL | 3 | 2 | 1 | 6 de 6 PASA |
| [O11](#o11) | Marcar estado de una obra | PostgreSQL | 4 | 2 | 2 | 8 de 8 PASA |
| [O12](#o12) | Crear, renombrar y eliminar lista | PostgreSQL | 3 | 2 | 4 | 9 de 9 PASA |
| [O13](#o13) | Agregar y quitar obra de una lista | PostgreSQL | 2 | 2 | 4 | 8 de 8 PASA |
| [O14](#o14) | Reordenar lista | PostgreSQL | 1 | 2 | 3 | 6 de 6 PASA |
| [O15](#o15) | Seguir usuario | PostgreSQL | 1 | 1 | 3 | 5 de 5 PASA |
| [O16](#o16) | Dejar de seguir | PostgreSQL | 1 | 2 | 1 | 4 de 4 PASA |
| [O17](#o17) | Consultas de lectura | PostgreSQL | 11 | 2 | 3 | 16 de 16 PASA |
| [O18](#o18) | Libros de partida para recomendar | PostgreSQL | 3 | 2 | 3 | 8 de 8 PASA |
| [O19](#o19) | Propagar eventos al grafo | PostgreSQL | 2 | 3 | 2 | 7 de 7 PASA (con pasos simulados) |
| [O20](#o20) | Datos para reconciliación | PostgreSQL | 6 | 1 | 1 | 8 de 8 PASA |
| [O21](#o21) | Purgar eventos procesados y sesiones vencidas | PostgreSQL | 2 | 3 | 1 | 6 de 6 PASA |
| [O22](#o22) | Validar la sesión de una petición | PostgreSQL | 2 | 1 | 2 | 5 de 5 PASA |
| [O23](#o23) | Cerrar sesión | PostgreSQL | 1 | 1 | 1 | 3 de 3 PASA |
| [AP-01](#ap-01) | Ficha completa de un libro | MongoDB | 1 | 2 | 2 | 5 de 5 PASA |
| [AP-02](#ap-02) | Ficha completa de una película | MongoDB | 1 | 2 | 2 | 5 de 5 PASA |
| [AP-03](#ap-03) | Buscar obras por título | MongoDB | 2 | 3 | 3 | 8 de 8 PASA |
| [AP-04](#ap-04) | Datos de presentación de varias obras | MongoDB | 1 | 2 | 3 | 6 de 6 PASA |
| [AP-05](#ap-05) | Existencia y estado de una obra | MongoDB | 1 | 2 | 2 | 5 de 5 PASA |
| [AP-07](#ap-07) | Crear la ficha de un libro como borrador | MongoDB | 2 | 3 | 6 | 11 de 11 PASA |
| [AP-08](#ap-08) | Crear la ficha de una película como borrador | MongoDB | 1 | 3 | 5 | 9 de 9 PASA |
| [AP-09](#ap-09) | Publicar una ficha | MongoDB | 3 | 1 | 2 | 6 de 6 PASA |
| [AP-10](#ap-10) | Corregir los datos descriptivos de una ficha | MongoDB | 2 | 2 | 4 | 8 de 8 PASA |
| [AP-11](#ap-11) | Agregar una edición a un libro | MongoDB | 2 | 2 | 4 | 8 de 8 PASA |
| [AP-12](#ap-12) | Corregir una edición de un libro | MongoDB | 2 | 2 | 3 | 7 de 7 PASA |
| [AP-13](#ap-13) | Quitar una edición de un libro | MongoDB | 1 | 1 | 2 | 4 de 4 PASA |
| [AP-14](#ap-14) | Agregar una plataforma a una película | MongoDB | 1 | 2 | 3 | 6 de 6 PASA |
| [AP-15](#ap-15) | Corregir el nombre de una plataforma | MongoDB | 1 | 2 | 2 | 5 de 5 PASA |
| [AP-16](#ap-16) | Quitar una plataforma de una película | MongoDB | 1 | 1 | 2 | 4 de 4 PASA |
| [AP-17](#ap-17) | Reemplazar el reparto de la ficha | MongoDB | 1 | 3 | 5 | 9 de 9 PASA |
| [AP-18](#ap-18) | Publicar una reseña comparativa | MongoDB | 2 | 2 | 6 | 10 de 10 PASA |
| [AP-19](#ap-19) | Comparativa de un usuario sobre una pareja | MongoDB | 1 | 1 | 2 | 4 de 4 PASA |
| [AP-20](#ap-20) | Consultar una comparativa | MongoDB | 1 | 3 | 1 | 5 de 5 PASA |
| [AP-21](#ap-21) | Comparativas de una adaptación | MongoDB | 1 | 3 | 1 | 5 de 5 PASA |
| [AP-23](#ap-23) | Comparativas de un usuario | MongoDB | 1 | 3 | 2 | 6 de 6 PASA |
| [AP-24](#ap-24) | Editar una comparativa propia | MongoDB | 2 | 2 | 3 | 7 de 7 PASA |
| [AP-25](#ap-25) | Eliminar una comparativa propia | MongoDB | 1 | 1 | 2 | 4 de 4 PASA |
| [AP-26](#ap-26) | Ocultar o mostrar una comparativa | MongoDB | 2 | 2 | 2 | 6 de 6 PASA |
| [AP-27](#ap-27) | Eliminar una comparativa por moderación | MongoDB | 1 | 1 | 1 | 3 de 3 PASA |
| [AP-28](#ap-28) | Eliminar las comparativas de un usuario | MongoDB | 1 | 2 | 2 | 5 de 5 PASA |
| [AP-29](#ap-29) | Fichas publicadas para la reconciliación | MongoDB | 2 | 2 | 1 | 5 de 5 PASA |
| [AP-30](#ap-30) | Borradores antiguos | MongoDB | 1 | 2 | 1 | 4 de 4 PASA |
| [AP-32](#ap-32) | Reparto de todas las películas | MongoDB | 1 | 2 | 1 | 4 de 4 PASA |
| [AP-33](#ap-33) | Usuarios que tienen comparativas | MongoDB | 1 | 2 | 1 | 4 de 4 PASA |
| [CG-01](#cg-01) | Buscar obras por el nombre de una persona | Neo4j | 2 | 2 | 2 | 6 de 6 PASA |
| [CG-02](#cg-02) | Buscar personas por nombre | Neo4j | 2 | 2 | 2 | 6 de 6 PASA |
| [CG-03](#cg-03) | Adaptaciones de un libro | Neo4j | 1 | 2 | 3 | 6 de 6 PASA |
| [CG-04](#cg-04) | Libro de origen de una película | Neo4j | 2 | 1 | 3 | 6 de 6 PASA |
| [CG-05](#cg-05) | Autores de un libro y directores de una película | Neo4j | 2 | 2 | 3 | 7 de 7 PASA |
| [CG-06](#cg-06) | Todos los caminos más cortos entre dos nodos | Neo4j | 2 | 3 | 2 | 7 de 7 PASA |
| [CG-07](#cg-07) | Autores adaptados por un mismo director | Neo4j | 2 | 2 | 2 | 6 de 6 PASA |
| [CG-08](#cg-08) | Recomendar libros por adaptaciones del mismo director | Neo4j | 2 | 3 | 3 | 8 de 8 PASA |
| [CG-09](#cg-09) | Recomendar películas por lo que leen los seguidos | Neo4j | 2 | 2 | 2 | 6 de 6 PASA |
| [CG-10](#cg-10) | Comprobar que un libro y una película están unidos por una adaptación | Neo4j | 2 | 1 | 2 | 5 de 5 PASA |
| [CG-11](#cg-11) | Crear el nodo de una obra | Neo4j | 2 | 3 | 1 | 6 de 6 PASA |
| [CG-13](#cg-13) | Registrar una persona | Neo4j | 1 | 2 | 2 | 5 de 5 PASA |
| [CG-14](#cg-14) | Relacionar una persona con una obra | Neo4j | 3 | 3 | 4 | 10 de 10 PASA |
| [CG-15](#cg-15) | Registrar que una película es adaptación de un libro | Neo4j | 2 | 2 | 4 | 8 de 8 PASA |
| [CG-16](#cg-16) | Crear el nodo de un usuario | Neo4j | 1 | 2 | 2 | 5 de 5 PASA |
| [CG-17](#cg-17) | Eliminar un usuario y sus relaciones | Neo4j | 2 | 2 | 1 | 5 de 5 PASA |
| [CG-18](#cg-18) | Crear o eliminar un seguimiento | Neo4j | 2 | 3 | 2 | 7 de 7 PASA |
| [CG-19](#cg-19) | Crear o eliminar una lectura de libro | Neo4j | 2 | 3 | 2 | 7 de 7 PASA |
| [CG-20](#cg-20) | Reparto de una película | Neo4j | 1 | 3 | 2 | 6 de 6 PASA |
| [CG-21](#cg-21) | Reparto de todas las películas | Neo4j | 2 | 3 | 1 | 6 de 6 PASA |
| [CG-22](#cg-22) | Obras con sus conteos | Neo4j | 3 | 2 | 2 | 7 de 7 PASA |
| [CG-23](#cg-23) | Usuarios con sus relaciones | Neo4j | 2 | 2 | 2 | 6 de 6 PASA |
| [CG-24](#cg-24) | Asignar, cambiar o quitar la foto de una persona | Neo4j | 2 | 2 | 2 | 6 de 6 PASA |
| [CG-25](#cg-25) | Películas en las que actuó una persona | Neo4j | 1 | 2 | 3 | 6 de 6 PASA |
| [INT-01](#int-01) | Alta de una película adaptada, de borrador a publicada | PostgreSQL, MongoDB, Neo4j | 2 | 3 | 2 | 7 de 7 PASA (con pasos simulados) |
| [INT-02](#int-02) | Publicar una reseña y ver la ficha con su promedio | PostgreSQL, MongoDB, Neo4j | 1 | 3 | 2 | 6 de 6 PASA |
| [INT-04](#int-04) | Recomendar libros por adaptaciones del mismo director | PostgreSQL, MongoDB, Neo4j | 2 | 2 | 4 | 8 de 8 PASA |
| [INT-06](#int-06) | Reseña comparativa con validación de la adaptación | PostgreSQL, MongoDB, Neo4j | 2 | 1 | 5 | 8 de 8 PASA (con pasos simulados) |
| [INT-07](#int-07) | Eliminar una cuenta y limpiar las copias | PostgreSQL, MongoDB, Neo4j | 3 | 2 | 1 | 6 de 6 PASA (con pasos simulados) |

## 2. Operaciones de la base relacional (PostgreSQL)

<a id="o1"></a>
### O1. Registrar usuario

RF-01 · Actor: Visitante

**1. Identificador y propósito.** `O1`. Crear la cuenta de un lector y dejar, en la misma transacción, el evento `usuario_creado`. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL (fuente). El evento `usuario_creado` hará que el grafo cree el nodo `Usuario` (CG-16) cuando exista el worker.

**3. Parámetros de entrada y validaciones.** `usuario_id` (UUID en minúsculas que genera la API), `correo` (único, en minúsculas, hasta 254 caracteres), `nombre` (obligatorio, hasta 100) y `password_hash` (el hash, nunca la contraseña). La API normaliza el correo y calcula el hash. La base valida: UNIQUE del correo, CHECK de minúsculas, NOT NULL y longitudes.

**4. Resultado esperado y formato de salida.** Una fila en `usuario` con rol `lector` y una fila `usuario_creado` en `sync_outbox` con el `usuario_id` en el `payload`. Sin cuerpo de respuesta: o se confirma o falla con `23505 uq_usuario_correo`, `23514 ck_usuario_correo_minusculas`, `23502` (nulo) o `22001` (demasiado largo), y entonces no queda ni usuario ni evento.

**5. Casos normales, límite y de error.** 7 casos: 2 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O1-n1` | normal | O1: registrar crea el usuario con rol lector y el evento usuario_creado |
| `O1-n2` | normal | O1: el evento lleva el usuario_id |
| `O1-l1` | límite | O1: un correo de exactamente 254 caracteres se acepta |
| `O1-l2` | límite | O1: un correo de 255 caracteres se rechaza |
| `O1-e1` | error | O1: correo ya registrado: rechaza con UNIQUE y no deja evento |
| `O1-e2` | error | O1: correo con mayusculas: rechaza con el CHECK |
| `O1-e3` | error | O1: nombre nulo: rechaza (NOT NULL) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **7 de 7 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O1-n1` | `lector / usuario_creado` | PASA |
| `O1-n2` | `00000000-0000-4000-8000-000000009001` | PASA |
| `O1-l1` | `sin_error` | PASA |
| `O1-l2` | `22001` | PASA |
| `O1-e1` | `23505 uq_usuario_correo / (ninguno)` | PASA |
| `O1-e2` | `23514 ck_usuario_correo_minusculas` | PASA |
| `O1-e3` | `23502` | PASA |

Evidencia previa (Entregable 4): `relacional/01-integridad.txt`: pruebas 1, 1b y E7.

<a id="o2"></a>
### O2. Iniciar sesión

RF-02 · Actor: Visitante

**1. Identificador y propósito.** `O2`. Autenticar a un usuario y abrir una sesión: leer el usuario por correo y guardar el hash del token aleatorio que recibirá la app (D-35). Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** `correo` (se busca ya normalizado), hash SHA-256 del token (64 hexadecimales; el token en claro no se guarda) y vigencia (propuesta: 30 días). La API compara la contraseña con `password_hash`. La base exige `expira_en > creado_en` y un token único.

**4. Resultado esperado y formato de salida.** Una fila en `sesion` y el `usuario_id`. Con un correo inexistente no hay usuario y la API responde lo mismo que con una contraseña incorrecta, para no revelar qué correos existen. Errores de base: `23514 ck_sesion_vigencia` y `23505 pk_sesion`.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 1 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O2-n1` | normal | O2: iniciar sesion guarda la sesion con vigencia de 30 dias (el correo se normaliza a minusculas) |
| `O2-n2` | normal | O2: se guarda el hash SHA-256 (64 hexadecimales), nunca el token |
| `O2-l1` | límite | O2: una sesion de 1 segundo ya es valida al crearse (expira_en > creado_en) |
| `O2-e1` | error | O2: correo inexistente: la misma respuesta que con contrasena mala (28000) |
| `O2-e2` | error | O2: una sesion que nace vencida se rechaza |
| `O2-e3` | error | O2: un token repetido choca con la clave primaria |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O2-n1` | `30 days` | PASA |
| `O2-n2` | `true` | PASA |
| `O2-l1` | `lector` | PASA |
| `O2-e1` | `28000` | PASA |
| `O2-e2` | `23514 ck_sesion_vigencia` | PASA |
| `O2-e3` | `23505 pk_sesion` | PASA |

Evidencia previa (Entregable 4): `relacional/01-integridad.txt`: pruebas 16, 17a y 17b.

<a id="o3"></a>
### O3. Editar perfil

RF-03 · Actor: Lector

**1. Identificador y propósito.** `O3`. Cambiar el nombre y la biografía del usuario que tiene la sesión. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** `:sesion` (el `usuario_id` de la sesión), `nombre` (obligatorio, hasta 100 caracteres) y `biografia` (opcional, hasta 500). Solo se actualiza la fila de `:sesion`.

**4. Resultado esperado y formato de salida.** Número de filas actualizadas: 1, o 0 si el usuario no existe. Errores de base: `23502` (nombre nulo) y `22001` (texto demasiado largo).

**5. Casos normales, límite y de error.** 6 casos: 1 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O3-n1` | normal | O3: editar el perfil cambia nombre y biografia del usuario de la sesion |
| `O3-l1` | límite | O3: una biografia de exactamente 500 caracteres se acepta |
| `O3-l2` | límite | O3: la biografia puede quedar nula |
| `O3-e1` | error | O3: nombre nulo se rechaza |
| `O3-e2` | error | O3: una biografia de 501 caracteres se rechaza |
| `O3-e3` | error | O3: un usuario que no existe no cambia ninguna fila |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O3-n1` | `1 fila; Nombre Nuevo \| Mi biografia` | PASA |
| `O3-l1` | `sin_error` | PASA |
| `O3-l2` | `1 fila; (nulo)` | PASA |
| `O3-e1` | `23502` | PASA |
| `O3-e2` | `22001` | PASA |
| `O3-e3` | `0 filas` | PASA |

<a id="o4"></a>
### O4. Eliminar cuenta

RF-04 · Actor: Lector

**1. Identificador y propósito.** `O4`. Borrar la cuenta con todo lo suyo, corregir el promedio de las obras que había reseñado y dejar el evento `usuario_eliminado`, todo en una transacción. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL hace la cascada y el trigger del promedio. La limpieza de MongoDB (AP-28) y de Neo4j (CG-17) la hará el worker al procesar el evento; aquí se demuestra completa en INT-07.

**3. Parámetros de entrada y validaciones.** `:sesion` (el `usuario_id` de la sesión). El evento se escribe antes del borrado y la transacción falla si el usuario no existe.

**4. Resultado esperado y formato de salida.** El usuario desaparece y con él, por cascada, sus reseñas, estados, listas con sus elementos, seguimientos en ambos sentidos y sesiones. El trigger recalcula `promedio` y `total_resenas` de cada obra afectada (también cuando la reseña borrada estaba oculta). Queda un evento `usuario_eliminado` pendiente. Si algo falla, no se borra nada y tampoco queda evento.

**5. Casos normales, límite y de error.** 8 casos: 5 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O4-n1` | normal | O4: eliminar a Ana borra todo lo suyo y el trigger recalcula las 5 obras que habia resenado (la oculta tambien dispara el recalculo) |
| `O4-n2` | normal | O4: no queda ninguna fila de Ana en ninguna tabla |
| `O4-n3` | normal | O4: lo ajeno sobrevive: 13 resenas y 6 seguimientos entre los demas usuarios de la semilla; 7 usuarios |
| `O4-n4` | normal | O4: queda el evento usuario_eliminado con el id de Ana |
| `O4-n5` | normal | O4: el promedio guardado coincide con el recalculo en todas las obras |
| `O4-l1` | límite | O4: un usuario sin datos se elimina igual y deja su evento |
| `O4-e1` | error | O4: un usuario que no existe: error, y el evento tambien se revierte |
| `O4-e2` | error | O4: si el borrado falla, el evento se deshace con el y el usuario sigue existiendo |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O4-n1` | `b01 total=2 promedio=4.00; b03 total=1 promedio=5.00; b06 total=0 promedio=(nulo); b09 total=1 promedio=2.00; f09 total=0 promedio=(nulo)` | PASA |
| `O4-n2` | `resena=0 estado=0 lista=0 elemento=0 seguimiento=0 sesion=0` | PASA |
| `O4-n3` | `7 usuarios; 13 resenas; 6 seguimientos` | PASA |
| `O4-n4` | `usuario_eliminado c1000000-0000-4000-8000-000000000002` | PASA |
| `O4-n5` | `0 discrepancias` | PASA |
| `O4-l1` | `0 usuarios; usuario_eliminado` | PASA |
| `O4-e1` | `P0001 / (ninguno)` | PASA |
| `O4-e2` | `P0001 / 1 usuarios / (ninguno)` | PASA |

Evidencia previa (Entregable 4): `relacional/01-integridad.txt`: pruebas 10-antes, 10a, 10b, 11a a 11c y 16.

<a id="o5"></a>
### O5. Registrar obra

RF-08 · Actor: Administrador

**1. Identificador y propósito.** `O5`. Dar de alta en `obra_resumen` la referencia (id y tipo) de una obra cuya ficha ya existe como borrador, de forma idempotente. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL. Es el segundo paso del alta de una obra (la ficha vive en MongoDB y el nodo en Neo4j): ver INT-01.

**3. Parámetros de entrada y validaciones.** `obra_id` (el UUID de la ficha) y `tipo` (`libro` o `pelicula`). Un alta repetida no hace nada ni falla.

**4. Resultado esperado y formato de salida.** Número de filas insertadas: 1, o 0 si ya existía. La obra nace con `total_resenas = 0` y `promedio` nulo. Errores: `22P02` (tipo fuera de la lista) y `23502` (id nulo).

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O5-n1` | normal | O5: registrar una obra la crea sin resenas |
| `O5-l1` | límite | O5: repetir el alta es idempotente: 0 filas nuevas, sigue habiendo una |
| `O5-e1` | error | O5: un tipo fuera de la lista se rechaza |
| `O5-e2` | error | O5: un id nulo se rechaza |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O5-n1` | `1 fila; total=0 promedio=(nulo)` | PASA |
| `O5-l1` | `0 filas nuevas; 1 en obra_resumen` | PASA |
| `O5-e1` | `22P02` | PASA |
| `O5-e2` | `23502` | PASA |

<a id="o7"></a>
### O7. Publicar reseña

RF-12, RF-13 · Actor: Lector

**1. Identificador y propósito.** `O7`. Guardar la reseña, recalcular el promedio de la obra, marcarla como terminada y dejar el evento `obra_leida`, todo o nada. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL (una sola transacción). El evento `obra_leida` llevará la lectura al grafo (CG-19) cuando exista el worker: ver INT-02.

**3. Parámetros de entrada y validaciones.** `:sesion`, `obra_id`, `calificacion` (entero de 1 a 5) y `texto` (opcional). La base valida: una reseña por usuario y obra (RN-01), calificación de 1 a 5 (RN-02) y que la obra exista.

**4. Resultado esperado y formato de salida.** Reseña creada; `promedio` y `total_resenas` de la obra actualizados por el trigger; `estado_obra = terminada`; evento `obra_leida` solo si el estado anterior no era `terminada`. Devuelve el estado anterior. En cualquier fallo (`23505 uq_resena_usuario_obra`, `23514 ck_resena_calificacion`, `23503 fk_resena_obra`) no queda reseña, estado, promedio ni evento.

**5. Casos normales, límite y de error.** 8 casos: 3 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O7-n1` | normal | O7: publicar una resena crea resena, promedio, estado terminada y el evento obra_leida |
| `O7-n2` | normal | O7: una segunda resena de otro usuario recalcula el promedio (5 y 3) |
| `O7-n3` | normal | O7: si el estado ya era terminada, la resena no genera un segundo evento |
| `O7-l1` | límite | O7: calificacion minima (1) y texto nulo se aceptan; promedio de 5, 3 y 1 |
| `O7-l2` | límite | O7: la resena de una PELICULA tambien genera obra_leida (el worker la descartara, D-16) |
| `O7-e1` | error | O7: segunda resena del mismo usuario y obra: RN-01; no cambia nada |
| `O7-e2` | error | O7: calificacion 6: RN-02; no queda resena, estado ni evento |
| `O7-e3` | error | O7: obra inexistente: llave foranea; no queda estado ni evento |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O7-n1` | `previo=sin estado; total=1 promedio=5.00; estado=terminada; obra_leida` | PASA |
| `O7-n2` | `total=2 promedio=4.00` | PASA |
| `O7-n3` | `previo=terminada; total=1 promedio=4.00; (ninguno)` | PASA |
| `O7-l1` | `total=3 promedio=3.00; texto=(nulo)` | PASA |
| `O7-l2` | `obra_leida` | PASA |
| `O7-e1` | `23505 uq_resena_usuario_obra / total=3 promedio=3.00 / (ninguno)` | PASA |
| `O7-e2` | `23514 ck_resena_calificacion / estados=0 / (ninguno)` | PASA |
| `O7-e3` | `23503 fk_resena_obra / estados=0 / (ninguno)` | PASA |

Evidencia previa (Entregable 4): `relacional/02-transaccion.txt`: pruebas 14a a 14c. `relacional/03-concurrencia.txt`: 15a y 15b. `relacional/01-integridad.txt`: 2, 3a, 3b y 7a.

<a id="o8"></a>
### O8. Editar reseña

RF-14 · Actor: Lector

**1. Identificador y propósito.** `O8`. Cambiar la calificación y el texto de una reseña propia; el promedio se recalcula. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** `:sesion`, `resena_id`, `calificacion` (1 a 5) y `texto`. Solo se edita si `usuario_id = :sesion` (RN-10). La obra de una reseña no se puede cambiar.

**4. Resultado esperado y formato de salida.** Filas actualizadas (1, o 0 si la reseña no existe o es de otro usuario). `actualizado_en` avanza y el trigger recalcula la obra. `23514 ck_resena_calificacion` si la calificación sale de rango.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O8-n1` | normal | O8: editar la calificacion (3 -> 5) recalcula el promedio de la obra (5, 5 y 1) |
| `O8-n2` | normal | O8: la edicion actualiza actualizado_en y deja creado_en igual |
| `O8-l1` | límite | O8: editar solo el texto (misma calificacion) deja el promedio igual |
| `O8-l2` | límite | O8: calificacion minima (1): promedio de 5, 1 y 1 |
| `O8-e1` | error | O8: calificacion 6 se rechaza y el promedio no cambia |
| `O8-e2` | error | O8: editar la resena de OTRO usuario no cambia ninguna fila (RN-10) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O8-n1` | `1 fila; total=3 promedio=3.67` | PASA |
| `O8-n2` | `true` | PASA |
| `O8-l1` | `1 fila; total=3 promedio=3.67` | PASA |
| `O8-l2` | `1 fila; total=3 promedio=2.33` | PASA |
| `O8-e1` | `23514 ck_resena_calificacion / total=3 promedio=2.33` | PASA |
| `O8-e2` | `0 filas; total=3 promedio=2.33` | PASA |

Evidencia previa (Entregable 4): `relacional/01-integridad.txt`: prueba 12c.

<a id="o9"></a>
### O9. Eliminar reseña

RF-14 · Actor: Lector

**1. Identificador y propósito.** `O9`. Borrar una reseña propia; el promedio se recalcula y el estado de la obra no cambia. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** `:sesion` y `resena_id`. Solo se borra si `usuario_id = :sesion` (RN-10).

**4. Resultado esperado y formato de salida.** Filas borradas (1, o 0 si no existe o es ajena). El trigger recalcula `promedio` y `total_resenas`; con la última reseña vigente la obra queda en 0 reseñas y promedio nulo. El estado sigue siendo `terminada`.

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O9-n1` | normal | O9: eliminar la propia resena recalcula el promedio (5 y 1) y el estado sigue terminada |
| `O9-l1` | límite | O9: eliminar la unica resena de una obra deja total 0 y promedio nulo (obra B) |
| `O9-e1` | error | O9: eliminar la resena de otro usuario no borra nada (RN-10) |
| `O9-e2` | error | O9: una resena que no existe no borra nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O9-n1` | `1 fila; total=2 promedio=3.00; estado=terminada` | PASA |
| `O9-l1` | `1 fila; total=0 promedio=(nulo)` | PASA |
| `O9-e1` | `0 filas; total=2 promedio=3.00` | PASA |
| `O9-e2` | `0 filas` | PASA |

Evidencia previa (Entregable 4): `relacional/01-integridad.txt`: prueba 12f.

<a id="o10"></a>
### O10. Moderar reseña

RF-18 · Actor: Administrador

**1. Identificador y propósito.** `O10`. Ocultar, mostrar o eliminar una reseña; solo cuentan en el promedio las no ocultas. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL. La moderación de comparativas es de MongoDB (AP-26 y AP-27).

**3. Parámetros de entrada y validaciones.** `resena_id` y la acción: `ocultar`, `mostrar` o `eliminar`. La comprobación del rol `admin` (RN-09) es de la API.

**4. Resultado esperado y formato de salida.** Filas afectadas (1, o 0 si no existe). El trigger recalcula el promedio y el total con las reseñas no ocultas.

**5. Casos normales, límite y de error.** 6 casos: 3 normales, 2 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O10-n1` | normal | O10: ocultar una resena la saca del promedio |
| `O10-n2` | normal | O10: volver a mostrarla la devuelve al promedio |
| `O10-n3` | normal | O10: eliminar por moderacion borra la fila y recalcula |
| `O10-l1` | límite | O10: ocultar la unica resena vigente deja total 0 y promedio nulo |
| `O10-l2` | límite | O10: ocultar una resena que ya esta oculta es idempotente |
| `O10-e1` | error | O10: moderar una resena que no existe no cambia nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O10-n1` | `1 fila; total=1 promedio=5.00` | PASA |
| `O10-n2` | `1 fila; total=2 promedio=3.00` | PASA |
| `O10-n3` | `1 fila; total=1 promedio=5.00; resenas del usuario=0` | PASA |
| `O10-l1` | `1 fila; total=0 promedio=(nulo)` | PASA |
| `O10-l2` | `1 fila; total=0 promedio=(nulo)` | PASA |
| `O10-e1` | `0 filas` | PASA |

Evidencia previa (Entregable 4): `relacional/01-integridad.txt`: pruebas 12d, 12e y 13.

<a id="o11"></a>
### O11. Marcar estado de una obra

RF-15 · Actor: Lector

**1. Identificador y propósito.** `O11`. Fijar el estado de lectura de una obra (`pendiente`, `en_curso` o `terminada`) y emitir el evento que corresponda al cambio. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL. Los eventos llevarán `leyó` al grafo (CG-19) solo para libros (D-16).

**3. Parámetros de entrada y validaciones.** `:sesion`, `obra_id` y `estado` (de la lista cerrada). Lee el estado anterior con bloqueo de fila.

**4. Resultado esperado y formato de salida.** Fila de `estado_obra` creada o actualizada. Evento `obra_leida` al pasar a `terminada` desde otro estado; `obra_no_leida` al salir de `terminada`; ninguno en cualquier otro cambio. Errores: `22P02` (estado fuera de la lista) y `23503 fk_estado_obra`.

**5. Casos normales, límite y de error.** 8 casos: 4 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O11-n1` | normal | O11: primer estado (pendiente) no genera evento |
| `O11-n2` | normal | O11: pendiente -> en_curso no genera evento |
| `O11-n3` | normal | O11: en_curso -> terminada genera obra_leida |
| `O11-n4` | normal | O11: terminada -> en_curso genera obra_no_leida |
| `O11-l1` | límite | O11: marcar terminada algo que ya esta terminada no genera evento |
| `O11-l2` | límite | O11: una PELICULA terminada tambien genera obra_leida (el worker la descartara, D-16) |
| `O11-e1` | error | O11: un estado fuera de la lista se rechaza |
| `O11-e2` | error | O11: una obra inexistente se rechaza y no deja evento |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O11-n1` | `(ninguno)` | PASA |
| `O11-n2` | `(ninguno)` | PASA |
| `O11-n3` | `obra_leida` | PASA |
| `O11-n4` | `obra_no_leida` | PASA |
| `O11-l1` | `(ninguno)` | PASA |
| `O11-l2` | `obra_leida` | PASA |
| `O11-e1` | `22P02` | PASA |
| `O11-e2` | `23503 fk_estado_obra / (ninguno)` | PASA |

Evidencia previa (Entregable 4): `relacional/01-integridad.txt`: pruebas 8a y E7.

<a id="o12"></a>
### O12. Crear, renombrar y eliminar lista

RF-19 · Actor: Lector

**1. Identificador y propósito.** `O12`. Gestionar las listas propias del usuario. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** `:sesion`, `lista_id` (UUID) y `nombre` (obligatorio, hasta 100 caracteres; puede repetirse dentro del mismo usuario). Renombrar y eliminar exigen `usuario_id = :sesion`.

**4. Resultado esperado y formato de salida.** Crear: lista nueva. Renombrar y eliminar: filas afectadas (1, o 0 si la lista es ajena o no existe). Eliminar borra también sus elementos por cascada. Errores: `22001` y `23502`.

**5. Casos normales, límite y de error.** 9 casos: 3 normales, 2 límite y 4 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O12-n1` | normal | O12: crear una lista |
| `O12-n2` | normal | O12: renombrar una lista propia |
| `O12-n3` | normal | O12: eliminar una lista borra sus elementos en cascada |
| `O12-l1` | límite | O12: un nombre de exactamente 100 caracteres se acepta |
| `O12-l2` | límite | O12: dos listas del mismo usuario pueden tener el mismo nombre |
| `O12-e1` | error | O12: un nombre de 101 caracteres se rechaza |
| `O12-e2` | error | O12: un nombre nulo se rechaza |
| `O12-e3` | error | O12: renombrar la lista de OTRO usuario no cambia nada (RN-10) |
| `O12-e4` | error | O12: eliminar la lista de OTRO usuario no borra nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **9 de 9 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O12-n1` | `1 lista: Mis pendientes` | PASA |
| `O12-n2` | `1 fila; Para leer` | PASA |
| `O12-n3` | `1 fila; 0 elementos` | PASA |
| `O12-l1` | `sin_error` | PASA |
| `O12-l2` | `2 listas llamadas Para leer` | PASA |
| `O12-e1` | `22001` | PASA |
| `O12-e2` | `23502` | PASA |
| `O12-e3` | `0 filas; Para leer` | PASA |
| `O12-e4` | `0 filas; la lista sigue` | PASA |

<a id="o13"></a>
### O13. Agregar y quitar obra de una lista

RF-20 · Actor: Lector

**1. Identificador y propósito.** `O13`. Poner una obra al final de una lista propia o quitarla. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** `:sesion`, `lista_id` y `obra_id`. La lista debe ser del usuario. La obra no puede repetirse en la lista (RN-04) y debe existir.

**4. Resultado esperado y formato de salida.** Agregar: la obra queda en la posición `última + 1` (1 en una lista vacía). Quitar: no renumera las demás. Ambas devuelven las filas afectadas (0 si la lista es ajena o la obra no estaba). Errores: `23505 pk_elemento_lista` y `23503 fk_elemento_obra`.

**5. Casos normales, límite y de error.** 8 casos: 2 normales, 2 límite y 4 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O13-n1` | normal | O13: agregar da posicion = ultima + 1 |
| `O13-n2` | normal | O13: quitar una obra no renumera las demas (B desaparece, quedan 1 y 3) |
| `O13-l1` | límite | O13: agregar a una lista vacia da posicion 1 |
| `O13-l2` | límite | O13: al volver a agregar, la posicion es maximo + 1 (4), no la primera libre |
| `O13-e1` | error | O13: la misma obra dos veces en una lista: RN-04 |
| `O13-e2` | error | O13: una obra inexistente se rechaza |
| `O13-e3` | error | O13: agregar a la lista de OTRO usuario no inserta nada (RN-10) |
| `O13-e4` | error | O13: quitar una obra que no esta en la lista no borra nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O13-n1` | `A=1, B=2, C=3` | PASA |
| `O13-n2` | `1 fila; A=1, C=3` | PASA |
| `O13-l1` | `1 fila; A=1` | PASA |
| `O13-l2` | `A=1, C=3, B=4` | PASA |
| `O13-e1` | `23505 pk_elemento_lista` | PASA |
| `O13-e2` | `23503 fk_elemento_obra` | PASA |
| `O13-e3` | `0 filas` | PASA |
| `O13-e4` | `0 filas` | PASA |

Evidencia previa (Entregable 4): `relacional/01-integridad.txt`: pruebas 6, 7c y E4.

<a id="o14"></a>
### O14. Reordenar lista

RF-20 · Actor: Lector

**1. Identificador y propósito.** `O14`. Reasignar las posiciones de una lista a 1…n en el orden recibido, sin que se vea un estado intermedio. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** `:sesion`, `lista_id` y el arreglo de `obra_id` en el nuevo orden. Debe contener exactamente los elementos de la lista.

**4. Resultado esperado y formato de salida.** Número de filas reordenadas. Si el orden recibido no coincide con los elementos (falta uno, sobra uno o la lista es ajena) la transacción falla y las posiciones quedan como estaban.

**5. Casos normales, límite y de error.** 6 casos: 1 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O14-n1` | normal | O14: reordenar reasigna posiciones 1..n en el orden recibido (tambien las compacta) |
| `O14-l1` | límite | O14: una lista de un solo elemento queda en la posicion 1 (venia en la 7) |
| `O14-l2` | límite | O14: una lista vacia con orden vacio no falla |
| `O14-e1` | error | O14: un orden con una obra ajena a la lista se rechaza y deja las posiciones como estaban |
| `O14-e2` | error | O14: un orden incompleto (falta un elemento) se rechaza y no cambia nada |
| `O14-e3` | error | O14: reordenar la lista de OTRO usuario se rechaza |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O14-n1` | `3 filas; B=1, A=2, C=3` | PASA |
| `O14-l1` | `1 filas; A=1` | PASA |
| `O14-l2` | `0 filas` | PASA |
| `O14-e1` | `P0001 / B=1, A=2, C=3` | PASA |
| `O14-e2` | `P0001 / B=1, A=2, C=3` | PASA |
| `O14-e3` | `P0001` | PASA |

<a id="o15"></a>
### O15. Seguir usuario

RF-21 · Actor: Lector

**1. Identificador y propósito.** `O15`. Registrar que un usuario sigue a otro y dejar el evento, en una transacción. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL (fuente). El evento `seguimiento_creado` creará `sigue` en el grafo (CG-18).

**3. Parámetros de entrada y validaciones.** `:sesion` (quien sigue) y `seguido_id`. La base valida: no seguirse a sí mismo y no seguir dos veces (RN-03), y que el seguido exista.

**4. Resultado esperado y formato de salida.** Una fila en `seguimiento` y un evento `seguimiento_creado`. Errores: `23514 ck_seguimiento_no_propio`, `23505 pk_seguimiento` y `23503 fk_seguimiento_seguido`; en todos, sin evento.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 1 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O15-n1` | normal | O15: seguir crea el seguimiento y el evento seguimiento_creado |
| `O15-l1` | límite | O15: seguir a un usuario de la semilla que ya tiene seguidores (el administrador) |
| `O15-e1` | error | O15: seguirse a si mismo: RN-03; no deja evento |
| `O15-e2` | error | O15: seguir dos veces: RN-03; no deja evento |
| `O15-e3` | error | O15: seguir a un usuario que no existe: llave foranea; no deja evento |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O15-n1` | `1 seguimiento; seguimiento_creado` | PASA |
| `O15-l1` | `2 seguidores; seguimiento_creado` | PASA |
| `O15-e1` | `23514 ck_seguimiento_no_propio / (ninguno)` | PASA |
| `O15-e2` | `23505 pk_seguimiento / (ninguno)` | PASA |
| `O15-e3` | `23503 fk_seguimiento_seguido / (ninguno)` | PASA |

Evidencia previa (Entregable 4): `relacional/01-integridad.txt`: pruebas 4 y 5.

<a id="o16"></a>
### O16. Dejar de seguir

RF-21 · Actor: Lector

**1. Identificador y propósito.** `O16`. Borrar un seguimiento y dejar el evento solo si realmente existía. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL (fuente). El evento `seguimiento_eliminado` borrará `sigue` en el grafo (CG-18).

**3. Parámetros de entrada y validaciones.** `:sesion` y `seguido_id`.

**4. Resultado esperado y formato de salida.** Filas borradas: 1 con evento `seguimiento_eliminado`, o 0 sin evento si no existía. No hay error posible por restricción.

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 2 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O16-n1` | normal | O16: dejar de seguir borra el seguimiento y escribe seguimiento_eliminado |
| `O16-l1` | límite | O16: dejar de seguir a quien no se seguia no hace nada ni escribe evento |
| `O16-l2` | límite | O16: se puede volver a seguir despues de dejar de seguir |
| `O16-e1` | error | O16: dejar de seguir a un usuario que no existe no hace nada ni escribe evento |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O16-n1` | `1 fila; seguimiento_eliminado` | PASA |
| `O16-l1` | `0 filas; (ninguno)` | PASA |
| `O16-l2` | `1 fila; seguimiento_eliminado; 0 seguimientos` | PASA |
| `O16-e1` | `0 filas; (ninguno)` | PASA |

<a id="o17"></a>
### O17. Consultas de lectura

RF-06, RF-07, RF-15, RF-19, RF-20, RF-22 · Actor: Lector, visitante

**1. Identificador y propósito.** `O17`. Las once lecturas que sirven las pantallas: promedio de una obra, reseñas de una obra, reseñas de un usuario, obras por estado, listas de un usuario, obras de una lista en orden, a quién sigue un usuario, quién lo sigue, perfil, estado de una obra concreta y reseña propia sobre una obra. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL. La API une el promedio a la ficha de MongoDB (INT-02).

**3. Parámetros de entrada y validaciones.** `obra_id`, `usuario_id` o `lista_id` según la consulta. Las reseñas ocultas no se listan.

**4. Resultado esperado y formato de salida.** Filas con el formato de la tabla de la sección 8 de `04-operaciones.md`. Sin coincidencias, resultado vacío (nunca error). `promedio` es nulo cuando `total_resenas = 0`.

**5. Casos normales, límite y de error.** 16 casos: 11 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O17-n1` | normal | O17: promedio y total de una obra (Dune: 5, 4 y 4) |
| `O17-n2` | normal | O17: resenas no ocultas de una obra, recientes primero (Dune) |
| `O17-n3` | normal | O17: resenas no ocultas de un usuario, recientes primero (Ana: su resena oculta no sale) |
| `O17-n4` | normal | O17: obras de un usuario por estado (Luis) |
| `O17-n5` | normal | O17: listas de un usuario (Ana) |
| `O17-n6` | normal | O17: obras de una lista en su posicion (no es el orden de insercion) |
| `O17-n7` | normal | O17: a quien sigue un usuario (Sofia) |
| `O17-n8` | normal | O17: quien sigue a un usuario (Ana) |
| `O17-n9` | normal | O17: perfil de un usuario (Ana) |
| `O17-n10` | normal | O17: estado que Ana dio a Dune (para mostrarlo en la ficha) |
| `O17-n11` | normal | O17: resena de Ana sobre Dune (para editarla o saber si ya reseno) |
| `O17-l1` | límite | O17: una obra sin resenas tiene total 0 y promedio nulo (Androides) |
| `O17-l2` | límite | O17: Expiacion tiene 2 resenas, una oculta: cuenta solo la visible |
| `O17-e1` | error | O17: perfil de un usuario que no existe: sin fila |
| `O17-e2` | error | O17: promedio de una obra que no existe: sin fila |
| `O17-e3` | error | O17: resena de un usuario que no ha resenado esa obra (Pedro y Androides): sin fila |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **16 de 16 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O17-n1` | `total=3 promedio=4.33` | PASA |
| `O17-n2` | `c05 (4), c04 (4), c02 (5)` | PASA |
| `O17-n3` | `f09 (5), b06 (3), b03 (4), b01 (5)` | PASA |
| `O17-n4` | `pendiente: 1, terminada: 2` | PASA |
| `O17-n5` | `1 lista(s): Por ver este año` | PASA |
| `O17-n6` | `b04, f05, b02` | PASA |
| `O17-n7` | `c02, c05, c07` | PASA |
| `O17-n8` | `c03, c04, c06` | PASA |
| `O17-n9` | `Ana Lectora \| ana@ejemplo.test \| lector` | PASA |
| `O17-n10` | `terminada` | PASA |
| `O17-n11` | `5` | PASA |
| `O17-l1` | `total=0 promedio=(nulo)` | PASA |
| `O17-l2` | `total=1 promedio=2.00` | PASA |
| `O17-e1` | `(sin fila)` | PASA |
| `O17-e2` | `(sin fila)` | PASA |
| `O17-e3` | `(sin fila)` | PASA |

Evidencia previa (Entregable 4): `relacional/05-consultas.txt`: Q-O17a a Q-O17h. `semilla/consultas-relacional.txt`: S-O17a a S-O17j. Planes: `relacional/04-indices.txt`.

<a id="o18"></a>
### O18. Libros de partida para recomendar

RF-26 (paso 1) · Actor: Lector

**1. Identificador y propósito.** `O18`. Devolver los libros que le gustaron al usuario (RN-11): terminados, con calificación de 4 o más y reseña no oculta. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL. La API pasa el resultado a Neo4j (CG-08): ver INT-04.

**3. Parámetros de entrada y validaciones.** `:sesion` y `:limite` (propuesto: 20).

**4. Resultado esperado y formato de salida.** Lista de `obra_id` de libros, la mejor calificación y la reseña más reciente primero, con tope de `:limite`. Vacía si el usuario no tiene ninguno. Excluye películas, estados distintos de `terminada`, calificaciones menores de 4 y reseñas ocultas.

**5. Casos normales, límite y de error.** 8 casos: 3 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O18-n1` | normal | O18: Ana, libros terminados con calificacion >= 4 y resena visible, mejor calificado primero |
| `O18-n2` | normal | O18: Ana, quedan fuera El Hobbit (3), Orgullo y prejuicio (pendiente), Expiacion (resena oculta), Orient Express (en curso) y la pelicula Orgullo y prejuicio |
| `O18-n3` | normal | O18: Pedro, Historia de tu vida (5) antes que Dune (4) |
| `O18-l1` | límite | O18: Marta, igual calificacion (4): primero la resena mas reciente |
| `O18-l2` | límite | O18: :limite 1 acota la lista a la mejor |
| `O18-e1` | error | O18: Elena califico 2 su unico libro terminado: no es de partida |
| `O18-e2` | error | O18: Sofia no termino ningun libro: lista vacia |
| `O18-e3` | error | O18: un usuario que no existe: lista vacia, sin error |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O18-n1` | `b01, b03` | PASA |
| `O18-n2` | `0 de b06 b08 b09 b10 f09` | PASA |
| `O18-n3` | `b04, b01` | PASA |
| `O18-l1` | `b08, b01` | PASA |
| `O18-l2` | `b01` | PASA |
| `O18-e1` | `(vacio)` | PASA |
| `O18-e2` | `(vacio)` | PASA |
| `O18-e3` | `(vacio)` | PASA |

Evidencia previa (Entregable 4): `relacional/05-consultas.txt`: Q-O18a a Q-O18c. `semilla/consultas-relacional.txt`: S-O18a a S-O18h.

<a id="o19"></a>
### O19. Propagar eventos al grafo

RNF-02 · Actor: Sistema

**1. Identificador y propósito.** `O19`. Tomar los eventos pendientes en orden, aplicarlos al grafo de forma idempotente y marcarlos. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL (`sync_outbox`) y Neo4j (CG-16 a CG-19). **SIMULADO:** el worker no existe; los casos ejecutan solo la parte de PostgreSQL (tomar el lote, marcar `procesado` o `fallido`).

**3. Parámetros de entrada y validaciones.** Tamaño de lote (50, D-34 y 9.2) y límite de intentos (5).

**4. Resultado esperado y formato de salida.** Lote de eventos `pendiente` por `evento_id`. Un evento aplicado queda `procesado` con su fecha. Un fallo suma 1 a `intentos` y guarda el error; al quinto queda `fallido` y no bloquea a los siguientes. Con la bandeja vacía, lote vacío.

**5. Casos normales, límite y de error.** 7 casos: 2 normales, 3 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O19-n1` | normal | O19 (simulado): el lote sale en orden de evento_id y solo con pendientes |
| `O19-n2` | normal | O19 (simulado): al marcar procesado, el evento sale del lote y queda con su fecha |
| `O19-l1` | límite | O19 (simulado): con la bandeja vacia el lote no trae nada |
| `O19-l2` | límite | O19 (simulado): con 5 pendientes, un lote de 2 trae solo los 2 primeros |
| `O19-l3` | límite | O19 (simulado): el indice parcial I6 existe sobre estado = pendiente |
| `O19-e1` | error | O19 (simulado): un fallo suma 1 a intentos, guarda el error y el evento sigue pendiente |
| `O19-e2` | error | O19 (simulado): al 5.o intento queda fallido y NO bloquea al siguiente |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **7 de 7 casos PASA**.

Pasos **SIMULADOS** (los haría el worker o la reconciliación, que aún no existen) en: `O19-n1`, `O19-n2`, `O19-l1`, `O19-l2`, `O19-l3`, `O19-e1`, `O19-e2`.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O19-n1` | `seguimiento_creado, obra_leida, seguimiento_eliminado` | PASA |
| `O19-n2` | `lote=obra_leida, seguimiento_eliminado; procesado_en=si` | PASA |
| `O19-l1` | `(vacio)` | PASA |
| `O19-l2` | `obra_leida, obra_leida` | PASA |
| `O19-l3` | `parcial` | PASA |
| `O19-e1` | `intentos=1 estado=pendiente error=destino no responde` | PASA |
| `O19-e2` | `estado=fallido intentos=5; lote=seguimiento_eliminado` | PASA |

Evidencia previa (Entregable 4): `relacional/04-indices.txt`: I-09, I-12 e I-13 (índice parcial I6).

<a id="o20"></a>
### O20. Datos para reconciliación

RNF-03 · Actor: Sistema

**1. Identificador y propósito.** `O20`. Entregar a la reconciliación lo que PostgreSQL sabe: seguimientos, estados `terminada` de libros, ids de obras y usuarios, eventos `fallido` y la verificación del promedio. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL. El script de reconciliación los compara con MongoDB y Neo4j (`coherencia.ps1`).

**3. Parámetros de entrada y validaciones.** Ninguna.

**4. Resultado esperado y formato de salida.** Listas de pares o ids (seguimientos, `terminada` de libros, obras, usuarios, eventos `fallido`) y, para la verificación del promedio, las obras cuyo `promedio` o `total_resenas` no coincide con el recálculo desde las reseñas no ocultas (vacío si todo cuadra).

**5. Casos normales, límite y de error.** 8 casos: 6 normales, 1 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O20-n1` | normal | O20: todos los seguimientos |
| `O20-n2` | normal | O20: estados terminada de obras de tipo libro (D-16: las peliculas no cuentan) |
| `O20-n3` | normal | O20: todos los obra_id de obra_resumen |
| `O20-n4` | normal | O20: todos los usuario_id de usuario |
| `O20-n5` | normal | O20: lista los eventos fallidos (aqui uno insertado a mano en la transaccion) |
| `O20-n6` | normal | O20: verificacion del promedio: ninguna obra con promedio distinto del recalculado |
| `O20-l1` | límite | O20: sin eventos fallidos no hay nada que reconciliar |
| `O20-e1` | error | O20: con el trigger apagado la consulta SI detecta un promedio incorrecto (Orient Express) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O20-n1` | `10 pares` | PASA |
| `O20-n2` | `12 pares` | PASA |
| `O20-n3` | `23 obras (11 libros, 12 peliculas)` | PASA |
| `O20-n4` | `8 usuarios` | PASA |
| `O20-n5` | `1 fallidos: obra_leida (5 intentos)` | PASA |
| `O20-n6` | `0 discrepancias` | PASA |
| `O20-l1` | `0 fallidos` | PASA |
| `O20-e1` | `b10: total=0 promedio=(nulo) vs total=1 promedio=3.00` | PASA |

Evidencia previa (Entregable 4): `relacional/05-consultas.txt`: Q-O20a y Q-O20b. `semilla/consultas-relacional.txt`: S-O20a a S-O20c.

<a id="o21"></a>
### O21. Purgar eventos procesados y sesiones vencidas

— · Actor: Sistema

**1. Identificador y propósito.** `O21`. Mantener pequeñas la bandeja y la tabla de sesiones. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** Sin parámetros. Reglas: eventos `procesado` con más de 30 días; sesiones con `expira_en` anterior a ahora.

**4. Resultado esperado y formato de salida.** Cuántos eventos y cuántas sesiones borró. No toca eventos `pendiente` ni `fallido`, ni el borde exacto de 30 días, ni una sesión que vence justo ahora.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 3 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O21-n1` | normal | O21: borra el procesado de hace 31 dias y la sesion vencida |
| `O21-n2` | normal | O21: lo vigente se conserva (procesado de hace 29 dias, sesion vigente) |
| `O21-l1` | límite | O21: el borde exacto de 30 dias se conserva (la regla es "mas de 30 dias") |
| `O21-l2` | límite | O21: una sesion que vence exactamente ahora se conserva (la regla es expira_en < ahora) |
| `O21-l3` | límite | O21: repetir la purga no borra nada mas |
| `O21-e1` | error | O21: un evento pendiente y uno fallido, aunque sean viejos, no se purgan (solo los procesados) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O21-n1` | `1 eventos, 1 sesiones` | PASA |
| `O21-n2` | `B y sesion 2` | PASA |
| `O21-l1` | `E se conserva` | PASA |
| `O21-l2` | `sesion 3 se conserva` | PASA |
| `O21-l3` | `0 eventos, 0 sesiones` | PASA |
| `O21-e1` | `C y D se conservan` | PASA |

<a id="o22"></a>
### O22. Validar la sesión de una petición

RF-02, RNF-06, RNF-07 · Actor: Lector, administrador

**1. Identificador y propósito.** `O22`. Saber a qué usuario y con qué rol pertenece el token de una petición. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** Hash SHA-256 del token. Consulta por clave primaria.

**4. Resultado esperado y formato de salida.** `usuario_id` y `rol` actuales si la sesión existe y `expira_en > ahora`; sin filas en caso contrario. Un cambio de rol surte efecto de inmediato. No renueva la vigencia.

**5. Casos normales, límite y de error.** 5 casos: 2 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O22-n1` | normal | O22: una sesion vigente devuelve el usuario y su rol |
| `O22-n2` | normal | O22: tras cambiar el rol en usuario, la misma sesion ya trae el rol nuevo |
| `O22-l1` | límite | O22: una sesion que vence exactamente ahora ya no es valida (expira_en > ahora) |
| `O22-e1` | error | O22: una sesion vencida no devuelve nada |
| `O22-e2` | error | O22: un token inexistente no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O22-n1` | `admin` | PASA |
| `O22-n2` | `lector` | PASA |
| `O22-l1` | `(sin sesion)` | PASA |
| `O22-e1` | `(sin sesion)` | PASA |
| `O22-e2` | `(sin sesion)` | PASA |

Evidencia previa (Entregable 4): `relacional/05-consultas.txt`: Q-O22a a Q-O22d. `semilla/consultas-relacional.txt`: S-O22a a S-O22d.

<a id="o23"></a>
### O23. Cerrar sesión

RF-02 · Actor: Lector, administrador

**1. Identificador y propósito.** `O23`. Invalidar la sesión de la petición actual. Diseño: [04-operaciones.md](../modelado/relacional/04-operaciones.md).

**2. Bases que intervienen.** PostgreSQL.

**3. Parámetros de entrada y validaciones.** Hash del token de la petición.

**4. Resultado esperado y formato de salida.** Filas borradas (1, o 0 si el token no existe). Las demás sesiones del mismo usuario siguen válidas.

**5. Casos normales, límite y de error.** 3 casos: 1 normales, 1 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `O23-n1` | normal | O23: cerrar sesion borra la fila y la sesion deja de ser valida |
| `O23-l1` | límite | O23: las demas sesiones del mismo usuario siguen validas |
| `O23-e1` | error | O23: cerrar un token que no existe no falla y no borra nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [relacional.txt](../../db/evidencias/catalogo/relacional.txt). Ejecutor: [07-catalogo.sql](../../db/relacional/pruebas/07-catalogo.sql). Resultado: **3 de 3 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `O23-n1` | `1 fila; (sin sesion)` | PASA |
| `O23-l1` | `admin` | PASA |
| `O23-e1` | `0 filas` | PASA |

## 3. Operaciones de la base documental (MongoDB)

<a id="ap-01"></a>
### AP-01. Ficha completa de un libro

RF-06 · Actor: Visitante, lector, administrador

**1. Identificador y propósito.** `AP-01`. Leer en una sola consulta todo lo descriptivo de un libro (RNF-04). Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. La API añade el promedio desde PostgreSQL (INT-02).

**3. Parámetros de entrada y validaciones.** `obra_id` (UUID en minúsculas, D-11). Visitantes y lectores solo ven fichas `publicada`; el administrador ve también los borradores.

**4. Resultado esperado y formato de salida.** El documento de `libros`: `titulo`, `sinopsis`, `portada_url` (si tiene), `generos`, `anio_publicacion_original`, `ediciones` y `estado_publicacion`. Sin documento si el id no existe.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-01-n1` | normal | AP-01: ficha completa de un libro en una sola lectura (Dune) |
| `AP-01-l1` | límite | AP-01: un libro sin portada no trae el campo portada_url (Historia de tu vida) |
| `AP-01-l2` | límite | AP-01: una ficha en borrador y sin ediciones tambien se lee (Neuromante) |
| `AP-01-e1` | error | AP-01: un id que no existe no devuelve ficha |
| `AP-01-e2` | error | AP-01: el id va en minusculas (D-11): el mismo id en mayusculas no encuentra nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-01-n1` | `Dune \| 1965 \| 2 ediciones` | PASA |
| `AP-01-l1` | `sin portada_url` | PASA |
| `AP-01-l2` | `borrador \| 0 ediciones` | PASA |
| `AP-01-e1` | `(no existe)` | PASA |
| `AP-01-e2` | `(no existe)` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 9-AP01. `semilla/consultas-documental.txt`: S-AP01a a S-AP01c.

<a id="ap-02"></a>
### AP-02. Ficha completa de una película

RF-07 · Actor: Visitante, lector, administrador

**1. Identificador y propósito.** `AP-02`. Leer en una sola consulta la ficha de una película con su reparto copiado. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. La API añade el promedio desde PostgreSQL.

**3. Parámetros de entrada y validaciones.** `obra_id`. Mismas reglas de visibilidad que AP-01.

**4. Resultado esperado y formato de salida.** El documento de `peliculas`: datos descriptivos, `plataformas`, `datos_tecnicos`, `reparto` (`persona_id`, `nombre`, `personaje`, `orden`, `foto_url` opcional) y `estado_publicacion`. Sin documento si el id no existe.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-02-n1` | normal | AP-02: ficha completa de una pelicula con reparto, datos tecnicos y clasificacion (Dune 2021) |
| `AP-02-l1` | límite | AP-02: una ficha en borrador tiene el reparto vacio (Neuromante) |
| `AP-02-l2` | límite | AP-02: un actor sin foto no lleva foto_url en el reparto (Macfadyen) |
| `AP-02-e1` | error | AP-02: un id que no existe no devuelve ficha |
| `AP-02-e2` | error | AP-02: el id de un libro buscado en peliculas no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-02-n1` | `2021 \| 155 min \| 2 actores \| PG-13` | PASA |
| `AP-02-l1` | `borrador \| 0 actores` | PASA |
| `AP-02-l2` | `Matthew Macfadyen \| sin foto_url` | PASA |
| `AP-02-e1` | `(no existe)` | PASA |
| `AP-02-e2` | `(no existe)` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 9-AP02. `semilla/consultas-documental.txt`: S-AP02a a S-AP02d.

<a id="ap-03"></a>
### AP-03. Buscar obras por título

RF-05 · Actor: Visitante, lector, administrador

**1. Identificador y propósito.** `AP-03`. Encontrar libros y películas cuyo título contenga las palabras escritas. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. La búsqueda por autor, director o actor es de Neo4j (CG-01); ver INT-04 y el inventario.

**3. Parámetros de entrada y validaciones.** Texto de búsqueda (índice de texto IX-01 e IX-02, sin distinguir mayúsculas ni tildes; solo palabras completas). El administrador ve también borradores.

**4. Resultado esperado y formato de salida.** Por resultado: `_id`, tipo, `titulo`, año y `portada_url`. Un fragmento de palabra o un texto vacío no devuelve nada (limitación conocida).

**5. Casos normales, límite y de error.** 8 casos: 2 normales, 3 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-03-n1` | normal | AP-03: 'dune' (visitante) encuentra el libro y las dos peliculas publicadas |
| `AP-03-n2` | normal | AP-03: 'MARCIANO' en mayusculas encuentra el libro y la pelicula |
| `AP-03-l1` | límite | AP-03: varias palabras: 'orgullo prejuicio' encuentra libro y pelicula |
| `AP-03-l2` | límite | AP-03: sin tilde ('expiacion') encuentra 'Expiación' |
| `AP-03-l3` | límite | AP-03: el administrador (sin filtro de publicacion) si ve los borradores |
| `AP-03-e1` | error | AP-03: un visitante no ve los borradores |
| `AP-03-e2` | error | AP-03: un fragmento de palabra ('dun') no encuentra nada: limitacion conocida del indice de texto |
| `AP-03-e3` | error | AP-03: un texto vacio no encuentra nada y no falla |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-03-n1` | `libros: Dune ; películas: Dune \| Dune: Parte dos` | PASA |
| `AP-03-n2` | `1 libros, 1 películas` | PASA |
| `AP-03-l1` | `Orgullo y prejuicio \| Orgullo y prejuicio` | PASA |
| `AP-03-l2` | `libros: Expiación ; películas: Expiación` | PASA |
| `AP-03-l3` | `1 libros, 1 películas` | PASA |
| `AP-03-e1` | `0 libros, 0 películas` | PASA |
| `AP-03-e2` | `0 libros, 0 películas` | PASA |
| `AP-03-e3` | `0 libros, 0 películas` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 7a a 7d, 8 y 9-AP03. `semilla/consultas-documental.txt`: S-AP03a a S-AP03g.

<a id="ap-04"></a>
### AP-04. Datos de presentación de varias obras

RF-23 a RF-27, RF-20 · Actor: Visitante, lector

**1. Identificador y propósito.** `AP-04`. Convertir una lista de ids en título, año y portada para mostrar resultados. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. Los ids los entregan Neo4j o PostgreSQL (INT-04).

**3. Parámetros de entrada y validaciones.** Lista de `obra_id`. Visitantes y lectores solo reciben fichas publicadas.

**4. Resultado esperado y formato de salida.** Por obra: `obra_id`, tipo, `titulo`, año y `portada_url`. Un id inexistente se omite; una lista vacía devuelve vacío.

**5. Casos normales, límite y de error.** 6 casos: 1 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-04-n1` | normal | AP-04: datos de presentacion de 4 obras (2 libros y 2 peliculas) a partir de sus ids |
| `AP-04-l1` | límite | AP-04: una lista vacia de ids no devuelve nada |
| `AP-04-l2` | límite | AP-04: una sola obra |
| `AP-04-e1` | error | AP-04: un id que no existe se omite sin fallar |
| `AP-04-e2` | error | AP-04: un visitante no recibe las fichas en borrador |
| `AP-04-e3` | error | AP-04: el administrador si las recibe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-04-n1` | `Dune \| Dune \| Historia de tu vida \| La llegada` | PASA |
| `AP-04-l1` | `0 obras` | PASA |
| `AP-04-l2` | `Historia de tu vida` | PASA |
| `AP-04-e1` | `Dune` | PASA |
| `AP-04-e2` | `0 obras` | PASA |
| `AP-04-e3` | `Neuromante \| Neuromante` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 9-AP04. `semilla/consultas-documental.txt`: S-AP04a y S-AP04b.

<a id="ap-05"></a>
### AP-05. Existencia y estado de una obra

RF-08, RF-10, RF-11, RN-06 · Actor: Sistema

**1. Identificador y propósito.** `AP-05`. Comprobar que una obra existe en la colección esperada y si está en borrador o publicada (alta idempotente, relaciones del grafo, comparativas). Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `obra_id` y la colección esperada (`libros` o `peliculas`).

**4. Resultado esperado y formato de salida.** `existe` con su `estado_publicacion`, o `no existe`.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-05-n1` | normal | AP-05: un libro publicado existe |
| `AP-05-l1` | límite | AP-05: un libro en borrador existe y lo dice (Neuromante) |
| `AP-05-l2` | límite | AP-05: una pelicula en borrador existe y lo dice (Neuromante) |
| `AP-05-e1` | error | AP-05: el id de un libro buscado en la coleccion de peliculas no existe |
| `AP-05-e2` | error | AP-05: un id desconocido no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-05-n1` | `existe, publicada` | PASA |
| `AP-05-l1` | `existe, borrador` | PASA |
| `AP-05-l2` | `existe, borrador` | PASA |
| `AP-05-e1` | `no existe` | PASA |
| `AP-05-e2` | `no existe` | PASA |

Evidencia previa (Entregable 4): `semilla/consultas-documental.txt`: S-AP05a a S-AP05d.

<a id="ap-07"></a>
### AP-07. Crear la ficha de un libro como borrador

RF-08 · Actor: Administrador

**1. Identificador y propósito.** `AP-07`. Registrar un libro nuevo que todavía no se ve en el catálogo. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. Es el primer paso del alta (INT-01).

**3. Parámetros de entrada y validaciones.** `_id` (UUID de la API), `titulo`, `sinopsis`, `generos` (al menos uno, sin repetir), `anio_publicacion_original` (−3000 a 2100), `ediciones` (hasta 50; puede ir vacío), `portada_url` opcional (https, hasta 500), `estado_publicacion = borrador`, `creado_en` y `actualizado_en`. El validador (nivel estricto) rechaza campos faltantes, tipos distintos y campos no definidos.

**4. Resultado esperado y formato de salida.** Documento insertado; el visitante no lo ve. Un documento inválido falla con el código 121 (validador) y un `_id` repetido con el 11000.

**5. Casos normales, límite y de error.** 11 casos: 2 normales, 3 límite y 6 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-07-n1` | normal | AP-07: crear la ficha de un libro como borrador |
| `AP-07-n2` | normal | AP-07: la ficha queda en borrador: 0 visibles para el visitante, 1 para el administrador |
| `AP-07-l1` | límite | AP-07: crear el libro con su primera edicion |
| `AP-07-l2` | límite | AP-07: anio de publicacion en el limite superior (2100) |
| `AP-07-l3` | límite | AP-07: con portada_url valida (opcional) |
| `AP-07-e1` | error | AP-07: sin titulo se rechaza |
| `AP-07-e2` | error | AP-07: estado_publicacion fuera de la lista |
| `AP-07-e3` | error | AP-07: _id en mayusculas |
| `AP-07-e4` | error | AP-07: anio de publicacion 2101 (fuera de rango) |
| `AP-07-e5` | error | AP-07: un campo no definido en el validador |
| `AP-07-e6` | error | AP-07: el mismo _id dos veces |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **11 de 11 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-07-n1` | `aceptado` | PASA |
| `AP-07-n2` | `0 visibles; 1 para el admin` | PASA |
| `AP-07-l1` | `aceptado` | PASA |
| `AP-07-l2` | `aceptado` | PASA |
| `AP-07-l3` | `aceptado` | PASA |
| `AP-07-e1` | `rechazado 121` | PASA |
| `AP-07-e2` | `rechazado 121` | PASA |
| `AP-07-e3` | `rechazado 121` | PASA |
| `AP-07-e4` | `rechazado 121` | PASA |
| `AP-07-e5` | `rechazado 121` | PASA |
| `AP-07-e6` | `rechazado 11000` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 1, 2a, 3a, 4, 5a, 5b, 6a, 7a y 11a.

<a id="ap-08"></a>
### AP-08. Crear la ficha de una película como borrador

RF-08 · Actor: Administrador

**1. Identificador y propósito.** `AP-08`. Registrar una película nueva en borrador. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. El reparto se llena después desde el grafo (AP-17).

**3. Parámetros de entrada y validaciones.** `_id`, `titulo`, `sinopsis`, `generos`, `anio_estreno` (1888 a 2100), `duracion_min` (1 a 1000), `plataformas`, `datos_tecnicos` (`idioma_original` y `paises` obligatorios; `productoras` y `clasificacion` opcionales), `reparto` vacío y `estado_publicacion = borrador`.

**4. Resultado esperado y formato de salida.** Documento insertado. Código 121 si algún campo no cumple el validador.

**5. Casos normales, límite y de error.** 9 casos: 1 normales, 3 límite y 5 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-08-n1` | normal | AP-08: crear la ficha de una pelicula como borrador con el reparto vacio |
| `AP-08-l1` | límite | AP-08: duracion minima (1) y anio minimo (1888) |
| `AP-08-l2` | límite | AP-08: duracion maxima (1000) |
| `AP-08-l3` | límite | AP-08: datos_tecnicos solo con lo obligatorio (sin productoras ni clasificacion) |
| `AP-08-e1` | error | AP-08: duracion 0 |
| `AP-08-e2` | error | AP-08: anio de estreno 1887 (antes del cine) |
| `AP-08-e3` | error | AP-08: datos_tecnicos sin paises |
| `AP-08-e4` | error | AP-08: un actor con orden 0 |
| `AP-08-e5` | error | AP-08: una plataforma con un campo url (D-26 la elimino) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **9 de 9 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-08-n1` | `aceptado` | PASA |
| `AP-08-l1` | `aceptado` | PASA |
| `AP-08-l2` | `aceptado` | PASA |
| `AP-08-l3` | `aceptado` | PASA |
| `AP-08-e1` | `rechazado 121` | PASA |
| `AP-08-e2` | `rechazado 121` | PASA |
| `AP-08-e3` | `rechazado 121` | PASA |
| `AP-08-e4` | `rechazado 121` | PASA |
| `AP-08-e5` | `rechazado 121` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 1, 2b, 6b, 6c, 11b, 11c y 9c.

<a id="ap-09"></a>
### AP-09. Publicar una ficha

RF-08, D-24 · Actor: Sistema

**1. Identificador y propósito.** `AP-09`. Último paso del alta: pasar la ficha de `borrador` a `publicada`, de forma que repetirlo no tenga efecto. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. Antes, la API comprueba el mínimo de D-24 en Neo4j (CG-03, CG-04, CG-05, CG-20): ver INT-01.

**3. Parámetros de entrada y validaciones.** `obra_id`; el filtro exige `estado_publicacion = borrador`.

**4. Resultado esperado y formato de salida.** Una ficha modificada; si ya estaba publicada o no existe, 0 coincidencias sin error. **El validador no comprueba el mínimo de D-24**: lo impone la API.

**5. Casos normales, límite y de error.** 6 casos: 3 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-09-n1` | normal | AP-09: publicar una ficha en borrador (Neuromante, libro) |
| `AP-09-n2` | normal | AP-09: repetirla no tiene efecto ni falla (el filtro exige borrador) |
| `AP-09-n3` | normal | AP-09: la ficha queda publicada |
| `AP-09-l1` | límite | AP-09: el validador NO impide publicar una pelicula con el reparto vacio: el minimo de D-24 lo exige la API antes de llamar a AP-09 |
| `AP-09-e1` | error | AP-09: publicar un id que no existe no hace nada |
| `AP-09-e2` | error | AP-09: un estado fuera de la lista se rechaza |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-09-n1` | `coincidencias=1 modificados=1` | PASA |
| `AP-09-n2` | `coincidencias=0 modificados=0` | PASA |
| `AP-09-n3` | `publicada` | PASA |
| `AP-09-l1` | `coincidencias=1 modificados=1; reparto=0` | PASA |
| `AP-09-e1` | `coincidencias=0 modificados=0` | PASA |
| `AP-09-e2` | `rechazado 121` | PASA |

<a id="ap-10"></a>
### AP-10. Corregir los datos descriptivos de una ficha

RF-08 · Actor: Administrador

**1. Identificador y propósito.** `AP-10`. Cambiar título, sinopsis, portada, géneros, año, duración o datos técnicos. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. El grafo no guarda el título (D-18): no hay nada que propagar.

**3. Parámetros de entrada y validaciones.** `obra_id` y solo los campos que cambian. Se aplican las mismas reglas del validador (título no vacío, `portada_url` con https, sin campos nuevos).

**4. Resultado esperado y formato de salida.** Coincidencias y documentos modificados. Con el mismo valor no se modifica nada; con un valor inválido, código 121.

**5. Casos normales, límite y de error.** 8 casos: 2 normales, 2 límite y 4 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-10-n1` | normal | AP-10: corregir titulo y sinopsis |
| `AP-10-n2` | normal | AP-10: agregar una portada a una ficha que no la tenia (Historia de tu vida) |
| `AP-10-l1` | límite | AP-10: quitar la portada con $unset (el campo deja de existir) |
| `AP-10-l2` | límite | AP-10: corregir con el mismo valor no modifica nada |
| `AP-10-e1` | error | AP-10: dejar el titulo vacio |
| `AP-10-e2` | error | AP-10: portada_url con http:// |
| `AP-10-e3` | error | AP-10: un id que no existe |
| `AP-10-e4` | error | AP-10: un campo no definido en el validador |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-10-n1` | `coincidencias=1 modificados=1; Dune (edicion corregida)` | PASA |
| `AP-10-n2` | `coincidencias=1 modificados=1` | PASA |
| `AP-10-l1` | `coincidencias=1 modificados=1; sin portada_url` | PASA |
| `AP-10-l2` | `coincidencias=1 modificados=0` | PASA |
| `AP-10-e1` | `rechazado 121` | PASA |
| `AP-10-e2` | `rechazado 121` | PASA |
| `AP-10-e3` | `coincidencias=0 modificados=0` | PASA |
| `AP-10-e4` | `rechazado 121` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 17a, 24a, 24b y 24c.

<a id="ap-11"></a>
### AP-11. Agregar una edición a un libro

RF-09 · Actor: Administrador

**1. Identificador y propósito.** `AP-11`. Añadir una edición sin cambiar el esquema. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `obra_id` y la edición: `edicion_id` (UUID), `isbn` (opcional, 13 dígitos sin guiones), `paginas` (1 a 10000), `editorial`, `idioma` y `anio`. El filtro condicional rechaza un ISBN que el libro ya tiene; el índice único *sparse* IX-03 rechaza uno que tenga otro libro.

**4. Resultado esperado y formato de salida.** Una edición más (máximo 50). ISBN repetido en el mismo libro: 0 modificados; en otro libro: error 11000; edición inválida: 121.

**5. Casos normales, límite y de error.** 8 casos: 2 normales, 2 límite y 4 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-11-n1` | normal | AP-11: agregar una edicion con ISBN nuevo, sin cambiar el esquema |
| `AP-11-n2` | normal | AP-11: agregar una edicion sin ISBN (es opcional) |
| `AP-11-l1` | límite | AP-11: la primera edicion de un libro que no tenia ninguna (Neuromante) |
| `AP-11-l2` | límite | AP-11: la edicion numero 51 (el maximo es 50) |
| `AP-11-e1` | error | AP-11: un ISBN que el mismo libro ya tiene (filtro condicional de la API) |
| `AP-11-e2` | error | AP-11: un ISBN que ya tiene OTRO libro (lo rechaza el indice unico sparse) |
| `AP-11-e3` | error | AP-11: una edicion sin paginas |
| `AP-11-e4` | error | AP-11: un ISBN con guiones |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-11-n1` | `coincidencias=1 modificados=1; 3 ediciones` | PASA |
| `AP-11-n2` | `coincidencias=1 modificados=1` | PASA |
| `AP-11-l1` | `coincidencias=1 modificados=1` | PASA |
| `AP-11-l2` | `rechazado 121` | PASA |
| `AP-11-e1` | `coincidencias=0 modificados=0` | PASA |
| `AP-11-e2` | `rechazado 11000` | PASA |
| `AP-11-e3` | `rechazado 121` | PASA |
| `AP-11-e4` | `rechazado 121` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 8, 12a y 15. `documental/02-indices.txt`: 1, 4 y 9-AP11.

<a id="ap-12"></a>
### AP-12. Corregir una edición de un libro

RF-08 · Actor: Administrador

**1. Identificador y propósito.** `AP-12`. Cambiar campos de una edición concreta, incluido su ISBN. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `obra_id`, `edicion_id` y los campos que cambian. Un ISBN nuevo se filtra con `$ne` para no repetir uno del mismo libro.

**4. Resultado esperado y formato de salida.** Coincidencias y modificados. Edición inexistente: 0 coincidencias; ISBN de la misma ficha: 0; de otro libro: 11000; valor inválido: 121.

**5. Casos normales, límite y de error.** 7 casos: 2 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-12-n1` | normal | AP-12: corregir las paginas de una edicion |
| `AP-12-n2` | normal | AP-12: ponerle un ISBN libre a la edicion que no lo tenia |
| `AP-12-l1` | límite | AP-12: quitarle el ISBN a una edicion ($unset): el ISBN es opcional |
| `AP-12-l2` | límite | AP-12: una edicion que no existe no coincide con nada |
| `AP-12-e1` | error | AP-12: ISBN que ya tiene otra edicion del mismo libro (filtro condicional) |
| `AP-12-e2` | error | AP-12: ISBN que ya tiene OTRO libro |
| `AP-12-e3` | error | AP-12: paginas 0 |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **7 de 7 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-12-n1` | `coincidencias=1 modificados=1; 600` | PASA |
| `AP-12-n2` | `coincidencias=1 modificados=1` | PASA |
| `AP-12-l1` | `coincidencias=1 modificados=1` | PASA |
| `AP-12-l2` | `coincidencias=0 modificados=0` | PASA |
| `AP-12-e1` | `coincidencias=0 modificados=0` | PASA |
| `AP-12-e2` | `rechazado 11000` | PASA |
| `AP-12-e3` | `rechazado 121` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 18 y 19a a 19c.

<a id="ap-13"></a>
### AP-13. Quitar una edición de un libro

RF-08 · Actor: Administrador

**1. Identificador y propósito.** `AP-13`. Eliminar una edición de la ficha. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `obra_id` y `edicion_id`.

**4. Resultado esperado y formato de salida.** Coincidencias y modificados. Quitar la última deja `ediciones` vacío y la ficha sigue siendo válida. Una edición inexistente deja la ficha como estaba.

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-13-n1` | normal | AP-13: quitar una edicion de un libro con dos |
| `AP-13-l1` | límite | AP-13: quitar la ultima edicion deja el arreglo vacio y la ficha sigue siendo valida |
| `AP-13-e1` | error | AP-13: quitar una edicion que no existe: coincide el libro pero no cambia nada |
| `AP-13-e2` | error | AP-13: un libro que no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-13-n1` | `coincidencias=1 modificados=1; 1 ediciones` | PASA |
| `AP-13-l1` | `coincidencias=1 modificados=1; 0 ediciones` | PASA |
| `AP-13-e1` | `coincidencias=1 modificados=0` | PASA |
| `AP-13-e2` | `coincidencias=0 modificados=0` | PASA |

<a id="ap-14"></a>
### AP-14. Agregar una plataforma a una película

RF-09 · Actor: Administrador

**1. Identificador y propósito.** `AP-14`. Añadir una plataforma sin cambiar el esquema. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `obra_id` y `nombre` (único dentro de la película; sin otros campos, D-26). Hasta 30 plataformas.

**4. Resultado esperado y formato de salida.** Coincidencias y modificados. Un nombre repetido (filtro condicional): 0; sin nombre o con un campo `url`: 121; la número 31: 121.

**5. Casos normales, límite y de error.** 6 casos: 1 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-14-n1` | normal | AP-14: agregar una plataforma sin cambiar el esquema |
| `AP-14-l1` | límite | AP-14: un nombre con tilde y espacios |
| `AP-14-l2` | límite | AP-14: la plataforma numero 31 (el maximo es 30) |
| `AP-14-e1` | error | AP-14: un nombre que la pelicula ya tiene (filtro condicional) |
| `AP-14-e2` | error | AP-14: una plataforma sin nombre |
| `AP-14-e3` | error | AP-14: una plataforma con un campo url (D-26) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-14-n1` | `coincidencias=1 modificados=1; A,B,C` | PASA |
| `AP-14-l1` | `coincidencias=1 modificados=1` | PASA |
| `AP-14-l2` | `rechazado 121` | PASA |
| `AP-14-e1` | `coincidencias=0 modificados=0` | PASA |
| `AP-14-e2` | `rechazado 121` | PASA |
| `AP-14-e3` | `rechazado 121` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 9b, 9c, 12b y 16.

<a id="ap-15"></a>
### AP-15. Corregir el nombre de una plataforma

RF-08 · Actor: Administrador

**1. Identificador y propósito.** `AP-15`. Renombrar una plataforma de una película. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `obra_id`, `nombre` actual y `nombre` nuevo (no puede estar ya en la película).

**4. Resultado esperado y formato de salida.** Coincidencias y modificados. Nombre nuevo repetido, plataforma inexistente o mismo nombre: 0 coincidencias; nombre vacío: 121.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-15-n1` | normal | AP-15: renombrar una plataforma a un nombre libre |
| `AP-15-l1` | límite | AP-15: renombrar una plataforma que no existe |
| `AP-15-l2` | límite | AP-15: renombrar a su mismo nombre no coincide (el filtro exige un nombre distinto) |
| `AP-15-e1` | error | AP-15: renombrar a un nombre que la pelicula ya tiene |
| `AP-15-e2` | error | AP-15: renombrar a un nombre vacio |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-15-n1` | `coincidencias=1 modificados=1; Plataforma A,Plataforma Z` | PASA |
| `AP-15-l1` | `coincidencias=0 modificados=0` | PASA |
| `AP-15-l2` | `coincidencias=0 modificados=0` | PASA |
| `AP-15-e1` | `coincidencias=0 modificados=0` | PASA |
| `AP-15-e2` | `rechazado 121` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 20, 21 y 21b.

<a id="ap-16"></a>
### AP-16. Quitar una plataforma de una película

RF-08 · Actor: Administrador

**1. Identificador y propósito.** `AP-16`. Eliminar una plataforma de la ficha. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `obra_id` y `nombre` de la plataforma.

**4. Resultado esperado y formato de salida.** Coincidencias y modificados. Quitar la última deja el arreglo vacío y la ficha válida; un nombre inexistente no cambia nada.

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-16-n1` | normal | AP-16: quitar una plataforma |
| `AP-16-l1` | límite | AP-16: quitar la ultima plataforma deja el arreglo vacio y la ficha sigue siendo valida |
| `AP-16-e1` | error | AP-16: quitar una plataforma que no existe |
| `AP-16-e2` | error | AP-16: una pelicula que no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-16-n1` | `coincidencias=1 modificados=1; Plataforma A` | PASA |
| `AP-16-l1` | `coincidencias=1 modificados=1; 0 plataformas` | PASA |
| `AP-16-e1` | `coincidencias=1 modificados=0` | PASA |
| `AP-16-e2` | `coincidencias=0 modificados=0` | PASA |

<a id="ap-17"></a>
### AP-17. Reemplazar el reparto de la ficha

RF-10, D-27 · Actor: Sistema

**1. Identificador y propósito.** `AP-17`. Regenerar la copia del reparto con el que hay en el grafo. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB (copia). La fuente es Neo4j: el reparto se lee con CG-20 y, si cambia una foto, con CG-24 y CG-25.

**3. Parámetros de entrada y validaciones.** `obra_id` de la película y el arreglo completo `[{persona_id, nombre, personaje, orden, foto_url?}]` (hasta 300). `orden` ≥ 1; `persona_id` UUID; `foto_url` con https y hasta 500 caracteres.

**4. Resultado esperado y formato de salida.** Coincidencias y modificados. Reparto vacío, de 1 o de 300 personas: aceptado; de 301, con `orden` 0, foto con http o `persona_id` inválido: 121; película inexistente: 0.

**5. Casos normales, límite y de error.** 9 casos: 1 normales, 3 límite y 5 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-17-n1` | normal | AP-17: reemplazar el reparto completo (2 actores, uno con foto y otro sin ella) |
| `AP-17-l1` | límite | AP-17: un reparto de un solo actor |
| `AP-17-l2` | límite | AP-17: un reparto de exactamente 300 actores (el maximo) |
| `AP-17-l3` | límite | AP-17: un reparto vacio (una ficha en borrador que aun no lo tiene) |
| `AP-17-e1` | error | AP-17: un reparto de 301 actores |
| `AP-17-e2` | error | AP-17: un actor con orden 0 |
| `AP-17-e3` | error | AP-17: foto_url con http:// |
| `AP-17-e4` | error | AP-17: persona_id que no es un UUID |
| `AP-17-e5` | error | AP-17: una pelicula que no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **9 de 9 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-17-n1` | `coincidencias=1 modificados=1; 2 actores` | PASA |
| `AP-17-l1` | `coincidencias=1 modificados=1` | PASA |
| `AP-17-l2` | `coincidencias=1 modificados=1` | PASA |
| `AP-17-l3` | `coincidencias=1 modificados=1; 0 actores` | PASA |
| `AP-17-e1` | `rechazado 121` | PASA |
| `AP-17-e2` | `rechazado 121` | PASA |
| `AP-17-e3` | `rechazado 121` | PASA |
| `AP-17-e4` | `rechazado 121` | PASA |
| `AP-17-e5` | `coincidencias=0 modificados=0` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 9d, 12c, 25a, 25b y 26.

<a id="ap-18"></a>
### AP-18. Publicar una reseña comparativa

RF-16 · Actor: Lector

**1. Identificador y propósito.** `AP-18`. Guardar la comparación de un libro con su adaptación. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB escribe. Antes, la API valida el usuario en PostgreSQL, las dos obras con AP-05 y la relación `adaptado_a` con CG-10 (RN-06): ver INT-06.

**3. Parámetros de entrada y validaciones.** `_id` (UUID), `usuario_id`, `libro_id`, `pelicula_id`, `veredicto` (`preferencia` en `libro`, `pelicula` o `empate`; `comentario` opcional), `aspectos` (de 1 a 10, `nombre` libre, `puntuacion` de 1 a 5 y `comentario` opcionales), `oculta`, `creado_en` y `actualizado_en`. Una por usuario y pareja (RN-05, índice IX-04).

**4. Resultado esperado y formato de salida.** Documento insertado. Pareja repetida del mismo usuario: 11000; 11 aspectos, preferencia o puntuación fuera de rango, sin aspectos u `oculta` como texto: 121.

**5. Casos normales, límite y de error.** 10 casos: 2 normales, 2 límite y 6 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-18-n1` | normal | AP-18: publicar una comparativa |
| `AP-18-n2` | normal | AP-18: aspectos de nombre libre, con y sin puntuacion (RF-16) |
| `AP-18-l1` | límite | AP-18: exactamente 10 aspectos (el maximo) |
| `AP-18-l2` | límite | AP-18: veredicto 'empate' con comentario |
| `AP-18-e1` | error | AP-18: la misma pareja del mismo usuario otra vez (RN-05) |
| `AP-18-e2` | error | AP-18: 11 aspectos |
| `AP-18-e3` | error | AP-18: preferencia fuera de la lista |
| `AP-18-e4` | error | AP-18: puntuacion 6 |
| `AP-18-e5` | error | AP-18: sin aspectos |
| `AP-18-e6` | error | AP-18: oculta como texto |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **10 de 10 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-18-n1` | `aceptado` | PASA |
| `AP-18-n2` | `aceptado` | PASA |
| `AP-18-l1` | `aceptado` | PASA |
| `AP-18-l2` | `aceptado` | PASA |
| `AP-18-e1` | `rechazado 11000` | PASA |
| `AP-18-e2` | `rechazado 121` | PASA |
| `AP-18-e3` | `rechazado 121` | PASA |
| `AP-18-e4` | `rechazado 121` | PASA |
| `AP-18-e5` | `rechazado 121` | PASA |
| `AP-18-e6` | `rechazado 121` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 1, 2c, 10a a 10g y 13. `documental/02-indices.txt`: 5 y 6.

<a id="ap-19"></a>
### AP-19. Comparativa de un usuario sobre una pareja

RN-05 · Actor: Lector

**1. Identificador y propósito.** `AP-19`. Saber si el usuario ya comparó esa pareja y abrir su comparativa para editarla. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `usuario_id`, `libro_id` y `pelicula_id`.

**4. Resultado esperado y formato de salida.** El documento completo, o nada si no existe. Su autor ve también la suya si está oculta.

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-19-n1` | normal | AP-19: la comparativa de Ana sobre Dune y Dune (2021) |
| `AP-19-l1` | límite | AP-19: su autora ve su propia comparativa oculta (Elena) |
| `AP-19-e1` | error | AP-19: Pedro no tiene comparativa sobre esa pareja (RN-05 permite crearla) |
| `AP-19-e2` | error | AP-19: un usuario que no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-19-n1` | `existe: 01` | PASA |
| `AP-19-l1` | `existe: 05 (oculta)` | PASA |
| `AP-19-e1` | `no existe` | PASA |
| `AP-19-e2` | `no existe` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 9-AP19.

<a id="ap-20"></a>
### AP-20. Consultar una comparativa

RF-16, RF-17, RF-18 · Actor: Visitante, lector, administrador

**1. Identificador y propósito.** `AP-20`. Leer una comparativa por su id. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `comparativa_id`. Las ocultas solo las ven su autor y el administrador (supuesto 6): se aplica con el filtro `oculta = false` (o `usuario_id` propio).

**4. Resultado esperado y formato de salida.** El documento completo si es visible para quien consulta; nada en caso contrario o si no existe.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 3 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-20-n1` | normal | AP-20: una comparativa por id |
| `AP-20-l1` | límite | AP-20: la comparativa oculta NO la ve otro lector (filtro oculta=false) |
| `AP-20-l2` | límite | AP-20: su autora (Elena) si la ve |
| `AP-20-l3` | límite | AP-20: el administrador (sin filtro) la ve |
| `AP-20-e1` | error | AP-20: un id que no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-20-n1` | `preferencia=libro oculta=false` | PASA |
| `AP-20-l1` | `(no visible)` | PASA |
| `AP-20-l2` | `visible` | PASA |
| `AP-20-l3` | `visible` | PASA |
| `AP-20-e1` | `no existe` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 9-AP20.

<a id="ap-21"></a>
### AP-21. Comparativas de una adaptación

RF-16, RF-17 · Actor: Visitante, lector, administrador

**1. Identificador y propósito.** `AP-21`. Listar las comparativas de una pareja libro–película, las más recientes primero. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. La API añade el nombre del autor desde PostgreSQL.

**3. Parámetros de entrada y validaciones.** `libro_id`, `pelicula_id`, y `oculta = false` salvo para el administrador; paginado (índice IX-05).

**4. Resultado esperado y formato de salida.** `comparativa_id`, `usuario_id`, `veredicto`, `aspectos` y `creado_en`, de la más reciente a la más antigua. Una pareja sin comparativas devuelve vacío.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 3 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-21-n1` | normal | AP-21: comparativas de una adaptacion, la mas reciente primero (Dune y Dune 2021: Marta, luego Ana) |
| `AP-21-l1` | límite | AP-21: la comparativa oculta no se lista a un lector |
| `AP-21-l2` | límite | AP-21: el administrador si la ve |
| `AP-21-l3` | límite | AP-21: paginado (saltar 1, tomar 1) |
| `AP-21-e1` | error | AP-21: una pareja sin comparativas (Dune y El marciano no son adaptacion una de la otra) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-21-n1` | `02, 01` | PASA |
| `AP-21-l1` | `0` | PASA |
| `AP-21-l2` | `05` | PASA |
| `AP-21-l3` | `01` | PASA |
| `AP-21-e1` | `0` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 9-AP21 a 9-AP21c. `semilla/consultas-documental.txt`: S-AP21a a S-AP21f.

<a id="ap-23"></a>
### AP-23. Comparativas de un usuario

RF-22 · Actor: Lector, administrador

**1. Identificador y propósito.** `AP-23`. Listar las comparativas de un usuario (su perfil y «mis comparativas»), las más recientes primero. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `usuario_id`, y `oculta = false` si quien consulta no es el autor ni el administrador; paginado (prefijo de IX-04).

**4. Resultado esperado y formato de salida.** `comparativa_id`, `libro_id`, `pelicula_id`, `veredicto` y `creado_en`. Un usuario sin comparativas devuelve vacío.

**5. Casos normales, límite y de error.** 6 casos: 1 normales, 3 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-23-n1` | normal | AP-23: comparativas de un usuario, la mas reciente primero (Ana) |
| `AP-23-l1` | límite | AP-23: otro lector no ve la comparativa oculta de Elena |
| `AP-23-l2` | límite | AP-23: su autora o el administrador si |
| `AP-23-l3` | límite | AP-23: paginado, primera pagina de 1 (Marta) |
| `AP-23-e1` | error | AP-23: un usuario sin comparativas (Sofia) |
| `AP-23-e2` | error | AP-23: un usuario que no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-23-n1` | `01` | PASA |
| `AP-23-l1` | `0` | PASA |
| `AP-23-l2` | `05` | PASA |
| `AP-23-l3` | `02` | PASA |
| `AP-23-e1` | `0` | PASA |
| `AP-23-e2` | `0` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 9-AP23. `semilla/consultas-documental.txt`: S-AP23a a S-AP23e.

<a id="ap-24"></a>
### AP-24. Editar una comparativa propia

RF-17, RN-10 · Actor: Lector

**1. Identificador y propósito.** `AP-24`. Cambiar el veredicto y los aspectos de una comparativa propia. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `comparativa_id`, `usuario_id` de la sesión (el filtro exige que sea el autor), `veredicto`, `aspectos` y `actualizado_en`. No cambian `usuario_id`, `libro_id` ni `pelicula_id`.

**4. Resultado esperado y formato de salida.** Coincidencias y modificados. De otro usuario: 0 coincidencias; puntuación 7 o preferencia fuera de la lista: 121; mismos valores: 0 modificados.

**5. Casos normales, límite y de error.** 7 casos: 2 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-24-n1` | normal | AP-24: editar veredicto y aspectos de una comparativa propia |
| `AP-24-n2` | normal | AP-24: no cambian usuario, libro ni pelicula y actualizado_en avanza |
| `AP-24-l1` | límite | AP-24: editar con 10 aspectos (el maximo) |
| `AP-24-l2` | límite | AP-24: guardar los mismos valores no modifica nada (sin tocar actualizado_en) |
| `AP-24-e1` | error | AP-24: puntuacion 7 |
| `AP-24-e2` | error | AP-24: editar la comparativa de OTRO usuario no cambia nada (RN-10) |
| `AP-24-e3` | error | AP-24: preferencia fuera de la lista |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **7 de 7 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-24-n1` | `coincidencias=1 modificados=1` | PASA |
| `AP-24-n2` | `mismo usuario, libro y pelicula; actualizado_en avanzo` | PASA |
| `AP-24-l1` | `coincidencias=1 modificados=1` | PASA |
| `AP-24-l2` | `coincidencias=1 modificados=0` | PASA |
| `AP-24-e1` | `rechazado 121` | PASA |
| `AP-24-e2` | `coincidencias=0 modificados=0` | PASA |
| `AP-24-e3` | `rechazado 121` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: 17b.

<a id="ap-25"></a>
### AP-25. Eliminar una comparativa propia

RF-17, RN-10 · Actor: Lector

**1. Identificador y propósito.** `AP-25`. Borrar la propia comparativa; la pareja queda libre para volver a compararla. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `comparativa_id` y `usuario_id` de la sesión.

**4. Resultado esperado y formato de salida.** Documentos borrados (1, o 0 si es ajena o no existe).

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-25-n1` | normal | AP-25: eliminar una comparativa propia |
| `AP-25-l1` | límite | AP-25: tras eliminarla, el mismo usuario puede volver a comparar esa pareja |
| `AP-25-e1` | error | AP-25: eliminar la comparativa de OTRO usuario no borra nada (RN-10) |
| `AP-25-e2` | error | AP-25: un id que no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-25-n1` | `borrados=1` | PASA |
| `AP-25-l1` | `aceptado` | PASA |
| `AP-25-e1` | `borrados=0; sigue existiendo` | PASA |
| `AP-25-e2` | `borrados=0` | PASA |

<a id="ap-26"></a>
### AP-26. Ocultar o mostrar una comparativa

RF-18 · Actor: Administrador

**1. Identificador y propósito.** `AP-26`. Moderar una comparativa sin borrarla. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `comparativa_id` y `oculta` (booleano). No modifica `actualizado_en` (supuesto 5).

**4. Resultado esperado y formato de salida.** Coincidencias y modificados. Ocultar una que ya lo está: 0 modificados; `oculta` como texto: 121; id inexistente: 0 coincidencias.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-26-n1` | normal | AP-26: ocultar una comparativa |
| `AP-26-n2` | normal | AP-26: volver a mostrarla |
| `AP-26-l1` | límite | AP-26: ocultar una que ya esta oculta no cambia nada |
| `AP-26-l2` | límite | AP-26: ocultar o mostrar no modifica actualizado_en (supuesto 5) |
| `AP-26-e1` | error | AP-26: oculta como texto |
| `AP-26-e2` | error | AP-26: un id que no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-26-n1` | `coincidencias=1 modificados=1; oculta=true` | PASA |
| `AP-26-n2` | `coincidencias=1 modificados=1; oculta=false` | PASA |
| `AP-26-l1` | `coincidencias=1 modificados=0` | PASA |
| `AP-26-l2` | `actualizado_en igual` | PASA |
| `AP-26-e1` | `rechazado 121` | PASA |
| `AP-26-e2` | `coincidencias=0 modificados=0` | PASA |

Evidencia previa (Entregable 4): `documental/01-validacion.txt`: prueba 14.

<a id="ap-27"></a>
### AP-27. Eliminar una comparativa por moderación

RF-18 · Actor: Administrador

**1. Identificador y propósito.** `AP-27`. Borrar cualquier comparativa, oculta o no. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `comparativa_id`.

**4. Resultado esperado y formato de salida.** Documentos borrados (1, o 0 si no existe).

**5. Casos normales, límite y de error.** 3 casos: 1 normales, 1 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-27-n1` | normal | AP-27: eliminar una comparativa por moderacion |
| `AP-27-l1` | límite | AP-27: eliminar una comparativa que estaba oculta |
| `AP-27-e1` | error | AP-27: un id que no existe |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **3 de 3 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-27-n1` | `borrados=1; quedan 4` | PASA |
| `AP-27-l1` | `borrados=1; quedan 3` | PASA |
| `AP-27-e1` | `borrados=0` | PASA |

<a id="ap-28"></a>
### AP-28. Eliminar las comparativas de un usuario

RF-04 · Actor: Sistema

**1. Identificador y propósito.** `AP-28`. Limpiar las comparativas de una cuenta eliminada; repetirlo no falla. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. Lo dispara el evento `usuario_eliminado`: ver INT-07.

**3. Parámetros de entrada y validaciones.** `usuario_id` (prefijo del índice IX-04).

**4. Resultado esperado y formato de salida.** Documentos borrados; 0 si el usuario no tiene o ya se borraron. No toca las de otros usuarios.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-28-n1` | normal | AP-28: borrar todas las comparativas de un usuario (3) |
| `AP-28-l1` | límite | AP-28: repetirlo no falla y no borra nada |
| `AP-28-l2` | límite | AP-28: un usuario con una sola comparativa (Ana) |
| `AP-28-e1` | error | AP-28: un usuario sin comparativas (Sofia) |
| `AP-28-e2` | error | AP-28: las comparativas de los demas no se tocan |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-28-n1` | `borrados=3; quedan 5 de los demas` | PASA |
| `AP-28-l1` | `borrados=0` | PASA |
| `AP-28-l2` | `borrados=1` | PASA |
| `AP-28-e1` | `borrados=0` | PASA |
| `AP-28-e2` | `4` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 9-AP28 y 9-AP28b.

<a id="ap-29"></a>
### AP-29. Fichas publicadas para la reconciliación

RNF-03 · Actor: Sistema

**1. Identificador y propósito.** `AP-29`. Recorrer por lotes las fichas publicadas para compararlas con `obra_resumen` y con los nodos. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `estado_publicacion = publicada`, salto y tamaño de lote.

**4. Resultado esperado y formato de salida.** `obra_id` y tipo de cada ficha publicada, ordenadas por id. Un lote más allá del final o una colección vacía devuelve vacío.

**5. Casos normales, límite y de error.** 5 casos: 2 normales, 2 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-29-n1` | normal | AP-29: fichas publicadas de libros y de peliculas (10 y 11 de las 23 fichas) |
| `AP-29-n2` | normal | AP-29: recorrido por lotes de 5 en peliculas |
| `AP-29-l1` | límite | AP-29: un lote mas alla del final esta vacio |
| `AP-29-l2` | límite | AP-29: los borradores no entran |
| `AP-29-e1` | error | AP-29: una coleccion vacia (en dlbp_pruebas) no devuelve nada y no falla |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-29-n1` | `libros=10 peliculas=11` | PASA |
| `AP-29-n2` | `5, 5, 1` | PASA |
| `AP-29-l1` | `0` | PASA |
| `AP-29-l2` | `libros 10 de 11; peliculas 11 de 12` | PASA |
| `AP-29-e1` | `0` | PASA |

<a id="ap-30"></a>
### AP-30. Borradores antiguos

RF-08, RNF-03, D-10 · Actor: Sistema

**1. Identificador y propósito.** `AP-30`. Encontrar altas incompletas que la reconciliación debe completar. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** `estado_publicacion = borrador` y un umbral de antigüedad sobre `creado_en`. **El umbral no está definido** (supuesto 7): los casos usan fechas de prueba.

**4. Resultado esperado y formato de salida.** `obra_id`, tipo y `creado_en` de los borradores creados antes del umbral (comparación estricta). Ninguno si no hay.

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 2 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-30-n1` | normal | AP-30: borradores creados antes del umbral (umbral de prueba 2026-11-06; el umbral real no esta definido, supuesto 7) |
| `AP-30-l1` | límite | AP-30: un umbral igual a la fecha exacta de creacion no incluye esa ficha (la comparacion es estricta) |
| `AP-30-l2` | límite | AP-30: un umbral entre las dos fechas solo incluye la mas antigua |
| `AP-30-e1` | error | AP-30: un umbral anterior a todas las fichas no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-30-n1` | `libro 11, pelicula 12` | PASA |
| `AP-30-l1` | `(ninguno)` | PASA |
| `AP-30-l2` | `libro 11` | PASA |
| `AP-30-e1` | `(ninguno)` | PASA |

<a id="ap-32"></a>
### AP-32. Reparto de todas las películas

RNF-03 · Actor: Sistema

**1. Identificador y propósito.** `AP-32`. Leer el reparto de todas las películas publicadas para compararlo con `actuó_en`. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB. Se compara con Neo4j (CG-21).

**3. Parámetros de entrada y validaciones.** Películas publicadas; por lotes.

**4. Resultado esperado y formato de salida.** `obra_id` y `reparto` de cada una. La ficha en borrador no entra; una colección vacía devuelve vacío.

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 2 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-32-n1` | normal | AP-32: el reparto de todas las peliculas publicadas, para compararlo con actuo_en |
| `AP-32-l1` | límite | AP-32: un lote de 5 |
| `AP-32-l2` | límite | AP-32: la ficha en borrador (sin reparto) no entra |
| `AP-32-e1` | error | AP-32: una coleccion vacia (en dlbp_pruebas) no devuelve nada y no falla |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-32-n1` | `11 peliculas, 18 personas` | PASA |
| `AP-32-l1` | `5 peliculas` | PASA |
| `AP-32-l2` | `11 de 12 peliculas` | PASA |
| `AP-32-e1` | `0` | PASA |

<a id="ap-33"></a>
### AP-33. Usuarios que tienen comparativas

RNF-03 · Actor: Sistema

**1. Identificador y propósito.** `AP-33`. Listar los usuarios con comparativas para detectar huérfanos frente a PostgreSQL. Diseño: [01-patrones-de-acceso.md](../modelado/documental/01-patrones-de-acceso.md).

**2. Bases que intervienen.** MongoDB.

**3. Parámetros de entrada y validaciones.** Ninguna.

**4. Resultado esperado y formato de salida.** Los valores distintos de `usuario_id`; se resuelve solo con el índice IX-04, sin leer documentos. Sin comparativas, vacío.

**5. Casos normales, límite y de error.** 4 casos: 1 normales, 2 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `AP-33-n1` | normal | AP-33: los usuarios distintos que tienen comparativas |
| `AP-33-l1` | límite | AP-33: recorre solo el indice IX-04, sin leer documentos |
| `AP-33-l2` | límite | AP-33: tras borrar las comparativas de un usuario (en dlbp_pruebas) ya no aparece |
| `AP-33-e1` | error | AP-33: sin comparativas no hay usuarios y no falla |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [documental.txt](../../db/evidencias/catalogo/documental.txt). Ejecutor: [05-catalogo.js](../../db/documental/pruebas/05-catalogo.js). Resultado: **4 de 4 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `AP-33-n1` | `02, 04, 05, 07, 08` | PASA |
| `AP-33-l1` | `ix_comp_unica, 0 documentos leidos` | PASA |
| `AP-33-l2` | `04, 05, 07, 08` | PASA |
| `AP-33-e1` | `0 usuarios` | PASA |

Evidencia previa (Entregable 4): `documental/02-indices.txt`: 9-AP33 y 9-AP33b.

## 4. Operaciones de la base de grafos (Neo4j)

<a id="cg-01"></a>
### CG-01. Buscar obras por el nombre de una persona

RF-05 · Actor: Visitante, lector, administrador

**1. Identificador y propósito.** `CG-01`. Encontrar las obras que una persona escribió, dirigió o donde actuó. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. La API completa los títulos con AP-04.

**3. Parámetros de entrada y validaciones.** `$texto`: consulta Lucene del índice de texto `persona_nombre_texto` (D-41). La API debe sanearla: con sintaxis mal formada o vacía Neo4j falla.

Consulta: [CG-01.cypher](../../db/grafo/consultas/CG-01.cypher).

**4. Resultado esperado y formato de salida.** Por obra: `obra_id`, `tipo` (`libro` o `pelicula`), `vinculo` (`escribió`, `dirigida_por` o `actuó_en`) y la persona (`persona_id`, `nombre`, `foto_url`). Sin coincidencias, vacío.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-01-n1` | normal | CG-01: buscar por el nombre de una persona devuelve sus obras con el vinculo (Villeneuve dirigio 3 peliculas) |
| `CG-01-n2` | normal | CG-01: un autor devuelve el libro que escribio (Herbert) |
| `CG-01-l1` | límite | CG-01: una persona con dos roles en la misma pelicula da 1 obra y 2 vinculos (Branagh) |
| `CG-01-l2` | límite | CG-01: en mayusculas y sin tilde ('TIMOTHEE') encuentra a Chalamet con sus 2 peliculas |
| `CG-01-e1` | error | CG-01: un nombre que no existe no devuelve nada |
| `CG-01-e2` | error | CG-01: un texto con sintaxis Lucene mal formada FALLA en Neo4j: por eso la API debe sanearlo (D-41) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-01-n1` | `valor 3\|3\|dirigida_por` | PASA |
| `CG-01-n2` | `valor libro\|escribió` | PASA |
| `CG-01-l1` | `valor 2\|1\|2` | PASA |
| `CG-01-l2` | `filas 2` | PASA |
| `CG-01-e1` | `filas 0` | PASA |
| `CG-01-e2` | `error Neo.ClientError.Procedure.ProcedureCallFailed` | PASA |

Evidencia previa (Entregable 4): `grafo/03-consultas.txt`: Q-00.2 a Q-00.5. `semilla/grafo-01-consultas.txt`.

<a id="cg-02"></a>
### CG-02. Buscar personas por nombre

RF-10, D-15 · Actor: Administrador

**1. Identificador y propósito.** `CG-02`. Reutilizar una persona existente antes de registrar otra. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j.

**3. Parámetros de entrada y validaciones.** `$texto`: consulta Lucene ya saneada, nunca vacía.

Consulta: [CG-02.cypher](../../db/grafo/consultas/CG-02.cypher).

**4. Resultado esperado y formato de salida.** `persona_id`, `nombre` y `foto_url` (nulo si no tiene), por nombre. Sin coincidencias, vacío; un fragmento de palabra no encuentra nada.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-02-n1` | normal | CG-02: buscar una persona por nombre antes de registrar otra (Tolkien) |
| `CG-02-n2` | normal | CG-02: varias palabras encuentran a varias personas ('ferguson villeneuve') |
| `CG-02-l1` | límite | CG-02: una persona sin foto devuelve foto_url nulo (Macfadyen) |
| `CG-02-l2` | límite | CG-02: sin tilde ('timothee') encuentra a Timothée Chalamet |
| `CG-02-e1` | error | CG-02: un fragmento de palabra ('chala') no encuentra nada: limitacion conocida del indice de texto (D-41) |
| `CG-02-e2` | error | CG-02: un texto vacio FALLA en Neo4j (la API no debe llamarla sin texto) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-02-n1` | `valor J. R. R. Tolkien` | PASA |
| `CG-02-n2` | `filas 2` | PASA |
| `CG-02-l1` | `valor (nulo)` | PASA |
| `CG-02-l2` | `valor 1\|Timothée Chalamet` | PASA |
| `CG-02-e1` | `filas 0` | PASA |
| `CG-02-e2` | `error Neo.ClientError.Procedure.ProcedureCallFailed` | PASA |

Evidencia previa (Entregable 4): `grafo/03-consultas.txt`: Q-00.6. `grafo/01-restricciones.txt`: R-18 y R-19.

<a id="cg-03"></a>
### CG-03. Adaptaciones de un libro

RF-23 · Actor: Visitante, lector, sistema

**1. Identificador y propósito.** `CG-03`. Listar las películas que adaptan un libro. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. La API la usa también antes de publicar un libro (D-24).

**3. Parámetros de entrada y validaciones.** `$libro_id`.

Consulta: [CG-03.cypher](../../db/grafo/consultas/CG-03.cypher).

**4. Resultado esperado y formato de salida.** `obra_id` de cada película, ordenado. Vacío si el libro no tiene adaptaciones o el id no es de un libro.

**5. Casos normales, límite y de error.** 6 casos: 1 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-03-n1` | normal | CG-03: adaptaciones de un libro con dos peliculas (Dune: f01 y f02) |
| `CG-03-l1` | límite | CG-03: un libro con una sola adaptacion (Historia de tu vida: f05) |
| `CG-03-l2` | límite | CG-03: un libro en borrador ya tiene su pelicula en borrador (Neuromante: f12) |
| `CG-03-e1` | error | CG-03: un libro nuevo sin adaptaciones no devuelve nada (la API no lo publica, D-24) |
| `CG-03-e2` | error | CG-03: el id de una pelicula usado como libro no devuelve nada |
| `CG-03-e3` | error | CG-03: un id que no existe no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-03-n1` | `valor 01,02,` | PASA |
| `CG-03-l1` | `valor 05,` | PASA |
| `CG-03-l2` | `valor 12,` | PASA |
| `CG-03-e1` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |
| `CG-03-e2` | `filas 0` | PASA |
| `CG-03-e3` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/02-cardinalidad.txt`: K-01.2 y K-07.3.

<a id="cg-04"></a>
### CG-04. Libro de origen de una película

RF-23, RN-07 · Actor: Visitante, lector, sistema

**1. Identificador y propósito.** `CG-04`. Obtener el libro del que parte una película. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. La API la usa antes de registrar una adaptación y antes de publicar una película.

**3. Parámetros de entrada y validaciones.** `$pelicula_id`.

Consulta: [CG-04.cypher](../../db/grafo/consultas/CG-04.cypher).

**4. Resultado esperado y formato de salida.** `obra_id` del libro (uno solo, RN-07); vacío si la película aún no lo tiene.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 1 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-04-n1` | normal | CG-04: libro de origen de una pelicula (Dune 2021: Dune) |
| `CG-04-n2` | normal | CG-04: dos peliculas del mismo libro devuelven el mismo libro (Dune parte dos) |
| `CG-04-l1` | límite | CG-04: la pelicula en borrador ya tiene su libro (Neuromante) |
| `CG-04-e1` | error | CG-04: una pelicula nueva sin libro de origen no devuelve nada (la API no la publica, D-24) |
| `CG-04-e2` | error | CG-04: el id de un libro usado como pelicula no devuelve nada |
| `CG-04-e3` | error | CG-04: un id que no existe no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-04-n1` | `valor b01` | PASA |
| `CG-04-n2` | `valor b01` | PASA |
| `CG-04-l1` | `valor b11` | PASA |
| `CG-04-e1` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |
| `CG-04-e2` | `filas 0` | PASA |
| `CG-04-e3` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/02-cardinalidad.txt`: K-01.4. `grafo/04-concurrencia-d23.txt`.

<a id="cg-05"></a>
### CG-05. Autores de un libro y directores de una película

RF-06, RF-07 · Actor: Visitante, lector, sistema

**1. Identificador y propósito.** `CG-05`. Mostrar las personas principales de una ficha; la API la usa también para comprobar el mínimo de D-24. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j.

**3. Parámetros de entrada y validaciones.** `$obra_id` de un libro o de una película.

Consulta: [CG-05.cypher](../../db/grafo/consultas/CG-05.cypher).

**4. Resultado esperado y formato de salida.** `persona_id`, `nombre` y `foto_url` de cada autor (libro) o director (película). Vacío si no hay o el id no existe.

**5. Casos normales, límite y de error.** 7 casos: 2 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-05-n1` | normal | CG-05: autor de un libro (Dune) |
| `CG-05-n2` | normal | CG-05: director de una pelicula (Dune 2021) |
| `CG-05-l1` | límite | CG-05: un libro con dos autores devuelve dos personas |
| `CG-05-l2` | límite | CG-05: en una pelicula solo cuenta quien la dirigio, no quien actua (Orient Express: Branagh dirige y actua, sale una vez) |
| `CG-05-e1` | error | CG-05: un libro nuevo sin autor no devuelve nada (la API no lo publica, D-24) |
| `CG-05-e2` | error | CG-05: una pelicula nueva sin director no devuelve nada |
| `CG-05-e3` | error | CG-05: un id que no existe no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **7 de 7 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-05-n1` | `valor Frank Herbert` | PASA |
| `CG-05-n2` | `valor Denis Villeneuve` | PASA |
| `CG-05-l1` | `filas 2` _(2 pasos; se muestra el último)_ | PASA |
| `CG-05-l2` | `valor 1\|Kenneth Branagh` | PASA |
| `CG-05-e1` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |
| `CG-05-e2` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |
| `CG-05-e3` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/03-consultas.txt`: Q-00.7 y Q-00.8. `grafo/02-cardinalidad.txt`: K-07.4 y K-07.5.

<a id="cg-06"></a>
### CG-06. Todos los caminos más cortos entre dos nodos

RF-24, D-17 · Actor: Lector

**1. Identificador y propósito.** `CG-06`. Mostrar cómo se conectan dos personas u obras (por ejemplo, de un autor a un actor a través de una adaptación). Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j.

**3. Parámetros de entrada y validaciones.** `$origen_id` y `$destino_id` (un `persona_id` o un `obra_id`), con tope de 6 saltos fijo en la consulta. **Deben ser distintos**: con el mismo id el motor falla (D-49) y la API lo rechaza antes.

Consulta: [CG-06.cypher](../../db/grafo/consultas/CG-06.cypher).

**4. Resultado esperado y formato de salida.** Por camino: `nodos` (tipo, id y, en personas, nombre y foto) y `relaciones` (tipos en orden). Sin conexión o con un origen inexistente, vacío.

**5. Casos normales, límite y de error.** 7 casos: 2 normales, 3 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-06-n1` | normal | CG-06: de un autor a un actor hay 3 saltos y DOS caminos mas cortos (Herbert a Chalamet, por las dos peliculas de Dune) |
| `CG-06-n2` | normal | CG-06: el camino lleva los tipos de relacion en orden |
| `CG-06-l1` | límite | CG-06: entre dos obras, por el director comun (Dune a Historia de tu vida): 4 saltos y 2 caminos |
| `CG-06-l2` | límite | CG-06: un camino largo, de 5 saltos y 2 rutas (Jane Austen a James McAvoy) |
| `CG-06-l3` | límite | CG-06: con origen = destino (Herbert a Herbert) allShortestPaths FALLA en el motor (HALLAZGO, D-49): la API debe rechazarlo antes |
| `CG-06-e1` | error | CG-06: dos nodos sin conexion no devuelven ningun camino (Gibson solo esta unido a la ficha en borrador) |
| `CG-06-e2` | error | CG-06: un origen que no existe no devuelve nada ni falla |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **7 de 7 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-06-n1` | `valor 2\|3` | PASA |
| `CG-06-n2` | `valor escribió,adaptado_a,actuó_en` | PASA |
| `CG-06-l1` | `valor 2\|4` | PASA |
| `CG-06-l2` | `valor 2\|5` | PASA |
| `CG-06-l3` | `error Neo.DatabaseError.Statement.ExecutionFailed` | PASA |
| `CG-06-e1` | `filas 0` | PASA |
| `CG-06-e2` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/03-consultas.txt`: Q-00.9 a Q-00.14. `semilla/grafo-01-consultas.txt`.

<a id="cg-07"></a>
### CG-07. Autores adaptados por un mismo director

RF-25 · Actor: Lector

**1. Identificador y propósito.** `CG-07`. Dado un director, listar los autores cuyos libros adaptó. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j.

**3. Parámetros de entrada y validaciones.** `$director_id`.

Consulta: [CG-07.cypher](../../db/grafo/consultas/CG-07.cypher).

**4. Resultado esperado y formato de salida.** Por libro adaptado: `persona_id`, `nombre`, `foto_url` del autor, `libro_id` y `pelicula_id`. Vacío si la persona no dirigió ninguna adaptación.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-07-n1` | normal | CG-07: autores cuyos libros adapto un director (Villeneuve: Herbert y Chiang, 3 filas) |
| `CG-07-n2` | normal | CG-07: otro director con dos autores (Scott: Dick y Weir) |
| `CG-07-l1` | límite | CG-07: un director con dos libros del MISMO autor da 2 filas y 1 autor (Jackson: Tolkien) |
| `CG-07-l2` | límite | CG-07: un director con un solo libro adaptado (Spielberg) |
| `CG-07-e1` | error | CG-07: una persona que no dirigio nada no devuelve autores (Herbert) |
| `CG-07-e2` | error | CG-07: un id que no existe no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-07-n1` | `valor 3\|2` | PASA |
| `CG-07-n2` | `valor 2\|2` | PASA |
| `CG-07-l1` | `valor 2\|1` | PASA |
| `CG-07-l2` | `valor 1\|1` | PASA |
| `CG-07-e1` | `filas 0` | PASA |
| `CG-07-e2` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/03-consultas.txt`: Q-00.15 y Q-00.16. `grafo/02-cardinalidad.txt`: K-05.

<a id="cg-08"></a>
### CG-08. Recomendar libros por adaptaciones del mismo director

RF-26 (paso 2) · Actor: Lector

**1. Identificador y propósito.** `CG-08`. Recomendar libros a dos saltos de los que le gustaron al usuario. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. Los libros de partida los entrega PostgreSQL (O18) y las fichas MongoDB (AP-04): ver INT-04.

**3. Parámetros de entrada y validaciones.** `$libros_partida` (hasta 20 `obra_id` de libros) y `$usuario_id`, para excluir lo que ya leyó.

Consulta: [CG-08.cypher](../../db/grafo/consultas/CG-08.cypher).

**4. Resultado esperado y formato de salida.** Una fila por (libro recomendado, libro de partida, director): `obra_id`, `partida_id`, `persona_id`, `nombre`, `foto_url` (D-45). Excluye los libros de partida y los ya leídos. Lista vacía, ids de películas o nada que recomendar: vacío.

**5. Casos normales, límite y de error.** 8 casos: 2 normales, 3 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-08-n1` | normal | CG-08: RF-26, Ana (partida: Dune y El marciano) recibe 2 libros por el mismo director |
| `CG-08-n2` | normal | CG-08: los libros recomendados son Historia de tu vida (por Villeneuve) y Androides (por Scott) |
| `CG-08-l1` | límite | CG-08: Pedro ya leyo el otro libro del director: no hay nada que recomendar |
| `CG-08-l2` | límite | CG-08: un libro de partida con dos adaptaciones del mismo director no se recomienda a si mismo (Dune) |
| `CG-08-l3` | límite | CG-08: Marta (partida: Orgullo y prejuicio y Dune) recibe Expiacion y Historia de tu vida |
| `CG-08-e1` | error | CG-08: una lista de partida vacia no devuelve nada |
| `CG-08-e2` | error | CG-08: ids de peliculas en la lista de partida no devuelven nada (la partida son libros) |
| `CG-08-e3` | error | CG-08: los libros que el usuario ya leyo no se recomiendan (Ana leyo Dune: se excluye aunque otro libro la lleve a el) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-08-n1` | `valor 2\|2` | PASA |
| `CG-08-n2` | `valor 02 por Ridley Scott;04 por Denis Villeneuve;` | PASA |
| `CG-08-l1` | `filas 0` | PASA |
| `CG-08-l2` | `valor 1\|0` | PASA |
| `CG-08-l3` | `valor 2\|2` | PASA |
| `CG-08-e1` | `filas 0` | PASA |
| `CG-08-e2` | `filas 0` | PASA |
| `CG-08-e3` | `valor 0` | PASA |

Evidencia previa (Entregable 4): `semilla/grafo-01-consultas.txt`.

<a id="cg-09"></a>
### CG-09. Recomendar películas por lo que leen los seguidos

RF-27 · Actor: Lector

**1. Identificador y propósito.** `CG-09`. Recomendar películas basadas en libros que leyeron las personas que el usuario sigue. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j.

**3. Parámetros de entrada y validaciones.** `$usuario_id`.

Consulta: [CG-09.cypher](../../db/grafo/consultas/CG-09.cypher).

**4. Resultado esperado y formato de salida.** Una fila por película: `obra_id`, `libro_id` y `seguidos` (a cuántos de los seguidos les consta la lectura), de más a menos. **No excluye** las películas ya vistas (D-20). Vacío si no sigue a nadie.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-09-n1` | normal | CG-09: RF-27, Sofia sigue a 3 lectores y recibe 7 peliculas; las mas alcanzadas, por 2 seguidos |
| `CG-09-n2` | normal | CG-09: cada pelicula trae su libro de origen: las 7 peliculas de Sofia vienen de 6 libros (Dune tiene dos adaptaciones) |
| `CG-09-l1` | límite | CG-09: quien sigue a un solo lector cuenta 1 en cada pelicula (Luis) |
| `CG-09-l2` | límite | CG-09: NO excluye las peliculas que el usuario ya vio (D-20): Sofia vio Dune 2021 y sigue saliendo |
| `CG-09-e1` | error | CG-09: quien no sigue a nadie no recibe nada (Pedro) |
| `CG-09-e2` | error | CG-09: un usuario que no existe no recibe nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-09-n1` | `valor 7\|2` | PASA |
| `CG-09-n2` | `valor 7\|6` | PASA |
| `CG-09-l1` | `valor 1` | PASA |
| `CG-09-l2` | `valor 1` | PASA |
| `CG-09-e1` | `filas 0` | PASA |
| `CG-09-e2` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `semilla/grafo-01-consultas.txt`.

<a id="cg-10"></a>
### CG-10. Comprobar que un libro y una película están unidos por una adaptación

RN-06 · Actor: Sistema

**1. Identificador y propósito.** `CG-10`. Validar la pareja de una reseña comparativa. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. La API la usa antes de crear una comparativa (INT-06).

**3. Parámetros de entrada y validaciones.** `$libro_id` y `$pelicula_id`.

Consulta: [CG-10.cypher](../../db/grafo/consultas/CG-10.cypher).

**4. Resultado esperado y formato de salida.** Un booleano `unidas`.

**5. Casos normales, límite y de error.** 5 casos: 2 normales, 1 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-10-n1` | normal | CG-10: un libro y su pelicula estan unidos por una adaptacion (Dune y Dune 2021) |
| `CG-10-n2` | normal | CG-10: un libro con varias adaptaciones esta unido a cada una (Dune y Dune parte dos) |
| `CG-10-l1` | límite | CG-10: un libro y una pelicula de otra adaptacion no estan unidos (Dune y El marciano: la API rechaza la comparativa, RN-06) |
| `CG-10-e1` | error | CG-10: con los ids invertidos (pelicula como libro) no hay adaptacion |
| `CG-10-e2` | error | CG-10: ids que no existen no estan unidos |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-10-n1` | `valor true` | PASA |
| `CG-10-n2` | `valor true` | PASA |
| `CG-10-l1` | `valor false` | PASA |
| `CG-10-e1` | `valor false` | PASA |
| `CG-10-e2` | `valor false` | PASA |

Evidencia previa (Entregable 4): `grafo/03-consultas.txt`: Q-00.17 y Q-00.18.

<a id="cg-11"></a>
### CG-11. Crear el nodo de una obra

RF-08 · Actor: Sistema

**1. Identificador y propósito.** `CG-11`. Crear el nodo `Libro` o `Película` de una ficha, de forma idempotente. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. Es un paso del alta de una obra (INT-01).

**3. Parámetros de entrada y validaciones.** `$obra_id` (UUID; no nulo) y el tipo, que elige el archivo (`CG-11-libro` o `CG-11-pelicula`).

Consulta: [CG-11-libro.cypher](../../db/grafo/consultas/CG-11-libro.cypher), [CG-11-pelicula.cypher](../../db/grafo/consultas/CG-11-pelicula.cypher).

**4. Resultado esperado y formato de salida.** El `obra_id`. Repetirlo no duplica el nodo; un libro y una película pueden compartir id (D-21). Un id nulo falla (`SemanticError`).

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 3 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-11-n1` | normal | CG-11: crear el nodo de un libro |
| `CG-11-n2` | normal | CG-11: crear el nodo de una pelicula |
| `CG-11-l1` | límite | CG-11: repetir el alta no duplica el nodo (idempotente) |
| `CG-11-l2` | límite | CG-11: sobre una obra de la semilla no cambia nada (Dune sigue siendo un solo nodo) |
| `CG-11-l3` | límite | CG-11: un libro y una pelicula pueden compartir obra_id: la unicidad es por etiqueta (D-21) |
| `CG-11-e1` | error | CG-11: un obra_id nulo se rechaza (no se puede crear un nodo con clave nula) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-11-n1` | `valor 1` _(2 pasos; se muestra el último)_ | PASA |
| `CG-11-n2` | `valor 1` _(2 pasos; se muestra el último)_ | PASA |
| `CG-11-l1` | `valor 1` _(3 pasos; se muestra el último)_ | PASA |
| `CG-11-l2` | `valor 11` _(2 pasos; se muestra el último)_ | PASA |
| `CG-11-l3` | `valor 2` _(3 pasos; se muestra el último)_ | PASA |
| `CG-11-e1` | `error Neo.ClientError.Statement.SemanticError` | PASA |

Evidencia previa (Entregable 4): `grafo/02-cardinalidad.txt`: K-10. `grafo/01-restricciones.txt`: R-05 y R-06.

<a id="cg-13"></a>
### CG-13. Registrar una persona

RF-10 · Actor: Administrador

**1. Identificador y propósito.** `CG-13`. Crear el nodo `Persona` de un autor, director o actor. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j.

**3. Parámetros de entrada y validaciones.** `$persona_id` (UUID de la API), `$nombre` (1 a 150 caracteres) y `$foto_url` (opcional, https). Community no valida valores: lo hace la API (D-22).

Consulta: [CG-13.cypher](../../db/grafo/consultas/CG-13.cypher).

**4. Resultado esperado y formato de salida.** El `persona_id`. Sin foto, la propiedad no existe. Si el id ya existe no cambia nada (`ON CREATE`). Un id nulo falla.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-13-n1` | normal | CG-13: registrar una persona con foto |
| `CG-13-l1` | límite | CG-13: sin foto (null) la propiedad foto_url no existe |
| `CG-13-l2` | límite | CG-13: registrar de nuevo el mismo persona_id no cambia el nombre (ON CREATE) |
| `CG-13-e1` | error | CG-13: un persona_id que ya existe con CREATE choca con la restriccion de unicidad (la API usa MERGE) |
| `CG-13-e2` | error | CG-13: un persona_id nulo se rechaza |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-13-n1` | `valor Persona de prueba\|https://almacenamiento.ejemplo.com/personas/t01.jpg` _(2 pasos; se muestra el último)_ | PASA |
| `CG-13-l1` | `valor true` _(2 pasos; se muestra el último)_ | PASA |
| `CG-13-l2` | `valor 1\|Nombre original` _(3 pasos; se muestra el último)_ | PASA |
| `CG-13-e1` | `error Neo.ClientError.Schema.ConstraintValidationFailed` | PASA |
| `CG-13-e2` | `error Neo.ClientError.Statement.SemanticError` | PASA |

Evidencia previa (Entregable 4): `grafo/01-restricciones.txt`: R-08, R-09 y R-20.

<a id="cg-14"></a>
### CG-14. Relacionar una persona con una obra

RF-10, D-19 · Actor: Administrador

**1. Identificador y propósito.** `CG-14`. Registrar que una persona escribió un libro, dirigió una película o actuó en ella. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j.

**3. Parámetros de entrada y validaciones.** `$persona_id`, `$obra_id` y el vínculo (`escribió`, `dirigida_por` o `actuó_en`); en `actuó_en`, también `$personaje` y `$orden`. Que `orden` no se repita lo valida la API.

Consulta: [CG-14-escribio.cypher](../../db/grafo/consultas/CG-14-escribio.cypher), [CG-14-dirigio.cypher](../../db/grafo/consultas/CG-14-dirigio.cypher), [CG-14-actuo.cypher](../../db/grafo/consultas/CG-14-actuo.cypher).

**4. Resultado esperado y formato de salida.** `creada = true`, o ninguna fila si la relación ya existe, falta un nodo, el id es de otro tipo o el reparto ya tiene 300 personas.

**5. Casos normales, límite y de error.** 10 casos: 3 normales, 3 límite y 4 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-14-n1` | normal | CG-14 (escribió): registrar que una persona escribio un libro |
| `CG-14-n2` | normal | CG-14 (dirigida_por): registrar que una persona dirigio una pelicula |
| `CG-14-n3` | normal | CG-14 (actuó_en): registrar un actor con su personaje y su orden |
| `CG-14-l1` | límite | CG-14: repetir la misma relacion no la duplica (devuelve 0 filas la segunda vez) |
| `CG-14-l2` | límite | CG-14 (actuó_en): una segunda relacion del mismo par no sobrescribe el personaje (D-19) |
| `CG-14-l3` | límite | CG-14 (actuó_en): el reparto admite exactamente 300 personas y la 301 se rechaza |
| `CG-14-e1` | error | CG-14: el id de una pelicula usado como libro no crea la relacion |
| `CG-14-e2` | error | CG-14: una persona que no existe no crea la relacion |
| `CG-14-e3` | error | CG-14: una obra que no existe no crea la relacion |
| `CG-14-e4` | error | CG-14 (dirigida_por): repetir la direccion de una persona sobre una pelicula no la duplica (Villeneuve y Dune 2021) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **10 de 10 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-14-n1` | `valor true` _(2 pasos; se muestra el último)_ | PASA |
| `CG-14-n2` | `valor true` _(2 pasos; se muestra el último)_ | PASA |
| `CG-14-n3` | `valor Personaje de prueba\|1` _(3 pasos; se muestra el último)_ | PASA |
| `CG-14-l1` | `filas 0` _(3 pasos; se muestra el último)_ | PASA |
| `CG-14-l2` | `valor 1\|Gandalf` _(4 pasos; se muestra el último)_ | PASA |
| `CG-14-l3` | `valor 300` _(4 pasos; se muestra el último)_ | PASA |
| `CG-14-e1` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |
| `CG-14-e2` | `filas 0` | PASA |
| `CG-14-e3` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |
| `CG-14-e4` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/02-cardinalidad.txt`: K-02 a K-05 y K-08. `grafo/01-restricciones.txt`: R-11 y R-12.

<a id="cg-15"></a>
### CG-15. Registrar que una película es adaptación de un libro

RF-11, RN-07, D-23 · Actor: Administrador

**1. Identificador y propósito.** `CG-15`. Crear `adaptado_a`. RN-07 (una película, un solo libro) no la impone la consulta: la API ejecuta antes `CG-15-bloqueo` y CG-04 en la misma transacción. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. Se usa con el protocolo de bloqueo de D-23/D-42.

**3. Parámetros de entrada y validaciones.** `$libro_id` y `$pelicula_id` (y `$pelicula_id` para el bloqueo).

Consulta: [CG-15.cypher](../../db/grafo/consultas/CG-15.cypher), [CG-15-bloqueo.cypher](../../db/grafo/consultas/CG-15-bloqueo.cypher).

**4. Resultado esperado y formato de salida.** `creada = true`; idempotente por par; ninguna fila si falta un nodo. Sin el protocolo, CG-15 por sí sola permite un segundo libro de origen.

**5. Casos normales, límite y de error.** 8 casos: 2 normales, 2 límite y 4 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-15-n1` | normal | CG-15: registrar una adaptacion con el protocolo de D-23 (bloqueo, CG-04 sin libro, CG-15) |
| `CG-15-n2` | normal | CG-15: un libro con varias adaptaciones (dos peliculas del mismo libro) |
| `CG-15-l1` | límite | CG-15: repetir la misma adaptacion no la duplica (idempotente por par) |
| `CG-15-l2` | límite | CG-15: por si sola NO impide un segundo libro de origen (RN-07 la impone la API con D-23): la pelicula queda con 2 |
| `CG-15-e1` | error | CG-15: con el protocolo, si CG-04 ya devuelve un libro la API rechaza y no llama a CG-15 (una pelicula de la semilla) |
| `CG-15-e2` | error | CG-15: un libro que no existe no crea la adaptacion |
| `CG-15-e3` | error | CG-15: una pelicula que no existe no crea la adaptacion |
| `CG-15-e4` | error | CG-15: el bloqueo sobre una pelicula que no existe no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-15-n1` | `filas 1` _(5 pasos; se muestra el último)_ | PASA |
| `CG-15-n2` | `filas 2` _(4 pasos; se muestra el último)_ | PASA |
| `CG-15-l1` | `valor 1` _(4 pasos; se muestra el último)_ | PASA |
| `CG-15-l2` | `filas 2` _(4 pasos; se muestra el último)_ | PASA |
| `CG-15-e1` | `filas 1` _(2 pasos; se muestra el último)_ | PASA |
| `CG-15-e2` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |
| `CG-15-e3` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |
| `CG-15-e4` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/02-cardinalidad.txt`: K-06 y K-10. `grafo/04-concurrencia-d23.txt`: D23-a1 a D23-a5.

<a id="cg-16"></a>
### CG-16. Crear el nodo de un usuario

RF-01 · Actor: Sistema

**1. Identificador y propósito.** `CG-16`. Anclar la cuenta en el grafo, de forma idempotente. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. Lo dispara el evento `usuario_creado`.

**3. Parámetros de entrada y validaciones.** `$usuario_id` (UUID; no nulo).

Consulta: [CG-16.cypher](../../db/grafo/consultas/CG-16.cypher).

**4. Resultado esperado y formato de salida.** El `usuario_id`. Repetirlo no duplica el nodo; un `CREATE` con un id existente choca con la restricción de unicidad.

**5. Casos normales, límite y de error.** 5 casos: 1 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-16-n1` | normal | CG-16: crear el nodo de un usuario |
| `CG-16-l1` | límite | CG-16: repetirlo no duplica el nodo (idempotente) |
| `CG-16-l2` | límite | CG-16: sobre un usuario de la semilla no cambia nada (Ana) |
| `CG-16-e1` | error | CG-16: un usuario_id que ya existe con CREATE choca con la restriccion de unicidad |
| `CG-16-e2` | error | CG-16: un usuario_id nulo se rechaza |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-16-n1` | `valor 9` _(2 pasos; se muestra el último)_ | PASA |
| `CG-16-l1` | `valor 1` _(3 pasos; se muestra el último)_ | PASA |
| `CG-16-l2` | `valor 8` _(2 pasos; se muestra el último)_ | PASA |
| `CG-16-e1` | `error Neo.ClientError.Schema.ConstraintValidationFailed` | PASA |
| `CG-16-e2` | `error Neo.ClientError.Statement.SemanticError` | PASA |

Evidencia previa (Entregable 4): `grafo/02-cardinalidad.txt`: K-10. `grafo/01-restricciones.txt`: R-04.

<a id="cg-17"></a>
### CG-17. Eliminar un usuario y sus relaciones

RF-04 · Actor: Sistema

**1. Identificador y propósito.** `CG-17`. Borrar el nodo con sus `sigue` y `leyó` en ambos sentidos. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. Lo dispara el evento `usuario_eliminado` (INT-07).

**3. Parámetros de entrada y validaciones.** `$usuario_id`.

Consulta: [CG-17.cypher](../../db/grafo/consultas/CG-17.cypher).

**4. Resultado esperado y formato de salida.** Sin filas. Repetirlo, o con un usuario inexistente, no falla. No toca los nodos de obra ni de otros usuarios.

**5. Casos normales, límite y de error.** 5 casos: 2 normales, 2 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-17-n1` | normal | CG-17: eliminar a Ana borra su nodo y sus sigue y leyó en ambos sentidos (quedan 6 sigue y 8 leyó de 10 y 12) |
| `CG-17-n2` | normal | CG-17: no toca los nodos de los demas usuarios ni los de obra |
| `CG-17-l1` | límite | CG-17: repetirlo no falla (idempotente): la segunda vez no encuentra nada |
| `CG-17-l2` | límite | CG-17: un usuario sin relaciones se elimina igual |
| `CG-17-e1` | error | CG-17: un usuario que no existe no falla ni borra nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **5 de 5 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-17-n1` | `valor 6\|8` _(2 pasos; se muestra el último)_ | PASA |
| `CG-17-n2` | `valor 7\|11\|12` _(2 pasos; se muestra el último)_ | PASA |
| `CG-17-l1` | `ok` _(2 pasos; se muestra el último)_ | PASA |
| `CG-17-l2` | `valor 0` _(3 pasos; se muestra el último)_ | PASA |
| `CG-17-e1` | `valor 8` _(2 pasos; se muestra el último)_ | PASA |

Evidencia previa (Entregable 4): `grafo/01-restricciones.txt`: R-14.

<a id="cg-18"></a>
### CG-18. Crear o eliminar un seguimiento

RF-21 · Actor: Sistema

**1. Identificador y propósito.** `CG-18`. Reflejar `sigue` en el grafo. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. Lo disparan los eventos `seguimiento_creado` y `seguimiento_eliminado`.

**3. Parámetros de entrada y validaciones.** `$seguidor_id` y `$seguido_id`. El grafo no impide seguirse a sí mismo: lo hace el CHECK del relacional (RN-03).

Consulta: [CG-18-crear.cypher](../../db/grafo/consultas/CG-18-crear.cypher), [CG-18-eliminar.cypher](../../db/grafo/consultas/CG-18-eliminar.cypher).

**4. Resultado esperado y formato de salida.** Crear: `creada = true` (idempotente por par; ninguna fila si falta un usuario). Eliminar: sin filas, sin error si no existía.

**5. Casos normales, límite y de error.** 7 casos: 2 normales, 3 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-18-n1` | normal | CG-18 (crear): crear un seguimiento |
| `CG-18-n2` | normal | CG-18 (eliminar): eliminar el seguimiento |
| `CG-18-l1` | límite | CG-18 (crear): repetirlo no duplica la relacion (idempotente por par) |
| `CG-18-l2` | límite | CG-18 (eliminar): eliminar un seguimiento que no existe no falla |
| `CG-18-l3` | límite | CG-18 (crear): dos usuarios pueden seguirse mutuamente (2 relaciones, una por sentido) |
| `CG-18-e1` | error | CG-18 (crear): el grafo ACEPTA un seguimiento a si mismo; RN-03 lo impide el CHECK del relacional |
| `CG-18-e2` | error | CG-18 (crear): un usuario que no existe no crea la relacion |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **7 de 7 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-18-n1` | `valor true` _(2 pasos; se muestra el último)_ | PASA |
| `CG-18-n2` | `valor 0` _(3 pasos; se muestra el último)_ | PASA |
| `CG-18-l1` | `valor 1` _(4 pasos; se muestra el último)_ | PASA |
| `CG-18-l2` | `ok` _(2 pasos; se muestra el último)_ | PASA |
| `CG-18-l3` | `valor 2` _(4 pasos; se muestra el último)_ | PASA |
| `CG-18-e1` | `valor true` _(2 pasos; se muestra el último)_ | PASA |
| `CG-18-e2` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |

Evidencia previa (Entregable 4): `grafo/02-cardinalidad.txt`: K-09 y K-10. `grafo/01-restricciones.txt`: R-15.

<a id="cg-19"></a>
### CG-19. Crear o eliminar una lectura de libro

RF-13, RF-15, D-16 · Actor: Sistema

**1. Identificador y propósito.** `CG-19`. Reflejar `leyó`, que solo apunta a libros. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. Lo disparan los eventos `obra_leida` y `obra_no_leida`.

**3. Parámetros de entrada y validaciones.** `$usuario_id` y `$obra_id` del libro.

Consulta: [CG-19-crear.cypher](../../db/grafo/consultas/CG-19-crear.cypher), [CG-19-eliminar.cypher](../../db/grafo/consultas/CG-19-eliminar.cypher).

**4. Resultado esperado y formato de salida.** Crear: `creada = true` (idempotente); con el id de una película no crea nada. Eliminar: sin filas, sin error si no existía.

**5. Casos normales, límite y de error.** 7 casos: 2 normales, 3 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-19-n1` | normal | CG-19 (crear): crear la lectura de un libro |
| `CG-19-n2` | normal | CG-19 (eliminar): eliminar la lectura (Ana deja de haber leido Dune) |
| `CG-19-l1` | límite | CG-19 (crear): repetirla no duplica la relacion (Ana ya habia leido Dune) |
| `CG-19-l2` | límite | CG-19 (crear): con el id de una PELICULA no crea nada (D-16: leyó solo apunta a libros) |
| `CG-19-l3` | límite | CG-19 (eliminar): eliminar una lectura que no existe no falla |
| `CG-19-e1` | error | CG-19 (crear): un usuario que no existe no crea la lectura |
| `CG-19-e2` | error | CG-19 (crear): un libro que no existe no crea la lectura |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **7 de 7 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-19-n1` | `valor true` _(2 pasos; se muestra el último)_ | PASA |
| `CG-19-n2` | `valor 0` _(2 pasos; se muestra el último)_ | PASA |
| `CG-19-l1` | `valor 1` _(2 pasos; se muestra el último)_ | PASA |
| `CG-19-l2` | `filas 0` | PASA |
| `CG-19-l3` | `ok` | PASA |
| `CG-19-e1` | `filas 0` | PASA |
| `CG-19-e2` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/01-restricciones.txt`: R-13. `grafo/02-cardinalidad.txt`: K-09.

<a id="cg-20"></a>
### CG-20. Reparto de una película

RF-10, D-24 · Actor: Sistema

**1. Identificador y propósito.** `CG-20`. Leer el reparto para regenerar la copia de la ficha y para comprobar el mínimo antes de publicar. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j (fuente). Se copia a MongoDB con AP-17 (INT-01).

**3. Parámetros de entrada y validaciones.** `$pelicula_id`.

Consulta: [CG-20.cypher](../../db/grafo/consultas/CG-20.cypher).

**4. Resultado esperado y formato de salida.** `persona_id`, `nombre`, `foto_url` (nulo si no tiene), `personaje` y `orden`, ordenado por `orden`. Vacío si no hay reparto o el id no es de una película.

**5. Casos normales, límite y de error.** 6 casos: 1 normales, 3 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-20-n1` | normal | CG-20: el reparto de una pelicula sale ordenado por orden, con personaje (Dune 2021) |
| `CG-20-l1` | límite | CG-20: una pelicula en borrador sin reparto no devuelve nada (la API no la publica, D-24) |
| `CG-20-l2` | límite | CG-20: el orden manda sobre el nombre (El Hobbit: Bilbo 1, Gandalf 2) |
| `CG-20-l3` | límite | CG-20: un actor sin foto devuelve foto_url nulo (Macfadyen en Orgullo y prejuicio) |
| `CG-20-e1` | error | CG-20: el id de un libro usado como pelicula no devuelve nada |
| `CG-20-e2` | error | CG-20: un id que no existe no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-20-n1` | `valor 1:Paul Atreides,2:Lady Jessica,` | PASA |
| `CG-20-l1` | `filas 0` | PASA |
| `CG-20-l2` | `valor 1:Bilbo Bolsón,2:Gandalf,` | PASA |
| `CG-20-l3` | `valor 2\|true` | PASA |
| `CG-20-e1` | `filas 0` | PASA |
| `CG-20-e2` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/03-consultas.txt`: Q-00.19. `semilla/grafo-01-consultas.txt`.

<a id="cg-21"></a>
### CG-21. Reparto de todas las películas

RNF-03 · Actor: Sistema

**1. Identificador y propósito.** `CG-21`. Lectura masiva para la reconciliación. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. Se compara con AP-32.

**3. Parámetros de entrada y validaciones.** Ninguna (por lotes con `SKIP`/`LIMIT` añadidos por la API).

Consulta: [CG-21.cypher](../../db/grafo/consultas/CG-21.cypher).

**4. Resultado esperado y formato de salida.** Una fila por película, también las que no tienen reparto (`[]`): `obra_id` y `reparto` ordenado por `orden` (D-45).

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 3 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-21-n1` | normal | CG-21: una fila por pelicula (12), tambien las que no tienen reparto |
| `CG-21-n2` | normal | CG-21: el total de personas en los repartos es 18 |
| `CG-21-l1` | límite | CG-21: la pelicula sin reparto devuelve una lista vacia (Neuromante) |
| `CG-21-l2` | límite | CG-21: el reparto va ordenado por orden (El Hobbit: primero Bilbo) |
| `CG-21-l3` | límite | CG-21: un actor sin foto lleva foto_url nulo (Macfadyen) |
| `CG-21-e1` | error | CG-21: un grafo sin peliculas no devuelve nada y no falla |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-21-n1` | `filas 12` | PASA |
| `CG-21-n2` | `valor 18` | PASA |
| `CG-21-l1` | `valor 0` | PASA |
| `CG-21-l2` | `valor Bilbo Bolsón` | PASA |
| `CG-21-l3` | `valor true` | PASA |
| `CG-21-e1` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |

Evidencia previa (Entregable 4): `semilla/grafo-01-consultas.txt`.

<a id="cg-22"></a>
### CG-22. Obras con sus conteos

RNF-03, D-24 · Actor: Sistema

**1. Identificador y propósito.** `CG-22`. Listar las obras con cuántas relaciones tienen, para reportar las que no llegan al mínimo de D-24 y detectar un segundo libro de origen. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j.

**3. Parámetros de entrada y validaciones.** Ninguna (por lotes).

Consulta: [CG-22.cypher](../../db/grafo/consultas/CG-22.cypher).

**4. Resultado esperado y formato de salida.** Por obra: `tipo`, `obra_id`, `n1`, `n2`, `n3`. Libro: autores, adaptaciones, 0. Película: libros de origen, directores, reparto.

**5. Casos normales, límite y de error.** 7 casos: 3 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-22-n1` | normal | CG-22: cuenta autores y adaptaciones de un libro (Dune: 1 autor, 2 adaptaciones) |
| `CG-22-n2` | normal | CG-22: cuenta libro de origen, directores y reparto de una pelicula (Dune 2021: 1, 1 y 2) |
| `CG-22-n3` | normal | CG-22: una fila por obra del grafo (11 libros y 12 peliculas) |
| `CG-22-l1` | límite | CG-22: el libro en borrador ya cumple su minimo (Neuromante: 1 autor, 1 adaptacion) |
| `CG-22-l2` | límite | CG-22: la pelicula en borrador no llega al minimo (Neuromante: 1 libro, 0 directores, 0 reparto) |
| `CG-22-e1` | error | CG-22: la reconciliacion senala exactamente las obras bajo el minimo de D-24 (solo la pelicula en borrador) |
| `CG-22-e2` | error | CG-22: detecta una pelicula con DOS libros de origen (RN-07 que Neo4j no impide) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **7 de 7 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-22-n1` | `valor 1\|2` | PASA |
| `CG-22-n2` | `valor 1\|1\|2` | PASA |
| `CG-22-n3` | `filas 23` | PASA |
| `CG-22-l1` | `valor 1\|1` | PASA |
| `CG-22-l2` | `valor 1\|0\|0` | PASA |
| `CG-22-e1` | `valor 1\|f1000000-0000-4000-8000-000000000012` | PASA |
| `CG-22-e2` | `valor 2` _(2 pasos; se muestra el último)_ | PASA |

Evidencia previa (Entregable 4): `grafo/03-consultas.txt`: Q-00.20 a Q-00.22. `grafo/02-cardinalidad.txt`: K-07.

<a id="cg-23"></a>
### CG-23. Usuarios con sus relaciones

RNF-03 · Actor: Sistema

**1. Identificador y propósito.** `CG-23`. Listar los usuarios con sus `sigue` y `leyó` para detectar huérfanos. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j. Se compara con PostgreSQL (O20).

**3. Parámetros de entrada y validaciones.** Ninguna (por lotes).

Consulta: [CG-23.cypher](../../db/grafo/consultas/CG-23.cypher).

**4. Resultado esperado y formato de salida.** Una fila por usuario: `usuario_id`, `sigue` (ids) y `leyo` (ids de obra), ordenados. Un `leyó` hacia una película (D-16 lo prohíbe) aparece para que la comparación lo señale.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-23-n1` | normal | CG-23: una fila por usuario (8) |
| `CG-23-n2` | normal | CG-23: Sofia sigue a 3 y no leyo libros |
| `CG-23-l1` | límite | CG-23: un usuario sin relaciones devuelve listas vacias (el administrador sigue a nadie y no leyo nada) |
| `CG-23-l2` | límite | CG-23: Ana sigue a 1 y leyo 4 libros |
| `CG-23-e1` | error | CG-23: un leyó hacia una PELICULA (que D-16 prohibe) aparece en la lista, para que la comparacion con el relacional lo senale |
| `CG-23-e2` | error | CG-23: sin usuarios no devuelve nada y no falla |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-23-n1` | `filas 8` | PASA |
| `CG-23-n2` | `valor 3\|0` | PASA |
| `CG-23-l1` | `valor 0\|0` | PASA |
| `CG-23-l2` | `valor 1\|4` | PASA |
| `CG-23-e1` | `valor 1\|true` _(2 pasos; se muestra el último)_ | PASA |
| `CG-23-e2` | `filas 0` _(2 pasos; se muestra el último)_ | PASA |

Evidencia previa (Entregable 4): `semilla/grafo-01-consultas.txt`.

<a id="cg-24"></a>
### CG-24. Asignar, cambiar o quitar la foto de una persona

RF-10, D-25 · Actor: Administrador

**1. Identificador y propósito.** `CG-24`. Mantener la `foto_url` de una persona. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j (fuente). Después la API regenera el reparto de sus películas (CG-25, CG-20 y AP-17).

**3. Parámetros de entrada y validaciones.** `$persona_id` y `$foto_url` (o nulo para quitarla). El grafo acepta cualquier texto: la API valida el https (D-22).

Consulta: [CG-24.cypher](../../db/grafo/consultas/CG-24.cypher).

**4. Resultado esperado y formato de salida.** El `persona_id`; con `null`, la propiedad deja de existir. Una persona inexistente no devuelve nada.

**5. Casos normales, límite y de error.** 6 casos: 2 normales, 2 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-24-n1` | normal | CG-24: asignar una foto a una persona que no la tenia (Macfadyen) |
| `CG-24-n2` | normal | CG-24: cambiar la foto de una persona que ya la tenia (Chalamet) |
| `CG-24-l1` | límite | CG-24: quitar la foto con null elimina la propiedad (nunca queda un valor vacio) |
| `CG-24-l2` | límite | CG-24: asignar dos veces la misma foto deja un solo valor (idempotente) |
| `CG-24-e1` | error | CG-24: una persona que no existe no cambia nada |
| `CG-24-e2` | error | CG-24: una foto con http:// SE ACEPTA en el grafo (Community no valida valores, D-22): la valida la API |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-24-n1` | `valor https://almacenamiento.ejemplo.com/personas/macfadyen.jpg` _(2 pasos; se muestra el último)_ | PASA |
| `CG-24-n2` | `valor https://almacenamiento.ejemplo.com/personas/chalamet-nueva.jpg` _(2 pasos; se muestra el último)_ | PASA |
| `CG-24-l1` | `valor true` _(2 pasos; se muestra el último)_ | PASA |
| `CG-24-l2` | `valor 1\|https://almacenamiento.ejemplo.com/personas/chalamet-x.jpg` _(3 pasos; se muestra el último)_ | PASA |
| `CG-24-e1` | `filas 0` | PASA |
| `CG-24-e2` | `valor http://inseguro.ejemplo.com/f.jpg` _(2 pasos; se muestra el último)_ | PASA |

Evidencia previa (Entregable 4): `grafo/01-restricciones.txt`: R-20. `grafo/03-consultas.txt`: Q-00.24 y Q-00.25.

<a id="cg-25"></a>
### CG-25. Películas en las que actuó una persona

RF-10, D-27 · Actor: Sistema

**1. Identificador y propósito.** `CG-25`. Saber qué reparto hay que regenerar cuando cambia la foto de una persona. Diseño: [01-consultas-y-entidades.md](../modelado/grafo/01-consultas-y-entidades.md).

**2. Bases que intervienen.** Neo4j.

**3. Parámetros de entrada y validaciones.** `$persona_id`.

Consulta: [CG-25.cypher](../../db/grafo/consultas/CG-25.cypher).

**4. Resultado esperado y formato de salida.** `obra_id` de cada película donde actuó (solo `actuó_en`). Vacío si no actuó, no existe o el id no es de una persona.

**5. Casos normales, límite y de error.** 6 casos: 1 normales, 2 límite y 3 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `CG-25-n1` | normal | CG-25: peliculas en las que actuo una persona (Chalamet: 2) |
| `CG-25-l1` | límite | CG-25: una persona con una sola pelicula (Amy Adams) |
| `CG-25-l2` | límite | CG-25: solo cuenta actuó_en, no dirigida_por (Branagh dirigio y actuo en la misma pelicula: sale una vez) |
| `CG-25-e1` | error | CG-25: un director que no actuo no devuelve nada (Villeneuve) |
| `CG-25-e2` | error | CG-25: una persona que no existe no devuelve nada |
| `CG-25-e3` | error | CG-25: el id de una pelicula usado como persona no devuelve nada |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [grafo.txt](../../db/evidencias/catalogo/grafo.txt). Ejecutor: [01-catalogo.cypher](../../db/grafo/pruebas/catalogo/01-catalogo.cypher) con [catalogo-grafo.ps1](../../db/scripts/catalogo-grafo.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `CG-25-n1` | `filas 2` | PASA |
| `CG-25-l1` | `filas 1` | PASA |
| `CG-25-l2` | `filas 1` | PASA |
| `CG-25-e1` | `filas 0` | PASA |
| `CG-25-e2` | `filas 0` | PASA |
| `CG-25-e3` | `filas 0` | PASA |

Evidencia previa (Entregable 4): `grafo/03-consultas.txt`: Q-00.23 y Q-00.24.

## 5. Operaciones integradas (varias bases)

<a id="int-01"></a>
### INT-01. Alta de una película adaptada, de borrador a publicada

RF-08, RF-10, RF-11, D-24 · Actor: Administrador

**1. Identificador y propósito.** `INT-01`. Dar de alta un libro y su película con autor, director y reparto, copiar el reparto a la ficha y publicar ambas solo cuando se cumple el mínimo de D-24. Diseño: [04-fuente-de-verdad-y-sincronizacion.md](../arquitectura/04-fuente-de-verdad-y-sincronizacion.md) y [matriz-responsabilidades.md](../modelado/matriz-responsabilidades.md).

**2. Bases que intervienen.** MongoDB (AP-05, AP-07, AP-08, AP-09, AP-17), PostgreSQL (O5) y Neo4j (CG-11, CG-13, CG-14, CG-15, CG-03, CG-04, CG-05, CG-20).

**3. Parámetros de entrada y validaciones.** Libro (título, autor), película (título, libro de origen, director, reparto con personaje y orden). El script hace de API: comprueba el libro de origen (AP-05), crea las fichas en borrador, registra la obra, crea nodos y relaciones (con el bloqueo de D-23), lee el reparto, lo copia y publica.

**4. Resultado esperado y formato de salida.** Libro y película `publicada` con el reparto copiado (con la foto de cada actor que la tenga), un libro de origen por película y la coherencia entre bases intacta. Si no se cumple el mínimo, la ficha queda en `borrador` y CG-22 la señala. Si el libro no existe, no se escribe nada.

**5. Casos normales, límite y de error.** 7 casos: 2 normales, 3 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `INT-01-n1` | normal | Alta del libro: queda en borrador, con autor pero sin adaptacion; no cumple el minimo y NO se publica (el alta de su primera pelicula lo publica, D-24) |
| `INT-01-n2` | normal | Alta de la pelicula con libro de origen, director y 2 actores: se copia el reparto y se publican el libro y la pelicula; la coherencia entre bases sigue en 13 de 13 |
| `INT-01-l1` | límite | D-27: la foto del actor se copia al reparto de la ficha; el actor sin foto no lleva el campo |
| `INT-01-l2` | límite | Una pelicula sin reparto NO cumple el minimo: el script no la publica, queda en borrador y la reconciliacion (CG-22) la senala |
| `INT-01-l3` | límite | Un alta interrumpida (tras AP-08 y O5) deja la ficha en borrador; repetir los pasos (SIMULADO: es lo que hara la reconciliacion) los completa sin duplicar |
| `INT-01-e1` | error | Un segundo libro de origen para una pelicula que ya tiene uno (RN-07): con el protocolo de D-23 se rechaza y no se llama a CG-15 |
| `INT-01-e2` | error | Una pelicula cuyo libro de origen no existe: AP-05 lo detecta y no se escribe nada en ninguna base |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [integradas.txt](../../db/evidencias/catalogo/integradas.txt). Ejecutor: [catalogo-integradas.ps1](../../db/scripts/catalogo-integradas.ps1). Resultado: **7 de 7 casos PASA**.

Pasos **SIMULADOS** (los haría el worker o la reconciliación, que aún no existen) en: `INT-01-l3`.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `INT-01-n1` | `libro borrador\|0; autores=1 adaptaciones=0; no publicable` | PASA |
| `INT-01-n2` | `libro=publicada;pelicula=publicada;reparto=2;publicada; coherencia 13 de 13` | PASA |
| `INT-01-l1` | `actor 1 con foto igual a la del nodo; actor 2 sin foto_url` | PASA |
| `INT-01-l2` | `libro=publicada;pelicula=borrador;reparto=0;no cumple el minimo: queda en borrador; CG-22: libro=1 directores=1 reparto=0` | PASA |
| `INT-01-l3` | `tras interrumpir: borrador\|0; tras reintentar: libro=publicada;pelicula=publicada;reparto=2;publicada; 1 fila en obra_resumen` | PASA |
| `INT-01-e1` | `rechazada: la pelicula ya tiene libro de origen (RN-07); no se llamo a CG-15; libros de origen 1` | PASA |
| `INT-01-e2` | `rechazada: el libro de origen no existe; no se escribio nada; ficha 0 obra_resumen 0 nodo 0` | PASA |

<a id="int-02"></a>
### INT-02. Publicar una reseña y ver la ficha con su promedio

RF-13, RF-06 · Actor: Lector

**1. Identificador y propósito.** `INT-02`. Mostrar que la reseña y el promedio son definitivos al responder, que la ficha de MongoDB no cambia (el promedio se une al mostrarla) y que lo único eventual es la lectura en el grafo. Diseño: [04-fuente-de-verdad-y-sincronizacion.md](../arquitectura/04-fuente-de-verdad-y-sincronizacion.md) y [matriz-responsabilidades.md](../modelado/matriz-responsabilidades.md).

**2. Bases que intervienen.** PostgreSQL (O7, O17), MongoDB (AP-01, AP-02) y Neo4j (solo para comprobar que `leyó` todavía no existe: el worker no corre).

**3. Parámetros de entrada y validaciones.** `usuario_id`, `obra_id` y calificación de 1 a 5.

**4. Resultado esperado y formato de salida.** Promedio y total nuevos en PostgreSQL; ficha de MongoDB idéntica; un evento `obra_leida` pendiente; ninguna relación `leyó` aún. Con calificación 6 o una segunda reseña, el rechazo no cambia nada.

**5. Casos normales, límite y de error.** 6 casos: 1 normales, 3 límite y 2 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `INT-02-n1` | normal | Publicar una resena: promedio y total cambian, la ficha de MongoDB no, el evento queda pendiente y el grafo todavia no tiene leyo |
| `INT-02-l1` | límite | Una segunda resena de otro usuario con calificacion 1 (limite inferior): el promedio baja a 3.40 con 5 resenas |
| `INT-02-l2` | límite | La resena de una PELICULA tambien actualiza su ficha y deja evento (el worker lo descartaria, D-16): Dune 2021 pasa a 4.00 con 3 |
| `INT-02-l3` | límite | Al eliminar los usuarios de prueba (O4), el trigger devuelve los promedios a los de la semilla: Dune 4.33\|3 y Dune 2021 3.50\|2 |
| `INT-02-e1` | error | Calificacion 6: PostgreSQL rechaza (RN-02) y no cambian ni el promedio, ni el estado, ni los eventos |
| `INT-02-e2` | error | Una segunda resena del mismo usuario sobre la misma obra: RN-01; el promedio no cambia |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [integradas.txt](../../db/evidencias/catalogo/integradas.txt). Ejecutor: [catalogo-integradas.ps1](../../db/scripts/catalogo-integradas.ps1). Resultado: **6 de 6 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `INT-02-n1` | `antes 4.33\|3; despues 4.00\|4; ficha sin cambios; eventos pendientes 1; leyo en el grafo 0` | PASA |
| `INT-02-l1` | `previo=sin estado; Dune 3.40\|5; evento nuevo` | PASA |
| `INT-02-l2` | `antes 3.50\|2; despues 4.00\|3; evento obra_leida pendiente` | PASA |
| `INT-02-l3` | `Dune 4.33\|3; Dune 2021 3.50\|2; ficha de Dune igual a la inicial` | PASA |
| `INT-02-e1` | `23514 ck_resena_calificacion; Dune 3.40\|5; estado=pendiente; eventos pendientes 2` | PASA |
| `INT-02-e2` | `23505 uq_resena_usuario_obra; Dune 3.40\|5` | PASA |

<a id="int-04"></a>
### INT-04. Recomendar libros por adaptaciones del mismo director

RF-26 · Actor: Lector

**1. Identificador y propósito.** `INT-04`. Recomendar libros: PostgreSQL entrega los libros que le gustaron, el grafo los conecta por director y MongoDB entrega las fichas. Diseño: [04-fuente-de-verdad-y-sincronizacion.md](../arquitectura/04-fuente-de-verdad-y-sincronizacion.md) y [matriz-responsabilidades.md](../modelado/matriz-responsabilidades.md).

**2. Bases que intervienen.** PostgreSQL (O18), Neo4j (CG-08) y MongoDB (AP-04).

**3. Parámetros de entrada y validaciones.** `usuario_id` y `:limite`.

**4. Resultado esperado y formato de salida.** Los libros recomendados con su ficha (título). Si O18 devuelve vacío no se llama al grafo; si el grafo no devuelve nada, no se consultan fichas.

**5. Casos normales, límite y de error.** 8 casos: 2 normales, 2 límite y 4 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `INT-04-n1` | normal | RF-26 para Ana (partida: Dune y El marciano): 2 libros recomendados, ambos con ficha |
| `INT-04-n2` | normal | RF-26 para Marta (empate en 4: Orgullo y prejuicio y Dune): recomienda Expiacion y Historia de tu vida |
| `INT-04-l1` | límite | Con :limite 1 solo parte del mejor calificado (Ana: Dune) y recomienda un solo libro |
| `INT-04-l2` | límite | Pedro ya leyo el otro libro del director: el grafo no devuelve nada y no se consultan fichas |
| `INT-04-e1` | error | Sofia no termino ningun libro: O18 devuelve vacio, no se llama al grafo |
| `INT-04-e2` | error | Elena califico 2 su libro terminado: no es de partida (RN-11), no hay recomendaciones |
| `INT-04-e3` | error | Un usuario que no existe: O18 vacio y nada que recomendar (no falla) |
| `INT-04-e4` | error | Ana: la resena oculta de Expiacion y el estado pendiente de Orgullo y prejuicio no la llevan a recomendar nada a partir de ellos (no aparecen como partida) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [integradas.txt](../../db/evidencias/catalogo/integradas.txt). Ejecutor: [catalogo-integradas.ps1](../../db/scripts/catalogo-integradas.ps1). Resultado: **8 de 8 casos PASA**.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `INT-04-n1` | `recomendados b02,b04; 2 fichas` | PASA |
| `INT-04-n2` | `recomendados b04,b09; 2 fichas` | PASA |
| `INT-04-l1` | `recomendados b04; 1 fichas` | PASA |
| `INT-04-l2` | `recomendados (ninguno); 0 fichas` | PASA |
| `INT-04-e1` | `recomendados (ninguno); 0 fichas` | PASA |
| `INT-04-e2` | `recomendados (ninguno); 0 fichas` | PASA |
| `INT-04-e3` | `recomendados (ninguno); 0 fichas` | PASA |
| `INT-04-e4` | `partida sin b08 ni b09` | PASA |

<a id="int-06"></a>
### INT-06. Reseña comparativa con validación de la adaptación

RF-16, RN-05, RN-06 · Actor: Lector

**1. Identificador y propósito.** `INT-06`. Crear una comparativa solo si el usuario existe, las dos fichas existen y están publicadas y el grafo confirma la adaptación. Diseño: [04-fuente-de-verdad-y-sincronizacion.md](../arquitectura/04-fuente-de-verdad-y-sincronizacion.md) y [matriz-responsabilidades.md](../modelado/matriz-responsabilidades.md).

**2. Bases que intervienen.** PostgreSQL (el usuario existe), MongoDB (AP-05 y AP-18) y Neo4j (CG-10).

**3. Parámetros de entrada y validaciones.** `usuario_id`, `libro_id`, `pelicula_id` y veredicto.

**4. Resultado esperado y formato de salida.** `creada` o un rechazo con el motivo y sin escribir nada (usuario o ficha inexistentes, ficha en borrador, sin adaptación, pareja repetida o grafo que no responde).

**5. Casos normales, límite y de error.** 8 casos: 2 normales, 1 límite y 5 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `INT-06-n1` | normal | Diego compara Dune con Dune 2021: usuario, fichas y adaptacion validan; se crea y la adaptacion pasa de 2 a 3 comparativas |
| `INT-06-n2` | normal | Diego compara Dune con Dune parte dos (otra adaptacion del mismo libro): tambien se crea; RN-05 es por pareja |
| `INT-06-l1` | límite | Una ficha en borrador (Neuromante) no se puede comparar aunque tenga adaptado_a: AP-05 informa el estado y se rechaza (criterio del script, a confirmar en la API) |
| `INT-06-e1` | error | Sin adaptacion (Dune con El marciano): CG-10 devuelve false y no se escribe nada (RN-06) |
| `INT-06-e2` | error | La misma pareja del mismo usuario otra vez (Ana, Dune y Dune 2021): todo valida y el indice unico de MongoDB lo rechaza (RN-05) |
| `INT-06-e3` | error | Un usuario que no existe: se rechaza en PostgreSQL sin tocar MongoDB ni Neo4j |
| `INT-06-e4` | error | Un libro que no existe: AP-05 lo detecta |
| `INT-06-e5` | error | El grafo no responde al comprobar la adaptacion (SIMULADO: puerto cerrado): error recuperable y no se guarda nada (fuente-de-verdad, seccion 7) |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [integradas.txt](../../db/evidencias/catalogo/integradas.txt). Ejecutor: [catalogo-integradas.ps1](../../db/scripts/catalogo-integradas.ps1). Resultado: **8 de 8 casos PASA**.

Pasos **SIMULADOS** (los haría el worker o la reconciliación, que aún no existen) en: `INT-06-e5`.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `INT-06-n1` | `creada; comparativas visibles 2 -> 3` | PASA |
| `INT-06-n2` | `creada; Dune parte dos 1 -> 2` | PASA |
| `INT-06-l1` | `rechazada: una de las fichas esta en borrador` | PASA |
| `INT-06-e1` | `rechazada: no hay adaptacion entre el libro y la pelicula (RN-06); comparativas de la pareja 0` | PASA |
| `INT-06-e2` | `rechazada: ya existe una comparativa del usuario para la pareja (RN-05)` | PASA |
| `INT-06-e3` | `rechazada: el usuario no existe` | PASA |
| `INT-06-e4` | `rechazada: una de las obras no existe` | PASA |
| `INT-06-e5` | `rechazada: el grafo no responde (error recuperable); no se guardo nada; comparativas de Diego 3` | PASA |

<a id="int-07"></a>
### INT-07. Eliminar una cuenta y limpiar las copias

RF-04 · Actor: Lector

**1. Identificador y propósito.** `INT-07`. Eliminar la cuenta en PostgreSQL con su cascada y dejar el evento; después limpiar las comparativas y el nodo. **SIMULADO:** como no hay worker, el script aplica el evento a mano. Diseño: [04-fuente-de-verdad-y-sincronizacion.md](../arquitectura/04-fuente-de-verdad-y-sincronizacion.md) y [matriz-responsabilidades.md](../modelado/matriz-responsabilidades.md).

**2. Bases que intervienen.** PostgreSQL (O4), MongoDB (AP-28) y Neo4j (CG-17).

**3. Parámetros de entrada y validaciones.** `usuario_id`.

**4. Resultado esperado y formato de salida.** PostgreSQL sin filas del usuario y con los promedios corregidos; mientras no se aplica el evento quedan restos que la coherencia detecta; al aplicarlo, las tres bases cuadran. Repetirlo es idempotente.

**5. Casos normales, límite y de error.** 6 casos: 3 normales, 2 límite y 1 de error.

| Caso | Tipo | Qué se prueba |
|---|---|---|
| `INT-07-n1` | normal | O4: una sola transaccion borra al usuario con su cascada, el trigger corrige el promedio de Dune y queda el evento usuario_eliminado |
| `INT-07-n2` | normal | Entre la respuesta y el procesamiento del evento quedan restos (comparativa y nodo con sus relaciones); la coherencia los detecta |
| `INT-07-n3` | normal | SIMULADO: el script aplica el evento (AP-28 y CG-17) y lo marca procesado; las copias quedan limpias y la coherencia vuelve a 13 de 13 |
| `INT-07-l1` | límite | SIMULADO: procesar el mismo evento otra vez no falla ni borra nada mas (idempotencia de AP-28 y CG-17) |
| `INT-07-l2` | límite | SIMULADO: un fallo a medias (se aplica AP-28 pero no CG-17) deja el nodo huerfano; el evento sigue pendiente y el reintento termina |
| `INT-07-e1` | error | Eliminar una cuenta que no existe: la transaccion falla y no queda evento |

**6. Evidencia de ejecución y resultado obtenido.** Archivo: [integradas.txt](../../db/evidencias/catalogo/integradas.txt). Ejecutor: [catalogo-integradas.ps1](../../db/scripts/catalogo-integradas.ps1). Resultado: **6 de 6 casos PASA**.

Pasos **SIMULADOS** (los haría el worker o la reconciliación, que aún no existen) en: `INT-07-n3`, `INT-07-l1`, `INT-07-l2`.

| Caso | Resultado obtenido | Resultado |
|---|---|---|
| `INT-07-n1` | `filas del usuario: resena=0 estado=0 lista=0 seguimiento=0 sesion=0; Dune 4.33\|3; evento usuario_eliminado pendiente 1` | PASA |
| `INT-07-n2` | `comparativas=1 nodo=1 sigue=2 leyo=1; la coherencia falla en C-06,C-07,C-08,C-10` | PASA |
| `INT-07-n3` | `borrados=1; nodo=0; evento procesado 1; coherencia 13 de 13` | PASA |
| `INT-07-l1` | `borrados=0; CG-17 sin error` | PASA |
| `INT-07-l2` | `tras AP-28: comparativas=0 nodo=1; reintento CG-17: nodo=0` | PASA |
| `INT-07-e1` | `P0001; eventos 0` | PASA |

## 6. Qué es real y qué es simulado

- **Real:** las 76 operaciones de las tres bases y las 5 integradas, ejecutadas contra PostgreSQL 18.7, MongoDB 9.0.4 y Neo4j 5.26.34 Community, sobre la semilla del Entregable 4, sin alterarla (D-50).
- **Simulado:** el worker (O19). INT-07 aplica a mano `AP-28` y `CG-17` y marca el evento `procesado`; INT-01-l3 repite los pasos de un alta interrumpida (lo que hará la reconciliación); INT-06-e5 provoca un «grafo caído» apuntando a un puerto cerrado (Neo4j no se detuvo); O19 ejecuta solo la parte de PostgreSQL.
- **Sin ejercitar:** el aviso en memoria, el sondeo de 30 s, los reintentos con espera creciente y el paso a `fallido` en un ciclo real del worker; la reconciliación que **corrige** copias (solo existe la que las detecta, `coherencia.ps1`).
- **Criterios del script a confirmar en el Entregable 6:** `INT-06-l1` rechaza comparar fichas en borrador (los documentos no lo dicen); AP-30 usa umbrales de prueba (el umbral real no está definido).
- **Hallazgos que el motor mostró:** CG-06 con origen igual a destino falla (D-49); CG-01 y CG-02 fallan con texto mal formado o vacío; MongoDB permite publicar una película con el reparto vacío (el mínimo de D-24 lo impone la API); Neo4j Community acepta seguimientos a sí mismo y fotos con `http://` (D-22).

## 7. Cómo reproducir la evidencia

Con las tres bases levantadas y la semilla cargada (`db/README.md`):

```powershell
.\db\scripts\catalogo.ps1
```

Ejecuta, uno a la vez, los scripts de cada base y las integradas (unos 3 minutos), guarda la salida en `db/evidencias/catalogo/` y termina con `coherencia.ps1` para comprobar que la semilla quedó intacta. Después se regenera este archivo:

```powershell
.\db\scripts\generar-catalogo.ps1
```

`generar-catalogo.ps1` falla si una operación no tiene casos normal, límite y de error, si algún caso no pasó o si hay casos en la evidencia que no pertenecen a ninguna operación.
