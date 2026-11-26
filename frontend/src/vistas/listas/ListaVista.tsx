// Una lista (EP-31). Su dueño la renombra, la ordena, quita obras y la borra (EP-32, 33 y 35).
import type { DetalleLista } from '@dlbp/shared';
import { View } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { BotonIcono } from '../../componentes/BotonIcono';
import { confirmar } from '../../componentes/confirmar';
import { Cargando, EstadoError, EstadoVacio } from '../../componentes/Estados';
import { Fila } from '../../componentes/Fila';
import { Pantalla } from '../../componentes/Pantalla';
import { Portada } from '../../componentes/Portada';
import { NOMBRE_TIPO } from '../../componentes/TarjetaObra';
import { Texto } from '../../componentes/Texto';
import { mensajeDeError } from '../../core/http/errores';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useEditarLista, useLista } from '../../hooks/useListas';
import { useNavegacion } from '../../hooks/useNavegacion';
import type { PropsDeRaiz } from '../../navegacion/tipos';
import { FormularioNombreLista } from './FormularioNombreLista';

function Contenido({ lista }: { lista: DetalleLista }) {
  const navegacion = useNavegacion();
  const { usuario } = useSesion();
  const esMia = lista.propietario.usuario_id === usuario?.usuario_id;
  const { cambiar, quitar, eliminar } = useEditarLista(lista.lista_id);
  const error = cambiar.error ?? quitar.error ?? eliminar.error;
  const ocupado = cambiar.isPending || quitar.isPending;

  /** Intercambia una obra con su vecina y envía el orden completo. */
  function mover(i: number, paso: -1 | 1) {
    const ids = lista.obras.map((o) => o.obra_id);
    [ids[i], ids[i + paso]] = [ids[i + paso]!, ids[i]!];
    cambiar.mutate({ obra_ids: ids });
  }

  return (
    <>
      <View>
        <Texto variante="titulo">{lista.nombre}</Texto>
        <Texto tono="suave">{esMia ? 'Tu lista' : `De ${lista.propietario.nombre}`}</Texto>
      </View>

      <Aviso mensaje={error ? mensajeDeError(error) : undefined} />

      {lista.obras.length === 0 ? (
        <EstadoVacio
          icono="list-outline"
          titulo="Lista vacía"
          mensaje={esMia ? 'Agrega obras desde su ficha.' : 'Todavía no tiene obras.'}
        />
      ) : (
        lista.obras.map((obra, i) => (
          <View key={obra.obra_id} className="gap-1">
            <Fila
              imagen={<Portada titulo={obra.titulo} url={obra.portada_url} tamano="mini" />}
              titulo={obra.titulo}
              detalle={`${NOMBRE_TIPO[obra.tipo]} · ${obra.anio}`}
              onPress={() => navegacion.push('Ficha', { obraId: obra.obra_id })}
            />
            {esMia ? (
              <View className="flex-row justify-end">
                <BotonIcono icono="arrow-up" etiqueta="Subir" deshabilitado={i === 0 || ocupado} onPress={() => mover(i, -1)} />
                <BotonIcono
                  icono="arrow-down"
                  etiqueta="Bajar"
                  deshabilitado={i === lista.obras.length - 1 || ocupado}
                  onPress={() => mover(i, 1)}
                />
                <BotonIcono
                  icono="trash-outline"
                  etiqueta="Quitar de la lista"
                  color="peligro"
                  deshabilitado={ocupado}
                  onPress={() => quitar.mutate(obra.obra_id)}
                />
              </View>
            ) : null}
          </View>
        ))
      )}

      {esMia ? (
        <>
          <FormularioNombreLista
            etiqueta="Nombre"
            accion="Cambiar nombre"
            inicial={lista.nombre}
            guardar={(datos) => cambiar.mutateAsync(datos)}
          />
          <Boton
            titulo="Eliminar lista"
            variante="peligro"
            icono="trash-outline"
            cargando={eliminar.isPending}
            onPress={() =>
              confirmar('Eliminar lista', 'Las obras no se borran, solo la lista.', 'Eliminar', () =>
                eliminar.mutate(undefined, { onSuccess: () => navegacion.goBack() }),
              )
            }
          />
        </>
      ) : null}
    </>
  );
}

export function ListaVista({ route }: PropsDeRaiz<'Lista'>) {
  const lista = useLista(route.params.listaId);
  return (
    <Pantalla>
      {lista.data ? (
        <Contenido lista={lista.data} />
      ) : lista.error ? (
        <EstadoError error={lista.error} onReintentar={() => void lista.refetch()} />
      ) : (
        <Cargando />
      )}
    </Pantalla>
  );
}
