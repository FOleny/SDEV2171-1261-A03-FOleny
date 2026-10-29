import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import { useFetch } from '../hooks/useFetch';

export default function DetailsScreen() {
  const router = useRouter();
  const { status, data, errorMessage, retry } = useFetch(`${API_BASE_URL}/study-steps?delay=500`);
  const steps = data ?? [];
  const [selectedSteps, setSelectedSteps] = useState([]);

  function toggleStep(step) {
    setSelectedSteps((currentSteps) => {
      const alreadySelected = currentSteps.some((entry) => entry.id === step.id);

      if (alreadySelected) {
        return currentSteps.filter((entry) => entry.id !== step.id);
      }

      return [...currentSteps, step];
    });
  }

  function openPlan() {
    // Route params are strings, so the selected steps are sent as JSON.
    router.push({ pathname: '/plan', params: { steps: JSON.stringify(selectedSteps) } });
  }

  function renderStep({ item }) {
    const isSelected = selectedSteps.some((entry) => entry.id === item.id);

    return (
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Pressable style={isSelected ? styles.removeChip : styles.addChip} onPress={() => toggleStep(item)}>
          <Text style={styles.chipLabel}>{isSelected ? 'Remove' : 'Add'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.count}>{selectedSteps.length} in your plan</Text>

      <Pressable style={styles.button} onPress={openPlan}>
        <Text style={styles.buttonLabel}>Open plan</Text>
      </Pressable>

      {status === 'loading' && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#8c5d35" />
          <Text style={styles.cardTitle}>Loading study steps...</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.cardTitle}>Couldn't load study steps.</Text>
          <Text style={styles.cardBody}>{errorMessage}</Text>
          <Pressable style={styles.button} onPress={retry}>
            <Text style={styles.buttonLabel}>Retry</Text>
          </Pressable>
        </View>
      )}

      {status === 'success' && (
        <FlatList
          data={steps}
          keyExtractor={(item) => item.id}
          renderItem={renderStep}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 16, padding: 24, backgroundColor: '#f5efe7' },
  count: { fontSize: 22, fontWeight: '800', color: '#1f1b18' },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { flex: 1, fontSize: 15, color: '#2d2620' },
  separator: { height: 12 },
  addChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#ece2d1' },
  removeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#d9e6d6' },
  chipLabel: { fontSize: 12, fontWeight: '700', color: '#2d2620' },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
});
