import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    image: v.string(),
    followers: v.number(),
    following: v.number(),
    posts: v.optional(v.number()),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  posts: defineTable({
    userId: v.id("users"),
    avUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    likes: v.number(),
    comments: v.number(),
  }).index("by_user", ["userId"]),

  comments: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
  }).index("by_post", ["postId"]),

  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_both", ["followerId", "followingId"]),

  notifications: defineTable({
    recieverId: v.id("users"),
    senderId: v.id("users"),
    type: v.union(v.literal("like"), v.literal("comment"), v.literal("follow")),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
  }).index("by_reciever", ["recieverId"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  mutes: defineTable({
    userId: v.id("users"),
    mutedUserId: v.id("users"),
    muted: v.boolean(),
  })
    .index("by_user", ["userId"]),
      

  // Direct messaging table with optional file & voice note support
  messages: defineTable({
    senderId: v.id("users"),
    recipientId: v.id("users"),
    text: v.optional(v.string()),
    file: v.optional(
        v.object({
            url: v.string(),   // e.g. S3 or CDN URL
            name: v.string(),   // original filename
            mimeType: v.string(),   // e.g. "image/png", "application/pdf"
            size: v.number(),   // bytes
        })
    ),
    voiceNote: v.optional(
      v.object({
        url: v.string(),  // link to the audio file
        duration: v.number(),  // length in seconds or ms
        mimeType: v.string(),  // e.g. "audio/mpeg", "audio/ogg"
      })
    ),
    sentAt: v.number(),
    readAt: v.optional(v.number()),
    archived: v.boolean(),
    muted: v.boolean(),
    blocked: v.boolean(),
  })
  .index("by_sender", ["senderId"])
  .index("by_recipient", ["recipientId"])
  .index("by_sentAt", ["sentAt"])
  .index("by_sender_and_recipient", ["senderId", "recipientId"])
});
