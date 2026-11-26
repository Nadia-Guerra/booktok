// Lo que comparten el alta de un libro y la de una película.
import { CampoTexto } from '../../componentes/CampoTexto';
import type { ValoresObra } from '../../core/formularios';

type Campo = { value: string; error: string | undefined; onChangeText: (texto: string) => void };
type Nombre = keyof ValoresObra;

export function CamposDeObra({ campo }: { campo: (nombre: Nombre) => Campo }) {
  return (
    <>
      <CampoTexto etiqueta="Título" maxLength={200} {...campo('titulo')} />
      <CampoTexto
        etiqueta="Sinopsis"
        multiline
        maxLength={3000}
        textAlignVertical="top"
        className="min-h-28"
        {...campo('sinopsis')}
      />
      <CampoTexto etiqueta="Géneros (separados por comas)" autoCapitalize="none" {...campo('generos')} />
      <CampoTexto etiqueta="Portada (https://, opcional)" autoCapitalize="none" keyboardType="url" {...campo('portada_url')} />
    </>
  );
}
