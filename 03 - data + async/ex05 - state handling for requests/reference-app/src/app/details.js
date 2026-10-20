import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { API_BASE_URL } from '../lib/apiBaseUrl';

// Test controls sent to the backend. Change, save, then press Retry.
//   'delay=1500'          slow response
//   'delay=1500&error=1'  server error
//   'race=1'              shorter searches answer slower
const TEST_PARAMS = 'delay=1500';

export default function DetailsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [steps, setSteps] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadSteps() {
      setStatus('loading');

      try {
        const url = `${API_BASE_URL}/study-steps?q=${encodeURIComponent(query)}&${TEST_PARAMS}`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? `Server returned ${response.status}`);
        }

        setSteps(await response.json());
        setStatus('success');
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error.message);
        setStatus('error');
      }
    }

    loadSteps();
    return () => controller.abort();
  }, [query, reloadKey]);

  function renderStep({ item }) {
    return <Text style={styles.stepLabel}>{item.label}</Text>;
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Study Steps</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search study steps"
        autoCapitalize="none"
        style={styles.input}
      />

      {status === 'loading' && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#8c5d35" />
          <Text style={styles.cardTitle}>Loading study steps...</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.cardTitle}>Couldn't load study steps</Text>
          <Text style={styles.cardBody}>{errorMessage}</Text>
          <Pressable style={styles.button} onPress={() => setReloadKey((key) => key + 1)}>
            <Text style={styles.buttonLabel}>Retry</Text>
          </Pressable>
        </View>
      )}

      {status === 'success' && steps.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No study steps match "{query}".</Text>
        </View>
      )}

      {status === 'success' && steps.length > 0 && (
        <FlatList
          data={steps}
          keyExtractor={(item) => item.id}
          renderItem={renderStep}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.list}
        />
      )}

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonLabel}>Go back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 16, padding: 24, paddingTop: 42, backgroundColor: '#f5efe7' },
  title: { fontSize: 30, fontWeight: '800', color: '#1f1b18' },
  input: {
    borderWidth: 1,
    borderColor: '#d2c4b5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fffdfb',
  },
  card: {
    padding: 18,
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#d7cec4',
    borderRadius: 16,
    backgroundColor: '#fff8f2',
  },
  errorCard: { borderColor: '#d3b3a8', backgroundColor: '#fff4f1' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#2d2620' },
  cardBody: { fontSize: 15, color: '#5d554d' },
  list: { flexGrow: 0 },
  stepLabel: { fontSize: 15, color: '#2d2620' },
  separator: { height: 12 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
  secondaryButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#ece2d1' },
  secondaryButtonLabel: { fontSize: 14, fontWeight: '700', color: '#4d3214' },
});
