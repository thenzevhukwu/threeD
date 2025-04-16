import { View, Text } from 'react-native'
import React, { useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@clerk/clerk-expo'
import { Stack, useRouter, useSegments } from 'expo-router'

export default function InitialLayout() {
    const {isLoaded, isSignedIn} = useAuth()
    const segments = useSegments();
    const router = useRouter();

    const handleAuthNavigation = useCallback(() => {
        if(!isLoaded) return;

        const inAuthPage = segments[0] === "(auth)";
        
        if(!isSignedIn && !inAuthPage) {
            router.replace("/(auth)/login");
            return;
        } 
        
        if(isSignedIn && inAuthPage) {
            router.replace('/(tabs)');
        }
    }, [isLoaded, isSignedIn, segments, router]);

    useEffect(() => {
        handleAuthNavigation();
    }, [handleAuthNavigation]);

    const screenOptions = useMemo(() => ({ headerShown: false }), []);

    if (!isLoaded) return null;

    return <Stack screenOptions={screenOptions} />;
}