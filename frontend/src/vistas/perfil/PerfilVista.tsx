// La cuenta propia: datos (EP-05), salir (EP-04) y eliminarla (EP-07).
import type { PerfilPropio } from '@dlbp/shared';
import { useNavegacion } from '../../hooks/useNavegacion';
import { View } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { Chip } from '../../componentes/Chip';
import { confirmar } from '../../componentes/confirmar';
import { Cargando, EstadoVacio } from '../../componentes/Estados';
import { Pantalla } from '../../componentes/Pantalla';
import { Retrato } from '../../componentes/Retrato';
import { Tarjeta } from '../../componentes/Tarjeta';
import { Texto } from '../../componentes/Texto';
import { mensajeDeError } from '../../core/http/errores';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useEliminarCuenta, useSalir } from '../../hooks/useCuenta';

function MiCuenta({ usuario }: { usuario: PerfilPropio }) {
  const navegacion = useNavegacion();
  const salir = useSalir();
  const eliminar = useEliminarCuenta();

  return (
    <>
      <Tarjeta className="items-center">
        <Retrato nombre={usuario.nombre} tamano="grande" />
        <View className="items-center">
          <Texto variante="titulo">{usuario.nombre}</Texto>
          <Texto tono="suave">{usuario.correo}</Texto>
        </View>
        {usuario.rol === 'admin' ? <Chip texto="Administrador" /> : null}
        {usuario.biografia ? <Texto className="text-center">{usuario.biografia}</Texto> : null}
      </Tarjeta>
      {usuario.rol === 'admin' ? (
        <Boton titulo="Administración" icono="construct-outline" onPress={() => navegacion.navigate('Admin')} />
      ) : null}
      <Boton titulo="Editar perfil" icono="create-outline" onPress={() => navegacion.navigate('EditarPerfil')} />
      <Boton
        titulo="Seguidos y seguidores"
        variante="secundario"
        icono="people-outline"
        onPress={() => navegacion.navigate('MiRed')}
      />
      <Boton
        titulo="Cerrar sesión"
        variante="secundario"
        icono="log-out-outline"
        cargando={salir.isPending}
        onPress={() => confirmar('Cerrar sesión', '¿Quieres salir de tu cuenta?', 'Salir', () => salir.mutate())}
      />
      <Aviso mensaje={eliminar.error ? mensajeDeError(eliminar.error) : undefined} />
      <Boton
        titulo="Eliminar cuenta"
        variante="peligro"
        icono="trash-outline"
        cargando={eliminar.isPending}
        onPress={() =>
          confirmar(
            'Eliminar cuenta',
            'Se borran tus reseñas, comparativas, listas y seguimientos. No se puede deshacer.',
            'Eliminar',
            () => eliminar.mutate(),
          )
        }
      />
    </>
  );
}

export function PerfilVista() {
  const navegacion = useNavegacion();
  const { estado, usuario, reintentar } = useSesion();

  return (
    <Pantalla titulo="Perfil">
      {usuario ? (
        <MiCuenta usuario={usuario} />
      ) : estado === 'cargando' ? (
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
          titulo="Estás como visitante"
          mensaje="Entra para reseñar, comparar, seguir a otros y guardar listas."
          accion={{ titulo: 'Entrar o crear cuenta', onPress: () => navegacion.navigate('Acceso') }}
        />
      )}
      <Boton
        titulo="Conexión con la API"
        variante="texto"
        icono="settings-outline"
        onPress={() => navegacion.navigate('Conexion')}
      />
    </Pantalla>
  );
}
