// Elegir personas del catálogo (EP-36). Se busca antes de registrar una nueva, para no duplicar (D-15).
import { personaNueva, type PersonaBreve } from '@dlbp/shared';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { BotonIcono } from '../../componentes/BotonIcono';
import { CampoTexto } from '../../componentes/CampoTexto';
import { confirmar } from '../../componentes/confirmar';
import { Cargando } from '../../componentes/Estados';
import { Fila } from '../../componentes/Fila';
import { Retrato } from '../../componentes/Retrato';
import { Tarjeta } from '../../componentes/Tarjeta';
import { Texto } from '../../componentes/Texto';
import { mensajeDeError } from '../../core/http/errores';
import { useBuscarPersonas, useCrearPersona } from '../../hooks/useAdministracion';
import { useFormulario } from '../../hooks/useFormulario';

type Props = {
  etiqueta: string;
  elegidas: PersonaBreve[];
  onCambiar: (personas: PersonaBreve[]) => void;
  error?: string | undefined;
  /** Campos propios de cada elegida, como el personaje. */
  detalle?: (persona: PersonaBreve, indice: number) => ReactNode;
};

/** No existe en la búsqueda: se registra. Una persona registrada no se puede borrar. */
function Registrar({ nombre, alCrear }: { nombre: string; alCrear: (p: PersonaBreve) => void }) {
  const form = useFormulario({
    esquema: personaNueva,
    iniciales: { nombre, foto_url: '' },
    enviar: useCrearPersona(),
    alTerminar: alCrear,
  });
  return (
    <Tarjeta>
      <Texto variante="etiqueta">¿No está? Regístrala</Texto>
      <CampoTexto etiqueta="Nombre completo" {...form.campo('nombre')} />
      <CampoTexto etiqueta="Foto (https://, opcional)" autoCapitalize="none" keyboardType="url" {...form.campo('foto_url')} />
      <Aviso mensaje={form.errorGeneral} />
      <Boton
        titulo="Registrar persona"
        variante="secundario"
        cargando={form.enviando}
        onPress={() =>
          confirmar(
            'Registrar persona',
            `«${form.valores.nombre}» quedará en el catálogo y no se puede borrar.`,
            'Registrar',
            form.enviar,
          )
        }
      />
    </Tarjeta>
  );
}

export function SelectorPersonas({ etiqueta, elegidas, onCambiar, error, detalle }: Props) {
  const [texto, setTexto] = useState('');
  const [buscado, setBuscado] = useState('');
  const busqueda = useBuscarPersonas(buscado);

  function elegir(persona: PersonaBreve) {
    if (!elegidas.some((p) => p.persona_id === persona.persona_id)) onCambiar([...elegidas, persona]);
    setTexto('');
    setBuscado('');
  }

  return (
    <View className="gap-2">
      <Texto variante="titulo">{etiqueta}</Texto>
      {elegidas.map((p, i) => (
        <Tarjeta key={p.persona_id}>
          <View className="flex-row items-center gap-3">
            <Retrato nombre={p.nombre} url={p.foto_url} />
            <Texto variante="subtitulo" className="flex-1">
              {p.nombre}
            </Texto>
            <BotonIcono
              icono="close"
              etiqueta={`Quitar a ${p.nombre}`}
              onPress={() => onCambiar(elegidas.filter((x) => x.persona_id !== p.persona_id))}
            />
          </View>
          {detalle?.(p, i)}
        </Tarjeta>
      ))}
      {error ? (
        <Texto variante="leyenda" tono="peligro">
          {error}
        </Texto>
      ) : null}

      <CampoTexto
        etiqueta={`Buscar para ${etiqueta.toLowerCase()}`}
        value={texto}
        onChangeText={setTexto}
        onSubmitEditing={() => setBuscado(texto.trim())}
        returnKeyType="search"
        placeholder="Nombre o apellido"
      />
      <Boton
        titulo="Buscar persona"
        variante="secundario"
        icono="search"
        deshabilitado={!texto.trim()}
        onPress={() => setBuscado(texto.trim())}
      />
      {buscado === '' ? null : busqueda.error ? (
        <Aviso mensaje={mensajeDeError(busqueda.error)} />
      ) : !busqueda.data ? (
        <Cargando />
      ) : (
        <>
          {busqueda.data.personas.map((p) => (
            <Fila
              key={p.persona_id}
              imagen={<Retrato nombre={p.nombre} url={p.foto_url} />}
              titulo={p.nombre}
              onPress={() => elegir(p)}
            />
          ))}
          <Registrar key={buscado} nombre={buscado} alCrear={elegir} />
        </>
      )}
    </View>
  );
}
