// Las reseñas de una obra, recientes primero (EP-10). Son públicas.
import { ListaPaginada } from '../../componentes/ListaPaginada';
import { Seccion } from '../../componentes/Seccion';
import { Texto } from '../../componentes/Texto';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useNavegacion } from '../../hooks/useNavegacion';
import { useResenas } from '../../hooks/useResenas';
import { ResenaModerable } from '../resenas/ResenaModerable';

export function ResenasDeObra({ obraId }: { obraId: string }) {
  const navegacion = useNavegacion();
  const { usuario } = useSesion();
  const resenas = useResenas({ obra_id: obraId });
  // Ver un perfil pide sesión (D-54).
  const abrirAutor = (usuarioId: string) =>
    usuario ? navegacion.navigate('Usuario', { usuarioId }) : navegacion.navigate('Acceso');
  return (
    <Seccion titulo="Reseñas">
      <ListaPaginada consulta={resenas} vacio={<Texto tono="suave">Todavía no hay reseñas.</Texto>}>
        {(lista) =>
          lista.map((r) => {
            const propia = r.autor.usuario_id === usuario?.usuario_id;
            return (
              <ResenaModerable
                key={r.resena_id}
                resena={r}
                encabezado={propia ? `${r.autor.nombre} (tú)` : r.autor.nombre}
                onPressEncabezado={propia ? undefined : () => abrirAutor(r.autor.usuario_id)}
              />
            );
          })
        }
      </ListaPaginada>
    </Seccion>
  );
}
