// EP-06
import { perfilCambios } from '@dlbp/shared';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Pantalla } from '../../componentes/Pantalla';
import { useSesion } from '../../core/sesion/ContextoSesion';
import { useGuardarPerfil } from '../../hooks/useCuenta';
import { useFormulario } from '../../hooks/useFormulario';
import type { PropsDeRaiz } from '../../navegacion/tipos';

export function EditarPerfilVista({ navigation }: PropsDeRaiz<'EditarPerfil'>) {
  const { usuario } = useSesion();
  const form = useFormulario({
    esquema: perfilCambios,
    iniciales: { nombre: usuario?.nombre ?? '', biografia: usuario?.biografia ?? '' },
    enviar: useGuardarPerfil(),
    alTerminar: () => navigation.goBack(),
  });
  return (
    <Pantalla>
      <CampoTexto etiqueta="Nombre" {...form.campo('nombre')} />
      <CampoTexto etiqueta="Biografía" multiline textAlignVertical="top" className="min-h-28" {...form.campo('biografia')} />
      <Aviso mensaje={form.errorGeneral} />
      <Boton titulo="Guardar" onPress={form.enviar} cargando={form.enviando} />
    </Pantalla>
  );
}
