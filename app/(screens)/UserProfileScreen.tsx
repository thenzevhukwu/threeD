import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader } from '@/components/Loader';
import { styles } from '@/styles/userprofile.styles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Id } from '@/convex/_generated/dataModel';
import Post from '@/components/Post';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Posts');
  const [refreshToken, setRefreshToken] = useState(Date.now());

  // Query user data
  const user = useQuery(api.users.getUser, { userId: userId as Id<"users"> });
  const isFollowing = useQuery(api.users.isFollowing, { userId: userId as Id<"users"> });
  const posts = useQuery(api.posts.getFeedPosts, { refreshToken });
  const toggleFollow = useMutation(api.users.toggleFollow);

  const handleFollow = useCallback(async () => {
    try {
      await toggleFollow({ userId: userId as Id<"users"> })
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }, [userId, toggleFollow]);

  // Memoize filtered posts
  const userPosts = React.useMemo(() => {
    return posts?.filter(post => post.author._id === userId) ?? [];
  }, [posts, userId]);

  const renderTabContent = useCallback(() => {
    switch (selectedTab) {
      case 'Posts':
        return (
          <ScrollView>
            {userPosts.map((post) => (
              <Post key={post._id} post={post} />
            ))}
          </ScrollView>
        );
      case 'Replies':
        return (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No replies yet.</Text>
          </View>
        );
      default:
        return null;
    }
  }, [selectedTab, userPosts]);

  if (!user || isFollowing === undefined || !posts) return <Loader />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.white} />
        </TouchableOpacity>
        <Feather name="more-vertical" size={24} color={theme.white} />
      </View>

      <View style={styles.profileRow}>
        <Image 
            source={{ uri: user.image }}
            style={styles.profileImage}
        />
        <TouchableOpacity 
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleFollow}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.nameSection}>
        <View style={styles.nameRow}>
            <Text style={styles.name}>{user.fullname}</Text>
        </View>
        <Text style={styles.handle}>@{user.username}</Text>
      </View>

      <Text style={styles.bio}>{user.bio}</Text>

      <View style={styles.followSection}>
        <Text style={styles.followText}>
          <Text style={styles.bold}>{user.following}</Text> Following
        </Text>
        <Text style={styles.followText}>
          <Text style={styles.bold}>{user.followers}</Text> Followers
        </Text>
      </View>
    
      <View style={styles.tabRow}>
        {['Posts', 'Replies', 'Highlights', 'Articles'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabButton, selectedTab === tab && styles.selectedTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.selectedTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}
    </View>
  );
}