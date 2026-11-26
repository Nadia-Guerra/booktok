// Estado de un formulario: valida con el mismo esquema que la API y reparte los errores por campo.
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { z } from 'zod';
import { ErrorApi, mensajeDeError } from '../core/http/errores';

type Opciones<V extends Record<string, unknown>, S, R> = {
  esquema: z.ZodType<S>;
  iniciales: V;
  enviar: (datos: S) => Promise<R>;
  alTerminar?: (resultado: R) => void;
};

export function useFormulario<V extends Record<string, unknown>, S, R>({
  esquema,
  iniciales,
  enviar,
  alTerminar,
}: Opciones<V, S, R>) {
  const [valores, setValores] = useState(iniciales);
  const [locales, setLocales] = useState<Record<string, string>>({});
  const envio = useMutation({ mutationFn: enviar, ...(alTerminar && { onSuccess: (resultado: R) => alTerminar(resultado) }) });
  const delServidor = envio.error instanceof ErrorApi ? envio.error.campos : {};
  const errores: Record<string, string | undefined> = { ...delServidor, ...locales };

  /** El error de un campo o de algo que cuelga de él (`generos.0`, `aspectos.1.nombre`). */
  const errorDe = (nombre: string) =>
    errores[nombre] ?? Object.entries(errores).find(([clave]) => clave.startsWith(`${nombre}.`))?.[1];

  /** Cambia un valor y olvida los errores que tenía. */
  function fijar<N extends keyof V & string>(nombre: N, valor: V[N]) {
    setValores((v) => ({ ...v, [nombre]: valor }));
    setLocales((actuales) =>
      Object.fromEntries(
        Object.entries(actuales).filter(([clave]) => clave !== nombre && !clave.startsWith(`${nombre}.`)),
      ),
    );
    if (envio.isError) envio.reset();
  }

  return {
    valores,
    errores,
    errorDe,
    fijar,
    /** Props listas para un `CampoTexto`. */
    campo: (nombre: keyof V & string) => ({
      value: String(valores[nombre] ?? ''),
      error: errorDe(nombre),
      onChangeText: (texto: string) => fijar(nombre, texto as V[typeof nombre]),
    }),
    enviando: envio.isPending,
    /** El fallo del envío, por si la vista necesita su detalle. */
    fallo: envio.error,
    /** Lo que no se puede señalar en un campo concreto. */
    errorGeneral:
      envio.error && Object.keys(delServidor).length === 0
        ? mensajeDeError(envio.error)
        : Object.keys(errores).length > 0
          ? 'Revisa los datos marcados.'
          : undefined,
    enviar: () => {
      const revision = esquema.safeParse(valores);
      if (!revision.success) {
        setLocales(Object.fromEntries(revision.error.issues.map((i) => [i.path.join('.'), i.message])));
        return;
      }
      setLocales({});
      envio.mutate(revision.data);
    },
  };
}
