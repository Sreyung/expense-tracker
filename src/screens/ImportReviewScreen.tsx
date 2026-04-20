import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Button, Chip, Text, useTheme, Checkbox, Divider, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ImportStackParamList } from '@/navigation/AppNavigator';
import { ParsedRow } from '@/types';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { formatDate } from '@/utils/dateHelpers';
import { formatINR } from '@/utils/currency';

type Nav = NativeStackNavigationProp<ImportStackParamList, 'ImportReview'>;
type Route = RouteProp<ImportStackParamList, 'ImportReview'>;

export default function ImportReviewScreen() {
  const theme = useTheme();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { parsedRows } = route.params;

  const { bulkInsert } = useTransactionStore();
  const { getById } = useCategoryStore();

  const [selected, setSelected] = useState<boolean[]>(parsedRows.map(() => true));
  const [rows, setRows] = useState<ParsedRow[]>(parsedRows);
  const [importing, setImporting] = useState(false);
  const [snack, setSnack] = useState('');

  const selectedCount = selected.filter(Boolean).length;

  function toggleAll(val: boolean) {
    setSelected(selected.map(() => val));
  }

  function toggleOne(i: number) {
    setSelected((s) => s.map((v, idx) => (idx === i ? !v : v)));
  }

  async function handleImport() {
    setImporting(true);
    const items = rows
      .filter((_, i) => selected[i])
      .map((r) => ({
        type: r.suggestedType,
        amount: r.amount,
        date: r.date ? r.date.getTime() : Date.now(),
        description: r.description,
        category_id: r.suggestedCategoryId ?? undefined,
        source: 'pdf_import' as const,
        raw_description: r.raw,
      }));
    await bulkInsert(items);
    setSnack(`${items.length} transactions imported`);
    setTimeout(() => nav.getParent()?.navigate('TransactionsTab'), 1500);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => nav.goBack()} />
        <Appbar.Content title={`Review Import (${parsedRows.length} found)`} />
      </Appbar.Header>

      <View style={styles.toolbar}>
        <Button compact onPress={() => toggleAll(true)}>Select All</Button>
        <Button compact onPress={() => toggleAll(false)}>Deselect All</Button>
      </View>
      <Divider />

      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item: row, index: i }) => {
          const cat = row.suggestedCategoryId ? getById(row.suggestedCategoryId) : null;
          return (
            <TouchableOpacity style={styles.row} onPress={() => toggleOne(i)} activeOpacity={0.7}>
              <Checkbox status={selected[i] ? 'checked' : 'unchecked'} onPress={() => toggleOne(i)} />
              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Text variant="labelSmall" style={{ opacity: 0.6 }}>
                    {row.date ? formatDate(row.date.getTime(), 'dd/MM/yy') : '—'}
                  </Text>
                  <Text
                    variant="titleSmall"
                    style={{ color: row.suggestedType === 'income' ? '#4CAF50' : '#EF5350', fontWeight: '700' }}
                  >
                    {row.suggestedType === 'income' ? '+' : '-'}{formatINR(row.amount)}
                  </Text>
                </View>
                <Text variant="bodySmall" numberOfLines={1} style={{ opacity: 0.8 }}>{row.description}</Text>
                {cat && (
                  <Chip compact style={styles.catChip} textStyle={{ fontSize: 10 }}>
                    {cat.name}
                  </Chip>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="contained"
          onPress={handleImport}
          loading={importing}
          disabled={importing || selectedCount === 0}
          style={styles.importBtn}
        >
          Import {selectedCount} transaction{selectedCount !== 1 ? 's' : ''}
        </Button>
      </View>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2000}>{snack}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4 },
  list: { paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, gap: 8 },
  info: { flex: 1, gap: 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catChip: { alignSelf: 'flex-start', height: 22, marginTop: 2 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ccc' },
  importBtn: { borderRadius: 8 },
});
