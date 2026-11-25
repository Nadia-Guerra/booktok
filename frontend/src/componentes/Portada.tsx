// Portada de una obra, con proporción de libro. Sin imagen, muestra el título.
import { Text } from 'react-native';
import { Imagen } from './Imagen';

const TAMANOS = {
  mini: { caja: 'w-14 rounded-lg', letra: 'text-[8px] leading-3', lineas: 3 },
  media: { caja: 'w-full rounded-2xl', letra: 'text-base leading-6', lineas: 4 },
  grande: { caja: 'w-44 rounded-2xl', letra: 'text-xl leading-7', lineas: 5 },
} as const;

type Props = { titulo: string; url: string | null; tamano?: keyof typeof TAMANOS };

export function Portada({ titulo, url, tamano = 'media' }: Props) {
  const { caja, letra, lineas } = TAMANOS[tamano];
  return (
    <Imagen
      url={url}
      nombre={titulo}
      className={`aspect-[2/3] ${caja}`}
      reemplazo={
        <Text numberOfLines={lineas} className={`px-1 text-center font-semi text-superficie ${letra}`}>
          {titulo}
        </Text>
      }
    />
  );
}
