// Lo mío: obras con su estado (EP-15), listas (EP-29) y comparativas (EP-23).
import type { EstadoLectura } from '@dlbp/shared';
import { useState } from 'react';
import { EstadoVacio } from '../../componentes/Estados';
import { ESTADOS_DE_LECTURA, NOMBRE_ESTADO } from '../../componentes/estadosDeLectura';
import { ListaPaginada } from '../../componentes/ListaPaginada';
import { Pantalla } from '../../componentes/Pantalla';
import { Rejilla } from '../../componentes/Rejilla';
import { Selector } from '../../componentes/Selector';
import { TarjetaObra } from '../../componentes/TarjetaObra';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useNavegacion } from '../../hooks/useNavegacion';
import { useMisEstados } from '../../hooks/useResenas';
import { ListaDeComparativas } from '../comparativas/ListaDeComparativas';
import { MisListas } from '../listas/MisListas';

const SECCIONES = [
  { valor: 'obras', titulo: 'Obras' },
  { valor: 'listas', titulo: 'Listas' },
  { valor: 'comparativas', titulo: 'Comparativas' },
] as const;

const FILTROS = [{ valor: 'todas', titulo: 'Todas' }, ...ESTADOS_DE_LECTURA] as const;

function Obras({ estado }: { estado: EstadoLectura | undefined }) {
  const navegacion = useNavegacion();
  const obras = useMisEstados(estado);
  return (
    <ListaPaginada
      consulta={obras}
      vacio={
        <EstadoVacio
          icono="bookmarks-outline"
          titulo="Aún no hay nada"
          mensaje="Marca una obra desde su ficha y aparecerá aquí."
        />
      }
    >
      {(lista) => (
        <Rejilla>
          {lista.map((e) => (
            <TarjetaObra
              key={e.obra.obra_id}
              obra={e.obra}
              detalle={NOMBRE_ESTADO[e.estado]}
              onPress={() => navegacion.navigate('Ficha', { obraId: e.obra.obra_id })}
            />
          ))}
        </Rejilla>
      )}
    </ListaPaginada>
  );
}

function MisObras() {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['valor']>('todas');
  return (
    <>
      <Selector opciones={FILTROS} valor={filtro} onCambiar={setFiltro} />
      <Obras estado={filtro === 'todas' ? undefined : filtro} />
    </>
  );
}

export function BibliotecaVista() {
  const navegacion = useNavegacion();
  const { usuario } = useSesion();
  const [seccion, setSeccion] = useState<(typeof SECCIONES)[number]['valor']>('obras');

  return (
    <Pantalla titulo="Mi biblioteca">
      {usuario ? (
        <>
          <Selector opciones={SECCIONES} valor={seccion} onCambiar={setSeccion} />
          {seccion === 'obras' ? (
            <MisObras />
          ) : seccion === 'listas' ? (
            <MisListas />
          ) : (
            <ListaDeComparativas
              filtro={{ usuario_id: usuario.usuario_id }}
              titular="obras"
              vacio="Compara un libro con su película desde su ficha."
            />
          )}
        </>
      ) : (
        <EstadoVacio
          icono="bookmarks-outline"
          titulo="Tu biblioteca"
          mensaje="Entra para guardar lo que lees y ves."
          accion={{ titulo: 'Entrar o crear cuenta', onPress: () => navegacion.navigate('Acceso') }}
        />
      )}
    </Pantalla>
  );
}
