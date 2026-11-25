// Datos de una ficha: cifras destacadas en fila y pares etiqueta-valor.
import { View } from 'react-native';
import { Texto } from './Texto';

export function Cifras({ cifras }: { cifras: { valor: string; nombre: string }[] }) {
  return (
    <View className="flex-row justify-around rounded-3xl bg-suave py-3">
      {cifras.map((c) => (
        <View key={c.nombre} className="items-center">
          <Texto variante="subtitulo">{c.valor}</Texto>
          <Texto variante="leyenda" tono="suave">
            {c.nombre}
          </Texto>
        </View>
      ))}
    </View>
  );
}

export function FilaDato({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <View className="flex-row gap-3">
      <Texto tono="suave" className="w-28">
        {nombre}
      </Texto>
      <Texto className="flex-1">{valor}</Texto>
    </View>
  );
}
