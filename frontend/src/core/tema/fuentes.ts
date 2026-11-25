// La familia tipográfica de la app (Poppins). Para cambiarla, solo se edita este archivo.
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { useFonts } from 'expo-font';
import { fuentes } from './tokens';

export function useFuentes(): boolean {
  const [cargadas, error] = useFonts({
    [fuentes.regular]: Poppins_400Regular,
    [fuentes.media]: Poppins_500Medium,
    [fuentes.semi]: Poppins_600SemiBold,
    [fuentes.negrita]: Poppins_700Bold,
  });
  // Si la fuente falla, la app abre igual con la del sistema.
  return cargadas || error !== null;
}
