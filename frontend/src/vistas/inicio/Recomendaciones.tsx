// Recomendaciones (EP-18): el grafo une lo que leen mis seguidos y lo que me gustó.
import type { RespuestaRecomendaciones } from '@dlbp/shared';
import { Boton } from '../../componentes/Boton';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { Seccion } from '../../componentes/Seccion';
import { TarjetaObra } from '../../componentes/TarjetaObra';
import { Texto } from '../../componentes/Texto';
import { useRecomendaciones } from '../../hooks/useDescubrimiento';
import { useNavegacion } from '../../hooks/useNavegacion';

const porSeguidos = ({ libro, seguidos }: RespuestaRecomendaciones['peliculas'][number]) =>
  `${seguidos === 1 ? '1 persona que sigues leyó' : `${seguidos} personas que sigues leyeron`} «${libro.titulo}»`;

const porGusto = ({ motivos: [motivo] }: RespuestaRecomendaciones['libros'][number]) =>
  motivo ? `Te gustó «${motivo.libro_partida.titulo}»; une ${motivo.director.nombre}` : undefined;

export function Recomendaciones() {
  const navegacion = useNavegacion();
  const consulta = useRecomendaciones();
  const abrir = (obraId: string) => navegacion.navigate('Ficha', { obraId });

  if (consulta.error) return <EstadoError error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  if (!consulta.data) return <Cargando />;
  const { peliculas, libros } = consulta.data;

  return (
    <>
      <Seccion titulo="Películas para ti" carrusel={peliculas.length > 0}>
        {peliculas.length === 0 ? (
          <Texto tono="suave">Sigue a otros lectores: aquí saldrán las películas de los libros que lean.</Texto>
        ) : (
          peliculas.map((p) => (
            <TarjetaObra
              key={p.obra.obra_id}
              obra={p.obra}
              detalle={porSeguidos(p)}
              className="w-36"
              onPress={() => abrir(p.obra.obra_id)}
            />
          ))
        )}
      </Seccion>
      <Seccion titulo="Libros para ti" carrusel={libros.length > 0}>
        {libros.length === 0 ? (
          <Texto tono="suave">Califica con 4 o 5 estrellas libros que te gusten para recibir otros.</Texto>
        ) : (
          libros.map((l) => (
            <TarjetaObra
              key={l.obra.obra_id}
              obra={l.obra}
              detalle={porGusto(l)}
              className="w-36"
              onPress={() => abrir(l.obra.obra_id)}
            />
          ))
        )}
      </Seccion>
      <Boton
        titulo="Actualizar recomendaciones"
        variante="texto"
        icono="refresh"
        cargando={consulta.isFetching}
        onPress={() => void consulta.refetch()}
      />
    </>
  );
}
