// Una edición más de un libro (EP-43): el documento crece sin cambiar el esquema.
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Pantalla } from '../../componentes/Pantalla';
import { esquemaEdicion, type ValoresEdicion } from '../../core/formularios';
import { useAgregarEdicion } from '../../hooks/useAdministracion';
import { useFormulario } from '../../hooks/useFormulario';
import type { PropsDeRaiz } from '../../navegacion/tipos';

const iniciales: ValoresEdicion = { isbn: '', paginas: '', editorial: '', idioma: '', anio: '' };

export function AgregarEdicionVista({ route, navigation }: PropsDeRaiz<'AgregarEdicion'>) {
  const form = useFormulario({
    esquema: esquemaEdicion,
    iniciales,
    enviar: useAgregarEdicion(route.params.obraId),
    alTerminar: () => navigation.goBack(),
  });
  return (
    <Pantalla>
      <CampoTexto etiqueta="Editorial" {...form.campo('editorial')} />
      <CampoTexto etiqueta="Idioma" {...form.campo('idioma')} />
      <CampoTexto etiqueta="Año" keyboardType="number-pad" {...form.campo('anio')} />
      <CampoTexto etiqueta="Páginas" keyboardType="number-pad" {...form.campo('paginas')} />
      <CampoTexto etiqueta="ISBN (opcional, 13 dígitos)" keyboardType="number-pad" {...form.campo('isbn')} />
      <Aviso mensaje={form.errorGeneral} />
      <Boton titulo="Agregar edición" onPress={form.enviar} cargando={form.enviando} />
    </Pantalla>
  );
}
