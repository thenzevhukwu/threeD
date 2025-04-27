import React, { ComponentProps, useEffect, useState } from "react";
import {
  Modal, SafeAreaView, View, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
  TouchableOpacity, StyleSheet,
  ActivityIndicator,
  Linking, Image,
  TouchableWithoutFeedback
} from "react-native";
import { Text, Avatar, IconButton } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video } from 'expo-av';
import { useVideoPlayer, VideoView } from 'expo-video'
import { theme } from "@/constants/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  _id: Id<"messages">;
  senderId: Id<"users">;
  recipientId: Id<"users">;
  text?: string;
  file?: {
    url: string;
    name: string;
    mimeType: string;
    size: number;
  };
  voiceNote?: {
    url: string;
    duration: number;
    mimeType: string;
  };
  sentAt: number;
  readAt?: number;
  archived: boolean;
  muted: boolean;
  blocked: boolean;
}

function MessageVideo({ uri }: { uri: string }) {
  // Initialize the player; loop and autoplay if you like
  const player = useVideoPlayer(
    { uri },
    player => {
      player.loop = false;
    }
  );
  return (
    <VideoView
      player={player}
      style={styles.videoPreview}
      nativeControls
      allowsFullscreen
      allowsPictureInPicture
      contentFit="contain"
    />
  );
}


export default function MessageDetail({
  chatId,
  onClose
}: {
  chatId: Id<"users"> | null;
  onClose: () => void;
}) {
  const me = useQuery(api.users.getCurrentUser);
  const recipient = useQuery(api.users.getUser, chatId ? { userId: chatId } : "skip");
  const history = useQuery(api.messages.getChatHistory, me && chatId ? {
    userA: me._id,
    userB: chatId,
    limit: 50
  } : "skip") || [];
  const sendMessage = useMutation(api.messages.sendMessage);
  const markRead = useMutation(api.messages.markAsRead);

  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<Id<"messages"> | null>(null);
  const [downloadingVoiceId, setDownloadingVoiceId] = useState<Id<"messages"> | null>(null);
  const [downloadedVoiceIds, setDownloadedVoiceIds] = useState<Id<"messages">[]>([]);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadedFileIds, setDownloadedFileIds] = useState<string[]>([]);
  const [attachVisible, setAttachVisible] = useState(false);

  const handleAttachment = () => setAttachVisible(true);
  const closeAttachment = () => setAttachVisible(false);

  const playVoiceNote = async (uri: string, messageId: Id<"messages">) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
      }
      const localUri = await downloadAndCacheFile(uri, `voicenote_${messageId}.m4a`);
      if (!localUri) return;
      
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: localUri });
      setSound(newSound);
      setPlayingId(messageId);

      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate(async status => {
        if (status.isLoaded && status.didJustFinish) {
          try {
            await newSound.stopAsync();
            await newSound.unloadAsync();
          } catch { /* ignore */ }
          setSound(null);
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.error("Error playing voice note:", e);
    }
  };

  const stopVoiceNote = async () => {
    if (!sound) return;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingId(null);
    } catch (error) {
      console.error("Error stopping/unloading voice note:", error);
    } finally {
      setSound(null);
      setPlayingId(null);
    }
  };

  useEffect(() => {
    if (history.length) {
      markRead({ messageIds: history.filter(m => !m.readAt).map(m => m._id) });
    }
  }, [history]);

  const handleSend = async () => {
    if (!text.trim() || !me || !chatId) return;
    await sendMessage({
      senderId: me._id,
      recipientId: chatId,
      text: text.trim()
    });
    setText("");
  }; 

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    if (!recording || !me || !chatId) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        const durationMillis = await recording.getStatusAsync()
          .then(status => status.durationMillis || 0);
        await sendMessage({
          senderId: me._id,
          recipientId: chatId,
          voiceNote: {
            url: uri,
            duration: durationMillis,
            mimeType: 'audio/m4a'
          }
        });
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
    setRecording(null);
    setIsRecording(false);
  };

  const downloadAndCacheFile = async (url: string, filename: string): Promise<string | null> => {
    try {
      if (url.startsWith("file://")) {
        return url;
      }
      const key = `downloaded_${filename}`;
      const cachedPath = await AsyncStorage.getItem(key);
      if (cachedPath) {
        const fileExists = await FileSystem.getInfoAsync(cachedPath);
        if (fileExists.exists) {
          return cachedPath;
        } else {
          await AsyncStorage.removeItem(key);
        }
      }
      const localPath = FileSystem.documentDirectory + filename;
      const downloadRes = await FileSystem.downloadAsync(url, localPath);
      await AsyncStorage.setItem(key, downloadRes.uri);
      return downloadRes.uri;
    } catch (error) {
      console.error("Failed to download or cache:", error);
      return null;
    }
  };

  const getFileIcon = (mimeType: string): keyof typeof Ionicons.glyphMap => {
    if (!mimeType) return 'document-outline';
    if (mimeType.startsWith('image/')) return 'image-outline';
    if (mimeType.startsWith('video/')) return 'videocam-outline';
    if (mimeType.startsWith('audio/')) return 'musical-notes-outline';
    if (mimeType === 'application/pdf') return 'document-text-outline';
    if (
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return 'document-outline';
    if (
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
      return 'grid-outline';
    if (
      mimeType === 'application/vnd.ms-powerpoint' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    )
      return 'easel-outline';
    if (mimeType === 'application/zip' || mimeType === 'application/x-rar-compressed')
      return 'archive-outline';
    return 'document-outline';
  };

  const sendFileMessage = async (uri: string, name: string, mimeType: string) => {
    if (!me || !chatId) return;
    const stats = await FileSystem.getInfoAsync(uri, { size: true });
    await sendMessage({
      senderId: me._id,
      recipientId: chatId,
      file: {
        url: uri,
        name,
        mimeType,
        size: (stats as any).size || 0
      }
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!result.canceled) {
      const asset = result.assets[0];
      await sendFileMessage(asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
    }
  };

  const pickAudioFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (!result.canceled) {
      const asset = result.assets[0];
      await sendFileMessage(asset.uri, asset.name, asset.mimeType || 'audio/*');
    }
  };

  const pickFromCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return;
  
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos', 'livePhotos'],  // images + videos
      quality: 0.8,
    });
  
    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = uri.split('/').pop()!;
  
      // derive mimeType from asset.type and/or file extension
      const mimeType =
        asset.type === 'video'
          ? 'video/mp4'
          : uri.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';
  
      await sendFileMessage(uri, name, mimeType);
    }
  };
  
  const pickFromGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos', 'livePhotos'],
      quality: 0.8,
    });
  
    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = uri.split('/').pop()!;
  
      const mimeType =
        asset.type === 'video'
          ? 'video/mp4'
          : uri.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';
  
      await sendFileMessage(uri, name, mimeType);
    }
  };

  type IoniconName = ComponentProps<typeof Ionicons>['name'];
  const options : {
    icon: IoniconName;
    label: string;
    onPress: () => void;
  }[] = [
    { icon: "document-outline", label: "Document", onPress: async () => pickDocument()},
    { icon: "camera-outline", label: "Camera", onPress: () => pickFromCamera() },
    { icon: "image-outline", label: "Gallery", onPress: () => pickFromGallery() },
    { icon: "headset-outline", label: "Audio", onPress: () => pickAudioFile() }
  ];
  
  const [filePreviewUris, setFilePreviewUris] = useState<Record<string,string>>({});
  const loadFilePreview = async (
    remoteUri: string,
    messageId: Id<"messages">,
    filename: string
  ) => {
    // reuse your downloadAndCacheFile
    const localUri = await downloadAndCacheFile(remoteUri, filename);
    if (!localUri) return;

    let displayUri = localUri;
    if (Platform.OS === "android") {
      try {
        // turn file:// into content:// so <Image> can load it
        displayUri = (await FileSystem.getContentUriAsync(localUri));
      } catch {
        // fallback to file:// if conversion fails
      }
    }

    setFilePreviewUris(prev => ({
      ...prev,
      [messageId]: displayUri
    }));
  };

  const renderMessage = (m: Message) => {
    const isSent = m.senderId === me?._id;
    const isRead = m.readAt !== undefined;
    const isDownloaded = m.voiceNote ? downloadedVoiceIds.includes(m._id) : false;

    return (
      <View
        key={m._id}
        style={[
          styles.bubble,
          isSent ? styles.sent : styles.received
        ]}
      >
        {m.text && <Text style={{ color: theme.white }}>{m.text}</Text>}

        {m.file && (
          <View style={styles.file}>
            {/* IMAGE */}
            {m.file.mimeType.startsWith("image/") && (
              filePreviewUris[m._id] ? (
                <Image
                  source={{ uri: filePreviewUris[m._id] }}
                  style={styles.imagePreview}
                />
              ) : (
                <>
                  {downloadingFileId === m._id ? (
                    <ActivityIndicator size={20} color={theme.white} style={{ marginLeft: 10 }} />
                  ) : (
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color={theme.white}
                      style={{ marginLeft: 10 }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => loadFilePreview(m.file!.url, m._id, m.file!.name)}
                  >
                    <View style={[styles.attachment, { flexShrink: 1, flexWrap: 'wrap', maxWidth: '80%' }]}>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.white }}>
                        {m.file.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        ({(m.file.size / 1024).toFixed(1)} KB)
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )
            )}

            {/* VIDEO */}
            {m.file.mimeType.startsWith("video/") && (
              filePreviewUris[m._id] ? (
                <MessageVideo uri={filePreviewUris[m._id]} />
              ) : (
                <>
                  {downloadingFileId === m._id ? (
                    <ActivityIndicator size={20} color={theme.white} style={{ marginLeft: 10 }} />
                  ) : (
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color={theme.white}
                      style={{ marginLeft: 10 }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => loadFilePreview(m.file!.url, m._id, m.file!.name)}
                  >
                    <View style={[styles.attachment, { flexShrink: 1, flexWrap: 'wrap', maxWidth: '80%' }]}>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.white }}>
                        {m.file.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        ({(m.file.size / 1024).toFixed(1)} KB)
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )
            )}

            {/* OTHER FILE TYPES */}
            {!m.file.mimeType.startsWith("image/") &&
            !m.file.mimeType.startsWith("video/") && (
              <>
                <TouchableOpacity
                  onPress={async () => {
                    if (downloadedFileIds.includes(m._id)) {
                      try {
                        const path = await downloadAndCacheFile(m.file!.url, m.file!.name);
                        const cUri = await FileSystem.getContentUriAsync(path!);
                        await Linking.openURL(cUri);
                      } catch (e) {
                        console.error(e);
                      }
                    } else {
                      setDownloadingFileId(m._id);
                      const path = await downloadAndCacheFile(m.file!.url, m.file!.name);
                      setDownloadingFileId(null);
                      if (path) setDownloadedFileIds(prev => [...prev, m._id]);
                    }
                  }}
                >
                  {downloadingFileId === m._id ? (
                    <ActivityIndicator size={24} color={theme.white} style={{ marginLeft: 10 }} />
                  ) : (
                    <Ionicons
                      name={downloadedFileIds.includes(m._id)
                        ? getFileIcon(m.file.mimeType)
                        : "download-outline"}
                      size={24}
                      color={theme.white}
                      style={{ marginLeft: 10 }}
                    />
                  )}
                </TouchableOpacity>
                <View style={[styles.attachment, { flexShrink: 1, flexWrap: 'wrap', maxWidth: '80%' }]}>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: theme.white }}>
                    {m.file.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    ({(m.file.size / 1024).toFixed(1)} KB)
                  </Text>
                </View>
              </>
            )}
          </View>
        )}


        {m.voiceNote && (
          <View style={styles.voiceNote}>
            <TouchableOpacity
              onPress={async () => {
                if (isDownloaded) {
                  playingId === m._id ? await stopVoiceNote() : await playVoiceNote(m.voiceNote!.url, m._id);
                } else {
                  setDownloadingVoiceId(m._id);
                  const localUri = await downloadAndCacheFile(m.voiceNote!.url, `voicenote_${m._id}.m4a`);
                  setDownloadingVoiceId(null);
                  if (localUri) setDownloadedVoiceIds(prev => [...prev, m._id]);
                }
              }}
            >
              {downloadingVoiceId === m._id ? (
                <ActivityIndicator size={24} color={theme.white} />
              ) : (
                <Ionicons
                  name={isDownloaded ? (playingId === m._id ? "pause" : "play") : "download-outline"}
                  size={24}
                  color={theme.white}
                />
              )}
            </TouchableOpacity>
            <Text style={{ marginLeft: 10, color: theme.white }}>Voice Message</Text>
            <Text style={{ marginLeft: 10, color: theme.white }}>
              ({Math.round(m.voiceNote.duration / 1000)}s)
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4, alignSelf: 'flex-end', gap: 8 }}>
          <Text style={{ color: theme.white, fontSize: 11 }}>
            {new Intl.DateTimeFormat(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }).format(m.sentAt)}
          </Text>

          {isSent && (
            <Ionicons
              name={isRead ? "checkmark-done" : "checkmark"}
              size={16}
              color={isRead ? theme.white : theme.inputBackground}
            />
          )}
        </View>
      </View>
    );
  };

  if (!chatId || !me || !recipient) return null;
  return (
    <Modal animationType="slide" visible onRequestClose={onClose} transparent>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={theme.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Avatar.Image size={36} source={{ uri: recipient.image }} />
            <Text style={styles.headerName}>{recipient.fullname || recipient.username}</Text>
          </View>
        </View>
        <ScrollView style={styles.history}>
          {history.map(renderMessage)}
          <View style={{ height: 20 }} />
        </ScrollView>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputRow}
        >
          <IconButton
            icon="attachment"
            size={24}
            onPress={handleAttachment}
            iconColor={theme.white}
          />
          <IconButton
            icon={isRecording ? "stop" : "microphone"}
            size={24}
            onPress={isRecording ? stopRecording : startRecording}
            style={isRecording ? styles.recording : styles.notrecording}
            iconColor={theme.white}
          />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={theme.grey}
            style={styles.input}
            maxLength={250}
          />
          <TouchableOpacity onPress={handleSend}>
            <Ionicons name="send" size={24} color={theme.primary}  style={{marginLeft: 10}}/>
          </TouchableOpacity>
        </KeyboardAvoidingView>

        {/* Attachment Menu Modal */}
        <Modal
          animationType="fade"
          visible={attachVisible}
          transparent
          onRequestClose={closeAttachment}
        >
          <TouchableWithoutFeedback onPress={closeAttachment}>
            <View style={styles.overlay}>
              <View style={styles.attachContainer}>
                {options.map(opt => (
                  <TouchableOpacity
                    key={opt.label}
                    style={styles.attachItem}
                    onPress={() => {
                      opt.onPress();
                      closeAttachment();
                    }}
                  >
                    <Ionicons name={opt.icon} size={28} color={theme.primary} />
                    <Text style={styles.attachLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  header: { flexDirection: "row", alignItems: "center", padding: 12 },
  headerInfo: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  headerName: { marginLeft: 8, fontSize: 16, fontWeight: "bold", color: theme.white },
  history: { flex: 1, padding: 12 },
  bubble: { padding: 6, borderRadius: 14, marginVertical: 4, maxWidth: "75%", position: 'relative' },
  sent: { alignSelf: "flex-end", backgroundColor: theme.primary, borderBottomRightRadius: 0 },
  received: { alignSelf: "flex-start", backgroundColor: theme.surfaceLight, borderTopLeftRadius: 0 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  input: {
    flex: 1,
    padding: 8,
    borderRadius: 16,
    backgroundColor: theme.surfaceLight,
    color: theme.white,
    },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.surfaceLight,
    borderRadius: 12,
    borderBottomRightRadius: 0,
  },
  attachment: {
    alignItems: "flex-start",
    backgroundColor: theme.surfaceLight,
    padding: 8,
    borderRadius: 4,
    marginVertical: 4
  },
  fileSize: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 12,
    color: '#666'
  },
  voiceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceLight,
    borderRadius: 12,
    padding: 8,
    marginVertical: 4,
  },
  recording: {
    backgroundColor: theme.primary,
  },
  notrecording: {
    backgroundColor: theme.surfaceLight,
  },
  badge: {
    backgroundColor: "transparent",
  },
  fileName: {
    flexShrink: 1,
    flexWrap: 'wrap',
    fontSize: 14,
    color: theme.text,
    maxWidth: '80%',
    marginTop: 4,
    marginBottom: 2,
    marginLeft: 4,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginVertical: 4,
  },
  videoPreview: {
    width: '100%',  // Take up available width in the bubble
    maxWidth: 240,
    height: undefined, // Height will be determined by aspectRatio
    aspectRatio: 16/9, // Common video aspect ratio
    borderRadius: 8,
    marginVertical: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },
  attachContainer: {
    backgroundColor: theme.background,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  attachItem: {
    width: "25%",
    alignItems: "center",
    marginBottom: 24,
  },
  attachLabel: {
    marginTop: 6,
    fontSize: 12,
    color: theme.white,
  },
});
