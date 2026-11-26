// Lo propio en una ficha: estado (EP-14) y mi reseña (EP-11, EP-13).
import type { Ficha } from '@dlbp/shared';
import { View } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { confirmar } from '../../componentes/confirmar';
import { ESTADOS_DE_LECTURA } from '../../componentes/estadosDeLectura';
import { Seccion } from '../../componentes/Seccion';
import { Selector } from '../../componentes/Selector';
import { TarjetaResena } from '../../componentes/TarjetaResena';
import { mensajeDeError } from '../../core/http/errores';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useNavegacion } from '../../hooks/useNavegacion';
import { useEliminarResena, useMarcarEstado } from '../../hooks/useResenas';

export function MiActividad({ ficha }: { ficha: Ficha }) {
  const navegacion = useNavegacion();
  const { usuario } = useSesion();
  const marcar = useMarcarEstado(ficha.obra_id);
  const eliminar = useEliminarResena();
  const resena = ficha.mi_resena;
  const error = marcar.error ?? eliminar.error;
  const escribir = () => navegacion.navigate('EscribirResena', { obraId: ficha.obra_id });

  if (!usuario) {
    return (
      <Boton
        titulo="Entra para reseñar y guardar"
        icono="log-in-outline"
        onPress={() => navegacion.navigate('Acceso')}
      />
    );
  }

  return (
    <Seccion titulo="Mi actividad">
      <Selector
        opciones={ESTADOS_DE_LECTURA}
        valor={marcar.isPending ? marcar.variables : (ficha.mi_estado ?? null)}
        onCambiar={(estado) => marcar.mutate(estado)}
      />
      <Aviso mensaje={error ? mensajeDeError(error) : undefined} />
      {resena ? (
        <TarjetaResena
          encabezado="Tu reseña"
          calificacion={resena.calificacion}
          texto={resena.texto}
          fecha={resena.actualizado_en}
          oculta={resena.oculta}
        >
          <View className="flex-row gap-2">
            <Boton titulo="Editar" variante="secundario" icono="create-outline" onPress={escribir} className="flex-1" />
            <Boton
              titulo="Eliminar"
              variante="peligro"
              icono="trash-outline"
              cargando={eliminar.isPending}
              onPress={() =>
                confirmar('Eliminar reseña', 'El estado de la obra no cambia.', 'Eliminar', () =>
                  eliminar.mutate(resena.resena_id),
                )
              }
              className="flex-1"
            />
          </View>
        </TarjetaResena>
      ) : (
        <Boton titulo="Escribir reseña" icono="star-outline" onPress={escribir} />
      )}
    </Seccion>
  );
}
