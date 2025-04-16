import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { router } from 'expo-router';
import * as ImagePicker from "expo-image-picker";
import { theme } from '@/constants/theme';

export default function EditProfileScreen() {
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const updateUsername = useMutation(api.users.updateUsername);

  const [name, setName] = useState<string>(user?.fullname || '');
  const [username, setUsername] = useState<string>(user?.username || '');
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [profileImage, setProfileImage] = useState<string>(user?.image || '');
  const [error, setError] = useState<string>('');

  const pickImage = async (type: 'profile' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      if (type === 'profile') setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      
      // First update username if changed
      if (username !== user?.username) {
        await updateUsername({ username });
      }

      // Then update other profile fields
      await updateProfile({
        fullname: name,
        bio,
        image: profileImage,
      });

      router.back();
    } catch (error) {
      setError((error as Error).message || 'Error updating profile');
      console.error('Error updating profile:', error);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>

        {/* Profile Image */}
        <View style={styles.profileImageWrapper}>
          <View style={styles.profileImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImageContent} />
            ) : (
              <Text style={{ color: '#ccc' }}>Add photo</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.cameraIcon} 
            onPress={() => pickImage('profile')}
          >
            <Ionicons name="camera" size={20} color={theme.white} />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Add your username"
            placeholderTextColor={theme.grey}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Add your name"
            placeholderTextColor={theme.grey}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Add a bio"
            placeholderTextColor={theme.grey}
            multiline
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    fontSize: 16,
    color: '#1DA1F2',
    fontWeight: '600',
  },
  bannerContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#000',
  },
  bannerPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  profileImageWrapper: {
    marginTop: 20,
    marginLeft: 16,
    position: 'relative', // Added to contain absolute positioned children
    width: 80, // Added explicit width to match profileImage
    height: 80, // Added explicit height to match profileImage
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.surface,  // Made background darker
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.background,
  },
  cameraIcon: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }], // Center the icon
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
    borderRadius: 20,
    padding: 8,
    zIndex: 1, // Ensure icon stays on top
  },
  formContainer: {
    marginTop: 20,   // Reduced from 50
    paddingHorizontal: 16,
    backgroundColor: theme.background,
  },
  label: {
    marginTop: 20,
    fontSize: 14,
    color: '#555',
    fontWeight: 'bold',
  },
  input: {
    marginTop: 8,
    backgroundColor: theme.surfaceLight,  // Made input darker
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.white,
  },
  professionalButton: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#1DA1F2',
    alignItems: 'center',
  },
  professionalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1DA1F2',
    alignItems: 'center',
  },
  tipsButtonText: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: '600',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  profileImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
});
