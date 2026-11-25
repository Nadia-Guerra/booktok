/** Une clases de Tailwind y descarta las vacías. */
export const clases = (...partes: (string | false | null | undefined)[]) => partes.filter(Boolean).join(' ');
