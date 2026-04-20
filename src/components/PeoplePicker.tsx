import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, useTheme, Chip, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePeopleStore } from '@/stores/peopleStore';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function PeoplePicker({ selectedIds, onChange }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { people, getById } = usePeopleStore();

  function toggle(id: string) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((i) => i !== id));
    else onChange([...selectedIds, id]);
  }

  function remove(id: string) {
    onChange(selectedIds.filter((i) => i !== id));
  }

  return (
    <>
      <View style={styles.wrap}>
        <View style={styles.chips}>
          {selectedIds.map((id) => {
            const p = getById(id);
            if (!p) return null;
            return (
              <Chip
                key={id}
                onClose={() => remove(id)}
                style={styles.chip}
              >
                {p.name}
              </Chip>
            );
          })}
          <TouchableOpacity style={styles.addBtn} onPress={() => setOpen(true)}>
            <MaterialCommunityIcons name="account-plus" size={18} color={theme.colors.primary} />
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>Tag people</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={() => setOpen(false)} />
          <Surface style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <SafeAreaView edges={['bottom']}>
              <Text variant="titleMedium" style={styles.title}>Tag People</Text>
              {people.length === 0 ? (
                <Text style={styles.empty}>No people added yet. Go to Settings → People.</Text>
              ) : (
                <FlatList
                  data={people}
                  keyExtractor={(p) => p.id}
                  style={styles.list}
                  renderItem={({ item: p }) => {
                    const selected = selectedIds.includes(p.id);
                    return (
                      <TouchableOpacity style={styles.item} onPress={() => toggle(p.id)}>
                        <MaterialCommunityIcons
                          name="account-circle"
                          size={28}
                          color={theme.colors.primary}
                        />
                        <Text variant="bodyLarge" style={{ flex: 1, color: theme.colors.onSurface }}>
                          {p.name}
                        </Text>
                        {selected && (
                          <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
              <Button mode="contained" onPress={() => setOpen(false)} style={styles.doneBtn}>
                Done
              </Button>
            </SafeAreaView>
          </Surface>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { marginBottom: 0 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: { textAlign: 'center', marginBottom: 16 },
  empty: { textAlign: 'center', padding: 24, opacity: 0.6 },
  list: { maxHeight: 300 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  doneBtn: { margin: 16 },
});
