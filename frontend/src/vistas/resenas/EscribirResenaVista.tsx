// Publicar o editar mi reseña de una obra (EP-11). El texto se envía siempre completo.
import { resenaEntrada, type Ficha } from '@dlbp/shared';
import { Aviso } from '../../componentes/Aviso';
import { Boton } from '../../componentes/Boton';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Cargando, EstadoError } from '../../componentes/Estados';
import { Pantalla } from '../../componentes/Pantalla';
import { SelectorEstrellas } from '../../componentes/SelectorEstrellas';
import { Texto } from '../../componentes/Texto';
import { useFicha } from '../../hooks/useCatalogo';
import { useFormulario } from '../../hooks/useFormulario';
import { usePublicarResena } from '../../hooks/useResenas';
import type { PropsDeRaiz } from '../../navegacion/tipos';

function Formulario({ ficha, alTerminar }: { ficha: Ficha; alTerminar: () => void }) {
  const form = useFormulario({
    esquema: resenaEntrada,
    iniciales: { calificacion: ficha.mi_resena?.calificacion ?? 0, texto: ficha.mi_resena?.texto ?? '' },
    enviar: usePublicarResena(ficha.obra_id),
    alTerminar,
  });
  return (
    <>
      <Texto variante="titulo">{ficha.titulo}</Texto>
      <SelectorEstrellas
        etiqueta="Tu calificación"
        valor={form.valores.calificacion}
        onCambiar={(n) => form.fijar('calificacion', n)}
        error={form.errores.calificacion}
      />
      <CampoTexto
        etiqueta="Tu reseña (opcional)"
        multiline
        maxLength={3000}
        textAlignVertical="top"
        className="min-h-40"
        {...form.campo('texto')}
      />
      <Aviso mensaje={form.errorGeneral} />
      <Boton titulo={ficha.mi_resena ? 'Guardar cambios' : 'Publicar'} onPress={form.enviar} cargando={form.enviando} />
    </>
  );
}

export function EscribirResenaVista({ route, navigation }: PropsDeRaiz<'EscribirResena'>) {
  const consulta = useFicha(route.params.obraId);
  return (
    <Pantalla>
      {consulta.data ? (
        <Formulario ficha={consulta.data} alTerminar={() => navigation.goBack()} />
      ) : consulta.error ? (
        <EstadoError error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : (
        <Cargando />
      )}
    </Pantalla>
  );
}
