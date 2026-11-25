// Dos columnas. Para listas cortas (el catálogo devuelve como mucho 20 resultados).
import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

export function Rejilla({ children }: { children: ReactNode }) {
  return (
    <View className="flex-row flex-wrap justify-between gap-y-5">
      {Children.map(children, (hijo) => (
        <View className="w-[47%]">{hijo}</View>
      ))}
    </View>
  );
}
