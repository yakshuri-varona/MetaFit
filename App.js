// App.js
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { META_FIT_KEY } from './config'; // <- tu API Key segura

const API_URL = 'https://api.api-ninjas.com/v1/nutrition';

export default function App() {
  const [food, setFood] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNutrition = async () => {
    const query = food.trim();
    if (!query) {
      setError('Escribe un alimento para buscar.');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    // Timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const url = `${API_URL}?query=${encodeURIComponent(query)}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-Api-Key': META_FIT_KEY },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      console.log('API status:', response.status);
      console.log('API body:', text);

      let json;
      try { json = JSON.parse(text); } catch (e) { json = text; }

      if (!response.ok) {
        if (response.status === 401) {
          setError('401 Unauthorized — API Key inválida o no activa.');
        } else if (response.status === 429) {
          setError('429 Rate limit — demasiadas solicitudes. Prueba más tarde.');
        } else {
          setError(`Error ${response.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
        }
        return;
      }

      const item = Array.isArray(json) ? json[0] : json;
      if (!item) {
        setError('No se encontró información para ese alimento.');
        return;
      }

      setData(item);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Tiempo de espera agotado. Intenta de nuevo.');
      } else {
        console.error('Fetch exception:', err);
        setError('Error de red: no se pudo conectar con la API.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>🍎 MetaFit</Text>

      <TextInput
        style={styles.input}
        placeholder="Escribe un alimento... ej. manzana"
        value={food}
        onChangeText={setFood}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading ? styles.buttonDisabled : null]}
        onPress={fetchNutrition}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Buscando...' : 'Buscar'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#00b894" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {data && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>{(data.name || '').toUpperCase()}</Text>
          <Text>Calorías: {data.calories ?? '—'}</Text>
          <Text>Proteínas: {data.protein_g ?? '—'} g</Text>
          <Text>Grasas: {data.fat_total_g ?? '—'} g</Text>
          <Text>Carbohidratos: {data.carbohydrates_total_g ?? '—'} g</Text>
          <Text>Azúcar: {data.sugar_g ?? '—'} g</Text>
          <Text>Fibra: {data.fiber_g ?? '—'} g</Text>
        </View>
      )}

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#00b894', marginBottom: 25 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, width: '100%', marginBottom: 15 },
  button: { backgroundColor: '#00b894', paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  result: { backgroundColor: '#f1f2f6', padding: 20, borderRadius: 15, width: '100%' },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#2d3436' },
  error: { color: 'red', marginTop: 10, textAlign: 'center' },
});