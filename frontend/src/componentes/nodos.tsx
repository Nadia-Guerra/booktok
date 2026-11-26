// Un punto del grafo (persona u obra) tal como lo muestra la app.
import type { ObraBreve, PersonaBreve } from '@dlbp/shared';
import { Portada } from './Portada';
import { Retrato } from './Retrato';
import { NOMBRE_TIPO } from './TarjetaObra';

export type Nodo = { id: string; nombre: string; tipo: 'persona' | 'libro' | 'pelicula'; url: string | null };

export const nodoDePersona = (p: PersonaBreve): Nodo => ({
  id: p.persona_id,
  nombre: p.nombre,
  tipo: 'persona',
  url: p.foto_url,
});

export const nodoDeObra = (o: Pick<ObraBreve, 'obra_id' | 'titulo' | 'tipo' | 'portada_url'>): Nodo => ({
  id: o.obra_id,
  nombre: o.titulo,
  tipo: o.tipo,
  url: o.portada_url,
});

export const nombreDeTipo = (tipo: Nodo['tipo']) => (tipo === 'persona' ? 'Persona' : NOMBRE_TIPO[tipo]);

export function ImagenNodo({ nodo }: { nodo: Nodo }) {
  return nodo.tipo === 'persona' ? (
    <Retrato nombre={nodo.nombre} url={nodo.url} />
  ) : (
    <Portada titulo={nodo.nombre} url={nodo.url} tamano="mini" />
  );
}
