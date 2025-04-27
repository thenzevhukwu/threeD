import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const generateUploadUrl = mutation(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error ("Unauthorized");
    return await ctx.storage.generateUploadUrl();
});

export const createPost = mutation({
    args: {
        caption: v.optional(v.string()),
        storageId: v.id("_storage"),
        mediaType: v.union(v.literal("image"), v.literal("video")),
    },

    handler: async (ctx, args) => {
        const currentUser = await getAuthenticatedUser(ctx);

        // Generate url with content-type header for videos
        const avUrl = await ctx.storage.getUrl(args.storageId);
        if (!avUrl) throw new Error("Media not found");

        // create post with media type
        const postId = await ctx.db.insert("posts", {
            userId: currentUser._id,
            avUrl,
            mediaType: args.mediaType,
            storageId: args.storageId,
            caption: args.caption,
            likes: 0,
            comments: 0,
        });

        // increment users posts by 1
        await ctx.db.patch(currentUser._id, {
            posts: (currentUser.posts || 0) + 1,
        });

        return postId;
    }
});

// Query to fetch all posts ordered by creation time (newest first)
export const getFeedPosts = query({
    args: { refreshToken: v.optional(v.number()) },// Accept a dummy token
    handler: async(ctx) => {
        const currentUser = await getAuthenticatedUser(ctx);

        // fetch posts
        const posts = await ctx.db.query("posts").order("desc").collect();

        if (posts.length == 0) return [];

        // enhance posts with user data and interaction service
        const postsWithInfo = await Promise.all(
            posts.map(async(post) => {
                const postAuthor = (await ctx.db.get(post.userId))!;

                const likes = await ctx.db
                .query("likes")
                .withIndex("by_user_and_post",
                   (q) => q.eq("userId", currentUser._id).eq("postId", post._id)
                )
                .first();

                const bookmarks = await ctx.db
                .query("bookmarks")
                .withIndex("by_user_and_post",
                   (q) => q.eq("userId", currentUser._id).eq("postId", post._id)
                )
                .first();

                return {
                    ...post,
                    author: {
                        _id:postAuthor?._id,
                        username: postAuthor?.username,
                        image: postAuthor?.image,
                    },
                    isLiked:!!likes,
                    isBookmarked:!!bookmarks,

                }
            })
        )

        return postsWithInfo;
    }
})

export const toggleLike = mutation({
    args: {postId: v.id("posts")},
    handler: async (ctx, args) => {
        const currentUser = await getAuthenticatedUser(ctx);

        const existingLike = await ctx.db
        .query("likes")
        .withIndex("by_user_and_post",
            (q) => q.eq("userId", currentUser._id).eq("postId", args.postId)
        )
        .first();

        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");

        if (existingLike) {
            // Remove like
            await ctx.db.delete(existingLike._id);
            // Update post likes count
            const newLikes = Math.max(0, post.likes - 1); // Prevent negative likes
            await ctx.db.patch(args.postId, { likes: newLikes });
            return false;
        } else {
            // Add like
            await ctx.db.insert("likes", {
                userId: currentUser._id,
                postId: args.postId,
            });
            // Update post likes count 
            await ctx.db.patch(args.postId, { likes: (post.likes || 0) + 1 });

            // Create notification only if not liking own post
            if (post.userId !== currentUser._id) {
                await ctx.db.insert("notifications", {
                    recieverId: post.userId,
                    senderId: currentUser._id,
                    type: "like",
                    postId: args.postId,
                });
            }
            return true;
        }
    }
});

// Add new query to get bookmarked posts
export const getBookmarkedPosts = query({
    handler: async(ctx) => {
        const currentUser = await getAuthenticatedUser(ctx);

        const bookmarks = await ctx.db
            .query("bookmarks")
            .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
            .collect();

        if (bookmarks.length === 0) return [];

        const postsWithInfo = await Promise.all(
            bookmarks.map(async(bookmark) => {
                const post = (await ctx.db.get(bookmark.postId))!;
                const postAuthor = (await ctx.db.get(post.userId))!;

                const isLiked = await ctx.db
                    .query("likes")
                    .withIndex("by_user_and_post",
                        (q) => q.eq("userId", currentUser._id).eq("postId", post._id)
                    )
                    .first();

                return {
                    ...post,
                    author: {
                        _id: postAuthor?._id,
                        username: postAuthor?.username,
                        image: postAuthor?.image,
                    },
                    isLiked: !!isLiked,
                    isBookmarked: true
                }
            })
        );

        return postsWithInfo;
    }
});

export const toggleBookmark = mutation({
    args: {postId: v.id("posts")},
    handler: async (ctx, args) => {
        const currentUser = await getAuthenticatedUser(ctx);

        const existingBookmark = await ctx.db
            .query("bookmarks")
            .withIndex("by_user_and_post",
                (q) => q.eq("userId", currentUser._id).eq("postId", args.postId)
            )
            .first();

        if (existingBookmark) {
            // Remove bookmark
            await ctx.db.delete(existingBookmark._id);
            return false;
        } else {
            // Add bookmark
            await ctx.db.insert("bookmarks", {
                userId: currentUser._id,
                postId: args.postId,
            });
            return true;
        }
    }
});

export const getPostLikes = query({
  args: {
    postId: v.id("posts")
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    const likeCount = likes.length;
    return {
      count: likeCount,
      total: post.likes
    };
    }
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post) throw new Error("Post not found");
    if (post.userId !== currentUser._id) throw new Error("Unauthorized");

    // Delete all likes for the post
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    await Promise.all(likes.map(like => ctx.db.delete(like._id)));

    // Delete all bookmarks for the post
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    await Promise.all(bookmarks.map(bookmark => ctx.db.delete(bookmark._id)));

    // Delete all comments for the post (if you have comments)
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    await Promise.all(comments.map(comment => ctx.db.delete(comment._id)));

    // Delete the storage file
    await ctx.storage.delete(post.storageId);

    // Delete the post itself
    await ctx.db.delete(args.postId);

    // Decrement user's post count
    await ctx.db.patch(currentUser._id, {
      posts: Math.max(0, (currentUser.posts || 1) - 1),
    });

    return true;
  },
});

export const getFollowingPosts = query({
  args: { refreshToken: v.optional(v.number()) },
  handler: async(ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Get all users that the current user follows
    const followingConnections = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .collect();

    // If not following anyone, return empty array
    if (followingConnections.length === 0) return [];

    // Extract following IDs
    const followingIds = followingConnections.map(f => f.followingId);

    // Get posts from followed users with correct filter syntax
    const posts = await ctx.db
      .query("posts")
      .filter((q) => 
        q.or(...followingIds.map(id => 
          q.eq(q.field("userId"), id)
        ))
      )
      .order("desc")
      .collect();

    // If no posts found, return empty array
    if (posts.length === 0) return [];

    // Enhance posts with user data and interaction status
    const postsWithInfo = await Promise.all(
      posts.map(async(post) => {
        const postAuthor = (await ctx.db.get(post.userId))!;

        // Get likes status
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) => 
            q.eq("userId", currentUser._id)
             .eq("postId", post._id)
          )
          .first();

        // Get bookmarks status
        const bookmarks = await ctx.db
          .query("bookmarks")
          .withIndex("by_user_and_post", (q) => 
            q.eq("userId", currentUser._id)
             .eq("postId", post._id)
          )
          .first();

        return {
          ...post,
          author: {
            _id: postAuthor?._id,
            username: postAuthor?.username,
            image: postAuthor?.image,
          },
          isLiked: !!likes,
          isBookmarked: !!bookmarks,
        };
      })
    );

    return postsWithInfo;
  }
});
