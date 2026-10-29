import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PlanScreen() {
  const router = useRouter();
  const { steps } = useLocalSearchParams();

  // The useState initializer runs once, when this screen mounts.
  const [planSteps, setPlanSteps] = useState(() => JSON.parse(steps ?? '[]'));

  function removeStep(id) {
    setPlanSteps((currentSteps) => currentSteps.filter((step) => step.id !== id));
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.count}>{planSteps.length} in your plan</Text>

      {planSteps.length === 0 && <Text style={styles.empty}>Your plan is empty. Add steps on the Study Steps screen.</Text>}

      {planSteps.map((step) => (
        <View key={step.id} style={styles.row}>
          <Text style={styles.rowLabel}>{step.label}</Text>
          <Pressable style={styles.removeChip} onPress={() => removeStep(step.id)}>
            <Text style={styles.chipLabel}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonLabel}>Go back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, gap: 16, padding: 24, backgroundColor: '#f5efe7' },
  count: { fontSize: 22, fontWeight: '800', color: '#1f1b18' },
  empty: { fontSize: 15, color: '#5d554d' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { flex: 1, fontSize: 15, color: '#2d2620' },
  removeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#d9e6d6' },
  chipLabel: { fontSize: 12, fontWeight: '700', color: '#2d2620' },
  secondaryButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#ece2d1' },
  secondaryButtonLabel: { fontSize: 14, fontWeight: '700', color: '#4d3214' },
});
