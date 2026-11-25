import { useNavigation } from '@react-navigation/native';
import { Cargando, EstadoError, EstadoVacio } from '../../componentes/Estados';
import { Pantalla } from '../../componentes/Pantalla';
import { Texto } from '../../componentes/Texto';
import { useSalud } from '../../hooks/useConexion';

export function InicioVista() {
  const navegacion = useNavigation();
  const salud = useSalud();
  const abrirConexion = () => navegacion.navigate('Conexion');

  return (
    <Pantalla titulo="Del Libro a la Pantalla">
      <Texto tono="suave">Reseña libros, sus películas y compáralos.</Texto>
      {salud.isPending ? (
        <Cargando />
      ) : salud.error ? (
        <>
          <EstadoError error={salud.error} onReintentar={() => void salud.refetch()} />
          <EstadoVacio
            icono="settings-outline"
            titulo="¿Cambió la dirección?"
            accion={{ titulo: 'Configurar conexión', onPress: abrirConexion }}
          />
        </>
      ) : (
        <EstadoVacio icono="search-outline" titulo="Conectado" mensaje="El buscador llega en la siguiente etapa." />
      )}
    </Pantalla>
  );
}
