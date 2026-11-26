// Elegir un extremo de un camino: se busca a la vez entre personas y obras.
import { useState } from 'react';
import { View } from 'react-native';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { Fila } from '../../componentes/Fila';
import { ImagenNodo, nodoDeObra, nodoDePersona, nombreDeTipo, type Nodo } from '../../componentes/nodos';
import { Texto } from '../../componentes/Texto';
import { useBusqueda } from '../../hooks/useCatalogo';

type Props = { etiqueta: string; valor: Nodo | null; onElegir: (nodo: Nodo | null) => void };

export function ElegirNodo({ etiqueta, valor, onElegir }: Props) {
  const [texto, setTexto] = useState('');
  const [buscado, setBuscado] = useState('');
  const porPersona = useBusqueda(buscado, 'persona');
  const porTitulo = useBusqueda(buscado, 'titulo');

  if (valor) {
    return (
      <View className="gap-1">
        <Texto variante="etiqueta">{etiqueta}</Texto>
        <Fila imagen={<ImagenNodo nodo={valor} />} titulo={valor.nombre} detalle={nombreDeTipo(valor.tipo)} />
        <Boton titulo="Cambiar" variante="texto" onPress={() => onElegir(null)} />
      </View>
    );
  }

  // Una persona sale una vez por cada obra: se deja una sola.
  const personas = new Map(
    porPersona.data?.obras.flatMap((o) => (o.persona ? [[o.persona.persona_id, nodoDePersona(o.persona)]] : [])),
  );
  const nodos = [...personas.values(), ...(porTitulo.data?.obras.map(nodoDeObra) ?? [])];
  const error = porPersona.error ?? porTitulo.error;

  return (
    <View className="gap-2">
      <CampoTexto
        etiqueta={etiqueta}
        value={texto}
        onChangeText={setTexto}
        onSubmitEditing={() => setBuscado(texto.trim())}
        returnKeyType="search"
        placeholder="Persona o título (palabra completa)"
      />
      <Boton
        titulo="Buscar"
        variante="secundario"
        icono="search"
        deshabilitado={!texto.trim()}
        onPress={() => setBuscado(texto.trim())}
      />
      {buscado === '' ? null : error ? (
        <EstadoError
          error={error}
          onReintentar={() => {
            void porPersona.refetch();
            void porTitulo.refetch();
          }}
        />
      ) : porPersona.isPending || porTitulo.isPending ? (
        <Cargando />
      ) : nodos.length === 0 ? (
        <Texto tono="suave">Sin resultados.</Texto>
      ) : (
        nodos.map((nodo) => (
          <Fila
            key={nodo.id}
            imagen={<ImagenNodo nodo={nodo} />}
            titulo={nodo.nombre}
            detalle={nombreDeTipo(nodo.tipo)}
            onPress={() => onElegir(nodo)}
          />
        ))
      )}
    </View>
  );
}
