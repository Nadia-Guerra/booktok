// Buscar obras por título o por persona (EP-08). Es lo primero que ve un visitante.
import type { ResultadoBusqueda } from '@dlbp/shared';
import { useNavegacion } from '../../hooks/useNavegacion';
import { useState } from 'react';
import type { BuscarPor } from '../../api/catalogo';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Cargando, EstadoError, EstadoVacio } from '../../componentes/Estados';
import { Pantalla } from '../../componentes/Pantalla';
import { Rejilla } from '../../componentes/Rejilla';
import { Selector } from '../../componentes/Selector';
import { TarjetaObra } from '../../componentes/TarjetaObra';
import { Texto } from '../../componentes/Texto';
import { VINCULOS } from '../../componentes/vinculos';
import { ErrorApi } from '../../core/http/errores';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useBusqueda } from '../../hooks/useCatalogo';
import { Recomendaciones } from './Recomendaciones';

const FILTROS = [
  { valor: 'titulo', titulo: 'Por título' },
  { valor: 'persona', titulo: 'Por persona' },
] as const;

const motivo = ({ persona, vinculo }: ResultadoBusqueda) =>
  persona && vinculo ? `${VINCULOS[vinculo]}: ${persona.nombre}` : undefined;

export function InicioVista() {
  const navegacion = useNavegacion();
  const { usuario } = useSesion();
  const [texto, setTexto] = useState('');
  const [buscado, setBuscado] = useState('');
  const [por, setPor] = useState<BuscarPor>('titulo');
  const busqueda = useBusqueda(buscado, por);
  const sinConfigurar = busqueda.error instanceof ErrorApi && busqueda.error.codigo === 'sin_configurar';

  return (
    <Pantalla titulo="Del Libro a la Pantalla">
      <Texto tono="suave">Reseña libros, sus películas y compáralos.</Texto>
      <CampoTexto
        etiqueta="Buscar"
        value={texto}
        onChangeText={(nuevo) => {
          setTexto(nuevo);
          // Al borrar el texto vuelve la portada.
          if (!nuevo.trim()) setBuscado('');
        }}
        onSubmitEditing={() => setBuscado(texto.trim())}
        returnKeyType="search"
        placeholder={por === 'titulo' ? 'Una palabra del título' : 'Nombre o apellido'}
      />
      <Selector opciones={FILTROS} valor={por} onCambiar={setPor} />
      <Boton titulo="Buscar" icono="search" onPress={() => setBuscado(texto.trim())} deshabilitado={!texto.trim()} />

      {buscado === '' ? (
        usuario ? (
          <>
            <Boton
              titulo="Explorar conexiones"
              variante="secundario"
              icono="git-network-outline"
              onPress={() => navegacion.navigate('Caminos')}
            />
            <Recomendaciones />
          </>
        ) : (
          <EstadoVacio
            icono="film-outline"
            titulo="Encuentra un libro o su película"
            mensaje="La búsqueda usa palabras completas."
          />
        )
      ) : busqueda.isPending ? (
        <Cargando />
      ) : sinConfigurar ? (
        <EstadoVacio
          icono="settings-outline"
          titulo="Falta la dirección de la API"
          accion={{ titulo: 'Configurar conexión', onPress: () => navegacion.navigate('Conexion') }}
        />
      ) : busqueda.error ? (
        <EstadoError error={busqueda.error} onReintentar={() => void busqueda.refetch()} />
      ) : busqueda.data.obras.length === 0 ? (
        <EstadoVacio icono="search-outline" titulo="Sin resultados" mensaje={`No hay nada para «${buscado}».`} />
      ) : (
        <Rejilla>
          {busqueda.data.obras.map((obra) => (
            <TarjetaObra
              key={`${obra.obra_id}-${obra.persona?.persona_id}-${obra.vinculo}`}
              obra={obra}
              detalle={motivo(obra)}
              onPress={() => navegacion.navigate('Ficha', { obraId: obra.obra_id })}
            />
          ))}
        </Rejilla>
      )}
    </Pantalla>
  );
}
