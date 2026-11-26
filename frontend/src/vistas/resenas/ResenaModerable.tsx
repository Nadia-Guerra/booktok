// Una reseña de una lista, con las acciones del administrador si las tiene.
import type { ResenaEnLista } from '@dlbp/shared';
import { AccionesModeracion } from '../../componentes/AccionesModeracion';
import { Aviso } from '../../componentes/Aviso';
import { TarjetaResena } from '../../componentes/TarjetaResena';
import { mensajeDeError } from '../../core/http/errores';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useEliminarResena, useOcultarResena } from '../../hooks/useResenas';

type Props = { resena: ResenaEnLista; encabezado: string; onPressEncabezado?: (() => void) | undefined };

export function ResenaModerable({ resena, ...encabezado }: Props) {
  const { esAdmin } = useSesion();
  const ocultar = useOcultarResena();
  const eliminar = useEliminarResena();
  const error = ocultar.error ?? eliminar.error;
  return (
    <TarjetaResena
      {...encabezado}
      calificacion={resena.calificacion}
      texto={resena.texto}
      fecha={resena.creado_en}
      oculta={resena.oculta}
    >
      {esAdmin ? (
        <>
          <AccionesModeracion
            oculta={resena.oculta}
            ocupado={ocultar.isPending || eliminar.isPending}
            onAlternar={() => ocultar.mutate({ id: resena.resena_id, oculta: !resena.oculta })}
            onEliminar={() => eliminar.mutate(resena.resena_id)}
          />
          <Aviso mensaje={error ? mensajeDeError(error) : undefined} />
        </>
      ) : null}
    </TarjetaResena>
  );
}
