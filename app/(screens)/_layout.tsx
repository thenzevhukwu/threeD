import { Stack } from 'expo-router';
import React from 'react';
import { theme } from '@/constants/theme';

export default function ScreenLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="EditProfileScreen"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="UserProfileScreen"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Profile"
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
