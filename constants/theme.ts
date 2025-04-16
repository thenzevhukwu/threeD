import { Appearance } from 'react-native';

const colorscheme = Appearance.getColorScheme();
const isDark = Appearance.getColorScheme() === 'dark';
const isLight = Appearance.getColorScheme() === 'light';

if (colorscheme === 'dark') {
  console.log('Dark mode is enabled');
}

const lightTheme = {
  primary: "#FF6B00",
  secondary: "#222831",
  background: "#F4F4F4",
  surface: "#FFFFFF",
  surfaceLight: "#FAFAFA",
  white: "#000000",
  grey: "#D9D9D9",
  accent: "#0096FF",
  text: "#222831",
  textSecondary: "#666666",
  error: "#E94560",
  inputBackground: '#FFFFFF',
  inputBorder: '#D9D9D9',
  inputText: '#000000',
  placeholder: '#999999',
  buttonText: '#FFFFFF',
  linkText: '#666666',
};

const darkTheme = {
  primary: "#FF6B00",
  secondary: "#1E1E1E",
  background: "#121212",
  surface: "#121212",
  surfaceLight: "#2A2A2A",
  white: "#EAEAEA",
  grey: "#B0B0B0",
  accent: "#E94560",
  text: "#EAEAEA",
  textSecondary: "#B0B0B0",
  error: "#E94560",
  inputBackground: '#1E1E1E',
  inputBorder: '#333333',
  inputText: '#FFFFFF',
  placeholder: '#777777',
  buttonText: '#FFFFFF',
  linkText: '#B0B0B0',
};

export const theme = isDark ? darkTheme : lightTheme;
