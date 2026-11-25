// Esquemas Zod y tipos que usan la API y la app (D-37, D-53).
import { z } from 'zod';

// Los mensajes que Zod genera por su cuenta también van en español.
z.config(z.locales.es());

export * from './catalogo.ts';
export * from './cuentas.ts';
export * from './errores.ts';
export * from './salud.ts';
