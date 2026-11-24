// CG-15, paso previo (D-23): bloquear el nodo de la película ANTES de comprobar con CG-04 y crear con CG-15.
// Escribir en el nodo toma su candado dentro de la transacción; una segunda escritura simultánea sobre la
// misma película espera aquí hasta que la primera confirme. El valor no cambia (se reescribe el mismo).
// Orden obligatorio, todo en UNA transacción: CG-15-bloqueo -> CG-04 -> (si no hay libro) CG-15.
MATCH (f:`Película` {obra_id: $pelicula_id})
SET f.obra_id = f.obra_id
RETURN f.obra_id AS obra_id
