// Acciones del administrador sobre una obra (EP-40, 41, 43 y 46).
import type { Ficha } from '@dlbp/shared';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { Seccion } from '../../componentes/Seccion';
import { Texto } from '../../componentes/Texto';
import { mensajeDeError } from '../../core/http/errores';
import { usePublicarObra } from '../../hooks/useAdministracion';
import { useNavegacion } from '../../hooks/useNavegacion';

export function AdminDeObra({ ficha }: { ficha: Ficha }) {
  const navegacion = useNavegacion();
  const publicar = usePublicarObra();
  const obraId = ficha.obra_id;

  return (
    <Seccion titulo="Administrar">
      {ficha.estado_publicacion === 'borrador' ? (
        <>
          <Texto tono="suave">Es un borrador: solo lo ve el administrador.</Texto>
          <Boton
            titulo="Completar publicación"
            icono="cloud-upload-outline"
            cargando={publicar.isPending}
            onPress={() => publicar.mutate(obraId)}
          />
          <Aviso mensaje={publicar.error ? mensajeDeError(publicar.error) : undefined} />
        </>
      ) : null}
      {ficha.tipo === 'libro' ? (
        <>
          <Boton
            titulo="Agregar edición"
            variante="secundario"
            icono="add"
            onPress={() => navegacion.navigate('AgregarEdicion', { obraId })}
          />
          <Boton
            titulo="Registrar adaptación"
            variante="secundario"
            icono="film-outline"
            onPress={() => navegacion.navigate('NuevaPelicula', { libroId: obraId })}
          />
        </>
      ) : (
        <Boton
          titulo="Agregar plataforma"
          variante="secundario"
          icono="add"
          onPress={() => navegacion.navigate('AgregarPlataforma', { obraId })}
        />
      )}
    </Seccion>
  );
}
