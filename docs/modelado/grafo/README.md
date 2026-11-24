# Modelo de grafos: índice

Documentación de la base de grafos (Neo4j, D-14) de *Del Libro a la Pantalla*, dividida por etapas. Cada dato vive en un solo archivo; los demás lo referencian por nombre.

| Archivo | Contiene | Consultar cuando… | Estado |
|---|---|---|---|
| `01-consultas-y-entidades.md` | Consultas que el sistema hace sobre el grafo y las entidades (nodos) que hay que guardar para resolverlas | Se definen nodos, relaciones o índices | Hecho |
| `02-relaciones.md` | Relaciones entre las entidades: origen, tipo, destino, propiedades, cardinalidad y consultas que las usan | Se escriben las consultas o se crean relaciones | Hecho |
| `03-propiedades.md` | Propiedades de nodos y relaciones: tipo de dato, obligatoriedad y descripción | Se crean nodos o relaciones, o se escriben las restricciones | Hecho |
| `04-restricciones.md` | Restricciones por entidad, por propiedad y por entidad y propiedad; verificación de coherencia; sentencias para crearlas | Se crea la base o se escriben pruebas de integridad | Hecho |
| `05-cardinalidad.md` | Cuántas instancias de una entidad pueden relacionarse con otras, en cada sentido de las seis relaciones, y quién impone cada tope | Se escriben las escrituras de relaciones o las pruebas de integridad | Hecho |

Documentos de contexto: `../matriz-responsabilidades.md`, `../fuente-de-verdad.md`, `../justificacion-tres-bases.md`, `../../decisiones_tomadas.md` (D-12 y D-14 a D-25) y `../../requerimientos/`.
