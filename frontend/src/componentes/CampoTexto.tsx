import { TextInput, View, type TextInputProps } from 'react-native';
import { colores } from '../core/tema/tokens';
import { clases } from './clases';
import { Texto } from './Texto';

type Props = TextInputProps & { etiqueta: string; error?: string | undefined };

export function CampoTexto({ etiqueta, error, className, ...resto }: Props) {
  return (
    <View className="gap-1">
      <Texto variante="etiqueta">{etiqueta}</Texto>
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor={colores['texto-suave']}
        className={clases(
          'min-h-12 rounded-2xl border bg-superficie px-4 py-2 font-regular text-sm text-texto',
          error ? 'border-peligro' : 'border-borde',
          className,
        )}
        {...resto}
      />
      {error ? (
        <Texto variante="leyenda" tono="peligro">
          {error}
        </Texto>
      ) : null}
    </View>
  );
}
