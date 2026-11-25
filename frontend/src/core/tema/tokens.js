// Colores y fuentes globales: este es el único lugar donde se cambian.
// Es JavaScript porque también lo lee tailwind.config.js. Los tipos están en tokens.d.ts.

const colores = {
  fondo: '#F7F1E6', // crema de la pantalla
  superficie: '#FFFFFF', // tarjetas y campos
  suave: '#EFE4CF', // bandas y chips
  primario: '#D9A862', // dorado de botones
  'primario-fuerte': '#8A5E1F', // dorado legible como texto sobre crema
  'sobre-primario': '#2B1D14',
  texto: '#2B1D14',
  'texto-suave': '#75685C',
  borde: '#E7DBC4',
  peligro: '#A4262C',
  exito: '#2E6B45',
  estrella: '#D9A14A',
  // Fondos de las portadas y retratos generados cuando no hay imagen.
  'portada-1': '#2F5D50',
  'portada-2': '#7A3E48',
  'portada-3': '#35507A',
  'portada-4': '#8C5A2B',
};

// Nombres propios, no de la familia: para cambiar de fuente basta con editar fuentes.ts.
const fuentes = {
  regular: 'app-regular',
  media: 'app-media',
  semi: 'app-semi',
  negrita: 'app-negrita',
};

module.exports = { colores, fuentes };
