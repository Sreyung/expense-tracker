import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { PaperProvider, ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { runMigrations } from '@/db/migrations/migrate';
import { useCategoryStore } from '@/stores/categoryStore';
import { usePeopleStore } from '@/stores/peopleStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { setCategoryMap } from '@/services/pdfParser';
import { lightTheme, darkTheme } from '@/constants/theme';
import AppNavigator from '@/navigation/AppNavigator';
import { currentYearMonth } from '@/utils/dateHelpers';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const { load: loadCategories, categories } = useCategoryStore();
  const { load: loadPeople } = usePeopleStore();
  const { loadMonth } = useTransactionStore();

  useEffect(() => {
    async function init() {
      try {
        await runMigrations();
        await Promise.all([loadCategories(), loadPeople()]);
        const { year, month } = currentYearMonth();
        await loadMonth(year, month);
        setReady(true);
      } catch (e) {
        setError(String(e));
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      const map: Record<string, string> = {};
      for (const c of categories) map[c.name] = c.id;
      setCategoryMap(map);
    }
  }, [categories]);

  if (error) {
    return (
      <PaperProvider theme={theme}>
        <View style={styles.center}>
          <Text variant="titleMedium">Failed to initialize database</Text>
          <Text variant="bodySmall" style={{ marginTop: 8, opacity: 0.6 }}>{error}</Text>
        </View>
      </PaperProvider>
    );
  }

  if (!ready) {
    return (
      <PaperProvider theme={theme}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={{ marginTop: 16 }}>Loading...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <AppNavigator />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
