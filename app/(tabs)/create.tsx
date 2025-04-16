import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, TextInput } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { styles } from '@/styles/create.styles';
import { useUser } from '@clerk/clerk-expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '@/constants/theme';
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image"
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function CreateScreen() {

  const router = useRouter();
  const { user } = useUser();

  const [caption, setCaption] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Move useVideoPlayer to top level with a valid initial value
  const player = useVideoPlayer(selectedMedia?.type === 'video' ? selectedMedia.uri : '');

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      // Check if it's a video by looking at the URI extension
      const isVideo = asset.uri.toLowerCase().endsWith('.mov') || 
                     asset.uri.toLowerCase().endsWith('.mp4');
      setSelectedMedia({ 
        uri: asset.uri, 
        type: isVideo ? 'video' : 'image' 
      });
    }
  };

  const generateUploadUrl = useMutation(api.posts.generateUploadUrl)
  const createPost = useMutation(api.posts.createPost)

  const handleShare = async () => {
    if (!selectedMedia) return;

    try {
      setIsSharing(true);
      const uploadUrl = await generateUploadUrl();

      // Get the file extension from the URI
      const extension = selectedMedia.uri.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg'; // default

      // Set proper MIME type for videos
      if (selectedMedia.type === 'video') {
        mimeType = extension === 'mov' ? 'video/quicktime' : 'video/mp4';
      }

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, selectedMedia.uri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        mimeType: mimeType,
        headers: {
          'Content-Type': mimeType,
        }
      });

      if (uploadResult.status !== 200) {
        throw new Error("Upload failed: " + uploadResult.body);
      }

      const { storageId } = JSON.parse(uploadResult.body);
      await createPost({ 
        storageId, 
        caption,
        mediaType: selectedMedia.type
      });

      setSelectedMedia(null);
      setCaption("");
      router.push("/(tabs)");

    } catch (error) {
      console.error("Error sharing post:", error); 
    } finally {
      setIsSharing(false); 
    }
  }

  if (!selectedMedia) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <View style={{width: 28}} />
        </View>

        <TouchableOpacity style={styles.emptyImageContainer} onPress={pickMedia}>
          <Ionicons name="cloud-upload-outline" size={32} color={theme.grey} />
          <Text style={styles.emptyImageText}>Tap to select an image or video</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderMedia = () => {
    if (selectedMedia?.type === 'video' && player) {
      return (
        <View style={styles.imageSection}>
          <VideoView 
            style={styles.previewImage} 
            player={player}
            nativeControls={true}
            contentFit='contain'
          />
        </View>
      );
    }
    return (
      <View style={styles.imageSection}>
        <Image
          source={selectedMedia.uri}
          style={styles.previewImage}
          contentFit="contain"
          transition={200}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS == "ios" ? 100 : 0}
    >
      <View style={styles.contentContainer}>
        {/* Headers */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setSelectedMedia(null);
              setCaption("");
            }}
            disabled={isSharing}>

              <Ionicons
                name="close-outline"
                size={28}
                color={isSharing ? theme.grey : theme.white}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Post</Text>
            <TouchableOpacity  
              style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
              disabled={isSharing || !selectedMedia}
              onPress={handleShare}
              
            >
              {isSharing ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={styles.shareText}>Share</Text>
              )}
            </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentOffset={{ x: 0, y: -100}}
        >
          <View style={[styles.content, isSharing && styles.contentDisabled]}>
            {/* Media Section */}
            {renderMedia()}

            {/* Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.captionContainer}>
                <Image
                  source={user?.imageUrl}
                  style={styles.userAvatar}
                  contentFit="cover"
                  transition={200}
                />
                <TextInput 
                  style={styles.captionInput}
                  placeholder="Write a caption..."
                  placeholderTextColor={theme.grey}
                  multiline
                  value={caption}
                  onChangeText={setCaption}
                  editable={!isSharing}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}