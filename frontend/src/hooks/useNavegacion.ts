// `useNavigation` con las rutas de la app ya puestas (incluye `push`).
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RaizParams } from '../navegacion/tipos';

export const useNavegacion = () => useNavigation<NativeStackNavigationProp<RaizParams>>();
