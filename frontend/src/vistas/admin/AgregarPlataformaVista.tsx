// Una plataforma más donde ver una película (EP-46).
import { plataformaNueva } from '@dlbp/shared';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Pantalla } from '../../componentes/Pantalla';
import { useAgregarPlataforma } from '../../hooks/useAdministracion';
import { useFormulario } from '../../hooks/useFormulario';
import type { PropsDeRaiz } from '../../navegacion/tipos';

export function AgregarPlataformaVista({ route, navigation }: PropsDeRaiz<'AgregarPlataforma'>) {
  const form = useFormulario({
    esquema: plataformaNueva,
    iniciales: { nombre: '' },
    enviar: useAgregarPlataforma(route.params.obraId),
    alTerminar: () => navigation.goBack(),
  });
  return (
    <Pantalla>
      <CampoTexto etiqueta="Nombre de la plataforma" maxLength={100} {...form.campo('nombre')} />
      <Aviso mensaje={form.errorGeneral} />
      <Boton titulo="Agregar plataforma" onPress={form.enviar} cargando={form.enviando} />
    </Pantalla>
  );
}
