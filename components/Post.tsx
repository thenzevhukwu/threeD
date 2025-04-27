import { theme } from '@/constants/theme'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { styles } from '@/styles/feed.styles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMutation, useQuery } from 'convex/react'
import { useEvent } from 'expo'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'
import React, { useCallback, useEffect, useState } from 'react'
import { Modal, Text, TouchableOpacity, View } from 'react-native'
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu'

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
    isVisible?: boolean
}

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

export default function Post({ post, isVisible = true }: PostProps ) {

  const currentUser = useQuery(api.users.getCurrentUser);
  const isPostAuthor = post.author._id === currentUser?._id;

  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likes);
    setIsBookmarked(post.isBookmarked);
  }, [post.isLiked, post.likes, post.isBookmarked]);

  const player = useVideoPlayer(post.avUrl, player => {
    if (player && post.mediaType === 'video') {
      player.loop = true;
    }
  });

  useEvent(player, 'playingChange', { isPlaying: player?.playing || false });

  const toggleLike = useMutation(api.posts.toggleLike)
  const handleLike = useCallback(async () => {
    try {
      const newIsLiked = await toggleLike({postId: post._id})
      setIsLiked(newIsLiked)
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }, [post._id, toggleLike]);

  const toggleBookmark = useMutation(api.posts.toggleBookmark)
  const handleBookmark = useCallback(async () => {
    try {
      const newIsBookmarked = await toggleBookmark({postId: post._id})
      setIsBookmarked(newIsBookmarked)
    } catch (error) {
      console.error("Error bookmarking post:", error)
    }
  }, [post._id, toggleBookmark]);
  
  const toggleFollow = useMutation(api.users.toggleFollow);
  const handleFollow = useCallback(async () => {
    try {
      await toggleFollow({ userId: post.author._id as Id<"users"> });
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }, [post.author._id, toggleFollow]);

  const deletePost = useMutation(api.posts.deletePost);
  const handleDeletePost = async () => {
    try {
      await deletePost({ postId: post._id });
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleMute = () => {
    setShowMuteDialog(false);
  };

  const handleBlock = () => {
    setShowBlockDialog(false);
  };

  const handleReport = () => {
    setShowReportDialog(false);
  };

  const handleViewAnalytics = () => {
    setShowAnalyticsDialog(false);
  };

  const handleEdit = () => {
    setShowEditDialog(false);
  };

  useEffect(() => {
    if (!isVisible && player?.playing) {
      player.pause();
    }
  }, [isVisible, player]);

  const handleProfilePress = useCallback(() => {
    if (!currentUser) return;
    
    if (currentUser._id === post.author._id) {
      router.push("/(screens)/Profile");
    } else {
      router.push({
        pathname: "/(screens)/UserProfileScreen",
        params: { userId: post.author._id }
      });
    }
  }, [currentUser, post.author._id, router]);

  const options: Array<{ icon: keyof typeof Ionicons.glyphMap;
                         label: string;
                         onPress: () => void }> = isPostAuthor
  ? [
      { 
        icon: 'analytics-outline',
        label: 'View post analytics',
        onPress: () => setShowAnalyticsDialog(true)
      },
      { 
        icon: 'pencil-outline',
        label: 'Edit post',
        onPress: () => setShowEditDialog(true)  
      },
      { 
        icon: 'trash-outline',
        label: 'Delete post',
        onPress: () => setShowDeleteDialog(true)
      },
    ]
  : [
      { 
        icon: 'person-add-outline',
        label: `Follow @${post.author.username}`,
        onPress: () => handleFollow()
      },
      { 
        icon: 'volume-mute-outline',
        label: `Mute @${post.author.username}`,
        onPress: () => setShowMuteDialog(true)
      },
      { 
        icon: 'hand-left-outline', 
        label: `Block @${post.author.username}`,
        onPress: () => setShowBlockDialog(true)
      },
      { 
        icon: 'bookmark-outline',
        label: 'Bookmark post',
        onPress: () => handleBookmark()
      },
      { 
        icon: 'flag-outline',
        label: 'Report post',
        onPress: () => setShowReportDialog(true)
      },
    ];

  const renderDialogs = () => (
    <>
      <Modal visible={showDeleteDialog} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Delete post?</Text>
            <Text style={styles.dialogMessage}>
              This can't be undone and it will be removed from your profile,
              the feed of any accounts that follow you and from search params.
            </Text>
            
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.buttonCancel} onPress={() => setShowDeleteDialog(false)}>
                <Text style={styles.buttonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonDelete} onPress={handleDeletePost}>
                <Text style={styles.buttonTextDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showMuteDialog} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Mute @{post.author.username}?</Text>
            <Text style={styles.dialogMessage}>
              You won't see posts from this user in your feed anymore.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.buttonCancel} onPress={() => setShowMuteDialog(false)}>
                <Text style={styles.buttonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonDelete} onPress={handleMute}>
                <Text style={styles.buttonTextDelete}>Mute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showBlockDialog} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Block @{post.author.username}?</Text>
            <Text style={styles.dialogMessage}>
              They won't be able to see your posts or contact you.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.buttonCancel} onPress={() => setShowBlockDialog(false)}>
                <Text style={styles.buttonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonDelete} onPress={handleBlock}>
                <Text style={styles.buttonTextDelete}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showReportDialog} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Report this post?</Text>
            <Text style={styles.dialogMessage}>
              We'll review this post for any violations of our community guidelines.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.buttonCancel} onPress={() => setShowReportDialog(false)}>
                <Text style={styles.buttonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonDelete} onPress={handleReport}>
                <Text style={styles.buttonTextDelete}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditDialog} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Edit post</Text>
            <Text style={styles.dialogMessage}>
              This feature is coming soon.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.buttonCancel} onPress={() => setShowEditDialog(false)}>
                <Text style={styles.buttonTextCancel}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAnalyticsDialog} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.dialog, { padding: 20, width: '65%', backgroundColor: theme.background }]}>
            <Text style={[styles.dialogTitle, { fontSize: 20, color: theme.white }]}>Post Analytics</Text>

            <View style={{ marginTop: 20 }}>
              {/* Overview Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: theme.white, fontSize: 18, fontWeight: '600' }}>132</Text>
                  <Text style={{ color: theme.grey, fontSize: 12 }}>Impressions</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: theme.white, fontSize: 18, fontWeight: '600' }}>98</Text>
                  <Text style={{ color: theme.grey, fontSize: 12 }}>Reach</Text>
                </View>
              </View>

              {/* Interaction Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: theme.white, fontSize: 18, fontWeight: '600' }}>{post.comments}</Text>
                  <Text style={{ color: theme.grey, fontSize: 12 }}>Comments</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: theme.white, fontSize: 18, fontWeight: '600' }}>{post.likes}</Text>
                  <Text style={{ color: theme.grey, fontSize: 12 }}>Likes</Text>
                </View>
              </View>
              </View>

              {/* Close Button */}
              <View style={[styles.dialogButtons, { marginTop: 20 }]}>
                <TouchableOpacity style={styles.buttonCancel} onPress={() => setShowAnalyticsDialog(false)}>
                  <Text style={styles.buttonTextCancel}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>

    </>
  );

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

        {/* Post Popup */}
        <Menu>
          <MenuTrigger customStyles={{ TriggerTouchableComponent: TouchableOpacity }}>
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.white} />
          </MenuTrigger>

          <MenuOptions customStyles={{ optionsContainer: { backgroundColor: 'black', padding: 8, borderRadius: 8 } }}>
            {options.map((option, index) => (
              <MenuOption key={index} onSelect={option.onPress}>
                <View style={styles.optionButton}>
                  <Ionicons name={option.icon} size={15} color={theme.white} style={{ marginRight: 10 }} />
                  <Text style={[styles.optionText, { color: theme.white }]}>{option.label}</Text>
                </View>
              </MenuOption>
            ))}
          </MenuOptions>
        </Menu>
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

      {renderDialogs()}
    </View>
  )
}