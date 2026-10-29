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
const TEST_PARAMS = 'race=1';

export default function DetailsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [steps, setSteps] = useState([]);

  // I'm going to use state not just to hold data, but to observe & handle the state of my request.
  // I'm starting by manually changing this state UI-side to make sure all my UI branches work right, *then* I'll let the request/response cycle drive it.
  const [status, setStatus]             = useState('loading')  //  'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  const [reloadKey, setReloadKey] = useState(0); // I'm going to use this to 'key' each specific request/retry (full payoff in next commit)


  useEffect(() => {

    const controller = new AbortController();

    async function loadSteps() {
      setStatus('loading');

      // I can connect this to a request when it fires, and 'detonate' it to cancel that request
      // (e.g. if I want to re-fire it)

      try {
        // encodeURIComponent makes the user's search text safe to put in a URL.
        // TEST_PARAMS is added as-is, since you write it yourself.
        const url = `${API_BASE_URL}/study-steps?q=${encodeURIComponent(query)}&${TEST_PARAMS}`;
        const response = await fetch(
          url,
          {signal: controller.signal} // this is the 'umbilical connection' between the request and the AbortController
        );
        console.log(response);

        if (!response.ok) {
          const body = await response.json().catch(() => ({})); // catch-all catch expression; I want to capture any error, not just JSON/HTTP errors 
          throw new Error(body.error ?? `Server returned ${response.status}`)
          // first, try to get an error message out of the response
          // if there is none, return a prepapred string w/ just the HTTP status code
        }

        setSteps(await response.json());
        setStatus('success'); // oops
      } catch (error) {
        // console.error('request failed', error);
        if (controller.signal.abort) return; // if I've already canceled the request, don't show error state
        setErrorMessage(error.message);
        setStatus('error'); // oops
      }
    }

    loadSteps();
    // if a useEffect callback returns a nested callback, that nested callback runs as cleanup (on component dismount)
    // just remember: re-rendering the component (e.g. if state updates) means dismounting and re-mounting it
    // clearer sketch of the structure: https://react.dev/reference/react/useEffect#usage
    return () => controller.abort(); // we're saying, any time this effect re-fires, kill the fetch that was happening the previous effect fire
  }, [query, reloadKey]);  // I just need to increment the key to re-fire the request cycle

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
          <Text style={styles.cardBody}>{errorMessage}</Text>
          <Pressable
            style={styles.button}
            onPress={() => setReloadKey((key) => key + 1)}
          >
            <Text style={styles.buttonLabel}>Retry</Text>
          </Pressable>
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
