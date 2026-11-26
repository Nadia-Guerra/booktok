// Crear o editar mi comparativa (EP-25, EP-26): veredicto y de 1 a 10 aspectos.
import type { Comparativa } from '@dlbp/shared';
import { View } from 'react-native';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { Pantalla } from '../../componentes/Pantalla';
import { PREFERENCIAS } from '../../componentes/preferencias';
import { Selector } from '../../componentes/Selector';
import { SelectorEstrellas } from '../../componentes/SelectorEstrellas';
import { Tarjeta } from '../../componentes/Tarjeta';
import { Texto } from '../../componentes/Texto';
import { esquemaComparativa, type Aspecto, type ValoresComparativa } from '../../core/formularios';
import { useGuardarComparativa, useMiComparativa, type Pareja } from '../../hooks/useComparativas';
import { useFormulario } from '../../hooks/useFormulario';
import type { PropsDeRaiz } from '../../navegacion/tipos';

const MAXIMO_ASPECTOS = 10;
const SUGERIDOS = ['Historia', 'Personajes', 'Ambientación'];

const aspectoVacio = (nombre = ''): Aspecto => ({ nombre, puntuacion: 0, comentario: '' });

const iniciales = (c: Comparativa | null): ValoresComparativa => ({
  veredicto: { preferencia: c?.veredicto.preferencia ?? null, comentario: c?.veredicto.comentario ?? '' },
  aspectos: c
    ? c.aspectos.map((a) => ({ nombre: a.nombre, puntuacion: a.puntuacion ?? 0, comentario: a.comentario ?? '' }))
    : [aspectoVacio(SUGERIDOS[0])],
});

type Props = { pareja: Pareja; actual: Comparativa | null; alTerminar: () => void };

function Formulario({ pareja, actual, alTerminar }: Props) {
  const form = useFormulario({
    esquema: esquemaComparativa,
    iniciales: iniciales(actual),
    enviar: useGuardarComparativa(pareja, actual?.comparativa_id),
    alTerminar,
  });
  const { veredicto, aspectos } = form.valores;
  const cambiarAspecto = (i: number, cambios: Partial<Aspecto>) =>
    form.fijar('aspectos', aspectos.map((a, j) => (j === i ? { ...a, ...cambios } : a)));

  return (
    <>
      <View className="gap-1">
        <Texto variante="etiqueta">¿Cuál te gustó más?</Texto>
        <Selector
          opciones={PREFERENCIAS}
          valor={veredicto.preferencia}
          onCambiar={(preferencia) => form.fijar('veredicto', { ...veredicto, preferencia })}
        />
        {form.errores['veredicto.preferencia'] ? (
          <Texto variante="leyenda" tono="peligro">
            Elige una opción
          </Texto>
        ) : null}
      </View>
      <CampoTexto
        etiqueta="Tu veredicto (opcional)"
        multiline
        maxLength={2000}
        textAlignVertical="top"
        className="min-h-24"
        value={veredicto.comentario}
        onChangeText={(comentario) => form.fijar('veredicto', { ...veredicto, comentario })}
        error={form.errores['veredicto.comentario']}
      />

      <Texto variante="titulo">Aspectos</Texto>
      {aspectos.map((a, i) => (
        <Tarjeta key={i}>
          <CampoTexto
            etiqueta="Aspecto"
            maxLength={60}
            placeholder={SUGERIDOS[i] ?? 'Final, ritmo, diálogos…'}
            value={a.nombre}
            onChangeText={(nombre) => cambiarAspecto(i, { nombre })}
            error={form.errores[`aspectos.${i}.nombre`]}
          />
          <SelectorEstrellas
            etiqueta="Puntuación (opcional)"
            valor={a.puntuacion}
            // Tocar la misma estrella otra vez quita la puntuación.
            onCambiar={(n) => cambiarAspecto(i, { puntuacion: n === a.puntuacion ? 0 : n })}
          />
          <CampoTexto
            etiqueta="Comentario (opcional)"
            multiline
            maxLength={1000}
            value={a.comentario}
            onChangeText={(comentario) => cambiarAspecto(i, { comentario })}
            error={form.errores[`aspectos.${i}.comentario`]}
          />
          {aspectos.length > 1 ? (
            <Boton
              titulo="Quitar aspecto"
              variante="texto"
              icono="close"
              onPress={() => form.fijar('aspectos', aspectos.filter((_, j) => j !== i))}
            />
          ) : null}
        </Tarjeta>
      ))}
      {aspectos.length < MAXIMO_ASPECTOS ? (
        <Boton
          titulo="Agregar aspecto"
          variante="secundario"
          icono="add"
          onPress={() => form.fijar('aspectos', [...aspectos, aspectoVacio()])}
        />
      ) : null}

      <Aviso mensaje={form.errorGeneral} />
      <Boton titulo={actual ? 'Guardar cambios' : 'Publicar'} onPress={form.enviar} cargando={form.enviando} />
    </>
  );
}

export function EscribirComparativaVista({ route, navigation }: PropsDeRaiz<'EscribirComparativa'>) {
  const mia = useMiComparativa(route.params);
  return (
    <Pantalla>
      {mia.data !== undefined ? (
        <Formulario pareja={route.params} actual={mia.data} alTerminar={() => navigation.goBack()} />
      ) : mia.error ? (
        <EstadoError error={mia.error} onReintentar={() => void mia.refetch()} />
      ) : (
        <Cargando />
      )}
    </Pantalla>
  );
}
