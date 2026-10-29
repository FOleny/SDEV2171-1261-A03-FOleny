import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Text style={styles.eyebrow}>SDEV2171 lesson 15</Text>
      <Text style={styles.title}>Home</Text>
      <Pressable style={styles.button} onPress={() => router.push('/details')}>
        <Text style={styles.buttonLabel}>Open study steps</Text>
      </Pressable>
    </View>
  );
}

// Includes a body style that later steps use.
const styles = StyleSheet.create({
  screen: { flex: 1, gap: 16, padding: 24, paddingTop: 42, backgroundColor: '#f5efe7' },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: '#8c5d35' },
  title: { fontSize: 30, fontWeight: '800', color: '#1f1b18' },
  body: { fontSize: 15, color: '#5d554d' },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
});
