import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, useTheme, Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const theme = useTheme();
  const nav = useNavigation<Nav>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Settings" />
      </Appbar.Header>
      <List.Item
        title="Categories"
        description="Manage income and expense categories"
        left={(p) => <List.Icon {...p} icon="tag-multiple" />}
        right={(p) => <List.Icon {...p} icon="chevron-right" />}
        onPress={() => nav.navigate('Categories')}
      />
      <List.Item
        title="People"
        description="Manage people to tag on transactions"
        left={(p) => <List.Icon {...p} icon="account-group" />}
        right={(p) => <List.Icon {...p} icon="chevron-right" />}
        onPress={() => nav.navigate('People')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
