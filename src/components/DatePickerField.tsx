import React, { useState } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate } from '@/utils/dateHelpers';

interface Props {
  value: number;
  onChange: (ms: number) => void;
}

export default function DatePickerField({ value, onChange }: Props) {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  function handleChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(selected.getTime());
  }

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={[styles.trigger, { borderColor: theme.colors.outline }]}
      >
        <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, flex: 1 }}>
          {formatDate(value)}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={new Date(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginVertical: 8,
    gap: 8,
  },
});
