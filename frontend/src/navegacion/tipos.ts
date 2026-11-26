// Rutas de la app y sus parámetros.
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Nodo } from '../componentes/nodos';

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
  EscribirResena: { obraId: string };
  Usuario: { usuarioId: string };
  MiRed: undefined;
  Persona: { persona: Nodo };
  Caminos: { origen?: Nodo } | undefined;
  Comparativas: { libroId: string; peliculaId: string };
  EscribirComparativa: { libroId: string; peliculaId: string };
  Lista: { listaId: string };
  AgregarALista: { obraId: string };
  Admin: undefined;
  NuevoLibro: undefined;
  NuevaPelicula: { libroId: string };
  AgregarEdicion: { obraId: string };
  AgregarPlataforma: { obraId: string };
};

export type PropsDeRaiz<R extends keyof RaizParams> = NativeStackScreenProps<RaizParams, R>;

// Así `useNavigation()` conoce las rutas sin repetir los tipos en cada vista.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RaizParams {}
  }
}
