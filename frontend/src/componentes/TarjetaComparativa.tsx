// Una reseña comparativa: veredicto y aspectos.
import type { Comparativa } from '@dlbp/shared';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { formatearFecha } from '../core/formato';
import { Chip } from './Chip';
import { Estrellas } from './Estrellas';
import { VEREDICTOS } from './preferencias';
import { Tarjeta } from './Tarjeta';
import { Texto } from './Texto';

type Props = {
  comparativa: Comparativa;
  encabezado: string;
  onPressEncabezado?: (() => void) | undefined;
  children?: ReactNode;
};

export function TarjetaComparativa({ comparativa, encabezado, onPressEncabezado, children }: Props) {
  const { veredicto, aspectos, oculta, creado_en } = comparativa;
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
        <Texto variante="leyenda" tono="suave">
          {formatearFecha(creado_en)}
        </Texto>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <Chip texto={VEREDICTOS[veredicto.preferencia]} />
        {oculta ? <Chip texto="Oculta por moderación" /> : null}
      </View>
      {veredicto.comentario ? <Texto>{veredicto.comentario}</Texto> : null}
      {aspectos.map((a, i) => (
        <View key={i} className="gap-1 border-t border-borde pt-2">
          <View className="flex-row items-center justify-between gap-2">
            <Texto variante="etiqueta" className="flex-1">
              {a.nombre}
            </Texto>
            {a.puntuacion ? <Estrellas valor={a.puntuacion} /> : null}
          </View>
          {a.comentario ? (
            <Texto variante="leyenda" tono="suave">
              {a.comentario}
            </Texto>
          ) : null}
        </View>
      ))}
      {children}
    </Tarjeta>
  );
}
