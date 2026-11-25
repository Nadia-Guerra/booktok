// Cargando, vacío y error: los tres estados que repite cualquier lista o ficha.
import { ActivityIndicator, View } from 'react-native';
import { mensajeDeError } from '../core/http/errores';
import { colores } from '../core/tema/tokens';
import { Boton } from './Boton';
import { Icono, type NombreIcono } from './Icono';
import { Texto } from './Texto';

export function Cargando() {
  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size="large" color={colores['primario-fuerte']} accessibilityLabel="Cargando" />
    </View>
  );
}

type VacioProps = {
  icono: NombreIcono;
  titulo: string;
  mensaje?: string;
  accion?: { titulo: string; onPress: () => void };
};

export function EstadoVacio({ icono, titulo, mensaje, accion }: VacioProps) {
  return (
    <View className="items-center gap-2 px-4 py-8">
      <View className="rounded-full bg-suave p-4">
        <Icono nombre={icono} tamano={28} color="primario-fuerte" />
      </View>
      <Texto variante="subtitulo" className="text-center">
        {titulo}
      </Texto>
      {mensaje ? (
        <Texto tono="suave" className="text-center">
          {mensaje}
        </Texto>
      ) : null}
      {accion ? <Boton titulo={accion.titulo} onPress={accion.onPress} className="mt-2" /> : null}
    </View>
  );
}

export function EstadoError({ error, onReintentar }: { error: unknown; onReintentar: () => void }) {
  return (
    <EstadoVacio
      icono="cloud-offline-outline"
      titulo="No se pudo cargar"
      mensaje={mensajeDeError(error)}
      accion={{ titulo: 'Reintentar', onPress: onReintentar }}
    />
  );
}
