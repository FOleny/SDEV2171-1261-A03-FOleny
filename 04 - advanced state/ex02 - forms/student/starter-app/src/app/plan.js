import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStudyPlan } from '../context/StudyPlanContext';

export default function PlanScreen() {
  const router = useRouter();
  const { selectedSteps: planSteps, removeStep } = useStudyPlan();

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

// Includes styles that later steps use (button, card), so the commits only change logic and JSX.
const styles = StyleSheet.create({
  screen: { flexGrow: 1, gap: 16, padding: 24, backgroundColor: '#f5efe7' },
  count: { fontSize: 22, fontWeight: '800', color: '#1f1b18' },
  empty: { fontSize: 15, color: '#5d554d' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { flex: 1, fontSize: 15, color: '#2d2620' },
  removeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#d9e6d6' },
  chipLabel: { fontSize: 12, fontWeight: '700', color: '#2d2620' },
  card: { padding: 18, gap: 6, borderWidth: 1, borderColor: '#d7cec4', borderRadius: 16, backgroundColor: '#fff8f2' },
  cardLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: '#8c5d35' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#2d2620' },
  cardBody: { fontSize: 15, color: '#5d554d' },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
  secondaryButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#ece2d1' },
  secondaryButtonLabel: { fontSize: 14, fontWeight: '700', color: '#4d3214' },
});
