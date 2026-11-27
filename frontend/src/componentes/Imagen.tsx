// Imagen remota con reemplazo: si no hay dirección o no carga, se dibuja lo que se le pase.
import { useEffect, useState, type ReactNode } from 'react';
import { Image, View } from 'react-native';
import { clases } from './clases';

const FONDOS = ['bg-portada-1', 'bg-portada-2', 'bg-portada-3', 'bg-portada-4'];

// Wikimedia rechaza (403) el identificador que Android manda por defecto y pide uno propio.
const CABECERAS = { 'User-Agent': 'app-de-resenas/1.0 (proyecto escolar)' };

// Wikimedia además limita las peticiones seguidas (429): se reintenta cada vez más tarde, con una
// parte al azar para que las imágenes de una pantalla no vuelvan a pedirse todas a la vez.
const ESPERAS_MS = [2000, 5000, 12000, 30000];

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
  const [estado, setEstado] = useState({ url, intento: 0, fallo: false });
  // Si cambia la dirección, lo ocurrido con la anterior no cuenta.
  const { intento, fallo } = estado.url === url ? estado : { intento: 0, fallo: false };

  useEffect(() => {
    const espera = ESPERAS_MS[intento];
    if (!fallo || espera === undefined) return;
    const reloj = setTimeout(() => setEstado({ url, intento: intento + 1, fallo: false }), espera * (1 + Math.random()));
    return () => clearTimeout(reloj);
  }, [url, intento, fallo]);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={nombre}
      className={clases('items-center justify-center overflow-hidden', fondoPara(nombre), className)}
    >
      {reemplazo}
      {url && !fallo ? (
        <Image
          key={`${url}#${intento}`}
          source={{ uri: url, headers: CABECERAS }}
          onError={() => setEstado({ url, intento, fallo: true })}
          className="absolute inset-0 h-full w-full"
        />
      ) : null}
    </View>
  );
}
