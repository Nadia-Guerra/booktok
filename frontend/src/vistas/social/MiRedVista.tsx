// A quién sigo y quién me sigue (EP-21).
import { useState } from 'react';
import { Cargando, EstadoError, EstadoVacio } from '../../componentes/Estados';
import { Fila } from '../../componentes/Fila';
import { Pantalla } from '../../componentes/Pantalla';
import { Retrato } from '../../componentes/Retrato';
import { Selector } from '../../componentes/Selector';
import { useNavegacion } from '../../hooks/useNavegacion';
import { useMiRed } from '../../hooks/useSocial';

const VISTAS = [
  { valor: 'seguidos', titulo: 'Sigo' },
  { valor: 'seguidores', titulo: 'Me siguen' },
] as const;

export function MiRedVista() {
  const navegacion = useNavegacion();
  const red = useMiRed();
  const [vista, setVista] = useState<(typeof VISTAS)[number]['valor']>('seguidos');

  return (
    <Pantalla>
      <Selector opciones={VISTAS} valor={vista} onCambiar={setVista} />
      {red.error ? (
        <EstadoError error={red.error} onReintentar={() => void red.refetch()} />
      ) : !red.data ? (
        <Cargando />
      ) : red.data[vista].length === 0 ? (
        <EstadoVacio
          icono="people-outline"
          titulo="Nadie todavía"
          mensaje="Para seguir a alguien, toca su nombre en una reseña."
        />
      ) : (
        red.data[vista].map((u) => (
          <Fila
            key={u.usuario_id}
            imagen={<Retrato nombre={u.nombre} />}
            titulo={u.nombre}
            onPress={() => navegacion.navigate('Usuario', { usuarioId: u.usuario_id })}
          />
        ))
      )}
    </Pantalla>
  );
}
