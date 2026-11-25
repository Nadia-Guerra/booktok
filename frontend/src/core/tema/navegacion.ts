// El mismo tema, para las barras que dibuja React Navigation.
import { DefaultTheme, type Theme } from '@react-navigation/native';
import { colores, fuentes } from './tokens';

export const temaNavegacion: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colores['primario-fuerte'],
    background: colores.fondo,
    card: colores.superficie,
    text: colores.texto,
    border: colores.borde,
    notification: colores.peligro,
  },
  fonts: {
    regular: { fontFamily: fuentes.regular, fontWeight: 'normal' },
    medium: { fontFamily: fuentes.media, fontWeight: 'normal' },
    bold: { fontFamily: fuentes.semi, fontWeight: 'normal' },
    heavy: { fontFamily: fuentes.negrita, fontWeight: 'normal' },
  },
};
