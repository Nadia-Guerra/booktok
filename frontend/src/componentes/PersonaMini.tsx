// Retrato con nombre y, debajo, su papel en la obra.
import { Pressable, View } from 'react-native';
import { Retrato } from './Retrato';
import { Texto } from './Texto';

type Props = { nombre: string; url: string | null; detalle?: string; onPress?: () => void };

export function PersonaMini({ nombre, url, detalle, onPress }: Props) {
  const contenido = (
    <View className="w-20 items-center gap-1">
      <Retrato nombre={nombre} url={url} />
      <Texto variante="leyenda" numberOfLines={2} className="text-center">
        {nombre}
      </Texto>
      {detalle ? (
        <Texto variante="leyenda" tono="suave" numberOfLines={2} className="text-center">
          {detalle}
        </Texto>
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={nombre} onPress={onPress} className="active:opacity-70">
      {contenido}
    </Pressable>
  ) : (
    contenido
  );
}
