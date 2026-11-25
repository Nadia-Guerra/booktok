// Arma la aplicación Express sin abrir ningún puerto (así la usan también las pruebas).
import express from 'express';
import type { RequestHandler, Router } from 'express';
import { manejadorDeErrores, rutaNoEncontrada } from './errores.ts';
import { rutasCatalogo } from './rutas/catalogo.ts';
import { rutasCuentas } from './rutas/cuentas.ts';
import { rutasResenas } from './rutas/resenas.ts';
import { rutasSalud } from './rutas/salud.ts';

// Registra método, ruta, estado y duración. Nunca cuerpos, cabeceras ni la cadena de consulta.
const registro: RequestHandler = (req, res, next) => {
  const inicio = Date.now();
  const ruta = req.path;
  res.on('finish', () => console.log(`${req.method} ${ruta} ${res.statusCode} ${Date.now() - inicio} ms`));
  next();
};

export function crearApp(rutas: Router[] = [rutasSalud, rutasCuentas, rutasCatalogo, rutasResenas]) {
  const app = express();
  app.disable('x-powered-by');
  app.use(registro);
  app.use(express.json({ limit: '100kb' }));
  for (const r of rutas) app.use('/api/v1', r);
  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);
  return app;
}
