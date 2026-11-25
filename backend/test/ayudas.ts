// Utilidades comunes de las pruebas por HTTP.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { cuerpoError, respuestaSesion } from '@dlbp/shared';
import { crearApp } from '../src/app.ts';

export async function levantarApi() {
  const servidor: Server = crearApp().listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/api/v1`;

  function pedir(metodo: string, ruta: string, opciones: { cuerpo?: unknown; token?: string } = {}) {
    const headers: Record<string, string> = {};
    if (opciones.cuerpo !== undefined) headers['content-type'] = 'application/json';
    if (opciones.token) headers.authorization = `Bearer ${opciones.token}`;
    const body = opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo);
    return fetch(base + ruta, { method: metodo, headers, body });
  }

  /** Abre una sesión con un usuario de la semilla (`ana`, `admin`…). */
  async function entrarComo(usuario: string): Promise<string> {
    const res = await pedir('POST', '/auth/sesion', {
      cuerpo: { correo: `${usuario}@ejemplo.test`, password: claveSemilla() },
    });
    assert.equal(res.status, 201);
    return respuestaSesion.parse(await res.json()).token;
  }

  const salir = (token: string) => pedir('DELETE', '/auth/sesion', { token });

  return { pedir, entrarComo, salir, cerrar: () => servidor.close() };
}

/** La contraseña de prueba solo vive en el README de la semilla: se lee de ahí y no se copia. */
function claveSemilla(): string {
  const readme = readFileSync(new URL('../../db/semilla/README.md', import.meta.url), 'utf8');
  const clave = readme.split('## Usuarios de prueba')[1]?.match(/```\r?\n(.+?)\r?\n```/)?.[1];
  assert.ok(clave, 'no se encontró la contraseña de prueba en db/semilla/README.md');
  return clave;
}

export async function esperarError(res: Response, estado: number) {
  assert.equal(res.status, estado);
  return cuerpoError.parse(await res.json()).error;
}
