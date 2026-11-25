import { mongoDb } from '../../bases/mongo.ts';

export async function ping(): Promise<void> {
  await mongoDb.command({ ping: 1 });
}
