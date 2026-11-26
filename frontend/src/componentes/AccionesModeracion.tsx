// Lo que el administrador puede hacer con una reseña o una comparativa (RF-18).
import { View } from 'react-native';
import { Boton } from './Boton';
import { confirmar } from './confirmar';

type Props = { oculta: boolean; onAlternar: () => void; onEliminar: () => void; ocupado?: boolean };

export function AccionesModeracion({ oculta, onAlternar, onEliminar, ocupado }: Props) {
  return (
    <View className="flex-row gap-2">
      <Boton
        titulo={oculta ? 'Mostrar' : 'Ocultar'}
        variante="secundario"
        icono={oculta ? 'eye-outline' : 'eye-off-outline'}
        deshabilitado={!!ocupado}
        onPress={onAlternar}
        className="flex-1"
      />
      <Boton
        titulo="Eliminar"
        variante="peligro"
        icono="trash-outline"
        deshabilitado={!!ocupado}
        onPress={() => confirmar('Eliminar', 'No se puede deshacer.', 'Eliminar', onEliminar)}
        className="flex-1"
      />
    </View>
  );
}
