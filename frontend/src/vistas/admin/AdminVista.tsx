// Punto de partida del administrador. El resto se hace desde cada ficha.
import { personaNueva } from '@dlbp/shared';
import { Alert } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { confirmar } from '../../componentes/confirmar';
import { Pantalla } from '../../componentes/Pantalla';
import { Seccion } from '../../componentes/Seccion';
import { Texto } from '../../componentes/Texto';
import { useCrearPersona } from '../../hooks/useAdministracion';
import { useFormulario } from '../../hooks/useFormulario';
import type { PropsDeRaiz } from '../../navegacion/tipos';

function NuevaPersona() {
  const form = useFormulario({
    esquema: personaNueva,
    iniciales: { nombre: '', foto_url: '' },
    enviar: useCrearPersona(),
    alTerminar: (persona) => {
      Alert.alert('Persona registrada', persona.nombre);
      form.fijar('nombre', '');
      form.fijar('foto_url', '');
    },
  });
  return (
    <Seccion titulo="Registrar persona">
      <CampoTexto etiqueta="Nombre completo" {...form.campo('nombre')} />
      <CampoTexto etiqueta="Foto (https://, opcional)" autoCapitalize="none" keyboardType="url" {...form.campo('foto_url')} />
      <Aviso mensaje={form.errorGeneral} />
      <Boton
        titulo="Registrar"
        variante="secundario"
        cargando={form.enviando}
        deshabilitado={!form.valores.nombre.trim()}
        onPress={() =>
          confirmar(
            'Registrar persona',
            'Una persona registrada no se puede borrar. Comprueba antes que no exista.',
            'Registrar',
            form.enviar,
          )
        }
      />
    </Seccion>
  );
}

export function AdminVista({ navigation }: PropsDeRaiz<'Admin'>) {
  return (
    <Pantalla>
      <Seccion titulo="Catálogo">
        <Boton titulo="Nuevo libro" icono="book-outline" onPress={() => navigation.navigate('NuevoLibro')} />
        <Texto tono="suave">
          Una película se registra desde la ficha de su libro. Ahí mismo se agregan ediciones y plataformas, y se completa
          un borrador.
        </Texto>
      </Seccion>
      <NuevaPersona />
      <Seccion titulo="Moderación">
        <Texto tono="suave">
          En cada reseña y comparativa tienes los botones para ocultar, mostrar o eliminar.
        </Texto>
      </Seccion>
    </Pantalla>
  );
}
