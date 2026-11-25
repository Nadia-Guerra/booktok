// Reseñas comparativas en MongoDB. Por ahora solo la limpieza al eliminar una cuenta.
import { mongoDb } from '../../bases/mongo.ts';

const comparativas = mongoDb.collection<{ usuario_id: string }>('resenas_comparativas');

/** AP-28: borra las comparativas de un usuario. Repetirlo no falla. */
export async function eliminarDeUsuario(usuarioId: string): Promise<void> {
  await comparativas.deleteMany({ usuario_id: usuarioId });
}
