const FECHA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatearFecha = (iso: string) => FECHA.format(new Date(iso));
