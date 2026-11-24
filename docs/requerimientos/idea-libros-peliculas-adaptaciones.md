# Del Libro a la Pantalla

Plataforma social de libros, películas y adaptaciones.

## 1. Nombre de la aplicación

**Del Libro a la Pantalla.** El nombre expresa la función central: seguir el camino de una obra literaria hasta su adaptación cinematográfica y compartir la experiencia con otros lectores y espectadores.

## 2. Problema

Quienes leen y ven películas llevan su seguimiento en herramientas separadas: una app para libros, otra para cine y notas sueltas. Ninguna trata la **adaptación** como relación central, así que es difícil saber qué películas provienen de un libro, comparar ambas versiones o descubrir obras a partir de autores, directores y actores conectados. Las reseñas también quedan aisladas, sin forma de comparar el libro con su adaptación.

## 3. Usuarios

| Usuario | Qué necesita hacer |
|---|---|
| **Lector/espectador** (principal) | Registrar lo que leyó o vio, reseñar, comparar un libro con su adaptación, armar listas, seguir a otros usuarios y descubrir adaptaciones. |
| **Administrador/curador** | Mantener el catálogo: alta y corrección de obras, ediciones, personas y adaptaciones; moderar reseñas. |

## 4. Objetivo general

Ofrecer una plataforma donde los usuarios registren, reseñen y comparen libros y sus adaptaciones cinematográficas, y descubran nuevas obras mediante las conexiones entre autores, directores, actores y otros usuarios, usando una base de datos relacional, una documental y una de grafo, cada una por una necesidad real del dominio.

## 5. Alcance

**Incluye**

- Catálogo de libros y películas con fichas detalladas.
- Registro, perfiles y seguimiento entre usuarios.
- Reseñas individuales y reseñas comparativas libro vs. adaptación.
- Listas de seguimiento y listas personalizadas mixtas.
- Exploración de adaptaciones y de conexiones entre personas y obras.
- Recomendaciones basadas en la red de seguimiento.
- Gestión básica del catálogo por parte del administrador.

**Exclusiones explícitas**

- No se venden ni se reproducen libros o películas (sin compra, lectura ni streaming).
- No hay mensajería privada ni chat entre usuarios.
- No cubre series, videojuegos ni otros medios.
- No incluye motor de recomendación con aprendizaje automático; solo recomendaciones por recorridos del grafo.
- No se importan catálogos masivos de APIs externas; el catálogo es propio y acotado.

## 6. Operaciones principales

1. Registrarse, iniciar sesión y editar el perfil.
2. Buscar y consultar la ficha de un libro o una película (con su reparto y adaptaciones).
3. **Publicar una reseña:** en una sola transacción se guarda la reseña, se marca la obra como "terminada" para el usuario y se actualiza el promedio de la obra.
4. Editar y eliminar una reseña (una por usuario y obra).
5. Marcar el estado de una obra: pendiente, en curso o terminada.
6. Publicar una reseña comparativa entre un libro y su adaptación (aspectos elegidos por el usuario).
7. Crear y gestionar listas, y agregar o quitar obras de ellas.
8. Seguir y dejar de seguir a otros usuarios.
9. **Eliminar la cuenta:** se borran en cascada reseñas, listas, estados y seguimientos, y se limpian las reseñas comparativas y las proyecciones del grafo asociadas.
10. Ver las adaptaciones de un libro y el libro de origen de una película.
11. Explorar conexiones: autores y directores relacionados, caminos entre personas y obras.
12. Recibir recomendaciones a partir de lo que leyeron o vieron las personas que sigo.
13. (Administrador) Dar de alta y corregir obras, personas y adaptaciones, y moderar reseñas.
14. (Administrador) **Agregar una edición nueva a un libro o una plataforma a una película**, con campos propios de cada tipo, sin migrar esquema.

## 7. Datos necesarios

**Entidades (relacional)**

- Usuario, Reseña, Lista, ElementoDeLista, EstadoDeObra, Seguimiento.
- Reseña: una por usuario y obra (libro o película); calificación en rango válido.
- Promedio de calificación de cada obra, guardado como dato derivado y actualizado en la misma transacción que la reseña.

**Documentos (documental)**

- Ficha de libro: título, sinopsis, portada (la dirección de una imagen guardada fuera de la base), géneros, año de publicación original y **ediciones anidadas** (ISBN opcional, páginas, editorial, idioma, año).
- Ficha de película: título, sinopsis, portada (la dirección de una imagen guardada fuera de la base), géneros, año de estreno, duración, plataformas, datos técnicos (idioma original, países de origen, productoras, clasificación) y una copia de presentación del reparto (ver sección 9).
- Reseña comparativa: documento propio que referencia a un usuario, un libro y su película, con un veredicto (prefiere el libro, la película o empate) y aspectos variables (fidelidad, ritmo, final, personajes). Índice único compuesto (usuario, libro, película).
- Cada ficha y cada comparativa llevan fecha de creación y de última actualización.

**Nodos y relaciones (grafo)**

- Nodos: Persona (autor, director o actor según sus relaciones; una misma persona puede ser las tres cosas; con una foto opcional, la dirección de una imagen guardada fuera de la base), Libro, Película, Usuario.
- Relaciones: Persona –[escribió]→ Libro, Libro –[adaptado_a]→ Película, Película –[dirigida_por]→ Persona, Persona –[actuó_en {personaje, orden}]→ Película.
- Proyecciones derivadas del relacional: Usuario –[sigue]→ Usuario y Usuario –[leyó]→ Libro (solo libros).

**Vínculo entre bases:** el identificador de obra y de usuario se comparte como referencia. Los datos que existen en más de una base están listados y justificados en la sección 9.

## 8. Justificación de los tres modelos

### Relacional: transacciones, unicidad e integridad

Guarda usuarios, reseñas, listas, estados de lectura o visionado y seguimientos.

**Necesidades que atiende:**

- **Transacción de varias entidades:** publicar una reseña, marcar la obra como terminada y actualizar el promedio debe ocurrir completo o no ocurrir.
- **Integridad referencial:** al eliminar una cuenta se borran en cascada sus reseñas, listas, estados y seguimientos sin dejar registros huérfanos.
- **Unicidad y rangos:** una reseña por usuario y obra; un elemento por lista; calificación válida; nadie se sigue a sí mismo.

### Documental: estructura anidada y atributos variables

Guarda las fichas de libros y películas, y las reseñas comparativas.

**Necesidades que atiende:**

- Cada obra se lee completa en una sola consulta (página de detalle), con ediciones o plataformas anidadas.
- Libros y películas no comparten los mismos atributos. Se puede agregar una edición o una plataforma sin migrar esquema ni crear columnas vacías.
- La reseña comparativa es un objeto distinto de la reseña individual: involucra dos obras, sus aspectos los elige el usuario y se lee como una unidad.

### Grafo: relaciones explícitas y recorridos

Guarda la red de autores, libros, adaptaciones, directores, actores y la red social.

**Necesidad que atiende:** recorridos y patrones que son funcionalidad central, en especial los de **longitud variable**:

- Camino entre un autor y un actor a través de adaptaciones.
- Autores cuyos libros fueron adaptados por el mismo director.
- Libros a dos saltos de uno que me gustó, vía adaptaciones del mismo director.
- Películas basadas en libros que leyeron personas que sigo.

En SQL estas consultas requerirían uniones encadenadas o consultas recursivas costosas y difíciles de mantener.

### Prueba de eliminación

| Si se quita… | Se pierde o empeora… |
|---|---|
| Relacional | Atomicidad de publicar reseña + estado + promedio, cascada al borrar cuentas y unicidad con integridad referencial |
| Documental | Lectura de la ficha completa en una consulta y flexibilidad de atributos por tipo; habría que normalizar a muchas tablas o columnas vacías |
| Grafo | Recorridos de longitud variable y recomendaciones sociales, que son la funcionalidad más distintiva de la aplicación |

## 9. Registro de redundancia controlada

Algunos datos existen en más de una base. Cada caso tiene fuente de verdad, dirección de sincronización y razón.

| Dato | Fuente de verdad | Copia | Dirección y razón |
|---|---|---|---|
| Seguimiento entre usuarios | Relacional | Grafo (`sigue`) | Relacional → grafo. Integridad y cascada en SQL; recorridos sociales en el grafo |
| Reparto de una película (con la foto de cada actor) | Grafo (`actuó_en` con personaje y orden, y nodo `Persona`) | Ficha documental (copia de presentación) | Grafo → documento. Permite leer la ficha completa en una consulta; se regenera desde el grafo |
| Estado de lectura de libros | Relacional | Grafo (`leyó`, solo hacia libros) | Relacional → grafo. Permite resolver las recomendaciones en una sola consulta de grafo |
| Promedio de calificación | Relacional (reseñas) | Campo derivado de la obra (`ObraResumen`) | Misma base y misma transacción, sin riesgo de desincronización |
| Existencia de obra (id) | Documental (ficha) | Relacional (`ObraResumen`) y grafo (nodo) | Documento → relacional y grafo. Permite claves foráneas desde reseñas, estados y listas, y anclar los recorridos |
| Identidad de usuario (id) | Relacional | Grafo (nodo Usuario) | Relacional → grafo. Ancla `sigue` y `leyó` |

**Reglas de control**

- Toda escritura se hace primero en la fuente de verdad y después se propaga a la copia, con reintento si falla.
- Las copias nunca se editan directamente; si hay duda, se reconstruyen desde la fuente con un script de reconciliación.
- **Limitación reconocida:** entre bases distintas no hay transacción atómica. La sincronización es eventual y la consistencia fuerte solo se garantiza dentro de cada base (por ejemplo, la transacción de publicar reseña ocurre completa en el relacional).
- **Plan de respaldo para el estado de lectura:** si la proyección `leyó` resulta difícil de sincronizar, la recomendación puede resolverse sin copia en tres pasos (grafo para quién sigo, relacional para lo que leyeron, grafo para adaptaciones), a costa de más consultas encadenadas.

## 10. Puntos a defender

- **Redundancia justificada:** cada copia tiene fuente, dirección, razón y forma de reconstruirse.
- **Reseña comparativa como objeto aparte:** no es una segunda reseña; su referencia a usuario y obras se valida en la aplicación y su unicidad la garantiza el índice compuesto del documento. Al eliminar una cuenta se limpian sus comparativas.
- **Grafo defendido por recorridos variables:** las consultas de saltos fijos se podrían resolver con uniones; la ventaja clara está en caminos y patrones de longitud variable.
- **Riesgo reconocido:** el catálogo de adaptaciones es más acotado que uno general de cine. Se compensa porque la relación libro → adaptación es el núcleo del dominio y no una función accesoria.
