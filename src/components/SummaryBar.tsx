import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MonthlySummary } from '@/types';
import { formatINR } from '@/utils/currency';
import { INCOME_COLOR, EXPENSE_COLOR, BALANCE_COLOR } from '@/constants/theme';

interface Props {
  summary: MonthlySummary;
}

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.pill}>
      <Text variant="labelSmall" style={styles.label}>{label}</Text>
      <Text variant="titleSmall" style={[styles.value, { color }]}>
        {formatINR(value)}
      </Text>
    </View>
  );
}

export default function SummaryBar({ summary }: Props) {
  const theme = useTheme();
  return (
    <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Pill label="Income" value={summary.income} color={INCOME_COLOR} />
      <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
      <Pill label="Expense" value={summary.expense} color={EXPENSE_COLOR} />
      <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
      <Pill label="Balance" value={summary.net} color={BALANCE_COLOR} />
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  pill: { flex: 1, alignItems: 'center' },
  label: { opacity: 0.6, marginBottom: 2 },
  value: { fontWeight: '700' },
  divider: { width: 1, marginVertical: 4 },
});
