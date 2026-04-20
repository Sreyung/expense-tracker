import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, FAB, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { useTransactionStore } from '@/stores/transactionStore';
import { currentYearMonth } from '@/utils/dateHelpers';
import MonthNavigator from '@/components/MonthNavigator';
import SummaryBar from '@/components/SummaryBar';
import TransactionCard from '@/components/TransactionCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const theme = useTheme();
  const nav = useNavigation<Nav>();
  const { transactions, summary, selectedYear, selectedMonth, isLoading, loadMonth } =
    useTransactionStore();

  useFocusEffect(
    useCallback(() => {
      loadMonth(selectedYear, selectedMonth);
    }, [selectedYear, selectedMonth])
  );

  const recent = transactions.slice(0, 8);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Expense Tracker" />
      </Appbar.Header>

      <MonthNavigator
        year={selectedYear}
        month={selectedMonth}
        onChange={(y, m) => loadMonth(y, m)}
      />
      <SummaryBar summary={summary} />

      <Text variant="titleSmall" style={styles.sectionLabel}>Recent Transactions</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={{ opacity: 0.5 }}>No transactions yet</Text>
          <Text variant="bodySmall" style={{ opacity: 0.4, marginTop: 4 }}>Tap + to add your first entry</Text>
        </View>
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(t) => t.id}
          renderItem={({ item: tx }) => (
            <TransactionCard
              transaction={tx}
              onPress={() => nav.navigate('AddEditTransaction', { transactionId: tx.id })}
              onLongPress={() => {}}
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
  sectionLabel: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, opacity: 0.6 },
  loader: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 100 },
  fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 28 },
});
