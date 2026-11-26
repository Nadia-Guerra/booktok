// Comparativas paginadas: de una adaptación (muestra el autor) o de una persona (muestra las obras).
import type { FiltroComparativas } from '../../api/comparativas';
import { ListaPaginada } from '../../componentes/ListaPaginada';
import { Texto } from '../../componentes/Texto';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useComparativas } from '../../hooks/useComparativas';
import { useNavegacion } from '../../hooks/useNavegacion';
import { ComparativaModerable } from './ComparativaModerable';

type Props = { filtro: FiltroComparativas; titular: 'autor' | 'obras'; vacio?: string };

export function ListaDeComparativas({ filtro, titular, vacio = 'Todavía no hay comparativas.' }: Props) {
  const navegacion = useNavegacion();
  const { usuario } = useSesion();
  const comparativas = useComparativas(filtro);

  return (
    <ListaPaginada consulta={comparativas} vacio={<Texto tono="suave">{vacio}</Texto>}>
      {(lista) =>
        lista.map((c) => {
          const propia = c.autor.usuario_id === usuario?.usuario_id;
          const abrir =
            titular === 'obras'
              ? () =>
                  navegacion.push('Comparativas', {
                    libroId: c.libro.obra_id,
                    peliculaId: c.pelicula.obra_id,
                  })
              : propia
                ? undefined
                : () =>
                    usuario
                      ? navegacion.push('Usuario', { usuarioId: c.autor.usuario_id })
                      : navegacion.push('Acceso');
          return (
            <ComparativaModerable
              key={c.comparativa_id}
              comparativa={c}
              encabezado={
                titular === 'obras'
                  ? `«${c.libro.titulo}» y «${c.pelicula.titulo}» (${c.pelicula.anio})`
                  : `${c.autor.nombre}${propia ? ' (tú)' : ''}`
              }
              onPressEncabezado={abrir}
            />
          );
        })
      }
    </ListaPaginada>
  );
}
