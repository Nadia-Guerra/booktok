// Cómo se conectan dos personas u obras (EP-16): el camino más corto en el grafo.
import type { Camino, RelacionDeCamino } from '@dlbp/shared';
import { useState } from 'react';
import { View } from 'react-native';
import { Cargando, EstadoError, EstadoVacio } from '../../componentes/Estados';
import { Fila } from '../../componentes/Fila';
import { Icono } from '../../componentes/Icono';
import { ImagenNodo, nodoDeObra, nodoDePersona, nombreDeTipo, type Nodo } from '../../componentes/nodos';
import { Pantalla } from '../../componentes/Pantalla';
import { Seccion } from '../../componentes/Seccion';
import { Texto } from '../../componentes/Texto';
import { useAbrirNodo } from '../../hooks/useAbrirNodo';
import { useCaminos } from '../../hooks/useDescubrimiento';
import type { PropsDeRaiz } from '../../navegacion/tipos';
import { ElegirNodo } from './ElegirNodo';

const RELACIONES: Record<RelacionDeCamino, string> = {
  'escribió': 'autoría',
  adaptado_a: 'adaptación',
  dirigida_por: 'dirección',
  'actuó_en': 'actuación',
};

function Recorrido({ camino }: { camino: Camino }) {
  const abrir = useAbrirNodo();
  return (
    <View className="gap-1">
      {camino.nodos.map((n, i) => {
        const nodo = n.tipo === 'persona' ? nodoDePersona(n) : nodoDeObra(n);
        const relacion = camino.relaciones[i];
        return (
          <View key={nodo.id} className="gap-1">
            <Fila
              imagen={<ImagenNodo nodo={nodo} />}
              titulo={nodo.nombre}
              detalle={nombreDeTipo(nodo.tipo)}
              onPress={() => abrir(nodo)}
            />
            {relacion ? (
              <View className="flex-row items-center justify-center gap-2">
                <Icono nombre="arrow-down" tamano={16} color="primario-fuerte" />
                <Texto variante="leyenda" tono="primario">
                  {RELACIONES[relacion]}
                </Texto>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function Resultado({ origen, destino }: { origen: Nodo; destino: Nodo }) {
  const consulta = useCaminos(origen.id, destino.id);

  if (origen.id === destino.id) return <Texto tono="peligro">Elige dos puntos distintos.</Texto>;
  if (consulta.error) return <EstadoError error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  if (!consulta.data) return <Cargando />;
  const { caminos } = consulta.data;
  if (caminos.length === 0) {
    return <EstadoVacio icono="git-network-outline" titulo="No hay conexión" mensaje="Prueba con otros dos puntos." />;
  }
  return caminos.map((camino, i) => (
    <Seccion key={i} titulo={caminos.length > 1 ? `Camino ${i + 1}` : 'Camino'}>
      <Recorrido camino={camino} />
    </Seccion>
  ));
}

export function CaminosVista({ route }: PropsDeRaiz<'Caminos'>) {
  const [origen, setOrigen] = useState<Nodo | null>(route.params?.origen ?? null);
  const [destino, setDestino] = useState<Nodo | null>(null);

  return (
    <Pantalla>
      <ElegirNodo etiqueta="Desde" valor={origen} onElegir={setOrigen} />
      <ElegirNodo etiqueta="Hasta" valor={destino} onElegir={setDestino} />
      {origen && destino ? <Resultado origen={origen} destino={destino} /> : null}
    </Pantalla>
  );
}
