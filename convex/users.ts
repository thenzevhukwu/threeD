import { mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

export const createUser = mutation({
    args:{
        username: v.string(),
        fullname: v.string(),
        image: v.string(),
        bio: v.optional(v.string()), 
        email: v.string(),
        clerkId: v.string(),
    },

    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const userData = {
            username: args.username,
            fullname: args.fullname,
            email: args.email,
            bio: args.bio,
            image: args.image,
            clerkId: args.clerkId,
            posts: existingUser?.posts || 0,
            followers: existingUser?.followers || 0,
            following: existingUser?.following || 0,
        };

        if (existingUser) {
            // Update existing user
            await ctx.db.patch(existingUser._id, userData);
            return existingUser._id;
        }

        // Create new user
        const newUserId = await ctx.db.insert("users", userData);
        return newUserId;
    },
});

export const updateUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Add empty check
    if (!args.username.trim()) {
      throw new Error("Username cannot be empty");
    }

    // Validate username length
    if (args.username.length < 3) {
      throw new Error("Username must be at least 3 characters long");
    }

    // Check if username is already taken
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("username"), args.username),
          q.neq(q.field("_id"), currentUser._id)
        )
      )
      .first();

    if (existingUser) {
      throw new Error("Username is already taken");
    }

    // Add check for whitespace and special characters
    if (!/^[a-zA-Z0-9_]+$/.test(args.username)) {
      throw new Error("Username can only contain letters, numbers and underscore");
    }

    // Update the username
    await ctx.db.patch(currentUser._id, {
      username: args.username,
    });

    return true;
  },
});

export const updateProfile = mutation({
  args: {
    fullname: v.optional(v.string()),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Only update fields that are provided
    const updates: Record<string, string> = {};
    if (args.fullname) updates.fullname = args.fullname;
    if (args.bio) updates.bio = args.bio;
    if (args.image) updates.image = args.image;

    await ctx.db.patch(currentUser._id, updates);
    return true;
  },
});

export const toggleFollow = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (args.userId === currentUser._id) {
      throw new Error("Cannot follow yourself");
    }

    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) => 
        q.eq("followerId", currentUser._id).eq("followingId", args.userId)
      )
      .first();

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    if (existingFollow) {
      // Unfollow
      await ctx.db.delete(existingFollow._id);
      await ctx.db.patch(currentUser._id, { following: currentUser.following - 1 });
      await ctx.db.patch(args.userId, { followers: targetUser.followers - 1 });
      return false;
    } else {
      // Follow
      await ctx.db.insert("follows", {
        followerId: currentUser._id,
        followingId: args.userId,
      });
      await ctx.db.patch(currentUser._id, { following: currentUser.following + 1 });
      await ctx.db.patch(args.userId, { followers: targetUser.followers + 1 });

      // Create notification
      await ctx.db.insert("notifications", {
        recieverId: args.userId,
        senderId: currentUser._id,
        type: "follow",
      });
      return true;
    }
  },
});

export const isFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) => 
        q.eq("followerId", currentUser._id).eq("followingId", args.userId)
      )
      .first();
    return !!follow;
  },
});

export async function getAuthenticatedUser(ctx:QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
        if(!identity) throw new Error ("Unauthorized");

    const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first()

    if (!currentUser) throw new Error("User not found");

    return currentUser;

}

export const getCurrentUser = query({
  handler: async (ctx) => {
    return getAuthenticatedUser(ctx);
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    return user;
  },
});

export const getAllUsers = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    
    // Get all users except the current user
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("_id"), currentUser._id))
      .collect();

    return users.map(user => ({
      _id: user._id,
      username: user.username,
      fullname: user.fullname,
      image: user.image
    }));
  }
});