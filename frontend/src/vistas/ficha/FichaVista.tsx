// Ficha de una obra (EP-09): lo común aquí; lo de cada tipo, en su componente.
import type { Ficha } from '@dlbp/shared';
import { View } from 'react-native';
import { Chip, Chips } from '../../componentes/Chip';
import { Cifras } from '../../componentes/Datos';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { Boton } from '../../componentes/Boton';
import { nodoDeObra } from '../../componentes/nodos';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useNavegacion } from '../../hooks/useNavegacion';
import { Estrellas } from '../../componentes/Estrellas';
import { Pantalla } from '../../componentes/Pantalla';
import { Portada } from '../../componentes/Portada';
import { Seccion } from '../../componentes/Seccion';
import { NOMBRE_TIPO } from '../../componentes/TarjetaObra';
import { Texto } from '../../componentes/Texto';
import { useFicha } from '../../hooks/useCatalogo';
import type { PropsDeRaiz } from '../../navegacion/tipos';
import { Adaptaciones } from './Adaptaciones';
import { AdminDeObra } from './AdminDeObra';
import { DetalleLibro } from './DetalleLibro';
import { DetallePelicula } from './DetallePelicula';
import { MiActividad } from './MiActividad';
import { ResenasDeObra } from './ResenasDeObra';

function cifrasDe(ficha: Ficha) {
  const comunes = [
    { valor: ficha.promedio?.toFixed(1) ?? '—', nombre: 'Promedio' },
    { valor: String(ficha.total_resenas), nombre: 'Reseñas' },
  ];
  return ficha.tipo === 'libro'
    ? [...comunes, { valor: String(ficha.anio_publicacion_original), nombre: 'Publicado' }]
    : [
        ...comunes,
        { valor: String(ficha.anio_estreno), nombre: 'Estreno' },
        { valor: `${ficha.duracion_min} min`, nombre: 'Duración' },
      ];
}

export function FichaVista({ route }: PropsDeRaiz<'Ficha'>) {
  const consulta = useFicha(route.params.obraId);
  const navegacion = useNavegacion();
  const { usuario, esAdmin } = useSesion();

  if (consulta.isPending || consulta.error) {
    return (
      <Pantalla>
        {consulta.error ? (
          <EstadoError error={consulta.error} onReintentar={() => void consulta.refetch()} />
        ) : (
          <Cargando />
        )}
      </Pantalla>
    );
  }

  const ficha = consulta.data;
  return (
    <Pantalla>
      <View className="items-center gap-2">
        <Portada titulo={ficha.titulo} url={ficha.portada_url} tamano="grande" />
        <Texto variante="titulo" className="text-center">
          {ficha.titulo}
        </Texto>
        <Chip texto={NOMBRE_TIPO[ficha.tipo]} />
        {ficha.promedio !== null ? <Estrellas valor={ficha.promedio} /> : null}
        {ficha.estado_publicacion === 'borrador' ? <Chip texto="Borrador" /> : null}
      </View>

      <Cifras cifras={cifrasDe(ficha)} />
      <Chips textos={ficha.generos} />

      {/* Un borrador no se reseña ni se marca (D-56). */}
      {ficha.estado_publicacion === 'publicada' ? <MiActividad ficha={ficha} /> : null}
      {usuario && ficha.estado_publicacion === 'publicada' ? (
        <Boton
          titulo="Guardar en una lista"
          variante="secundario"
          icono="list-outline"
          onPress={() => navegacion.navigate('AgregarALista', { obraId: ficha.obra_id })}
        />
      ) : null}
      {ficha.estado_publicacion === 'publicada' ? <Adaptaciones ficha={ficha} /> : null}

      <Seccion titulo="Sinopsis">
        <Texto>{ficha.sinopsis}</Texto>
      </Seccion>

      {ficha.tipo === 'libro' ? <DetalleLibro libro={ficha} /> : <DetallePelicula pelicula={ficha} />}

      {usuario && ficha.estado_publicacion === 'publicada' ? (
        <Boton
          titulo="Explorar conexiones desde aquí"
          variante="secundario"
          icono="git-network-outline"
          onPress={() => navegacion.push('Caminos', { origen: nodoDeObra(ficha) })}
        />
      ) : null}

      {esAdmin ? <AdminDeObra ficha={ficha} /> : null}

      <ResenasDeObra obraId={ficha.obra_id} />
    </Pantalla>
  );
}
