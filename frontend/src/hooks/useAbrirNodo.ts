// Tocar una persona o una obra lleva a su pantalla.
import type { Nodo } from '../componentes/nodos';
import { useNavegacion } from './useNavegacion';

export function useAbrirNodo() {
  const navegacion = useNavegacion();
  return (nodo: Nodo) =>
    nodo.tipo === 'persona'
      ? navegacion.push('Persona', { persona: nodo })
      : navegacion.push('Ficha', { obraId: nodo.id });
}
