import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useGameStore } from '../store/gameStore';

export function Page({ title, children }: React.PropsWithChildren<{ title: string }>) {
  const error = useGameStore(s => s.error);
  const busy = useGameStore(s => s.busy);
  return <SafeAreaView style={ui.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
    <Text accessibilityRole="header" style={ui.title}>{title}</Text>
    {busy && <Text accessibilityLiveRegion="polite" style={ui.text}>Сохраняем…</Text>}
    {error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
    {children}
  </ScrollView></SafeAreaView>;
}
export function Card({ children }: React.PropsWithChildren) { return <View style={ui.card}>{children}</View>; }
export function Button({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  const busy = useGameStore(s => s.busy);
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: disabled || busy }}
    disabled={disabled || busy} onPress={onPress} style={[ui.button, (disabled || busy) && { opacity: 0.45 }]}>
    <Text style={ui.buttonText}>{title}</Text>
  </TouchableOpacity>;
}
export function MoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (s: string) => void }) {
  return <View><Text style={ui.text}>{label}</Text><TextInput accessibilityLabel={label} value={value}
    onChangeText={onChange} keyboardType="number-pad" maxLength={7} style={ui.input} /></View>;
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgMain },
  page: { padding: 20, paddingBottom: 120, gap: 16 },
  title: { color: Colors.textPrimary, fontSize: 27, fontWeight: '800' },
  heading: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  text: { color: Colors.textPrimary, fontSize: 16, lineHeight: 24 },
  muted: { color: '#526174', fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 24, padding: 20, gap: 12 },
  button: { minHeight: 48, backgroundColor: Colors.mint, borderRadius: 16, padding: 14, justifyContent: 'center' },
  buttonText: { color: '#193C32', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  input: { minHeight: 48, backgroundColor: '#F0F3FA', borderWidth: 1, borderColor: '#8593A5', borderRadius: 12, padding: 12, fontSize: 18, color: Colors.textPrimary },
  error: { padding: 14, borderRadius: 12, color: '#9B1C1C', backgroundColor: '#FFEEEE', fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
