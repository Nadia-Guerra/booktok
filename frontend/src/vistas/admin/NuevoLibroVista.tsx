// Alta de un libro (EP-39). Queda en borrador hasta tener su primera adaptación (D-24).
import type { PersonaBreve } from '@dlbp/shared';
import { Alert } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Pantalla } from '../../componentes/Pantalla';
import { Texto } from '../../componentes/Texto';
import { esquemaLibro, OBRA_VACIA, type ValoresLibro } from '../../core/formularios';
import { useCrearLibro } from '../../hooks/useAdministracion';
import { useFormulario } from '../../hooks/useFormulario';
import type { PropsDeRaiz } from '../../navegacion/tipos';
import { CamposDeObra } from './CamposDeObra';
import { SelectorPersonas } from './SelectorPersonas';

const iniciales: ValoresLibro<PersonaBreve> = { ...OBRA_VACIA, anio_publicacion_original: '', autores: [] };

export function NuevoLibroVista({ navigation }: PropsDeRaiz<'NuevoLibro'>) {
  const form = useFormulario({
    esquema: esquemaLibro,
    iniciales,
    enviar: useCrearLibro(),
    alTerminar: ({ obraId, aviso }) => {
      if (aviso) Alert.alert('Alta incompleta', aviso);
      navigation.replace('Ficha', { obraId });
    },
  });
  return (
    <Pantalla>
      <Texto tono="suave">El libro queda como borrador hasta que registres su primera película.</Texto>
      <CamposDeObra campo={form.campo} />
      <CampoTexto
        etiqueta="Año de publicación original"
        keyboardType="numbers-and-punctuation"
        {...form.campo('anio_publicacion_original')}
      />
      <SelectorPersonas
        etiqueta="Autoría"
        elegidas={form.valores.autores}
        onCambiar={(autores) => form.fijar('autores', autores)}
        error={form.errorDe('autores')}
      />
      <Aviso mensaje={form.errorGeneral} />
      <Boton titulo="Crear libro" onPress={form.enviar} cargando={form.enviando} />
    </Pantalla>
  );
}
