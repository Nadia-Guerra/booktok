// El token se guarda cifrado en el teléfono (D-35).
import * as SecureStore from 'expo-secure-store';

const CLAVE = 'dlbp.token';

export const leerToken = () => SecureStore.getItemAsync(CLAVE);
export const guardarToken = (token: string) => SecureStore.setItemAsync(CLAVE, token);
export const borrarToken = () => SecureStore.deleteItemAsync(CLAVE);
