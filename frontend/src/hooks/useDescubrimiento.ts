// Recomendaciones, caminos y autores relacionados (Neo4j a través de la API).
import { useQuery } from '@tanstack/react-query';
import { verAutoresRelacionados, verCaminos, verRecomendaciones } from '../api/descubrimiento';
import { claves } from '../core/claves';

export function useRecomendaciones() {
  // El grafo se pone al día un instante después de cada acción (D-04): no se da nada por fresco.
  return useQuery({ queryKey: [claves.recomendaciones], queryFn: verRecomendaciones, staleTime: 0 });
}

/** No pregunta hasta tener dos extremos distintos (D-49). */
export function useCaminos(origen: string | undefined, destino: string | undefined) {
  return useQuery({
    queryKey: [claves.caminos, origen, destino],
    queryFn: () => verCaminos(origen!, destino!),
    enabled: !!origen && !!destino && origen !== destino,
  });
}

export function useAutoresRelacionados(directorId: string) {
  return useQuery({ queryKey: [claves.autores, directorId], queryFn: () => verAutoresRelacionados(directorId) });
}
