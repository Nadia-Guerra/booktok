// Marco común de las vistas: fondo, márgenes, desplazamiento y teclado.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Texto } from './Texto';

type Props = {
  children: ReactNode;
  /** Título grande. Sin él se asume que la barra de navegación ya lo muestra. */
  titulo?: string;
};

export function Pantalla({ children, titulo }: Props) {
  const margenes = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-fondo">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="grow">
        <View className="flex-1 gap-4 px-5 pb-8" style={{ paddingTop: titulo ? margenes.top + 16 : 16 }}>
          {titulo ? <Texto variante="portada">{titulo}</Texto> : null}
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
