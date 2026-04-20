import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from '@/screens/HomeScreen';
import TransactionListScreen from '@/screens/TransactionListScreen';
import AddEditTransactionScreen from '@/screens/AddEditTransactionScreen';
import PdfImportScreen from '@/screens/PdfImportScreen';
import ImportReviewScreen from '@/screens/ImportReviewScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import CategoriesScreen from '@/screens/CategoriesScreen';
import PeopleScreen from '@/screens/PeopleScreen';
import { ParsedRow } from '@/types';

export type RootStackParamList = {
  HomeTabs: undefined;
  AddEditTransaction: { transactionId?: string } | undefined;
  ImportReview: { parsedRows: ParsedRow[] };
};

export type HomeStackParamList = {
  Home: undefined;
};

export type TransactionsStackParamList = {
  TransactionList: undefined;
};

export type ImportStackParamList = {
  PdfImport: undefined;
  ImportReview: { parsedRows: ParsedRow[] };
};

export type SettingsStackParamList = {
  Settings: undefined;
  Categories: undefined;
  People: undefined;
};

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const TransactionsStack = createNativeStackNavigator<TransactionsStackParamList>();
const ImportStack = createNativeStackNavigator<ImportStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function TransactionsStackNav() {
  return (
    <TransactionsStack.Navigator screenOptions={{ headerShown: false }}>
      <TransactionsStack.Screen name="TransactionList" component={TransactionListScreen} />
    </TransactionsStack.Navigator>
  );
}

function ImportStackNav() {
  return (
    <ImportStack.Navigator screenOptions={{ headerShown: false }}>
      <ImportStack.Screen name="PdfImport" component={PdfImportScreen} />
      <ImportStack.Screen name="ImportReview" component={ImportReviewScreen} />
    </ImportStack.Navigator>
  );
}

function SettingsStackNav() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="Categories" component={CategoriesScreen} />
      <SettingsStack.Screen name="People" component={PeopleScreen} />
    </SettingsStack.Navigator>
  );
}

function TabNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: theme.colors.surface },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNav}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsStackNav}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ImportTab"
        component={ImportStackNav}
        options={{
          tabBarLabel: 'Import',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-upload" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNav}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="HomeTabs" component={TabNavigator} />
        <RootStack.Screen
          name="AddEditTransaction"
          component={AddEditTransactionScreen}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
