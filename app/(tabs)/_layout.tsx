import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '@/constants/theme';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.grey,
        headerShown: false,
        tabBarStyle: {
          height: 45,
          backgroundColor: theme.background,
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
          paddingBottom: 0,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarHideOnKeyboard: true,
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons name={focused ? 'add' : 'add-outline'} size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="bookmark"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="messaging"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons name={focused ? 'mail' : 'mail-outline'} size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons name={focused ? 'build' : 'build-outline'} size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
