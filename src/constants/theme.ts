import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#5C6BC0',
    secondary: '#4CAF50',
    error: '#EF5350',
    background: '#F5F5F5',
    surface: '#FFFFFF',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7986CB',
    secondary: '#66BB6A',
    error: '#EF9A9A',
    background: '#1a1a2e',
    surface: '#16213e',
  },
};

export const INCOME_COLOR = '#4CAF50';
export const EXPENSE_COLOR = '#EF5350';
export const BALANCE_COLOR = '#5C6BC0';
