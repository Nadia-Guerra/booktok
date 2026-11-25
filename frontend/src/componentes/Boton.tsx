import { ActivityIndicator, Pressable } from 'react-native';
import { colores } from '../core/tema/tokens';
import { clases } from './clases';
import { Icono, type NombreIcono } from './Icono';
import { Texto, type TextoProps } from './Texto';

const VARIANTES = {
  primario: { caja: 'bg-primario', tono: 'sobre-primario', color: 'sobre-primario' },
  secundario: { caja: 'border border-borde bg-superficie', tono: 'normal', color: 'texto' },
  texto: { caja: '', tono: 'primario', color: 'primario-fuerte' },
  peligro: { caja: 'border border-peligro bg-superficie', tono: 'peligro', color: 'peligro' },
} as const satisfies Record<string, { caja: string; tono: TextoProps['tono']; color: keyof typeof colores }>;

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: keyof typeof VARIANTES;
  icono?: NombreIcono;
  cargando?: boolean;
  deshabilitado?: boolean;
  className?: string;
};

export function Boton({ titulo, onPress, variante = 'primario', icono, cargando, deshabilitado, className }: Props) {
  const estilo = VARIANTES[variante];
  const inactivo = cargando || deshabilitado;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      disabled={inactivo}
      onPress={onPress}
      className={clases(
        'min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5 active:opacity-70',
        estilo.caja,
        inactivo && 'opacity-60',
        className,
      )}
    >
      {cargando ? (
        <ActivityIndicator color={colores[estilo.color]} />
      ) : (
        icono && <Icono nombre={icono} color={estilo.color} />
      )}
      <Texto variante="etiqueta" tono={estilo.tono}>
        {titulo}
      </Texto>
    </Pressable>
  );
}
