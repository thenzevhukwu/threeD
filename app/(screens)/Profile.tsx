import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Post from '@/components/Post';
import { Loader } from '@/components/Loader';
import { theme } from '@/constants/theme';
import { router } from 'expo-router';

const NoPostsFound = () => (
  <View style={styles.noPostsContainer}>
    <Text style={styles.noPostsText}>No posts found</Text>
  </View>
);

export default function ProfileScreen() {
  const [selectedTab, setSelectedTab] = useState('Posts');
  const [refreshToken, setRefreshToken] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  const user = useQuery(api.users.getCurrentUser);
  const posts = useQuery(api.posts.getFeedPosts, { refreshToken });

  // Memoize filtered posts
  const userPosts = React.useMemo(() => {
    return posts?.filter(post => post.author._id === user?._id) ?? [];
  }, [posts, user?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshToken(Date.now());
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  const renderTabContent = useCallback(() => {
    switch (selectedTab) {
      case 'Posts':
        if (userPosts.length === 0) {
          return <NoPostsFound />;
        }
        return (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          >
            {userPosts.map((post) => (
              <Post 
                key={post._id} 
                post={post} 
                isVisible={true} 
              />
            ))}
          </ScrollView>
        );
      case 'Replies':
        return (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No replies yet.</Text>
          </View>
        );
      case 'Highlights':
        return (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No highlights yet.</Text>
          </View>
        );
      case 'Articles':
        return (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No articles yet.</Text>
          </View>
        );
      default:
        return null;
    }
  }, [selectedTab, userPosts, refreshing, onRefresh]);

  if (!user || !posts) {
    return <Loader />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.white} />
        </TouchableOpacity>
        <Feather name="more-vertical" size={24} color={theme.white} />
      </View>

      {/* Profile Picture + Edit */}
      <View style={styles.profileRow}>
        <Image
          source={{ uri: user.image }}
          style={styles.profileImage}
        />
        <TouchableOpacity 
          style={[styles.editProfileButton, { backgroundColor: theme.surface }]}
          onPress={() => router.push('./EditProfileScreen')}
        >
          <Text style={[styles.editText, { color: theme.white }]}>Edit profile</Text>
        </TouchableOpacity>
      </View>

      {/* Username Editor */}
      <View style={styles.nameSection}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.white }]}>{user.fullname}</Text>
        </View>
        <Text style={[styles.handle, { color: theme.grey }]}>@{user.username}</Text>
      </View>

      {/* Bio */}
      <Text style={[styles.bio, { color: theme.white }]}>{user.bio}</Text>

      {/* Follower stats */}
      <View style={styles.followSection}>
        <Text style={[styles.followText, { color: theme.white }]}>
          <Text style={styles.bold}>{user.following}</Text> Following
        </Text>
        <Text style={[styles.followText, { color: theme.white }]}>
          <Text style={styles.bold}>{user.followers}</Text> Followers
        </Text>
      </View>

      {/* Updated Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: theme.surface }]}>
        {['Posts', 'Replies', 'Highlights', 'Articles'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[
              styles.tabButton,
              selectedTab === tab && [{ borderBottomColor: theme.primary }]
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[
              styles.tabText,
              { color: theme.grey },
              selectedTab === tab && { color: theme.white }
            ]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  editProfileButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editText: {
    fontSize: 14,
  },
  nameSection: {
    marginTop: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  handle: {
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    marginTop: 12,
    fontSize: 15,
  },
  infoSection: {
    marginTop: 10,
  },
  link: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    marginTop: 2,
  },
  followSection: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },
  followText: {
    fontSize: 14,
  },
  bold: {
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingBottom: 8,
  },
  tabButton: {
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: '600',
  },
  emptySection: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
  },
  editContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  usernameInput: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveButtonText: {
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 6,
  },
  cancelButtonText: {
  },
  editButton: {
    marginLeft: 12,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 12,
  },
  noPostsContainer: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPostsText: {
    fontSize: 20,
    color: theme.primary,
  },
});