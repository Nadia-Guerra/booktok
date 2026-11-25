// Nombre de algo y si está disponible.
import { View } from 'react-native';
import { Icono } from './Icono';
import { Texto } from './Texto';

export function FilaEstado({ nombre, disponible }: { nombre: string; disponible: boolean }) {
  return (
    <View className="flex-row items-center gap-3">
      <Icono nombre={disponible ? 'checkmark-circle' : 'close-circle'} color={disponible ? 'exito' : 'peligro'} />
      <Texto variante="etiqueta" className="flex-1">
        {nombre}
      </Texto>
      <Texto variante="leyenda" tono={disponible ? 'exito' : 'peligro'}>
        {disponible ? 'disponible' : 'no responde'}
      </Texto>
    </View>
  );
}
