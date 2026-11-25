// Raíz: fuentes, caché de datos, sesión y navegación.
import './global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { clienteConsultas } from './src/core/consultas';
import { ProveedorSesion } from './src/core/sesion/ContextoSesion';
import { useFuentes } from './src/core/tema/fuentes';
import { NavegadorRaiz } from './src/navegacion/NavegadorRaiz';

export default function App() {
  if (!useFuentes()) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={clienteConsultas}>
        <ProveedorSesion>
          <NavegadorRaiz />
          <StatusBar style="dark" />
        </ProveedorSesion>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
