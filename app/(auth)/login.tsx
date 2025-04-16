import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSSO } from '@clerk/clerk-expo';

export default function LoginScreen() {

  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try{
      const { createdSessionId, setActive} = await startSSOFlow({ strategy: "oauth_google" });

      if(setActive && createdSessionId) {
        setActive({ session: createdSessionId});
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("OAuth error: ", error)
    }
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Image source={require('@/assets/images/3d-logo.png')} style={styles.logo} />
        <Text style={styles.title}>threeD</Text>
      </View>

      <View style={styles.text}>
        <Text style={styles.title_1}>
          Bring your ideas to life in 3D
        </Text>
        <Text style={styles.subtitle}>
          Create stunning 3D models and render them with ease
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => handleGoogleSignIn()}>
        <Ionicons name="logo-google" size={20} color={"white"} />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: theme.text,
  },
  title_1: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: theme.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: theme.textSecondary,
  },
  text: {
    margin: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: theme.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.white,
  },
});
