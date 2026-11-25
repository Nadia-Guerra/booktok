// Pregunta antes de hacer algo que no se puede deshacer fácilmente.
import { Alert } from 'react-native';

export function confirmar(titulo: string, mensaje: string, accion: string, alAceptar: () => void): void {
  Alert.alert(titulo, mensaje, [
    { text: 'Cancelar', style: 'cancel' },
    { text: accion, style: 'destructive', onPress: alAceptar },
  ]);
}
