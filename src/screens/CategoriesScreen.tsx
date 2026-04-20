import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { Appbar, Button, FAB, List, SegmentedButtons, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Category, CategoryType } from '@/types';
import { useCategoryStore } from '@/stores/categoryStore';
import { countTransactionsForCategory } from '@/db/repositories/categories';

const COLORS = ['#EF5350','#FF7043','#EC407A','#AB47BC','#5C6BC0','#42A5F5','#26C6DA','#26A69A','#4CAF50','#FFA726','#FF8A65','#BDBDBD'];
const ICONS = ['food','car','shopping','hospital-box','flash','home','television-play','school','airplane','face-man','briefcase','laptop','trending-up','plus-circle','dots-horizontal'];

interface FormState {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

export default function CategoriesScreen() {
  const theme = useTheme();
  const nav = useNavigation();
  const { categories, add, update, remove } = useCategoryStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', type: 'expense', color: '#EF5350', icon: 'dots-horizontal' });
  const [nameError, setNameError] = useState('');

  const income = categories.filter((c) => c.type === 'income' || c.type === 'both');
  const expense = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  function openAdd() {
    setEditTarget(null);
    setForm({ name: '', type: 'expense', color: '#EF5350', icon: 'dots-horizontal' });
    setNameError('');
    setModalVisible(true);
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon });
    setNameError('');
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setNameError('Name is required'); return; }
    if (editTarget) {
      await update(editTarget.id, { name: form.name.trim(), color: form.color, icon: form.icon, type: form.type });
    } else {
      await add({ name: form.name.trim(), type: form.type, color: form.color, icon: form.icon });
    }
    setModalVisible(false);
  }

  async function handleDelete(cat: Category) {
    const count = await countTransactionsForCategory(cat.id);
    if (count > 0) {
      Alert.alert('Cannot Delete', `${cat.name} is used by ${count} transaction${count > 1 ? 's' : ''}. Reassign them first.`);
      return;
    }
    Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(cat.id) },
    ]);
  }

  function renderSection(title: string, data: Category[]) {
    return (
      <View>
        <Text variant="labelLarge" style={styles.sectionHeader}>{title}</Text>
        {data.map((cat) => (
          <List.Item
            key={cat.id}
            title={cat.name}
            left={() => (
              <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
                <MaterialCommunityIcons
                  name={cat.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                  size={20}
                  color={cat.color}
                />
              </View>
            )}
            right={() =>
              cat.is_system ? (
                <Text variant="labelSmall" style={styles.systemTag}>system</Text>
              ) : (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => openEdit(cat)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(cat)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="delete" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              )
            }
          />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => nav.goBack()} />
        <Appbar.Content title="Categories" />
      </Appbar.Header>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {renderSection(`Income (${income.length})`, income)}
            {renderSection(`Expense (${expense.length})`, expense)}
          </>
        }
        contentContainerStyle={styles.list}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={openAdd}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={() => setModalVisible(false)} />
          <Surface style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <SafeAreaView edges={['bottom']}>
              <Text variant="titleMedium" style={styles.sheetTitle}>
                {editTarget ? 'Edit Category' : 'Add Category'}
              </Text>
              <TextInput
                label="Name"
                value={form.name}
                onChangeText={(t) => { setForm((f) => ({ ...f, name: t })); setNameError(''); }}
                mode="outlined"
                error={!!nameError}
                style={styles.field}
              />
              {nameError ? <Text style={{ color: theme.colors.error, marginLeft: 16 }}>{nameError}</Text> : null}

              <Text variant="labelMedium" style={styles.fieldLabel}>Type</Text>
              <SegmentedButtons
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as CategoryType }))}
                buttons={[
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                  { value: 'both', label: 'Both' },
                ]}
                style={styles.segment}
              />

              <Text variant="labelMedium" style={styles.fieldLabel}>Color</Text>
              <View style={styles.colorRow}>
                {COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, form.color === c && styles.colorSelected]}
                    onPress={() => setForm((f) => ({ ...f, color: c }))}
                  />
                ))}
              </View>

              <Text variant="labelMedium" style={styles.fieldLabel}>Icon</Text>
              <View style={styles.iconRow}>
                {ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.iconBtn, form.icon === icon && { backgroundColor: form.color + '33' }]}
                    onPress={() => setForm((f) => ({ ...f, icon }))}
                  >
                    <MaterialCommunityIcons
                      name={icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                      size={22}
                      color={form.icon === icon ? form.color : theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Button mode="contained" onPress={handleSave} style={styles.saveBtn}>
                {editTarget ? 'Update' : 'Add Category'}
              </Button>
            </SafeAreaView>
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 100 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, opacity: 0.6, textTransform: 'uppercase' },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8, alignSelf: 'center' },
  systemTag: { alignSelf: 'center', marginRight: 8, opacity: 0.4 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },
  fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 28 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingHorizontal: 16 },
  sheetTitle: { textAlign: 'center', marginBottom: 16 },
  field: { marginBottom: 8 },
  fieldLabel: { marginTop: 12, marginBottom: 8, opacity: 0.6 },
  segment: { marginBottom: 4 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { margin: 16 },
});
