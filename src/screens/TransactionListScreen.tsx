import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Appbar, Chip, FAB, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { Transaction, TransactionType } from '@/types';
import { useTransactionStore } from '@/stores/transactionStore';
import TransactionCard from '@/components/TransactionCard';
import MonthNavigator from '@/components/MonthNavigator';
import SummaryBar from '@/components/SummaryBar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TransactionListScreen() {
  const theme = useTheme();
  const nav = useNavigation<Nav>();
  const { transactions, summary, selectedYear, selectedMonth, isLoading, loadMonth, deleteTransaction } =
    useTransactionStore();
  const [filter, setFilter] = useState<'all' | TransactionType>('all');

  useEffect(() => {
    loadMonth(selectedYear, selectedMonth);
  }, []);

  function onMonthChange(year: number, month: number) {
    loadMonth(year, month);
  }

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  function handleDelete(tx: Transaction) {
    Alert.alert(
      'Delete Transaction',
      `Delete this ${tx.type} of ₹${tx.amount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(tx.id) },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Transactions" />
      </Appbar.Header>

      <MonthNavigator year={selectedYear} month={selectedMonth} onChange={onMonthChange} />
      <SummaryBar summary={summary} />

      <View style={styles.chips}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={styles.chip}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={{ opacity: 0.5 }}>No transactions for this month</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          renderItem={({ item: tx }) => (
            <TransactionCard
              transaction={tx}
              onPress={() => nav.navigate('AddEditTransaction', { transactionId: tx.id })}
              onLongPress={() => handleDelete(tx)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => nav.navigate('AddEditTransaction', undefined)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  chip: {},
  loader: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 100 },
  fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 28 },
});
