// Todo el texto de la app pasa por aquí: tamaños y pesos se cambian en un solo sitio.
import { Text, type TextProps } from 'react-native';
import { clases } from './clases';

const VARIANTES = {
  portada: 'font-negrita text-3xl leading-10',
  titulo: 'font-semi text-xl',
  subtitulo: 'font-semi text-base',
  cuerpo: 'font-regular text-sm leading-6',
  etiqueta: 'font-media text-sm',
  leyenda: 'font-regular text-xs',
} as const;

const TONOS = {
  normal: 'text-texto',
  suave: 'text-texto-suave',
  primario: 'text-primario-fuerte',
  'sobre-primario': 'text-sobre-primario',
  peligro: 'text-peligro',
  exito: 'text-exito',
} as const;

export type TextoProps = TextProps & {
  variante?: keyof typeof VARIANTES;
  tono?: keyof typeof TONOS;
};

export function Texto({ variante = 'cuerpo', tono = 'normal', className, ...resto }: TextoProps) {
  return <Text className={clases(VARIANTES[variante], TONOS[tono], className)} {...resto} />;
}
