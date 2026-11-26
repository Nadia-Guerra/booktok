// Otro lector: perfil básico (EP-22), seguirlo (EP-19, EP-20) y, si lo sigo, lo suyo (D-54).
import type { PerfilDeOtro } from '@dlbp/shared';
import { View } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { Fila } from '../../componentes/Fila';
import { Icono } from '../../componentes/Icono';
import { Cargando, EstadoError, EstadoVacio } from '../../componentes/Estados';
import { ListaPaginada } from '../../componentes/ListaPaginada';
import { Pantalla } from '../../componentes/Pantalla';
import { Retrato } from '../../componentes/Retrato';
import { Seccion } from '../../componentes/Seccion';
import { Texto } from '../../componentes/Texto';
import { mensajeDeError } from '../../core/http/errores';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useNavegacion } from '../../hooks/useNavegacion';
import { useResenas } from '../../hooks/useResenas';
import { useSeguir, useUsuario } from '../../hooks/useSocial';
import type { PropsDeRaiz } from '../../navegacion/tipos';
import { ListaDeComparativas } from '../comparativas/ListaDeComparativas';
import { ResenaModerable } from '../resenas/ResenaModerable';

function ResenasDeUsuario({ usuarioId }: { usuarioId: string }) {
  const navegacion = useNavegacion();
  const resenas = useResenas({ usuario_id: usuarioId });
  return (
    <Seccion titulo="Reseñas">
      <ListaPaginada consulta={resenas} vacio={<Texto tono="suave">Todavía no ha reseñado nada.</Texto>}>
        {(lista) =>
          lista.map((r) => (
            <ResenaModerable
              key={r.resena_id}
              resena={r}
              encabezado={r.obra.titulo}
              onPressEncabezado={() => navegacion.push('Ficha', { obraId: r.obra.obra_id })}
            />
          ))
        }
      </ListaPaginada>
    </Seccion>
  );
}

function Perfil({ perfil }: { perfil: PerfilDeOtro }) {
  const { usuario, esAdmin } = useSesion();
  const navegacion = useNavegacion();
  const seguir = useSeguir(perfil.usuario_id);
  const soyYo = usuario?.usuario_id === perfil.usuario_id;

  return (
    <>
      <View className="items-center gap-2">
        <Retrato nombre={perfil.nombre} tamano="grande" />
        <Texto variante="titulo">{perfil.nombre}</Texto>
        {perfil.biografia ? <Texto className="text-center">{perfil.biografia}</Texto> : null}
      </View>
      {soyYo ? null : (
        <Boton
          titulo={perfil.lo_sigo ? 'Dejar de seguir' : 'Seguir'}
          variante={perfil.lo_sigo ? 'secundario' : 'primario'}
          icono={perfil.lo_sigo ? 'person-remove-outline' : 'person-add-outline'}
          cargando={seguir.isPending}
          onPress={() => seguir.mutate(perfil.lo_sigo)}
        />
      )}
      <Aviso mensaje={seguir.error ? mensajeDeError(seguir.error) : undefined} />

      {perfil.listas ? (
        <Seccion titulo="Listas">
          {perfil.listas.length === 0 ? <Texto tono="suave">Sin listas.</Texto> : null}
          {perfil.listas.map((l) => (
            <Fila
              key={l.lista_id}
              imagen={<Icono nombre="list" tamano={24} color="primario-fuerte" />}
              titulo={l.nombre}
              onPress={() => navegacion.push('Lista', { listaId: l.lista_id })}
            />
          ))}
        </Seccion>
      ) : null}

      {/* El historial lo ven los seguidores y el administrador (D-54, D-55). */}
      {perfil.lo_sigo || soyYo || esAdmin ? (
        <>
          <ResenasDeUsuario usuarioId={perfil.usuario_id} />
          <Seccion titulo="Comparativas">
            <ListaDeComparativas
              filtro={{ usuario_id: perfil.usuario_id }}
              titular="obras"
              vacio="Todavía no ha comparado nada."
            />
          </Seccion>
        </>
      ) : (
        <EstadoVacio
          icono="lock-closed-outline"
          titulo="Síguele para ver más"
          mensaje="Sus reseñas y listas son para quienes le siguen."
        />
      )}
    </>
  );
}

export function UsuarioVista({ route }: PropsDeRaiz<'Usuario'>) {
  const consulta = useUsuario(route.params.usuarioId);
  return (
    <Pantalla>
      {consulta.data ? (
        <Perfil perfil={consulta.data} />
      ) : consulta.error ? (
        <EstadoError error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : (
        <Cargando />
      )}
    </Pantalla>
  );
}
