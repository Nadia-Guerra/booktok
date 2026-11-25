// Dirección de la API y estado de las tres bases (EP-01).
import type { RespuestaSalud } from '@dlbp/shared';
import { useEffect, useState } from 'react';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { FilaEstado } from '../../componentes/FilaEstado';
import { Pantalla } from '../../componentes/Pantalla';
import { Tarjeta } from '../../componentes/Tarjeta';
import { Texto } from '../../componentes/Texto';
import { useCambiarUrlApi, useSalud, useUrlApi } from '../../hooks/useConexion';

const BASES: Record<keyof RespuestaSalud['bases'], string> = {
  postgres: 'PostgreSQL',
  mongo: 'MongoDB',
  neo4j: 'Neo4j',
};

export function ConexionVista() {
  const guardada = useUrlApi();
  const cambiar = useCambiarUrlApi();
  const salud = useSalud();
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (guardada.data !== undefined) setUrl(guardada.data);
  }, [guardada.data]);

  return (
    <Pantalla>
      <CampoTexto
        etiqueta="Dirección de la API"
        value={url}
        onChangeText={setUrl}
        placeholder="https://….trycloudflare.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <Boton titulo="Guardar y probar" onPress={() => cambiar.mutate(url)} cargando={salud.isFetching} />

      {salud.isFetching ? (
        <Cargando />
      ) : salud.error ? (
        <EstadoError error={salud.error} onReintentar={() => void salud.refetch()} />
      ) : salud.data ? (
        <Tarjeta>
          <Texto variante="subtitulo">Estado</Texto>
          <FilaEstado nombre="API" disponible />
          {(Object.keys(BASES) as (keyof typeof BASES)[]).map((base) => (
            <FilaEstado key={base} nombre={BASES[base]} disponible={salud.data.bases[base] === 'ok'} />
          ))}
        </Tarjeta>
      ) : null}
    </Pantalla>
  );
}
