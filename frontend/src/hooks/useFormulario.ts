// Estado de un formulario: valida con el mismo esquema que la API y reparte los errores por campo.
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { z } from 'zod';
import { ErrorApi, mensajeDeError } from '../core/http/errores';

type Opciones<V extends Record<string, string>, S> = {
  esquema: z.ZodType<S>;
  iniciales: V;
  enviar: (datos: S) => Promise<unknown>;
  alTerminar?: () => void;
};

export function useFormulario<V extends Record<string, string>, S>({ esquema, iniciales, enviar, alTerminar }: Opciones<V, S>) {
  const [valores, setValores] = useState(iniciales);
  const [locales, setLocales] = useState<Record<string, string>>({});
  const envio = useMutation({ mutationFn: enviar, ...(alTerminar && { onSuccess: () => alTerminar() }) });
  const delServidor = envio.error instanceof ErrorApi ? envio.error.campos : {};
  const errores: Record<string, string | undefined> = { ...delServidor, ...locales };

  return {
    /** Props listas para un `CampoTexto`. */
    campo: (nombre: keyof V & string) => ({
      value: valores[nombre] ?? '',
      error: errores[nombre],
      onChangeText: (texto: string) => {
        setValores((v) => ({ ...v, [nombre]: texto }));
        setLocales(({ [nombre]: _, ...resto }) => resto);
        if (envio.isError) envio.reset();
      },
    }),
    enviando: envio.isPending,
    /** Fallo que no pertenece a un campo concreto. */
    errorGeneral: envio.error && Object.keys(delServidor).length === 0 ? mensajeDeError(envio.error) : undefined,
    enviar: () => {
      const revision = esquema.safeParse(valores);
      if (!revision.success) {
        setLocales(Object.fromEntries(revision.error.issues.map((i) => [String(i.path[0] ?? ''), i.message])));
        return;
      }
      setLocales({});
      envio.mutate(revision.data);
    },
  };
}
