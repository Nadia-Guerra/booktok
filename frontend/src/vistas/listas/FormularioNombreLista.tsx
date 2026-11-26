// El mismo campo sirve para crear una lista (EP-30) y para renombrarla (EP-32).
import { listaNueva, type ListaNueva } from '@dlbp/shared';
import { View } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { useFormulario } from '../../hooks/useFormulario';

type Props = {
  etiqueta: string;
  accion: string;
  inicial?: string;
  guardar: (datos: ListaNueva) => Promise<unknown>;
  /** Vacía el campo al terminar, para crear la siguiente. */
  vaciar?: boolean;
};

export function FormularioNombreLista({ etiqueta, accion, inicial = '', guardar, vaciar }: Props) {
  const form = useFormulario({
    esquema: listaNueva,
    iniciales: { nombre: inicial },
    enviar: guardar,
    alTerminar: () => {
      if (vaciar) form.fijar('nombre', '');
    },
  });
  return (
    <View className="gap-2">
      <CampoTexto etiqueta={etiqueta} maxLength={100} {...form.campo('nombre')} onSubmitEditing={form.enviar} />
      <Aviso mensaje={form.errores.nombre ? undefined : form.errorGeneral} />
      <Boton
        titulo={accion}
        variante="secundario"
        onPress={form.enviar}
        cargando={form.enviando}
        deshabilitado={!form.valores.nombre.trim()}
      />
    </View>
  );
}
