import { driver } from '../../bases/neo4j.ts';

export async function ping(): Promise<void> {
  await driver.verifyConnectivity();
}
