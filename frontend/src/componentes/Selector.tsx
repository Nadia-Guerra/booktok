// Elegir una opción entre pocas.
import { Pressable, View } from 'react-native';
import { clases } from './clases';
import { Texto } from './Texto';

type Props<T extends string> = {
  opciones: readonly { valor: T; titulo: string }[];
  valor: T | null;
  onCambiar: (valor: T) => void;
};

export function Selector<T extends string>({ opciones, valor, onCambiar }: Props<T>) {
  return (
    <View accessibilityRole="tablist" className="flex-row gap-1 rounded-2xl bg-suave p-1">
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            onPress={() => onCambiar(o.valor)}
            className={clases('min-h-10 flex-1 items-center justify-center rounded-xl px-2', activa && 'bg-superficie')}
          >
            {/* Con cuatro opciones en un teléfono angosto, el texto se encoge en vez de partirse. */}
            <Texto variante="etiqueta" tono={activa ? 'normal' : 'suave'} numberOfLines={1} adjustsFontSizeToFit>
              {o.titulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}
