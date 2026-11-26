// Los estados de un listado largo (cargando, error, vacío) y el botón para pedir más.
import type { ReactNode } from 'react';
import type { Paginado } from '../hooks/usePaginado';
import { Aviso } from './Aviso';
import { Boton } from './Boton';
import { Cargando, EstadoError } from './Estados';
import { mensajeDeError } from '../core/http/errores';

type Props<T> = {
  consulta: Paginado<T>;
  vacio: ReactNode;
  children: (elementos: T[]) => ReactNode;
};

export function ListaPaginada<T>({ consulta, vacio, children }: Props<T>) {
  const { elementos, error, reintentar, hayMas, cargandoMas, verMas } = consulta;
  if (!elementos) return error ? <EstadoError error={error} onReintentar={reintentar} /> : <Cargando />;
  if (elementos.length === 0 && !hayMas) return vacio;
  return (
    <>
      {children(elementos)}
      <Aviso mensaje={error ? mensajeDeError(error) : undefined} />
      {hayMas ? <Boton titulo="Ver más" variante="secundario" onPress={verMas} cargando={cargandoMas} /> : null}
    </>
  );
}
