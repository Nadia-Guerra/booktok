// Una comparativa de la lista, con las acciones del administrador si las tiene.
import type { Comparativa } from '@dlbp/shared';
import { AccionesModeracion } from '../../componentes/AccionesModeracion';
import { Aviso } from '../../componentes/Aviso';
import { TarjetaComparativa } from '../../componentes/TarjetaComparativa';
import { mensajeDeError } from '../../core/http/errores';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useEliminarComparativa, useOcultarComparativa } from '../../hooks/useComparativas';

type Props = { comparativa: Comparativa; encabezado: string; onPressEncabezado?: (() => void) | undefined };

export function ComparativaModerable({ comparativa, ...encabezado }: Props) {
  const { esAdmin } = useSesion();
  const ocultar = useOcultarComparativa();
  const eliminar = useEliminarComparativa();
  const error = ocultar.error ?? eliminar.error;
  return (
    <TarjetaComparativa comparativa={comparativa} {...encabezado}>
      {esAdmin ? (
        <>
          <AccionesModeracion
            oculta={comparativa.oculta}
            ocupado={ocultar.isPending || eliminar.isPending}
            onAlternar={() => ocultar.mutate({ id: comparativa.comparativa_id, oculta: !comparativa.oculta })}
            onEliminar={() => eliminar.mutate(comparativa.comparativa_id)}
          />
          <Aviso mensaje={error ? mensajeDeError(error) : undefined} />
        </>
      ) : null}
    </TarjetaComparativa>
  );
}
