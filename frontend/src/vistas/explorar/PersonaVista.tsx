// Una persona del catálogo: sus obras (EP-08), y si dirige, los autores relacionados (EP-17).
import { View } from 'react-native';
import { Boton } from '../../componentes/Boton';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { Fila } from '../../componentes/Fila';
import { ImagenNodo, nodoDePersona } from '../../componentes/nodos';
import { Pantalla } from '../../componentes/Pantalla';
import { Rejilla } from '../../componentes/Rejilla';
import { Retrato } from '../../componentes/Retrato';
import { Seccion } from '../../componentes/Seccion';
import { TarjetaObra } from '../../componentes/TarjetaObra';
import { Texto } from '../../componentes/Texto';
import { VINCULOS } from '../../componentes/vinculos';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useAbrirNodo } from '../../hooks/useAbrirNodo';
import { useBusqueda } from '../../hooks/useCatalogo';
import { useAutoresRelacionados } from '../../hooks/useDescubrimiento';
import { useNavegacion } from '../../hooks/useNavegacion';
import type { PropsDeRaiz } from '../../navegacion/tipos';

function AutoresRelacionados({ directorId }: { directorId: string }) {
  const abrir = useAbrirNodo();
  const consulta = useAutoresRelacionados(directorId);
  return (
    <Seccion titulo="Autores relacionados">
      {consulta.error ? (
        <EstadoError error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : !consulta.data ? (
        <Cargando />
      ) : consulta.data.autores.length === 0 ? (
        <Texto tono="suave">No hay autores relacionados.</Texto>
      ) : (
        consulta.data.autores.map((autor) => {
          const nodo = nodoDePersona(autor);
          return (
            <Fila
              key={autor.persona_id}
              imagen={<ImagenNodo nodo={nodo} />}
              titulo={autor.nombre}
              detalle={autor.obras.map((o) => `«${o.libro.titulo}» → «${o.pelicula.titulo}»`).join('\n')}
              onPress={() => abrir(nodo)}
            />
          );
        })
      )}
    </Seccion>
  );
}

export function PersonaVista({ route }: PropsDeRaiz<'Persona'>) {
  const { persona } = route.params;
  const navegacion = useNavegacion();
  const { usuario } = useSesion();
  // El catálogo no tiene "ver persona": sus obras salen de buscar por su nombre.
  const busqueda = useBusqueda(persona.nombre, 'persona');
  const obras = busqueda.data?.obras.filter((o) => o.persona?.persona_id === persona.id);
  const dirige = obras?.some((o) => o.vinculo === 'dirigida_por');

  return (
    <Pantalla>
      <View className="items-center gap-2">
        <Retrato nombre={persona.nombre} url={persona.url} tamano="grande" />
        <Texto variante="titulo" className="text-center">
          {persona.nombre}
        </Texto>
      </View>
      <Boton
        titulo="Explorar conexiones desde aquí"
        icono="git-network-outline"
        onPress={() => (usuario ? navegacion.push('Caminos', { origen: persona }) : navegacion.push('Acceso'))}
      />

      <Seccion titulo="Sus obras">
        {busqueda.error ? (
          <EstadoError error={busqueda.error} onReintentar={() => void busqueda.refetch()} />
        ) : !obras ? (
          <Cargando />
        ) : obras.length === 0 ? (
          <Texto tono="suave">Sin obras que mostrar.</Texto>
        ) : (
          <Rejilla>
            {obras.map((o) => (
              <TarjetaObra
                key={`${o.obra_id}-${o.vinculo}`}
                obra={o}
                detalle={o.vinculo ? VINCULOS[o.vinculo] : undefined}
                onPress={() => navegacion.push('Ficha', { obraId: o.obra_id })}
              />
            ))}
          </Rejilla>
        )}
      </Seccion>

      {dirige && usuario ? <AutoresRelacionados directorId={persona.id} /> : null}
    </Pantalla>
  );
}
