import { useNavigation } from '@react-navigation/native';
import { Boton } from '../../componentes/Boton';
import { Cargando, EstadoVacio } from '../../componentes/Estados';
import { Pantalla } from '../../componentes/Pantalla';
import { useSesion } from '../../core/sesion/ContextoSesion';

export function PerfilVista() {
  const navegacion = useNavigation();
  const { estado, usuario, reintentar } = useSesion();

  return (
    <Pantalla titulo="Perfil">
      {estado === 'cargando' ? (
        <Cargando />
      ) : estado === 'sin_verificar' ? (
        <EstadoVacio
          icono="cloud-offline-outline"
          titulo="No se pudo comprobar tu sesión"
          accion={{ titulo: 'Reintentar', onPress: reintentar }}
        />
      ) : (
        <EstadoVacio
          icono="person-outline"
          titulo={usuario?.nombre ?? 'Estás como visitante'}
          mensaje={usuario?.correo ?? 'El registro y el inicio de sesión llegan en la siguiente etapa.'}
        />
      )}
      <Boton
        titulo="Conexión con la API"
        variante="secundario"
        icono="settings-outline"
        onPress={() => navegacion.navigate('Conexion')}
      />
    </Pantalla>
  );
}
