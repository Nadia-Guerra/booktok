import { EstadoVacio } from '../../componentes/Estados';
import { Pantalla } from '../../componentes/Pantalla';

export function BibliotecaVista() {
  return (
    <Pantalla titulo="Mi biblioteca">
      <EstadoVacio icono="bookmarks-outline" titulo="Aún no hay nada" mensaje="Tus obras y listas aparecerán aquí." />
    </Pantalla>
  );
}
