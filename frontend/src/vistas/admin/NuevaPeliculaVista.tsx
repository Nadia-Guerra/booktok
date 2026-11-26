// Alta de la adaptación de un libro (EP-40). Si el libro estaba en borrador, se publica con ella.
import type { PersonaBreve } from '@dlbp/shared';
import { Alert } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Pantalla } from '../../componentes/Pantalla';
import { Texto } from '../../componentes/Texto';
import { esquemaPelicula, OBRA_VACIA, type ValoresPelicula } from '../../core/formularios';
import { useCrearPelicula } from '../../hooks/useAdministracion';
import { useFicha } from '../../hooks/useCatalogo';
import { useFormulario } from '../../hooks/useFormulario';
import type { PropsDeRaiz } from '../../navegacion/tipos';
import { CamposDeObra } from './CamposDeObra';
import { SelectorPersonas } from './SelectorPersonas';

export function NuevaPeliculaVista({ route, navigation }: PropsDeRaiz<'NuevaPelicula'>) {
  const { libroId } = route.params;
  const libro = useFicha(libroId);
  const iniciales: ValoresPelicula<PersonaBreve> = {
    ...OBRA_VACIA,
    anio_estreno: '',
    duracion_min: '',
    idioma_original: '',
    paises: '',
    productoras: '',
    clasificacion: '',
    plataformas: '',
    libro_id: libroId,
    directores: [],
    actores: [],
    personajes: {},
  };
  const form = useFormulario({
    esquema: esquemaPelicula,
    iniciales,
    enviar: useCrearPelicula(),
    alTerminar: ({ obraId, aviso }) => {
      if (aviso) Alert.alert('Alta incompleta', aviso);
      navigation.replace('Ficha', { obraId });
    },
  });
  const { directores, actores, personajes } = form.valores;

  return (
    <Pantalla>
      <Texto tono="suave">Adaptación de «{libro.data?.titulo ?? '…'}»</Texto>
      <CamposDeObra campo={form.campo} />
      <CampoTexto etiqueta="Año de estreno" keyboardType="number-pad" {...form.campo('anio_estreno')} />
      <CampoTexto etiqueta="Duración en minutos" keyboardType="number-pad" {...form.campo('duracion_min')} />
      <CampoTexto
        etiqueta="Idioma original"
        {...form.campo('idioma_original')}
        error={form.errorDe('datos_tecnicos.idioma_original')}
      />
      <CampoTexto etiqueta="Países (separados por comas)" {...form.campo('paises')} error={form.errorDe('datos_tecnicos.paises')} />
      <CampoTexto
        etiqueta="Productoras (opcional, por comas)"
        {...form.campo('productoras')}
        error={form.errorDe('datos_tecnicos.productoras')}
      />
      <CampoTexto
        etiqueta="Clasificación (opcional)"
        {...form.campo('clasificacion')}
        error={form.errorDe('datos_tecnicos.clasificacion')}
      />
      <CampoTexto etiqueta="Plataformas (opcional, por comas)" {...form.campo('plataformas')} />

      <SelectorPersonas
        etiqueta="Dirección"
        elegidas={directores}
        onCambiar={(p) => form.fijar('directores', p)}
        error={form.errorDe('directores')}
      />
      <SelectorPersonas
        etiqueta="Reparto"
        elegidas={actores}
        onCambiar={(p) => form.fijar('actores', p)}
        error={form.errorDe('reparto')}
        detalle={(p) => (
          <CampoTexto
            etiqueta="Personaje"
            maxLength={150}
            value={personajes[p.persona_id] ?? ''}
            onChangeText={(texto) => form.fijar('personajes', { ...personajes, [p.persona_id]: texto })}
          />
        )}
      />

      <Aviso mensaje={form.errorGeneral} />
      <Boton titulo="Crear película" onPress={form.enviar} cargando={form.enviando} />
    </Pantalla>
  );
}
