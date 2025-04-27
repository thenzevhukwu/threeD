import React, { useState } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Avatar, Badge, Searchbar, Text, Modal } from "react-native-paper";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { theme } from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MessageDetail from "@/app/(screens)/MessageDetail"
import { router } from "expo-router";

function NewChatDialog({ visible, onDismiss, onSelectUser }: {
  visible: boolean;
  onDismiss: () => void;
  onSelectUser: (userId: Id<"users">) => void;
}) {
  const [search, setSearch] = useState("");
  const users = useQuery(api.users.getAllUsers) || [];
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.fullname?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Message</Text>
            <View style={{ width: 24 }} />
          </View>
          <Searchbar
            placeholder="Search users"
            value={search}
            onChangeText={setSearch}
            style={styles.modalSearch}
            placeholderTextColor={theme.grey}
            iconColor={theme.grey}
            inputStyle={{ color: theme.white }}
          />
        </View>
        
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No users found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={user => user._id}
            contentContainerStyle={styles.userList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.userRow}
                onPress={() => {
                  onSelectUser(item._id);
                  onDismiss();
                }}
              >
                {item.image ? (
                  <Avatar.Image size={40} source={{ uri: item.image }} />
                ) : (
                  <Avatar.Text size={40} label={item.fullname?.[0] || item.username[0]} />
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.fullname || item.username}</Text>
                  {item.fullname && <Text style={styles.userHandle}>@{item.username}</Text>}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function Messages() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Id<"users"> | null>(null);
  const [newChatVisible, setNewChatVisible] = useState(false);
  const chats = useQuery(api.messages.getChatList) || [];

  const currentUser = useQuery(api.users.getCurrentUser);
  const markAsRead = useMutation(api.messages.markAsRead);

  const filterChats = (chats: any[]) => {
    return chats.filter((chat) => 
      chat.name.toLowerCase().includes(search.toLowerCase())
    );
  };
  
  const handleOpenChat = async (chat: any) => {
    const lastSenderId = chat.lastSenderId;
    const isUnread = chat.unreadCount > 0;

    if (currentUser && lastSenderId !== currentUser._id && isUnread) {
      await markAsRead({ messageIds: chat.messageIds });
    }

    setSelected(chat.id);
  };



  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
          placeholderTextColor={theme.grey}
          iconColor={theme.grey}
          selectionColor={theme.grey}
          inputStyle={{ color: theme.white, paddingBottom: 25, textAlignVertical: 'center' }}
        />
        <TouchableOpacity onPress={() => console.log("Settings")}>
          <Ionicons name="settings" size={22} color={theme.grey} style={styles.settingsButton}/>
        </TouchableOpacity>
      </View>

      {filterChats(chats).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No messages found</Text>
        </View>
      ) : (
        <FlatList
          data={filterChats(chats)}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => (
            <View>
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => handleOpenChat(item)}
            >
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: "/(screens)/UserProfileScreen",
                  params: { userId: item.id }
                })}>
                  <Avatar.Image size={36} source={{ uri: item.image }}/>
              </TouchableOpacity>
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  
                  <Text style={styles.chatName} numberOfLines={1} ellipsizeMode="tail">{item.fullname}</Text>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    {item.unreadCount > 0 && (
                      <Badge style={styles.badge}>{item.unreadCount}</Badge>
                    )}
                  </View>
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.lastMessage, item.muted && styles.mutedText]}
                >
                  {item.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
            </View>
          )}
        />
      )}

      <MessageDetail
        chatId={selected}
        onClose={() => setSelected(null)}
      />

      <NewChatDialog
        visible={newChatVisible}
        onDismiss={() => setNewChatVisible(false)}
        onSelectUser={(userId) => {
          setSelected(userId);
          setNewChatVisible(false);
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setNewChatVisible(true)}
      >
        <Ionicons name="mail-outline" size={24} color={theme.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  searchBar: {
    flex: 1,
    backgroundColor: theme.surfaceLight,
    borderRadius: 10,
    height: 40
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    marginVertical: 5,
  },
  settingsButton: {
    marginLeft: 8,
  },
  chatList: {
    paddingHorizontal: 16,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.white,
    
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: theme.grey,
    marginRight: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  mutedText: {
    color: theme.grey,
  },
  mutedAvatar: {
    opacity: 0.6,
  },
  badge: {
    backgroundColor: theme.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: theme.primary,
    width: 52,
    height: 52,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.surface,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.white,
  },
  modalSearch: {
    backgroundColor: theme.surfaceLight,
    elevation: 0,
    borderRadius: 10,
    marginTop: 4,
  },
  userList: {
    paddingHorizontal: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.surface,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.white,
  },
  userHandle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.grey,
  },
});
