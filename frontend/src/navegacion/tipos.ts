// Rutas de la app y sus parámetros.
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type PestanasParams = {
  Inicio: undefined;
  Biblioteca: undefined;
  Perfil: undefined;
};

export type RaizParams = {
  Pestanas: NavigatorScreenParams<PestanasParams> | undefined;
  Conexion: undefined;
  Acceso: undefined;
  EditarPerfil: undefined;
  Ficha: { obraId: string };
};

export type PropsDeRaiz<R extends keyof RaizParams> = NativeStackScreenProps<RaizParams, R>;

// Así `useNavigation()` conoce las rutas sin repetir los tipos en cada vista.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RaizParams {}
  }
}
