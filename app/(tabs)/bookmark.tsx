import { View, Text, StyleSheet, ScrollView} from 'react-native'
import React from 'react'
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { theme } from '@/constants/theme';
import { Loader } from '@/components/Loader';
import Post from '@/components/Post';


export default function BookmarkScreen() {
  
  const bookmarkedPosts = useQuery(api.posts.getBookmarkedPosts);

  if (bookmarkedPosts === undefined) return <Loader />

  if (bookmarkedPosts.length === 0) return <NoBookmarksFound />

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {bookmarkedPosts.map((post) => (
          <Post key={post._id} post={post} />
        ))}
      </ScrollView>
    </View>
  )
}

const NoBookmarksFound = () => {
  return (
    <View style={styles.noBookmarksContainer}>
      <Text style={styles.noBookmarksText}>
        No bookmarked posts yet
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.surface,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: theme.white,
    },
    noBookmarksContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    noBookmarksText: {
        color: theme.grey,
        fontSize: 16,
    },
});
