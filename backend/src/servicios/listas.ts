// Listas (RF-19, RF-20 y RF-22; RN-04, RN-10; D-54, D-56).
import { randomUUID } from 'node:crypto';
import type { DetalleLista, ListaCambios, MisListas, RespuestaListaCreada } from '@dlbp/shared';
import { ErrorApi } from '../errores.ts';
import * as documental from '../repositorios/documental/obras.ts';
import * as relacional from '../repositorios/relacional/listas.ts';
import * as social from '../repositorios/relacional/social.ts';
import type { SesionActual } from './cuentas.ts';

// Una lista ajena responde igual que una que no existe al intentar cambiarla (RN-10).
const noExiste = () => new ErrorApi('no_encontrado', 'La lista no existe');

export async function mias(sesion: SesionActual): Promise<MisListas> {
  return { listas: await relacional.propias(sesion.usuarioId) };
}

export async function crear(sesion: SesionActual, nombre: string): Promise<RespuestaListaCreada> {
  const listaId = randomUUID();
  await relacional.crear(listaId, sesion.usuarioId, nombre);
  return { lista_id: listaId };
}

/** La ve su dueño y quien lo sigue (D-54). */
export async function ver(sesion: SesionActual, listaId: string): Promise<DetalleLista> {
  const lista = await relacional.buscar(listaId);
  if (!lista) throw noExiste();
  if (lista.usuario_id !== sesion.usuarioId && !(await social.sigue(sesion.usuarioId, lista.usuario_id))) {
    throw new ErrorApi('sin_permiso', 'Sigue a esta persona para ver sus listas');
  }
  const obras = await documental.obrasBreves(await relacional.obrasDe(listaId), sesion.rol === 'admin');
  return {
    lista_id: listaId,
    nombre: lista.nombre,
    propietario: { usuario_id: lista.usuario_id, nombre: lista.propietario },
    obras,
  };
}

export async function cambiar(sesion: SesionActual, listaId: string, cambios: ListaCambios): Promise<DetalleLista> {
  const resultado = await relacional.cambiar(listaId, sesion.usuarioId, {
    nombre: cambios.nombre,
    obraIds: cambios.obra_ids,
  });
  if (resultado === 'no_existe') throw noExiste();
  if (resultado === 'orden_incompleto') {
    throw new ErrorApi('entrada_invalida', 'Revisa los datos enviados', {
      obra_ids: 'Debe traer exactamente las obras de la lista, sin repetir',
    });
  }
  return ver(sesion, listaId);
}

export async function eliminar(sesion: SesionActual, listaId: string): Promise<void> {
  if (!(await relacional.eliminar(listaId, sesion.usuarioId))) throw noExiste();
}

export async function agregar(sesion: SesionActual, listaId: string, obraId: string) {
  // Un borrador no se agrega a una lista, tampoco por el administrador (D-56).
  if (!(await documental.estaPublicada(obraId))) throw new ErrorApi('no_encontrado', 'La obra no existe');
  const resultado = await relacional.agregar(listaId, sesion.usuarioId, obraId);
  if (resultado === 'no_existe') throw noExiste();
  if (resultado === 'ya_esta') throw new ErrorApi('conflicto', 'Esa obra ya está en la lista');
  return { lista_id: listaId, obra_id: obraId };
}

export async function quitar(sesion: SesionActual, listaId: string, obraId: string): Promise<void> {
  if (!(await relacional.quitar(listaId, sesion.usuarioId, obraId))) throw noExiste();
}
