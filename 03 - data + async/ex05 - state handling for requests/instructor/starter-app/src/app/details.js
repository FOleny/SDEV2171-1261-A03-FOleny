import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View 
} from 'react-native';
import { API_BASE_URL } from '../lib/apiBaseUrl';

// Test controls sent to the backend. Change, save, then reopen this screen.
//   'delay=1500'          slow response
//   'delay=1500&error=1'  server error
//   'race=1'              shorter searches answer slower
//   'flaky=2'             fails twice for the same URL, then succeeds
const TEST_PARAMS = 'delay=1500';

export default function DetailsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [steps, setSteps] = useState([]);

  // I'm going to use state not just to hold data, but to observe & handle the state of my request.
  // I'm starting by manually changing this state UI-side to make sure all my UI branches work right, *then* I'll let the request/response cycle drive it.
  const [status, setStatus] = useState('success')  //  'loading' | 'success' | 'error'

  useEffect(() => {
    async function loadSteps() {
      try {
        // encodeURIComponent makes the user's search text safe to put in a URL.
        // TEST_PARAMS is added as-is, since you write it yourself.
        const url = `${API_BASE_URL}/study-steps?q=${encodeURIComponent(query)}&${TEST_PARAMS}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        setSteps(await response.json());
      } catch (error) {
        console.error('request failed', error);
      }
    }

    loadSteps();
  }, [query]);

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
          <Text style={styles.cardTitle}>Error loading study steps.</Text>
        </View>
      )}

      {status === 'success' && steps.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No study steps found for: "{query}".</Text>
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

// Includes the styles later steps use (errorCard, cardBody, button), so the commits only change logic and JSX.
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
