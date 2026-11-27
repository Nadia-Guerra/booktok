// Imagen remota con reemplazo: si no hay dirección o no carga, se dibuja lo que se le pase.
import { useState, type ReactNode } from 'react';
import { Image, View } from 'react-native';
import { clases } from './clases';

const FONDOS = ['bg-portada-1', 'bg-portada-2', 'bg-portada-3', 'bg-portada-4'];

// Wikimedia rechaza (403) el identificador que Android manda por defecto y pide uno propio.
const CABECERAS = { 'User-Agent': 'app-de-resenas/1.0 (proyecto escolar)' };

/** El mismo texto da siempre el mismo color. */
function fondoPara(texto: string): string {
  let suma = 0;
  for (const letra of texto) suma += letra.charCodeAt(0);
  return FONDOS[suma % FONDOS.length]!;
}

type Props = {
  url: string | null;
  /** Describe la imagen y decide el color del reemplazo. */
  nombre: string;
  className: string;
  reemplazo: ReactNode;
};

export function Imagen({ url, nombre, className, reemplazo }: Props) {
  const [fallo, setFallo] = useState<string | null>(null);
  const visible = url && fallo !== url;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={nombre}
      className={clases('items-center justify-center overflow-hidden', fondoPara(nombre), className)}
    >
      {reemplazo}
      {visible ? (
        <Image
          source={{ uri: url, headers: CABECERAS }}
          onError={() => setFallo(url)}
          className="absolute inset-0 h-full w-full"
        />
      ) : null}
    </View>
  );
}
