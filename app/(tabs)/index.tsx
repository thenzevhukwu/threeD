import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { styles } from '@/styles/feed.styles';
import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader } from '@/components/Loader';
import Post from '@/components/Post';

import { theme } from '@/constants/theme';

export default function HomeScreen() {
  const [selectedTab, setSelectedTab] = useState('For You');
  const [refreshToken, setRefreshToken] = React.useState(Date.now());
  const [refreshing, setRefreshing] = React.useState(false);

  const { signOut } = useAuth();
  const router = useRouter();

  const posts = useQuery(api.posts.getFeedPosts, { refreshToken });
  const followingPosts = useQuery(api.posts.getFollowingPosts, { refreshToken });
  const currentUser = useQuery(api.users.getCurrentUser);

  const [visiblePosts, setVisiblePosts] = React.useState<string[]>([]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setRefreshToken(Date.now()); // Force refetch
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  // Render helpers
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'For You':
        if (posts?.length === 0) {
          return <NoPostsFound />;
        }
        else {
          return (
            <View>
              <FlatList
                data={posts}
                renderItem={({ item }) => (
                  <Post post={item} isVisible={visiblePosts.includes(item._id)} />
                )}
                keyExtractor={item => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.primary]} // Android
                    tintColor={theme.primary} // iOS
                  />
                }
              />
              <ScrollView
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.primary]}
                    tintColor={theme.primary}
                  />
                }
              >
              </ScrollView>
            </View>
            
          );
        }
        
      case 'Following':
        if (!followingPosts) return <Loader />;
        if (followingPosts.length === 0) {
          return (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>
                No posts from people you follow yet.
              </Text>
            </View>
          );
        }
        return (
          <View>
            <FlatList
              data={followingPosts}
              renderItem={({ item }) => (
                <Post post={item} isVisible={visiblePosts.includes(item._id)} />
              )}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}  
                  onRefresh={onRefresh}
                  colors={[theme.primary]}
                  tintColor={theme.primary}
                />
              }
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (posts === undefined || !currentUser) return <Loader />;
  if (!posts || posts.length === 0) return <NoPostsFound />;

  return (
    <View style={[styles.container, { position: 'relative' }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <TouchableOpacity onPress={() => router.push("/(screens)/Profile")}>
            <Image
              source={{ uri: currentUser.image }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
            />
          </TouchableOpacity>
        </Text>

        <TouchableOpacity onPress={() => signOut()}>
          <Ionicons name="log-out-outline" size={24} color={theme.white} />
        </TouchableOpacity>
      </View>

      {/* Updated Tabs */}
        <View style={[styles.tabRow, {borderBottomWidth: 1, borderBottomColor: theme.surface}]}>
          {['For You', 'Following'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[
                styles.tabButton,
                selectedTab === tab && [{ borderBottomColor: theme.primary,  }]
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={{
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
        }}
        onPress={() => router.push('/(tabs)/create')}
      >
        <Ionicons name="add" size={32} color={theme.white} />
      </TouchableOpacity>
    </View>
  );
}

const NoPostsFound = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 20, color: theme.primary }}>No posts found</Text>
    </View>
  );
};
