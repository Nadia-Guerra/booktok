// Cuentas y sesión (RF-01 a RF-03; D-35, D-61).
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type {
  PerfilCambios,
  PerfilPropio,
  RegistroEntrada,
  RespuestaRegistro,
  RespuestaSesion,
  RolUsuario,
  SesionEntrada,
} from '@dlbp/shared';
import bcrypt from 'bcrypt';
import { ErrorApi } from '../errores.ts';
import * as cuentas from '../repositorios/relacional/cuentas.ts';
import { avisarCambios } from './sincronizacion.ts';

const COSTO_BCRYPT = 10; // D-61

// Se compara contra este hash cuando el correo no existe, para que ambos fallos tarden lo mismo.
const HASH_SEÑUELO = bcrypt.hashSync(randomBytes(32).toString('hex'), COSTO_BCRYPT);

export interface SesionActual {
  usuarioId: string;
  rol: RolUsuario;
  tokenHash: string;
}

const sha256 = (token: string) => createHash('sha256').update(token).digest('hex');

export async function registrar(datos: RegistroEntrada): Promise<RespuestaRegistro> {
  const usuarioId = randomUUID(); // D-11: lo genera la API, en minúsculas
  const resultado = await cuentas.crearUsuario({
    usuarioId,
    correo: datos.correo,
    nombre: datos.nombre,
    passwordHash: await bcrypt.hash(datos.password, COSTO_BCRYPT),
  });
  if (resultado === 'correo_en_uso') throw new ErrorApi('conflicto', 'Ese correo ya está registrado');
  avisarCambios();
  return { usuario_id: usuarioId };
}

export async function iniciarSesion(datos: SesionEntrada): Promise<RespuestaSesion> {
  const usuario = await cuentas.buscarPorCorreo(datos.correo);
  const coincide = await bcrypt.compare(datos.password, usuario?.password_hash ?? HASH_SEÑUELO);
  if (!usuario || !coincide) throw new ErrorApi('sin_sesion', 'Correo o contraseña incorrectos');

  const token = randomBytes(32).toString('base64url'); // solo sale de aquí una vez
  const expira = await cuentas.crearSesion(sha256(token), usuario.usuario_id);
  const { password_hash: _, ...perfil } = usuario;
  return { token, expira_en: expira.toISOString(), usuario: perfil };
}

/** Devuelve la sesión vigente de un token, o `undefined`. */
export async function validarSesion(token: string): Promise<SesionActual | undefined> {
  const tokenHash = sha256(token);
  const fila = await cuentas.buscarSesion(tokenHash);
  return fila && { usuarioId: fila.usuario_id, rol: fila.rol, tokenHash };
}

export function cerrarSesion(sesion: SesionActual): Promise<void> {
  return cuentas.borrarSesion(sesion.tokenHash);
}

export async function verPerfil(usuarioId: string): Promise<PerfilPropio> {
  const perfil = await cuentas.buscarPerfil(usuarioId);
  if (!perfil) throw new ErrorApi('no_encontrado', 'La cuenta ya no existe');
  return perfil;
}

export async function editarPerfil(usuarioId: string, cambios: PerfilCambios): Promise<PerfilPropio> {
  const perfil = await cuentas.actualizarPerfil(usuarioId, cambios);
  if (!perfil) throw new ErrorApi('no_encontrado', 'La cuenta ya no existe');
  return perfil;
}

/** RF-04. Las comparativas y el nodo del grafo los limpia después el worker. */
export async function eliminarCuenta(sesion: SesionActual): Promise<void> {
  // El administrador no se borra desde la app: se crea por script y sin él nadie podría moderar.
  if (sesion.rol === 'admin') throw new ErrorApi('sin_permiso', 'La cuenta de administrador no se elimina desde la app');
  if (!(await cuentas.eliminarCuenta(sesion.usuarioId))) throw new ErrorApi('no_encontrado', 'La cuenta ya no existe');
  avisarCambios();
}
