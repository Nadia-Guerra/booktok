import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icono, type NombreIcono } from '../componentes/Icono';
import { colores, fuentes } from '../core/tema/tokens';
import { BibliotecaVista } from '../vistas/biblioteca/BibliotecaVista';
import { InicioVista } from '../vistas/inicio/InicioVista';
import { PerfilVista } from '../vistas/perfil/PerfilVista';
import type { PestanasParams } from './tipos';

const Tab = createBottomTabNavigator<PestanasParams>();

const ICONOS: Record<keyof PestanasParams, [activo: NombreIcono, inactivo: NombreIcono]> = {
  Inicio: ['home', 'home-outline'],
  Biblioteca: ['bookmarks', 'bookmarks-outline'],
  Perfil: ['person', 'person-outline'],
};

export function Pestanas() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colores['primario-fuerte'],
        tabBarInactiveTintColor: colores['texto-suave'],
        tabBarLabelStyle: { fontFamily: fuentes.media },
        tabBarIcon: ({ focused }) => (
          <Icono
            nombre={ICONOS[route.name][focused ? 0 : 1]}
            color={focused ? 'primario-fuerte' : 'texto-suave'}
            tamano={22}
          />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={InicioVista} />
      <Tab.Screen name="Biblioteca" component={BibliotecaVista} />
      <Tab.Screen name="Perfil" component={PerfilVista} />
    </Tab.Navigator>
  );
}
