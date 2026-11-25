import { View } from 'react-native';
import { Texto } from './Texto';

export function Chip({ texto }: { texto: string }) {
  return (
    <View className="rounded-full bg-suave px-3 py-1">
      <Texto variante="leyenda">{texto}</Texto>
    </View>
  );
}

export function Chips({ textos }: { textos: string[] }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {textos.map((t) => (
        <Chip key={t} texto={t} />
      ))}
    </View>
  );
}
