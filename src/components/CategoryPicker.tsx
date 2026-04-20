import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, useTheme, Searchbar, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, TransactionType } from '@/types';
import { useCategoryStore } from '@/stores/categoryStore';

interface Props {
  value: string | null;
  transactionType: TransactionType;
  onChange: (categoryId: string) => void;
  error?: string;
}

export default function CategoryPicker({ value, transactionType, onChange, error }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { byType, getById } = useCategoryStore();

  const selected = value ? getById(value) : null;
  const categories = byType(transactionType).filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  function pick(cat: Category) {
    onChange(cat.id);
    setOpen(false);
    setQuery('');
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: error ? theme.colors.error : theme.colors.outline }]}
      >
        {selected ? (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: selected.color }]} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>{selected.name}</Text>
          </View>
        ) : (
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Select category</Text>
        )}
        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
      {error ? (
        <Text variant="labelSmall" style={{ color: theme.colors.error, marginTop: 4 }}>{error}</Text>
      ) : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={() => setOpen(false)} />
          <Surface style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <SafeAreaView edges={['bottom']}>
              <Text variant="titleMedium" style={styles.sheetTitle}>Select Category</Text>
              <Searchbar
                placeholder="Search"
                value={query}
                onChangeText={setQuery}
                style={styles.search}
              />
              <FlatList
                data={categories}
                keyExtractor={(c) => c.id}
                style={styles.list}
                renderItem={({ item: cat }) => (
                  <TouchableOpacity style={styles.item} onPress={() => pick(cat)}>
                    <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
                      <MaterialCommunityIcons
                        name={cat.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                        size={20}
                        color={cat.color}
                      />
                    </View>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>{cat.name}</Text>
                    {cat.id === value && (
                      <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </SafeAreaView>
          </Surface>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginVertical: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 16,
  },
  sheetTitle: { textAlign: 'center', marginBottom: 8 },
  search: { marginHorizontal: 16, marginBottom: 8 },
  list: { maxHeight: 400 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
