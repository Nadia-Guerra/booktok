# Semilla de demostración

Datos pequeños pero con forma, para que cualquier consulta de los documentos devuelva algo con sentido. Son los **mismos datos, con los mismos ids**, en las tres bases (RNF-08, D-11).

| Archivo | Qué es |
|---|---|
| `semilla.json` | **La única fuente.** Todo lo que se quiera cambiar de los datos se cambia aquí |
| `generar.ps1` | Valida la fuente y escribe los tres cargadores. Windows PowerShell 5.1, sin dependencias |
| `../relacional/04-semilla.sql` | Generado. Carga PostgreSQL |
| `../documental/03-semilla.js` | Generado. Carga MongoDB |
| `../grafo/02-semilla.cypher` | Generado. Carga Neo4j |

Los tres cargadores se guardan en el repositorio como scripts legibles y **no se editan a mano**: se regeneran.

## Cómo se usa

```powershell
.\db\semilla\generar.ps1              # valida semilla.json y escribe los tres cargadores
.\db\semilla\generar.ps1 -Verificar   # comprueba que los cargadores en disco corresponden a semilla.json
.\db\scripts\cargar-semilla.ps1       # vacía y carga las tres bases (las construye antes cada construir.sh)
.\db\scripts\probar-semilla.ps1       # consultas representativas de las tres bases + coherencia entre ellas
.\db\scripts\coherencia.ps1           # solo la coherencia entre bases (13 comprobaciones; falla si algo no cuadra)
```

`generar.ps1` se niega a escribir si la fuente rompe una regla: UUID en minúsculas, referencias a ids que no existen, los mínimos de D-24, un solo libro de origen por película (RN-07), una comparativa entre obras sin `adaptado_a` (RN-06), una reseña sin su estado "terminada" (RF-13), ISBN repetido, etc.

> **Cuidado:** las pruebas de `db/*/pruebas/` (salvo las de nombre `*semilla*`) crean y **borran** sus propios datos, y `probar-grafo.ps1` vacía el grafo entero al empezar y al terminar. Córrelas **antes** de cargar la semilla, o vuelve a ejecutar `cargar-semilla.ps1` después. `probar-semilla.ps1` y `coherencia.ps1` solo leen.

## Usuarios de prueba

Los correos terminan en `@ejemplo.test`. **Todos comparten la misma contraseña de prueba:**

```
Semilla-Prueba-2026
```

Es una contraseña de **desarrollo local**; este es el único lugar del repositorio donde aparece. En las bases solo hay su hash (bcrypt, coste 10, uno distinto por usuario, generado con `crypt()` de `pgcrypto`; ver D-44).

| Usuario | Correo | Rol | Para qué sirve en la semilla |
|---|---|---|---|
| Administrador | `admin@ejemplo.test` | **admin** | El primer administrador (se crea aquí, no por la API). No sigue a nadie; Elena lo sigue |
| Ana Lectora | `ana@ejemplo.test` | lector | RF-26: dos libros de partida y cinco casos negativos |
| Luis Prado | `luis@ejemplo.test` | lector | Sigue a un solo lector (RF-27 con cuenta 1); su libro no tiene otro del mismo director |
| Marta Solís | `marta@ejemplo.test` | lector | RF-26 con dos libros empatados en 4 |
| Pedro Ibarra | `pedro@ejemplo.test` | lector | RF-26 sin nada que recomendar: ya leyó el otro libro del director |
| Sofía Navarro | `sofia@ejemplo.test` | lector | RF-27: sigue a tres lectores; ya vio una película que se le recomienda (D-20) |
| Diego Rivas | `diego@ejemplo.test` | lector | Segundo lector de *El marciano* y de *Parque Jurásico* |
| Elena Campos | `elena@ejemplo.test` | lector | Dueña de la comparativa oculta |

## Los ids

UUID en minúsculas, **legibles**: el prefijo dice el tipo y el final es un número. Así una fila de cualquier base se reconoce de un vistazo. Son ids válidos, pero los de la aplicación real serán aleatorios (los genera la API, D-11).

| Prefijo | Qué | Ejemplo |
|---|---|---|
| `a1000000-0000-4000-8000-0000000000NN` | Persona (autor, director, actor) | `…0017` Timothée Chalamet |
| `b1000000-…` | Libro (`obra_id`) | `…0001` Dune |
| `f1000000-…` | Película (`obra_id`) | `…0001` Dune (2021) |
| `c1000000-…` | Usuario | `…0002` Ana |
| `d1000000-…` | Reseña | |
| `e1000000-…` | Edición de un libro | |
| `11000000-…` | Lista | |
| `ca000000-…` | Reseña comparativa | |

## Qué contiene

| Tipo | Cantidad | Detalle |
|---|---|---|
| Libros | 11 (10 publicados + 1 borrador) | 10 con una adaptación real y *Neuromante* en borrador |
| Películas | 12 (11 publicadas + 1 borrador) | *Dune* tiene dos adaptaciones; *El Hobbit* y *La Comunidad del Anillo* comparten reparto |
| Personas | 29 | 10 autores, 6 directores, 13 actores; Branagh **dirige y actúa** en la misma película |
| Usuarios | 8 | 1 administrador y 7 lectores |
| Reseñas | 18 | Una **oculta** (la de Ana sobre *Expiación*) |
| Estados de lectura | 25 | Pendiente, en curso y terminada, en libros y en películas |
| Seguimientos | 10 | |
| Listas | 2 | 6 obras en total |
| Comparativas | 5 | Sobre 4 parejas unidas por `adaptado_a`; una **oculta** |
| ISBN | 8 libros con ISBN, 3 sin él | *Dune* mezcla una edición con ISBN y otra sin él; *Neuromante* no tiene ediciones |

Lo que **no** se escribe a mano:

- `obra_resumen.promedio` y `total_resenas` los calcula el trigger al insertar cada reseña (RN-08, RF-13). La reseña oculta no cuenta.
- El `reparto` de cada ficha de película se copia de las relaciones `actuó_en` (D-12, D-27), con `nombre` y `foto_url` de la persona.
- Las relaciones `leyó` salen de los estados "terminada" de **libros** (D-16): las películas terminadas no generan relación.
- `obra_resumen` y los nodos de obra salen de los libros y películas, incluidos los borradores.

La semilla **no** carga sesiones ni eventos del *outbox*: las bases se cargan directamente y ya están sincronizadas.

## Escenarios que permite demostrar

| Escenario | Dónde mirar | Resultado |
|---|---|---|
| **RF-24** camino de ≥ 3 saltos con **más de una ruta más corta** | `CG-06` de *Frank Herbert* (`a…0001`) a *Timothée Chalamet* (`a…0017`) | 3 saltos, **2 rutas** (por *Dune* 2021 y por *Dune: Parte dos*) |
| | de *Tolkien* (`a…0006`) a *Ian McKellen* (`a…0024`) | 3 saltos, 2 rutas (*El Hobbit* y *La Comunidad*) |
| | de *Jane Austen* (`a…0007`) a *James McAvoy* (`a…0028`) | 5 saltos, 2 rutas (por la actriz Knightley o por el director Wright) |
| | de *Gibson* (`a…0010`) a *Herbert* | **sin camino**: Gibson solo está unido a la ficha en borrador |
| **RF-25** director que adaptó libros de ≥ 2 autores | `CG-07` de *Villeneuve* (`a…0011`) | Herbert y Chiang. También Scott (Dick, Weir) y Wright (Austen, McEwan) |
| | Negativos: *Jackson* (`a…0014`) | Dos libros, **un** autor (Tolkien); *Spielberg*: un libro |
| **RF-26** libro terminado con ≥ 4 cuyo director adaptó **otro libro no leído** | `O18` + `CG-08` de **Ana** (`c…0002`) | Parte de *Dune* (5) y *El marciano* (4); recomienda *Historia de tu vida* (por Villeneuve) y *¿Sueñan los androides…?* (por Scott) |
| | Negativos de Ana | *El Hobbit* con 3 (no entra); *Orgullo y prejuicio* pendiente; *Expiación* con la reseña **oculta**; *Orient Express* en curso; *Orgullo y prejuicio* **película** terminada con 5 (no es libro). No se recomienda *La Comunidad del Anillo* |
| | **Pedro** | Ya leyó el otro libro de Villeneuve: no hay nada que recomendar |
| **RF-27** usuario que sigue a ≥ 2 lectores de un libro con adaptación | `CG-09` de **Sofía** (`c…0006`), que sigue a Ana, Pedro y Diego | 7 películas; las de *Dune* (2) y *El marciano* las alcanzan 2 seguidos. *Dune* (2021) sale aunque ya la vio (D-20) |
| | Negativos | Luis (sigue a uno): cuenta 1 en cada película; Pedro y el administrador no siguen a nadie |
| **RF-13 y RN-08** promedio consistente con las reseñas | `O17`, `O20` | *Dune*: 5, 4 y 4 → 4,33 con 3 reseñas. *Expiación*: la reseña de 5 está oculta → 2,00 con 1 reseña (no 3,50) |
| **D-24** ficha publicada con sus relaciones mínimas | `CG-22`, comprobación C-04 | Las 21 publicadas cumplen; solo la película en borrador está por debajo |
| Reseña oculta | `O17`, `O18`, `AP-21` | No cuenta en el promedio, ni como "le gustó", ni se lista a un lector |
| Fichas en borrador | `AP-03`, `AP-05`, C-11 | *Neuromante* (libro y película): un visitante no las encuentra; no tienen reseñas, estados ni listas |
| ISBN mezclados | `AP-01`, índice IX-03 (*sparse*) | 8 libros con ISBN y 3 sin él, sin chocar entre sí |
| Comparativas solo sobre parejas con `adaptado_a` | `AP-21`, `AP-23`, C-10 | 5 comparativas sobre *Dune*–*Dune* (2021) ×2, *Dune*–*Parte dos*, *El marciano* y *Expiación* (oculta) |

## Cómo añadir o cambiar datos

1. Edita `semilla.json` (mantén el patrón de ids de arriba o usa cualquier UUID en minúsculas).
2. `.\db\semilla\generar.ps1` — si algo rompe una regla, lo dice y no escribe nada.
3. `.\db\scripts\cargar-semilla.ps1` y `.\db\scripts\probar-semilla.ps1`.

Si cambias datos de los que dependen las consultas con valores esperados (`db/relacional/pruebas/06-consultas-semilla.sql`, `db/documental/pruebas/04-consultas-semilla.js`, `db/grafo/pruebas/semilla/01-consultas.cypher`), actualiza también esos valores: están escritos a mano a propósito, para que un cambio de datos no los dé por buenos sin que alguien los mire.
