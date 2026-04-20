import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { formatINR } from '@/utils/currency';
import { formatDate } from '@/utils/dateHelpers';
import { INCOME_COLOR, EXPENSE_COLOR } from '@/constants/theme';

interface Props {
  transaction: Transaction;
  onPress: () => void;
  onLongPress: () => void;
}

export default function TransactionCard({ transaction: tx, onPress, onLongPress }: Props) {
  const theme = useTheme();
  const isIncome = tx.type === 'income';
  const amountColor = isIncome ? INCOME_COLOR : EXPENSE_COLOR;
  const categoryColor = tx.category?.color ?? theme.colors.outline;
  const categoryIcon = (tx.category?.icon ?? 'circle') as React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: categoryColor + '22' }]}>
        <MaterialCommunityIcons name={categoryIcon} size={22} color={categoryColor} />
      </View>

      <View style={styles.center}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }} numberOfLines={1}>
          {tx.description ?? tx.category?.name ?? (isIncome ? 'Income' : 'Expense')}
        </Text>
        {tx.category && (
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {tx.category.name}
          </Text>
        )}
        {tx.people && tx.people.length > 0 && (
          <View style={styles.chips}>
            {tx.people.map((p) => (
              <Chip key={p.id} compact style={styles.chip} textStyle={styles.chipText}>
                {p.name}
              </Chip>
            ))}
          </View>
        )}
      </View>

      <View style={styles.right}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {formatDate(tx.date, 'dd MMM')}
        </Text>
        <Text variant="titleSmall" style={{ color: amountColor, fontWeight: '700' }}>
          {isIncome ? '+' : '-'}{formatINR(tx.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, gap: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  chip: { height: 20 },
  chipText: { fontSize: 10 },
});
