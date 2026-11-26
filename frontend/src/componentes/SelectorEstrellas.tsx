// Calificar de 1 a 5 tocando las estrellas.
import { Pressable, View } from 'react-native';
import { Icono } from './Icono';
import { Texto } from './Texto';

type Props = { etiqueta: string; valor: number; onCambiar: (valor: number) => void; error?: string | undefined };

export function SelectorEstrellas({ etiqueta, valor, onCambiar, error }: Props) {
  return (
    <View className="gap-1">
      <Texto variante="etiqueta">{etiqueta}</Texto>
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} de 5`}
            accessibilityState={{ selected: valor === n }}
            onPress={() => onCambiar(n)}
            className="h-12 w-12 items-center justify-center active:opacity-70"
          >
            <Icono nombre={n <= valor ? 'star' : 'star-outline'} tamano={34} color="estrella" />
          </Pressable>
        ))}
      </View>
      {error ? (
        <Texto variante="leyenda" tono="peligro">
          {error}
        </Texto>
      ) : null}
    </View>
  );
}
