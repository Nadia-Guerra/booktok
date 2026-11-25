// Red social (RF-21 y RF-22; D-54).
import type { PerfilDeOtro, RedPropia, RespuestaSeguir } from '@dlbp/shared';
import { ErrorApi } from '../errores.ts';
import * as social from '../repositorios/relacional/social.ts';
import type { SesionActual } from './cuentas.ts';
import { avisarCambios } from './sincronizacion.ts';

const noExisteElUsuario = () => new ErrorApi('no_encontrado', 'El usuario no existe');

export async function seguir(sesion: SesionActual, usuarioId: string): Promise<RespuestaSeguir> {
  if (usuarioId === sesion.usuarioId) {
    throw new ErrorApi('entrada_invalida', 'No puedes seguirte a ti mismo'); // RN-03
  }
  const resultado = await social.seguir(sesion.usuarioId, usuarioId);
  if (resultado === 'ya_lo_sigue') throw new ErrorApi('conflicto', 'Ya sigues a esta persona');
  if (resultado === 'no_existe') throw noExisteElUsuario();
  avisarCambios();
  return { usuario_id: usuarioId };
}

/** No falla si no lo seguía: quien repite la petición obtiene la misma respuesta. */
export async function dejarDeSeguir(sesion: SesionActual, usuarioId: string): Promise<void> {
  if (await social.dejarDeSeguir(sesion.usuarioId, usuarioId)) avisarCambios();
}

/** El perfil básico lo ve cualquiera con sesión; las listas, quien lo sigue (D-54). */
export async function verUsuario(sesion: SesionActual, usuarioId: string): Promise<PerfilDeOtro> {
  const perfil = await social.perfilBasico(usuarioId);
  if (!perfil) throw noExisteElUsuario();
  const loSigo = await social.sigue(sesion.usuarioId, usuarioId);
  const veListas = loSigo || sesion.usuarioId === usuarioId;
  return { ...perfil, lo_sigo: loSigo, ...(veListas && { listas: await social.listasDe(usuarioId) }) };
}

export function miRed(sesion: SesionActual): Promise<RedPropia> {
  return social.red(sesion.usuarioId);
}
