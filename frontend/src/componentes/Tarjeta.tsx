import { View, type ViewProps } from 'react-native';
import { clases } from './clases';

export function Tarjeta({ className, ...resto }: ViewProps) {
  return <View className={clases('gap-3 rounded-3xl border border-borde bg-superficie p-4', className)} {...resto} />;
}
