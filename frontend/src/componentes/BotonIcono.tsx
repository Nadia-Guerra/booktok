// Acción pequeña representada solo por un icono.
import { Pressable } from 'react-native';
import type { Color } from '../core/tema/tokens';
import { clases } from './clases';
import { Icono, type NombreIcono } from './Icono';

type Props = {
  icono: NombreIcono;
  /** Lo que lee el lector de pantalla. */
  etiqueta: string;
  onPress: () => void;
  color?: Color;
  deshabilitado?: boolean;
};

export function BotonIcono({ icono, etiqueta, onPress, color = 'texto', deshabilitado }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !!deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      className={clases('h-11 w-11 items-center justify-center rounded-full active:bg-suave', deshabilitado && 'opacity-30')}
    >
      <Icono nombre={icono} color={color} />
    </Pressable>
  );
}
