const { colores, fuentes } = require('./src/core/tema/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Se reemplaza la paleta de Tailwind: solo existen los colores de la app.
    colors: { transparent: 'transparent', ...colores },
    fontFamily: Object.fromEntries(Object.entries(fuentes).map(([peso, nombre]) => [peso, [nombre]])),
  },
  plugins: [],
};
