// La parte de la ficha propia de un libro: autores, adaptaciones y ediciones.
import type { FichaLibro } from '@dlbp/shared';
import { useNavegacion } from '../../hooks/useNavegacion';
import { FilaDato } from '../../componentes/Datos';
import { nodoDePersona } from '../../componentes/nodos';
import { useAbrirNodo } from '../../hooks/useAbrirNodo';
import { PersonaMini } from '../../componentes/PersonaMini';
import { Seccion } from '../../componentes/Seccion';
import { Tarjeta } from '../../componentes/Tarjeta';
import { TarjetaObra } from '../../componentes/TarjetaObra';
import { Texto } from '../../componentes/Texto';

export function DetalleLibro({ libro }: { libro: FichaLibro }) {
  const navegacion = useNavegacion();
  const abrir = useAbrirNodo();
  return (
    <>
      <Seccion titulo="Autoría" carrusel>
        {libro.autores.map((p) => (
          <PersonaMini key={p.persona_id} nombre={p.nombre} url={p.foto_url} onPress={() => abrir(nodoDePersona(p))} />
        ))}
      </Seccion>

      {libro.adaptaciones.length > 0 ? (
        <Seccion titulo="Llevado a la pantalla" carrusel>
          {libro.adaptaciones.map((obra) => (
            <TarjetaObra
              key={obra.obra_id}
              obra={obra}
              className="w-32"
              onPress={() => navegacion.push('Ficha', { obraId: obra.obra_id })}
            />
          ))}
        </Seccion>
      ) : null}

      <Seccion titulo="Ediciones">
        {libro.ediciones.length === 0 ? <Texto tono="suave">Sin ediciones registradas.</Texto> : null}
        {libro.ediciones.map((e) => (
          <Tarjeta key={e.edicion_id}>
            <Texto variante="subtitulo">
              {e.editorial} · {e.anio}
            </Texto>
            <FilaDato nombre="Idioma" valor={e.idioma} />
            <FilaDato nombre="Páginas" valor={String(e.paginas)} />
            {e.isbn ? <FilaDato nombre="ISBN" valor={e.isbn} /> : null}
          </Tarjeta>
        ))}
      </Seccion>
    </>
  );
}
