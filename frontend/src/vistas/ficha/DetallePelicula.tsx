// La parte de la ficha propia de una película: libro, dirección, reparto y datos.
import type { FichaPelicula } from '@dlbp/shared';
import { useNavegacion } from '../../hooks/useNavegacion';
import { Pressable, View } from 'react-native';
import { Chips } from '../../componentes/Chip';
import { FilaDato } from '../../componentes/Datos';
import { Icono } from '../../componentes/Icono';
import { PersonaMini } from '../../componentes/PersonaMini';
import { Portada } from '../../componentes/Portada';
import { Seccion } from '../../componentes/Seccion';
import { Tarjeta } from '../../componentes/Tarjeta';
import { Texto } from '../../componentes/Texto';

export function DetallePelicula({ pelicula }: { pelicula: FichaPelicula }) {
  const navegacion = useNavegacion();
  const { libro_origen: libro, datos_tecnicos: datos } = pelicula;
  return (
    <>
      {libro ? (
        <Seccion titulo="Basada en el libro">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver el libro ${libro.titulo}`}
            onPress={() => navegacion.push('Ficha', { obraId: libro.obra_id })}
            className="active:opacity-70"
          >
            <Tarjeta className="flex-row items-center">
              <Portada titulo={libro.titulo} url={libro.portada_url} tamano="mini" />
              <View className="flex-1">
                <Texto variante="subtitulo">{libro.titulo}</Texto>
                <Texto variante="leyenda" tono="suave">
                  {libro.anio}
                </Texto>
              </View>
              <Icono nombre="chevron-forward" color="texto-suave" />
            </Tarjeta>
          </Pressable>
        </Seccion>
      ) : null}

      <Seccion titulo="Dirección" carrusel>
        {pelicula.directores.map((p) => (
          <PersonaMini key={p.persona_id} nombre={p.nombre} url={p.foto_url} />
        ))}
      </Seccion>

      <Seccion titulo="Reparto" carrusel>
        {pelicula.reparto.map((a) => (
          <PersonaMini key={a.persona_id} nombre={a.nombre} url={a.foto_url} detalle={a.personaje} />
        ))}
      </Seccion>

      <Seccion titulo="Dónde verla">
        {pelicula.plataformas.length > 0 ? (
          <Chips textos={pelicula.plataformas.map((p) => p.nombre)} />
        ) : (
          <Texto tono="suave">Sin plataformas registradas.</Texto>
        )}
      </Seccion>

      <Seccion titulo="Datos técnicos">
        <Tarjeta>
          <FilaDato nombre="Idioma" valor={datos.idioma_original} />
          <FilaDato nombre="Países" valor={datos.paises.join(', ')} />
          {datos.productoras.length > 0 ? <FilaDato nombre="Productoras" valor={datos.productoras.join(', ')} /> : null}
          {datos.clasificacion ? <FilaDato nombre="Clasificación" valor={datos.clasificacion} /> : null}
        </Tarjeta>
      </Seccion>
    </>
  );
}
