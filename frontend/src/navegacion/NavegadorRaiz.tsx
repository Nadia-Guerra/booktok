import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { temaNavegacion } from '../core/tema/navegacion';
import { colores, fuentes } from '../core/tema/tokens';
import { ConexionVista } from '../vistas/conexion/ConexionVista';
import { Pestanas } from './Pestanas';
import type { RaizParams } from './tipos';

const Stack = createNativeStackNavigator<RaizParams>();

export function NavegadorRaiz() {
  return (
    <NavigationContainer theme={temaNavegacion}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colores.fondo },
          headerTitleStyle: { fontFamily: fuentes.semi },
          headerTintColor: colores.texto,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Pestanas" component={Pestanas} options={{ headerShown: false }} />
        <Stack.Screen name="Conexion" component={ConexionVista} options={{ title: 'Conexión' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
