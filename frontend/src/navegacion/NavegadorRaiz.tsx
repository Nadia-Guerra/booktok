import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { temaNavegacion } from '../core/tema/navegacion';
import { colores, fuentes } from '../core/tema/tokens';
import { ConexionVista } from '../vistas/conexion/ConexionVista';
import { AccesoVista } from '../vistas/cuenta/AccesoVista';
import { FichaVista } from '../vistas/ficha/FichaVista';
import { EditarPerfilVista } from '../vistas/perfil/EditarPerfilVista';
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
        <Stack.Screen name="Acceso" component={AccesoVista} options={{ title: 'Tu cuenta', presentation: 'modal' }} />
        <Stack.Screen name="EditarPerfil" component={EditarPerfilVista} options={{ title: 'Editar perfil' }} />
        <Stack.Screen name="Ficha" component={FichaVista} options={{ title: '' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
