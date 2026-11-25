// Iconos con los colores del tema.
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { colores, type Color } from '../core/tema/tokens';

export type NombreIcono = ComponentProps<typeof Ionicons>['name'];

export function Icono({ nombre, tamano = 20, color = 'texto' }: { nombre: NombreIcono; tamano?: number; color?: Color }) {
  return <Ionicons name={nombre} size={tamano} color={colores[color]} />;
}
