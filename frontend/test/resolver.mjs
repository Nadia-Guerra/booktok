// El código de la app importa sin extensión, como espera Metro; Node la necesita.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(especificador, contexto, siguiente) {
    try {
      return siguiente(especificador, contexto);
    } catch (error) {
      if (!especificador.startsWith('.')) throw error;
      return siguiente(`${especificador}.ts`, contexto);
    }
  },
});
