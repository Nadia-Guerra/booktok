// Una obra en una rejilla o un carrusel: portada, título y año.
import type { ObraBreve } from '@dlbp/shared';
import { Pressable } from 'react-native';
import { clases } from './clases';
import { Portada } from './Portada';
import { Texto } from './Texto';

export const NOMBRE_TIPO = { libro: 'Libro', pelicula: 'Película' } as const;

type Props = {
  obra: ObraBreve;
  onPress: () => void;
  /** Línea extra, por ejemplo por qué aparece. */
  detalle?: string | undefined;
  className?: string;
};

export function TarjetaObra({ obra, onPress, detalle, className }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${NOMBRE_TIPO[obra.tipo]}: ${obra.titulo}, ${obra.anio}`}
      onPress={onPress}
      className={clases('gap-1 active:opacity-70', className)}
    >
      <Portada titulo={obra.titulo} url={obra.portada_url} />
      <Texto variante="etiqueta" numberOfLines={1}>
        {obra.titulo}
      </Texto>
      <Texto variante="leyenda" tono="suave">
        {NOMBRE_TIPO[obra.tipo]} · {obra.anio}
      </Texto>
      {detalle ? (
        <Texto variante="leyenda" tono="primario" numberOfLines={2}>
          {detalle}
        </Texto>
      ) : null}
    </Pressable>
  );
}
