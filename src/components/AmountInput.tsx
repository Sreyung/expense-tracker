import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface Props {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export default function AmountInput({ value, onChange, error }: Props) {
  const theme = useTheme();
  const [raw, setRaw] = useState(value > 0 ? String(Math.round(value * 100)) : '');

  function handleChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '');
    setRaw(digits);
    const numValue = digits ? parseInt(digits, 10) / 100 : 0;
    onChange(Math.round(numValue * 100) / 100);
  }

  const display = raw
    ? (parseInt(raw, 10) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '';

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, { borderColor: error ? theme.colors.error : theme.colors.outline }]}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>₹</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.onSurface }]}
          value={display}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
      </View>
      {error ? (
        <Text variant="labelSmall" style={{ color: theme.colors.error, marginTop: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
  },
});
