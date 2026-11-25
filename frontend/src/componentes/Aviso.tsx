// Mensaje de error dentro de una vista o un formulario. Sin mensaje no ocupa nada.
import { View } from 'react-native';
import { Icono } from './Icono';
import { Texto } from './Texto';

export function Aviso({ mensaje }: { mensaje: string | undefined }) {
  if (!mensaje) return null;
  return (
    <View accessibilityRole="alert" className="flex-row items-center gap-2 rounded-2xl border border-peligro bg-superficie p-3">
      <Icono nombre="alert-circle-outline" color="peligro" />
      <Texto tono="peligro" className="flex-1">
        {mensaje}
      </Texto>
    </View>
  );
}
