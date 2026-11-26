// Elegir en qué lista guardar una obra (EP-34), o crear una.
import { Aviso } from '../../componentes/Aviso';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { Fila } from '../../componentes/Fila';
import { Icono } from '../../componentes/Icono';
import { Pantalla } from '../../componentes/Pantalla';
import { Texto } from '../../componentes/Texto';
import { mensajeDeError } from '../../core/http/errores';
import { useAgregarALista, useCrearLista, useMisListas } from '../../hooks/useListas';
import type { PropsDeRaiz } from '../../navegacion/tipos';
import { FormularioNombreLista } from './FormularioNombreLista';
import { obrasEnLista } from './MisListas';

export function AgregarAListaVista({ route, navigation }: PropsDeRaiz<'AgregarALista'>) {
  const listas = useMisListas();
  const crear = useCrearLista();
  const agregar = useAgregarALista(route.params.obraId);

  return (
    <Pantalla>
      <Aviso mensaje={agregar.error ? mensajeDeError(agregar.error) : undefined} />
      {listas.error ? (
        <EstadoError error={listas.error} onReintentar={() => void listas.refetch()} />
      ) : !listas.data ? (
        <Cargando />
      ) : listas.data.listas.length === 0 ? (
        <Texto tono="suave">Todavía no tienes listas. Crea la primera.</Texto>
      ) : (
        listas.data.listas.map((l) => (
          <Fila
            key={l.lista_id}
            imagen={<Icono nombre="add-circle-outline" tamano={24} color="primario-fuerte" />}
            titulo={l.nombre}
            detalle={obrasEnLista(l.total_obras)}
            onPress={
              agregar.isPending
                ? undefined
                : () => agregar.mutate(l.lista_id, { onSuccess: () => navigation.goBack() })
            }
          />
        ))
      )}
      <FormularioNombreLista etiqueta="Nueva lista" accion="Crear lista" guardar={crear} vaciar />
    </Pantalla>
  );
}
