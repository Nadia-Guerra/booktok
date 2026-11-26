// Entrada a las comparativas: una por cada adaptación que une el libro con una película.
import type { Ficha, ObraBreve } from '@dlbp/shared';
import { Fila } from '../../componentes/Fila';
import { Icono } from '../../componentes/Icono';
import { Seccion } from '../../componentes/Seccion';
import { useNavegacion } from '../../hooks/useNavegacion';

export function Adaptaciones({ ficha }: { ficha: Ficha }) {
  const navegacion = useNavegacion();
  // La otra obra de cada pareja: las películas del libro, o el libro de la película.
  const otras: ObraBreve[] =
    ficha.tipo === 'libro' ? ficha.adaptaciones : ficha.libro_origen ? [ficha.libro_origen] : [];
  if (otras.length === 0) return null;

  return (
    <Seccion titulo="Libro contra película">
      {otras.map((otra) => (
        <Fila
          key={otra.obra_id}
          imagen={<Icono nombre="git-compare-outline" tamano={24} color="primario-fuerte" />}
          titulo={`Comparar con «${otra.titulo}»`}
          detalle={String(otra.anio)}
          onPress={() =>
            navegacion.push('Comparativas', {
              libroId: ficha.tipo === 'libro' ? ficha.obra_id : otra.obra_id,
              peliculaId: ficha.tipo === 'libro' ? otra.obra_id : ficha.obra_id,
            })
          }
        />
      ))}
    </Seccion>
  );
}
