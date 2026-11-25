// Bloque con título; opcionalmente en una fila que se desliza.
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Texto } from './Texto';

export function Seccion({ titulo, carrusel, children }: { titulo: string; carrusel?: boolean; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Texto variante="titulo">{titulo}</Texto>
      {carrusel ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4">
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );
}
