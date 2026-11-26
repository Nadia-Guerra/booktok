// Una reseña: quién (o de qué obra), cuántas estrellas, cuándo y qué dice.
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { formatearFecha } from '../core/formato';
import { Chip } from './Chip';
import { Estrellas } from './Estrellas';
import { Tarjeta } from './Tarjeta';
import { Texto } from './Texto';

type Props = {
  encabezado: string;
  calificacion: number;
  texto: string | null;
  fecha: string;
  oculta?: boolean;
  onPressEncabezado?: (() => void) | undefined;
  /** Botones de la reseña (editar, borrar, moderar). */
  children?: ReactNode;
};

export function TarjetaResena({ encabezado, calificacion, texto, fecha, oculta, onPressEncabezado, children }: Props) {
  const titulo = (
    <Texto variante="subtitulo" tono={onPressEncabezado ? 'primario' : 'normal'}>
      {encabezado}
    </Texto>
  );
  return (
    <Tarjeta>
      <View className="gap-1">
        {onPressEncabezado ? (
          <Pressable accessibilityRole="link" onPress={onPressEncabezado} className="active:opacity-70">
            {titulo}
          </Pressable>
        ) : (
          titulo
        )}
        <View className="flex-row items-center justify-between">
          <Estrellas valor={calificacion} />
          <Texto variante="leyenda" tono="suave">
            {formatearFecha(fecha)}
          </Texto>
        </View>
      </View>
      {oculta ? <Chip texto="Oculta por moderación" /> : null}
      {texto ? <Texto>{texto}</Texto> : null}
      {children}
    </Tarjeta>
  );
}
