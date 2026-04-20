import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { Appbar, Button, FAB, List, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Person } from '@/types';
import { usePeopleStore } from '@/stores/peopleStore';
import { countTransactionsForPerson } from '@/db/repositories/people';

interface FormState { name: string; phone: string; email: string }

export default function PeopleScreen() {
  const theme = useTheme();
  const nav = useNavigation();
  const { people, add, update, remove } = usePeopleStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', phone: '', email: '' });
  const [nameError, setNameError] = useState('');

  function openAdd() {
    setEditTarget(null);
    setForm({ name: '', phone: '', email: '' });
    setNameError('');
    setModalVisible(true);
  }

  function openEdit(person: Person) {
    setEditTarget(person);
    setForm({ name: person.name, phone: person.phone ?? '', email: person.email ?? '' });
    setNameError('');
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setNameError('Name is required'); return; }
    const data = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    };
    if (editTarget) await update(editTarget.id, data);
    else await add(data);
    setModalVisible(false);
  }

  async function handleDelete(person: Person) {
    const count = await countTransactionsForPerson(person.id);
    Alert.alert(
      'Delete Person',
      count > 0
        ? `${person.name} is tagged in ${count} transaction${count > 1 ? 's' : ''}. Delete anyway? (Tags will be removed)`
        : `Delete "${person.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(person.id) },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => nav.goBack()} />
        <Appbar.Content title="People" />
      </Appbar.Header>

      {people.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="account-group" size={64} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
          <Text variant="bodyLarge" style={{ opacity: 0.5, marginTop: 16 }}>No people added yet</Text>
          <Text variant="bodySmall" style={{ opacity: 0.4, marginTop: 4 }}>Add people to tag them on transactions</Text>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(p) => p.id}
          renderItem={({ item: person }) => (
            <List.Item
              title={person.name}
              description={[person.phone, person.email].filter(Boolean).join(' · ') || undefined}
              left={() => (
                <View style={styles.avatar}>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                    {person.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              right={() => (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => openEdit(person)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(person)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="delete" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

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
                {editTarget ? 'Edit Person' : 'Add Person'}
              </Text>
              <TextInput
                label="Name *"
                value={form.name}
                onChangeText={(t) => { setForm((f) => ({ ...f, name: t })); setNameError(''); }}
                mode="outlined"
                error={!!nameError}
                style={styles.field}
              />
              {nameError ? <Text style={{ color: theme.colors.error, marginLeft: 16, marginBottom: 8 }}>{nameError}</Text> : null}
              <TextInput
                label="Phone (optional)"
                value={form.phone}
                onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.field}
              />
              <TextInput
                label="Email (optional)"
                value={form.email}
                onChangeText={(t) => setForm((f) => ({ ...f, email: t }))}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.field}
              />
              <Button mode="contained" onPress={handleSave} style={styles.saveBtn}>
                {editTarget ? 'Update' : 'Add Person'}
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#5C6BC022', alignItems: 'center', justifyContent: 'center',
    marginLeft: 8, alignSelf: 'center',
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },
  fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 28 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingHorizontal: 16 },
  sheetTitle: { textAlign: 'center', marginBottom: 16 },
  field: { marginBottom: 12 },
  saveBtn: { margin: 16 },
});
