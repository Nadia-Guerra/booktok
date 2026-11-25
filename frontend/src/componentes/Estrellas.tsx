// Calificación de 1 a 5 en solo lectura.
import { View } from 'react-native';
import { Icono } from './Icono';

export function Estrellas({ valor, tamano = 16 }: { valor: number; tamano?: number }) {
  return (
    <View accessible accessibilityLabel={`${valor} de 5 estrellas`} className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icono
          key={n}
          nombre={valor >= n ? 'star' : valor >= n - 0.5 ? 'star-half' : 'star-outline'}
          tamano={tamano}
          color="estrella"
        />
      ))}
    </View>
  );
}
