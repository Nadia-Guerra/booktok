// Un libro contra una de sus películas: la mía y las de los demás (EP-23, EP-28).
import { View } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { confirmar } from '../../componentes/confirmar';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { Pantalla } from '../../componentes/Pantalla';
import { Seccion } from '../../componentes/Seccion';
import { TarjetaComparativa } from '../../componentes/TarjetaComparativa';
import { TarjetaObra } from '../../componentes/TarjetaObra';
import { mensajeDeError } from '../../core/http/errores';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useFicha } from '../../hooks/useCatalogo';
import { useEliminarComparativa, useMiComparativa, type Pareja } from '../../hooks/useComparativas';
import { useNavegacion } from '../../hooks/useNavegacion';
import type { PropsDeRaiz } from '../../navegacion/tipos';
import { ListaDeComparativas } from './ListaDeComparativas';

function ObraComparada({ obraId }: { obraId: string }) {
  const navegacion = useNavegacion();
  const { data } = useFicha(obraId);
  if (!data) return <View className="flex-1" />;
  return (
    <TarjetaObra
      obra={{
        obra_id: data.obra_id,
        tipo: data.tipo,
        titulo: data.titulo,
        anio: data.tipo === 'libro' ? data.anio_publicacion_original : data.anio_estreno,
        portada_url: data.portada_url,
      }}
      className="flex-1"
      onPress={() => navegacion.push('Ficha', { obraId })}
    />
  );
}

function LaMia(pareja: Pareja) {
  const navegacion = useNavegacion();
  const { usuario } = useSesion();
  const mia = useMiComparativa(pareja);
  const eliminar = useEliminarComparativa();
  const escribir = () => navegacion.navigate('EscribirComparativa', pareja);

  if (!usuario) {
    return <Boton titulo="Entra para comparar" icono="log-in-outline" onPress={() => navegacion.navigate('Acceso')} />;
  }
  if (mia.error) return <EstadoError error={mia.error} onReintentar={() => void mia.refetch()} />;
  if (mia.data === undefined) return <Cargando />;
  if (mia.data === null) {
    return <Boton titulo="Escribir mi comparativa" icono="git-compare-outline" onPress={escribir} />;
  }

  const { comparativa_id } = mia.data;
  return (
    <TarjetaComparativa comparativa={mia.data} encabezado="Tu comparativa">
      <Aviso mensaje={eliminar.error ? mensajeDeError(eliminar.error) : undefined} />
      <View className="flex-row gap-2">
        <Boton titulo="Editar" variante="secundario" icono="create-outline" onPress={escribir} className="flex-1" />
        <Boton
          titulo="Eliminar"
          variante="peligro"
          icono="trash-outline"
          cargando={eliminar.isPending}
          onPress={() =>
            confirmar('Eliminar comparativa', 'No se puede deshacer.', 'Eliminar', () =>
              eliminar.mutate(comparativa_id),
            )
          }
          className="flex-1"
        />
      </View>
    </TarjetaComparativa>
  );
}

export function ComparativasVista({ route }: PropsDeRaiz<'Comparativas'>) {
  const { libroId, peliculaId } = route.params;
  return (
    <Pantalla>
      <View className="flex-row gap-4 px-4">
        <ObraComparada obraId={libroId} />
        <ObraComparada obraId={peliculaId} />
      </View>
      <LaMia libroId={libroId} peliculaId={peliculaId} />
      <Seccion titulo="Comparativas">
        <ListaDeComparativas filtro={{ libro_id: libroId, pelicula_id: peliculaId }} titular="autor" />
      </Seccion>
    </Pantalla>
  );
}
