import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Appbar, Button, SegmentedButtons, TextInput, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { TransactionType } from '@/types';
import { useTransactionStore } from '@/stores/transactionStore';
import { getById } from '@/db/repositories/transactions';
import AmountInput from '@/components/AmountInput';
import CategoryPicker from '@/components/CategoryPicker';
import PeoplePicker from '@/components/PeoplePicker';
import DatePickerField from '@/components/DatePickerField';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddEditTransaction'>;
type Route = RouteProp<RootStackParamList, 'AddEditTransaction'>;

export default function AddEditTransactionScreen() {
  const theme = useTheme();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const transactionId = route.params?.transactionId;
  const isEdit = !!transactionId;

  const { addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(Date.now());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [peopleIds, setPeopleIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if (transactionId) {
      getById(transactionId).then((tx) => {
        if (!tx) return;
        setType(tx.type);
        setAmount(tx.amount);
        setDate(tx.date);
        setCategoryId(tx.category_id);
        setDescription(tx.description ?? '');
        setPeopleIds(tx.people?.map((p) => p.id) ?? []);
      });
    }
  }, [transactionId]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (amount <= 0) e.amount = 'Amount must be greater than 0';
    if (!categoryId) e.category = 'Please select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateTransaction(transactionId!, { type, amount, date, description: description || undefined, category_id: categoryId!, peopleIds });
        setSnack('Transaction updated');
      } else {
        await addTransaction({ type, amount, date, description: description || undefined, category_id: categoryId!, peopleIds });
        setSnack('Transaction added');
      }
      nav.goBack();
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(transactionId!);
            nav.goBack();
          },
        },
      ]
    );
  }

  const accentColor = type === 'income' ? '#4CAF50' : '#EF5350';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: accentColor }}>
        <Appbar.Action icon="close" iconColor="#fff" onPress={() => nav.goBack()} />
        <Appbar.Content title={isEdit ? 'Edit Transaction' : 'New Transaction'} titleStyle={{ color: '#fff' }} />
        {isEdit && (
          <Appbar.Action icon="delete" iconColor="#fff" onPress={handleDelete} />
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <SegmentedButtons
          value={type}
          onValueChange={(v) => { setType(v as TransactionType); setCategoryId(null); }}
          buttons={[
            { value: 'expense', label: 'Expense', icon: 'arrow-up-circle' },
            { value: 'income', label: 'Income', icon: 'arrow-down-circle' },
          ]}
          style={styles.typeToggle}
        />

        <AmountInput value={amount} onChange={setAmount} error={errors.amount} />

        <DatePickerField value={date} onChange={setDate} />

        <CategoryPicker
          value={categoryId}
          transactionType={type}
          onChange={(id) => { setCategoryId(id); setErrors((e) => ({ ...e, category: undefined })); }}
          error={errors.category}
        />

        <TextInput
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.field}
          multiline
          numberOfLines={2}
        />

        <PeoplePicker selectedIds={peopleIds} onChange={setPeopleIds} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          buttonColor={accentColor}
          style={styles.saveBtn}
        >
          {isEdit ? 'Update' : 'Save'}
        </Button>
      </View>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2000}>
        {snack}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16, gap: 4 },
  typeToggle: { marginBottom: 8 },
  field: { marginVertical: 8 },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  saveBtn: { borderRadius: 8 },
});
