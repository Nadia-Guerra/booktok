// Foto redonda de una persona o cuenta. Sin imagen, sus iniciales.
import { Text } from 'react-native';
import { Imagen } from './Imagen';

const TAMANOS = { medio: ['h-14 w-14', 'text-base'], grande: ['h-24 w-24', 'text-3xl'] } as const;

export function Retrato({ nombre, url = null, tamano = 'medio' }: { nombre: string; url?: string | null; tamano?: keyof typeof TAMANOS }) {
  const [caja, letra] = TAMANOS[tamano];
  const iniciales = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
  return (
    <Imagen
      url={url}
      nombre={nombre}
      className={`rounded-full ${caja}`}
      reemplazo={<Text className={`font-semi text-superficie ${letra}`}>{iniciales}</Text>}
    />
  );
}
