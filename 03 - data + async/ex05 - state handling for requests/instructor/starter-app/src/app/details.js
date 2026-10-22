import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

export default function DetailsScreen() {
  const router = useRouter();
  const [remoteSteps, setRemoteSteps] = useState([]);

  async function loadRemoteSteps() {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=6');

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const data = await response.json();

      setRemoteSteps(
        data.map((item) => ({
          id: String(item.id),
          label: item.title,
        }))
      );
    } catch (error) {
      console.error('request failed', error);
    }
  }

  useEffect(() => {
    loadRemoteSteps();
  }, []);

  function renderStep({ item }) {
    return (
      <View style={styles.stepRow}>
        <Text style={styles.stepLabel}>{item.label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>SDEV2171 lesson 12</Text>
        <Text style={styles.title}>Study Steps</Text>

        {remoteSteps.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No study steps yet.</Text>
            <Text style={styles.emptyStateBody}>
              The list loads when this screen opens.
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            <Text style={styles.listLabel}>Study list</Text>
            <FlatList
              data={remoteSteps}
              keyExtractor={(item) => item.id}
              renderItem={renderStep}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonLabel}>Go back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5efe7',
    padding: 24,
    paddingTop: 42,
  },
  container: {
    flex: 1,
    gap: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8c5d35',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    color: '#1f1b18',
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5d554d',
  },
  listCard: {
    flex: 1,
    minHeight: 220,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d7cec4',
    borderRadius: 18,
    backgroundColor: '#fff8f2',
    gap: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  listLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8c5d35',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepRow: {
    paddingVertical: 6,
  },
  stepLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#2d2620',
  },
  separator: {
    height: 10,
  },
  emptyStateCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#d7cec4',
    borderRadius: 18,
    backgroundColor: '#fff8f2',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    color: '#2d2620',
  },
  emptyStateBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5d554d',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#ece2d1',
  },
  secondaryButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4d3214',
  },
});
