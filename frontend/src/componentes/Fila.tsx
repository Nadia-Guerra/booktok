// Renglón con imagen, nombre y detalle: personas, usuarios, obras y nodos de un camino.
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Icono } from './Icono';
import { Tarjeta } from './Tarjeta';
import { Texto } from './Texto';

type Props = {
  imagen: ReactNode;
  titulo: string;
  detalle?: string | undefined;
  onPress?: (() => void) | undefined;
};

export function Fila({ imagen, titulo, detalle, onPress }: Props) {
  const contenido = (
    <Tarjeta className="flex-row items-center">
      {imagen}
      <View className="flex-1">
        <Texto variante="subtitulo">{titulo}</Texto>
        {detalle ? (
          <Texto variante="leyenda" tono="suave">
            {detalle}
          </Texto>
        ) : null}
      </View>
      {onPress ? <Icono nombre="chevron-forward" color="texto-suave" /> : null}
    </Tarjeta>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={titulo} onPress={onPress} className="active:opacity-70">
      {contenido}
    </Pressable>
  ) : (
    contenido
  );
}
