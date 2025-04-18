import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import InitialLayout from '@/components/InitialLayout';
import ClerkAndConvexProviders from '@/providers/ClerkAndConvexProviders';
import { theme } from '@/constants/theme';
import { MenuProvider } from 'react-native-popup-menu';

export default function RootLayout() {
  return (
    <ClerkAndConvexProviders>
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
          <MenuProvider>
            <InitialLayout />
          </MenuProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </ClerkAndConvexProviders>

  );
}