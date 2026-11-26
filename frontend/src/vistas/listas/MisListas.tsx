// Mis listas (EP-29) y crear una nueva (EP-30).
import { View } from 'react-native';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { Fila } from '../../componentes/Fila';
import { Icono } from '../../componentes/Icono';
import { Texto } from '../../componentes/Texto';
import { useCrearLista, useMisListas } from '../../hooks/useListas';
import { useNavegacion } from '../../hooks/useNavegacion';
import { FormularioNombreLista } from './FormularioNombreLista';

export const obrasEnLista = (total: number) => (total === 1 ? '1 obra' : `${total} obras`);

export function MisListas() {
  const navegacion = useNavegacion();
  const listas = useMisListas();
  const crear = useCrearLista();

  return (
    <View className="gap-3">
      <FormularioNombreLista etiqueta="Nueva lista" accion="Crear lista" guardar={crear} vaciar />
      {listas.error ? (
        <EstadoError error={listas.error} onReintentar={() => void listas.refetch()} />
      ) : !listas.data ? (
        <Cargando />
      ) : listas.data.listas.length === 0 ? (
        <Texto tono="suave">Todavía no tienes listas.</Texto>
      ) : (
        listas.data.listas.map((l) => (
          <Fila
            key={l.lista_id}
            imagen={<Icono nombre="list" tamano={24} color="primario-fuerte" />}
            titulo={l.nombre}
            detalle={obrasEnLista(l.total_obras)}
            onPress={() => navegacion.navigate('Lista', { listaId: l.lista_id })}
          />
        ))
      )}
    </View>
  );
}
