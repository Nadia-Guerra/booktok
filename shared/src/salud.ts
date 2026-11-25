import { z } from 'zod';

export const estadoBase = z.enum(['ok', 'caida']);

export const respuestaSalud = z.object({
  estado: z.enum(['ok', 'degradado']),
  api: z.literal('ok'),
  bases: z.object({
    postgres: estadoBase,
    mongo: estadoBase,
    neo4j: estadoBase,
  }),
});

export type EstadoBase = z.infer<typeof estadoBase>;
export type RespuestaSalud = z.infer<typeof respuestaSalud>;
