import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { formatMonthYear } from '@/utils/dateHelpers';

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export default function MonthNavigator({ year, month, onChange }: Props) {
  const theme = useTheme();

  function prev() {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  }

  function next() {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  }

  return (
    <View style={styles.row}>
      <IconButton icon="chevron-left" onPress={prev} />
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
        {formatMonthYear(year, month)}
      </Text>
      <IconButton icon="chevron-right" onPress={next} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
