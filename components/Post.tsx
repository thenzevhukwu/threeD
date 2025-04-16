import { View, Text, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { styles } from '@/styles/feed.styles'
import { Image } from 'expo-image'
import { theme } from '@/constants/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Id } from '@/convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { router } from 'expo-router'
import { useEvent } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'

type PostProps = {
    post: {
        _id: Id<"posts">;
        avUrl: string;
        mediaType: 'image' | 'video' | 'model';
        caption?: string;
        likes: number;
        comments: number;
        _creationTime: number;
        isLiked: boolean;
        isBookmarked: boolean;
        author: {
            _id: string;
            username: string;
            image: string;
        }
    },
    isVisible?: boolean // Add this prop
}

// Add this utility function before the Post component
const getRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;

  // Convert to seconds, minutes, hours, days
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export default function Post({ post }: PostProps ) {
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const postLikes = useQuery(api.posts.getPostLikes, { postId: post._id });

  const [isLiked, setisLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked)
  const [isVisible, setIsVisible] = useState(true) // Default to true


  // Always initialize the player hook, but only use it when needed
  const player = useVideoPlayer(post.avUrl, player => {
    if (player && post.mediaType === 'video') {
      player.loop = true;
    }
  });

  useEvent(player, 'playingChange', { isPlaying: player?.playing || false });

  const toggleLike = useMutation(api.posts.toggleLike)
  const handleLike = async () => {
    try {
      const newIsLiked = await toggleLike({postId: post._id})
      setisLiked(newIsLiked)
      // Remove setLikesCount since we're using real-time data now
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const toggleBookmark = useMutation(api.posts.toggleBookmark)
  const handleBookmark = async () => {
    try {
      const newIsBookmarked = await toggleBookmark({postId: post._id})
      setIsBookmarked(newIsBookmarked)
    } catch (error) {
      console.error("Error bookmarking post:", error)
    }
  }

  // Add this effect to pause video when not visible
  useEffect(() => {
    if (!isVisible && player?.playing) {
      player.pause();
    }
  }, [isVisible, player]);

  const handleProfilePress = () => {
    if (!currentUser) return;
    
    if (currentUser._id === post.author._id) {
      router.push("./app/(screens)/Profile");
    } else {
      router.push({
        pathname: "./app/(screens)/UserProfileScreen",
        params: { userId: post.author._id }
      });
    }
  };

  const renderMedia = () => {
    if (post.mediaType === 'video' && player) {
      return (
        <View style={styles.mediaContainer}>
          <VideoView 
            style={styles.postImage} 
            player={player} 
            allowsFullscreen={false}
            nativeControls={true}
            contentFit="contain"
          />
        </View>
      );
    }

    return (
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: post.avUrl }}
          style={styles.postImage}
          contentFit="contain"
          transition={200}
        />
      </View>
    );
  };

  return (
    <View style={styles.post}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.postHeaderLeft} 
          onPress={handleProfilePress}
        >
          <Image
            source={post.author.image }
            style={styles.postAvatar}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
          />
          <Text style={styles.postUsername}>{post.author.username}</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={18} color={theme.white} />
        </TouchableOpacity>
      </View>

      {/* Post Media */}
      {renderMedia()}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity onPress={handleLike}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? theme.primary : theme.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={22} color={theme.white} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons 
            name={isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={22} 
            color={isBookmarked? theme.primary : theme.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Post Info */}
      <View style={styles.postInfo}>
        <Text style={styles.likesText}>
          {likesCount > 0 ? `${likesCount.toLocaleString()} likes` : "Be the First to Like"}
        </Text>

        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>{post.author.username}</Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>
        )}

        {post.comments > 0 && (
          <TouchableOpacity>
            <Text style={styles.commentsText}>
              View all {post.comments} comments
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeAgo}>{getRelativeTime(post._creationTime)}</Text>
      </View>
    </View>
  )
}