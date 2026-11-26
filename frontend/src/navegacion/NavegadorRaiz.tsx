import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { temaNavegacion } from '../core/tema/navegacion';
import { colores, fuentes } from '../core/tema/tokens';
import { AdminVista } from '../vistas/admin/AdminVista';
import { AgregarEdicionVista } from '../vistas/admin/AgregarEdicionVista';
import { AgregarPlataformaVista } from '../vistas/admin/AgregarPlataformaVista';
import { NuevaPeliculaVista } from '../vistas/admin/NuevaPeliculaVista';
import { NuevoLibroVista } from '../vistas/admin/NuevoLibroVista';
import { ComparativasVista } from '../vistas/comparativas/ComparativasVista';
import { EscribirComparativaVista } from '../vistas/comparativas/EscribirComparativaVista';
import { ConexionVista } from '../vistas/conexion/ConexionVista';
import { AccesoVista } from '../vistas/cuenta/AccesoVista';
import { CaminosVista } from '../vistas/explorar/CaminosVista';
import { PersonaVista } from '../vistas/explorar/PersonaVista';
import { FichaVista } from '../vistas/ficha/FichaVista';
import { AgregarAListaVista } from '../vistas/listas/AgregarAListaVista';
import { ListaVista } from '../vistas/listas/ListaVista';
import { EditarPerfilVista } from '../vistas/perfil/EditarPerfilVista';
import { EscribirResenaVista } from '../vistas/resenas/EscribirResenaVista';
import { MiRedVista } from '../vistas/social/MiRedVista';
import { UsuarioVista } from '../vistas/social/UsuarioVista';
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
        <Stack.Screen
          name="EscribirResena"
          component={EscribirResenaVista}
          options={{ title: 'Tu reseña', presentation: 'modal' }}
        />
        <Stack.Screen name="Usuario" component={UsuarioVista} options={{ title: '' }} />
        <Stack.Screen name="MiRed" component={MiRedVista} options={{ title: 'Mi red' }} />
        <Stack.Screen name="Persona" component={PersonaVista} options={{ title: '' }} />
        <Stack.Screen name="Caminos" component={CaminosVista} options={{ title: 'Conexiones' }} />
        <Stack.Screen name="Comparativas" component={ComparativasVista} options={{ title: 'Libro contra película' }} />
        <Stack.Screen
          name="EscribirComparativa"
          component={EscribirComparativaVista}
          options={{ title: 'Tu comparativa', presentation: 'modal' }}
        />
        <Stack.Screen name="Lista" component={ListaVista} options={{ title: 'Lista' }} />
        <Stack.Screen
          name="AgregarALista"
          component={AgregarAListaVista}
          options={{ title: 'Guardar en lista', presentation: 'modal' }}
        />
        <Stack.Screen name="Admin" component={AdminVista} options={{ title: 'Administración' }} />
        <Stack.Screen name="NuevoLibro" component={NuevoLibroVista} options={{ title: 'Nuevo libro' }} />
        <Stack.Screen name="NuevaPelicula" component={NuevaPeliculaVista} options={{ title: 'Nueva película' }} />
        <Stack.Screen name="AgregarEdicion" component={AgregarEdicionVista} options={{ title: 'Nueva edición' }} />
        <Stack.Screen
          name="AgregarPlataforma"
          component={AgregarPlataformaVista}
          options={{ title: 'Nueva plataforma' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
