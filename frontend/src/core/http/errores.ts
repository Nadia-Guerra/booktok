// Un solo tipo de error para toda la app, con mensajes que se pueden mostrar tal cual.
import type { CodigoError } from '@dlbp/shared';

export type CodigoApp = CodigoError | 'sin_configurar' | 'sin_conexion' | 'respuesta_invalida';

export class ErrorApi extends Error {
  readonly codigo: CodigoApp;
  /** Estado HTTP; 0 si no hubo respuesta. */
  readonly estado: number;
  readonly campos: Record<string, string>;
  /** Solo en un alta que quedó a medias (D-58). */
  readonly obraId: string | undefined;

  constructor(
    codigo: CodigoApp,
    mensaje: string,
    detalle: { estado?: number; campos?: Record<string, string>; obraId?: string } = {},
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.codigo = codigo;
    this.estado = detalle.estado ?? 0;
    this.campos = detalle.campos ?? {};
    this.obraId = detalle.obraId;
  }

  /** Tiene sentido reintentar: la red o una base fallaron. */
  get recuperable(): boolean {
    return this.codigo === 'sin_conexion' || this.codigo === 'base_no_disponible';
  }
}

export function mensajeDeError(error: unknown): string {
  return error instanceof ErrorApi ? error.message : 'Algo salió mal. Inténtalo de nuevo.';
}
