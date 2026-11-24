# Responsabilidades: app, API, servicios y repositorios

Reparte qué hace cada pieza y qué no. Es un reparto de tareas sin tecnologías (esas están en `03-eleccion-stack.md`). Las piezas y sus conexiones se ven en `01-diagrama-arquitectura.md`.

## 1. Regla general

Toda petición pasa por tres capas de la API y ninguna se salta:

```
App → Rutas → Servicios → Repositorios → Base de datos
```

| Capa | Regla |
|---|---|
| Rutas | No tienen reglas de negocio ni consultas |
| Servicios | Son los únicos que combinan varias bases. No escriben consultas |
| Repositorios | Son el único código que conoce una base. No contienen reglas de negocio ni se llaman entre sí |

## 2. App Android (frontend)

| Hace | No hace |
|---|---|
| Muestra las pantallas de lector (catálogo, ficha, reseñas, listas, seguimiento, recomendaciones, comparativas) y de administrador (alta y corrección de obras, personas, adaptaciones, moderación). Las de administrador se muestran según el rol | Hablar con las bases de datos ni llevar sus credenciales |
| Guarda el token de sesión en el almacenamiento seguro del teléfono | Decidir permisos: oculta pantallas por comodidad, pero la API comprueba el rol (RNF-07) |
| Llama a la API por HTTPS con una dirección base configurable (D-30) | Guardar o subir imágenes: solo descarga las que indica la URL (D-31) |
| Valida los formularios para avisar pronto al usuario | Considerar su validación como la definitiva: la API vuelve a validar todo |
| Muestra estados de carga y errores de red | Mantener reglas de negocio, como el cálculo del promedio |

## 3. API

### 3.1 Rutas

| Hacen | No hacen |
|---|---|
| Identifican la sesión y el rol, y rechazan lo que no corresponde (RN-09, RN-10, RNF-06, RNF-07) | Calcular ni decidir nada del negocio |
| Validan el formato de los datos: tipos, rangos y largos, incluido el UUID en minúsculas (D-11) y la URL `https://` de las imágenes (D-25) | Hablar con una base |
| Llaman a un servicio y devuelven su resultado o un error claro | |

### 3.2 Servicios

| Servicio | Responsabilidad | Requerimientos | Bases |
|---|---|---|---|
| Cuentas | Registro, inicio y cierre de sesión, perfil, eliminar cuenta (normaliza el correo a minúsculas, D-03; guarda y valida las sesiones en la tabla `sesion`, D-35) | RF-01 a RF-04 | Relacional |
| Catálogo | Ficha de obra: une la ficha, el promedio de `obra_resumen` y los títulos (AP-04); búsqueda por título y por persona | RF-05 a RF-07 | Documental, relacional, grafo |
| Reseñas y estados | Publicar reseña, marcar terminada y actualizar el promedio en una transacción; editar y eliminar | RF-12 a RF-15 | Relacional |
| Listas | Crear, renombrar, eliminar y ordenar listas; agregar y quitar obras | RF-19, RF-20 | Relacional |
| Social | Seguir y dejar de seguir; ver perfiles, reseñas y listas de seguidos | RF-21, RF-22 | Relacional |
| Comparativas | Crear, editar, eliminar y moderar comparativas; comprobar que libro y película están unidos por `adaptado_a` (RN-06) | RF-16 a RF-18 | Documental, grafo |
| Descubrimiento | Adaptaciones, camino entre dos nodos, autores con el mismo director y recomendaciones. RF-26 va en dos pasos: el relacional da los libros que gustaron y el grafo recorre | RF-23 a RF-27 | Relacional, grafo, documental |
| Administración | Alta y corrección de obras con el flujo de borrador a publicada (D-24), personas, autoría, reparto, adaptaciones, ediciones, plataformas y fotos | RF-08 a RF-11, RF-18 | Las tres |
| Sincronización | Aplica cada evento de `sync_outbox` a su base destino, de forma idempotente (O19), y regenera el reparto de las fichas | RNF-02 | Relacional, grafo, documental |
| Reconciliación | Compara fuente y copia y corrige solo la copia, con los nueve puntos de `fuente-de-verdad.md` | RNF-03 | Las tres |

### 3.3 Repositorios

| Repositorio | Maneja | Detalle en |
|---|---|---|
| Relacional | `usuario`, `resena`, `lista`, `elemento_lista`, `estado_obra`, `seguimiento`, `obra_resumen`, `sync_outbox` | `../modelado/relacional/` (O1 a O21) |
| Documental | `libros`, `peliculas`, `resenas_comparativas` | `../modelado/documental/` (AP-01 a AP-33) |
| Grafo | Nodos `Persona`, `Libro`, `Película`, `Usuario` y sus relaciones | `../modelado/grafo/` (CG-01 a CG-25) |

## 4. Worker de sincronización y reconciliación

| Pieza | Cómo funciona | Referencia |
|---|---|---|
| Worker | Dentro de la API (D-29). Se despierta por un aviso en memoria cuando un servicio confirma un evento nuevo y por un sondeo de respaldo cada 30 s. Toma los eventos `pendiente` de `sync_outbox` por `evento_id`, los aplica con el servicio de Sincronización y los marca `procesado`. Tras 5 intentos fallidos, `fallido` | D-04, D-34, O19 |
| Reconciliación | Comando del mismo código, que ejecuta una persona. Repara copias y reporta lo que no puede corregir (personas repetidas, obras sin el mínimo, borradores sin completar) | RNF-03, D-10 |

No se ejecuta más de una copia de la API: dos workers romperían el orden de los eventos (D-04, D-29).

## 5. Quién comprueba cada cosa

| Qué se comprueba | Capa | Ejemplo |
|---|---|---|
| Sesión válida y rol | Rutas | Un lector que llama a "dar de alta una obra" recibe un rechazo |
| Formato de los datos | Rutas | Una calificación de 7 o una portada sin `https://` |
| Regla de negocio | Servicios | Comparar un libro con una película que no son adaptación (RN-06); una película con un segundo libro de origen (RN-07, con bloqueo previo, D-23) |
| Integridad y unicidad | Base de datos | Una reseña repetida (`UNIQUE`); una calificación fuera de rango (`CHECK`) |
| Obligatoriedad, tipo y rango en el grafo | Servicios (Neo4j Community no lo impone, D-22) | Un nodo `Persona` sin nombre |
| Estructura de la ficha | MongoDB (validador) y servicios | Una ficha sin título |

## 6. Ejemplos de flujo

**Publicar una reseña (RF-13).** La ruta valida el formato y la sesión. El servicio de Reseñas pide al repositorio relacional una única transacción: insertar la reseña, actualizar el promedio (trigger), marcar la obra como terminada y escribir el evento `obra_leida`. Después el worker crea la relación `leyó` en el grafo, solo si la obra es un libro.

**Alta de una película (RF-08, RF-10, RF-11, D-24).** El servicio de Administración comprueba que el alta trae el libro de origen, un director y un actor. Luego: ficha en `borrador` (documental), `obra_resumen` (relacional), nodo, `adaptado_a`, `dirigida_por` y `actuó_en` (grafo), copia del reparto a la ficha, comprobación del mínimo con el grafo y, al final, ficha `publicada`.

**Recomendar libros (RF-26).** El servicio de Descubrimiento pide al repositorio relacional los libros terminados con calificación de 4 o más (O18), se los pasa al repositorio del grafo (CG-08) y completa los resultados con los títulos de la ficha (AP-04).

**Eliminar la cuenta (RF-04).** El servicio de Cuentas borra en el relacional (cascada) y escribe el evento `usuario_eliminado` en la misma transacción. El worker borra las comparativas del usuario en MongoDB y hace `DETACH DELETE` de su nodo en el grafo.
