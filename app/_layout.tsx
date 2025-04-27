import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MenuProvider } from 'react-native-popup-menu';
import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import ClerkAndConvexProviders from '@/providers/ClerkAndConvexProviders';
import { theme } from '@/constants/theme';

export default function RootLayout() {
  return (
    <ClerkAndConvexProviders>
      <PaperProvider>
        <SafeAreaProvider>
          <StatusBar 
            barStyle="default" // Options: 'dark-content', 'light-content', 'default'
            backgroundColor={theme.background} // Android only
            translucent={false} // Android only
          />
          <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
            <MenuProvider>
              <Slot />
            </MenuProvider>
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    </ClerkAndConvexProviders>
  );
}