// Etapa 1: pantalla de conexión. Comprueba que el teléfono llega a la API y a las tres bases.
import type { RespuestaSalud } from '@dlbp/shared';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { guardarUrlApi, leerUrlApi, pedirSalud } from './src/api';

const NOMBRES = { postgres: 'PostgreSQL', mongo: 'MongoDB', neo4j: 'Neo4j' } as const;

export default function App() {
  const [url, setUrl] = useState('');
  const [salud, setSalud] = useState<RespuestaSalud | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    void leerUrlApi().then(setUrl);
  }, []);

  async function probar() {
    setCargando(true);
    setSalud(null);
    setError('');
    try {
      const limpia = await guardarUrlApi(url);
      setUrl(limpia);
      if (!limpia) throw new Error('Escribe la dirección de la API');
      setSalud(await pedirSalud(limpia));
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : '';
      setError(
        /network|abort/i.test(mensaje) ? 'No se pudo llegar a la API. Revisa la dirección y la conexión.' : mensaje,
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Del Libro a la Pantalla</Text>
      <Text style={estilos.etiqueta}>Dirección de la API</Text>
      <TextInput
        style={estilos.entrada}
        value={url}
        onChangeText={setUrl}
        placeholder="https://….trycloudflare.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        accessibilityLabel="Dirección de la API"
      />
      <Pressable style={estilos.boton} onPress={probar} disabled={cargando} accessibilityRole="button">
        <Text style={estilos.textoBoton}>Probar conexión</Text>
      </Pressable>

      {cargando && <ActivityIndicator size="large" />}
      {error !== '' && <Text style={estilos.error}>{error}</Text>}
      {salud && (
        <View style={estilos.resultado}>
          <Text style={estilos.fila}>API: conectada</Text>
          {(Object.keys(NOMBRES) as (keyof typeof NOMBRES)[]).map((base) => (
            <Text key={base} style={[estilos.fila, salud.bases[base] === 'caida' && estilos.error]}>
              {NOMBRES[base]}: {salud.bases[base] === 'ok' ? 'disponible' : 'no responde'}
            </Text>
          ))}
        </View>
      )}
      <StatusBar style="dark" />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24, gap: 12 },
  titulo: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  etiqueta: { fontSize: 14, color: '#444' },
  entrada: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 16 },
  boton: { backgroundColor: '#1f4e79', borderRadius: 8, padding: 14, alignItems: 'center' },
  textoBoton: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultado: { gap: 6, marginTop: 8 },
  fila: { fontSize: 16 },
  error: { color: '#a4161a', fontSize: 16 },
});
