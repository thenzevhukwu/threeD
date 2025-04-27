// convex/functions/messages.ts
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Ionicons } from "@expo/vector-icons";

// Send a message (text, file, or voice note) with sent timestamp
export const sendMessage = mutation({
  args: {
    senderId:     v.id("users"),
    recipientId:  v.id("users"),
    text:         v.optional(v.string()),
    file:         v.optional(v.object({
                    url:      v.string(),
                    name:     v.string(),
                    mimeType: v.string(),
                    size:     v.number(),
                  })),
    voiceNote:    v.optional(v.object({
                    url:       v.string(),
                    duration:  v.number(),
                    mimeType:  v.string(),
                  })),
  },
  handler: async ({ db, auth }, args) => {
    // Optionally enforce that auth.userId === args.senderId
    const messageId = await db.insert("messages", {
      senderId:    args.senderId,
      recipientId: args.recipientId,
      text:        args.text,
      file:        args.file,
      voiceNote:   args.voiceNote,
      sentAt:      Date.now(),      // UTC ms timestamp
      readAt:      undefined,       // Not yet read
      archived:    false,
      muted:       false,
      blocked:     false,
    });
    return messageId;
  },
});  

// Mark one or all messages in a chat as read
export const markAsRead = mutation({
    args: {
      chatId: v.optional(v.string()),
      messageIds: v.array(v.id("messages"))
    },
    handler: async ({ db }, { messageIds }) => {
      const now = Date.now();
      for (const id of messageIds) {
        // Fetch the current message to check if it's already marked as read
        const message = await db.query("messages").filter(q => q.eq(q.field("_id"), id)).first();

        // If the message is unread (no readAt field), mark it as read
        if (message && message.readAt === undefined) {
          await db.patch(id, { readAt: now });
        }
          await db.patch(id, { readAt: now });
      }
      return now;
    },
  });

// Fetch chat history between two users (userA and userB) with optional cursor for pagination
export const getChatHistory = query({
  args: {
    userA: v.id("users"),
    userB: v.id("users"),
    limit: v.number(),
    cursor: v.optional(v.number()),
  },
  handler: async ({ db }, { userA, userB, limit, cursor }) => {
    let messages = await db
      .query("messages")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("senderId"), userA),
            q.eq(q.field("recipientId"), userB)
          ),
          q.and(
            q.eq(q.field("senderId"), userB),
            q.eq(q.field("recipientId"), userA)
          )
        )
      )
      .order("asc")
      .take(limit);

    // If a cursor is provided, filter out messages after it
    if (cursor !== undefined) {
      messages = messages.filter(msg => msg.sentAt < cursor);
    }

    return messages;
  },
});

  
// Query unread count per conversation
export const getUnreadCount = query({
  args: {
    userId: v.id("users"), // (recipient)
    peerId: v.id("users"), // (sender)
  },
  handler: async ({ db }, { userId, peerId }) => {
    // Query unread messages for the specific conversation
    const unreadMessages = await db.query("messages")
      .filter(q =>
        q.and(
          q.eq(q.field("recipientId"), userId), // Messages sent to the user
          q.eq(q.field("senderId"), peerId),     // Messages sent from the peer
          q.eq(q.field("readAt"), undefined)     // Messages that are unread (no readAt timestamp)
        )
      )
      .collect();

    // Return the number of unread messages
    return unreadMessages.length;
  },
});


// Archive or unarchive a chat (both directions)
export const archiveChat = mutation({
  args: {
    userId: v.id("users"),
    peerId: v.id("users"),
    archive: v.boolean(),
  },
  handler: async ({ db }, { userId, peerId, archive }) => {
    const messages = await db
      .query("messages")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("senderId"), userId),
            q.eq(q.field("recipientId"), peerId)
          ),
          q.and(
            q.eq(q.field("senderId"), peerId),
            q.eq(q.field("recipientId"), userId)
          )
        )
      )
      .collect();

    for (const msg of messages) {
      await db.patch(msg._id, { archived: archive });
    }
    return messages.length;
  },
});

// 4.2 Delete chat (hard delete)
export const deleteChat = mutation({
  args: { userA: v.id("users"), userB: v.id("users") },
  handler: async ({ db }, { userA, userB }) => {
    const messages = await db
      .query("messages")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("senderId"), userA),
            q.eq(q.field("recipientId"), userB)
          ),
          q.and(
            q.eq(q.field("senderId"), userB),
            q.eq(q.field("recipientId"), userA)
          )
        )
      )
      .collect();

    for (const msg of messages) {
      await db.delete(msg._id);
    }
    return messages.length;
  },
});

// 4.3 Mute/unmute chat notifications
export const muteChat = mutation({
    args: {
      userId: v.id("users"),
      mutedUserId: v.id("users"),
      mute: v.boolean(), // true = mute, false = unmute
    },
    handler: async ({ db }, { userId, mutedUserId, mute }) => {
      // Check if mute record already exists
      const existing = await db
        .query("mutes")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("mutedUserId"), mutedUserId)
          )
        )
        .first();
  
      if (existing) {
        // Update the mute status
        await db.patch(existing._id, { muted: mute });
      } else {
        // Create a new mute record
        await db.insert("mutes", {
          userId,
          mutedUserId,
          muted: mute,
        });
      }
  
      return { success: true };
    },
});

export const getChatList = query({
  handler: async ({ db, auth }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await db
      .query("users")
      .withIndex("by_clerk_id")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const allMsgs = await db
      .query("messages")
      .filter((q) =>
        q.or(
          q.eq(q.field("senderId"), user._id),
          q.eq(q.field("recipientId"), user._id)
        )
      )
      .collect();

    allMsgs.sort((a, b) => a.sentAt - b.sentAt);

    const chats = new Map<string, {
      peerId: Id<"users">;
      lastMessage: string;
      lastSenderId: Id<"users">;
      sentAt: number;
      readAt?: number;
      unreadCount: number;
      messageIds: Id<"messages">[];
    }>();

    for (const msg of allMsgs) {
      const peerId = msg.senderId.toString() === user._id.toString()
        ? msg.recipientId
        : msg.senderId;

      const existing = chats.get(peerId.toString());

      if (!existing || msg.sentAt > existing.sentAt) {
        chats.set(peerId.toString(), {
          peerId,
          lastMessage: msg.text ?? (msg.file ? "[Attachment]" : "[Voice]"),
          lastSenderId: msg.senderId,
          sentAt: msg.sentAt,
          readAt: msg.readAt,
          unreadCount: existing ? existing.unreadCount : 0,
          messageIds: existing ? [...existing.messageIds, msg._id] : [msg._id]
        });
      } else {
        existing.messageIds.push(msg._id);
        if (msg.recipientId.toString() === user._id.toString() && !msg.readAt) {
          existing.unreadCount++;
        }
      }
    }

    const peerIds = Array.from(chats.keys());
    const peerUsers = await Promise.all(
      peerIds.map(id => db.get(id as Id<"users">))
    );

    return Array.from(chats.values()).map((c, i) => {
      const peer = peerUsers[i];
      return {
        id: c.peerId,
        name: peer?.username ?? `User ${c.peerId.toString().slice(-4)}`,
        fullname: peer?.fullname,
        initials: peer?.fullname?.charAt(0).toUpperCase(),
        lastMessage: c.lastMessage,
        lastSenderId: c.lastSenderId,
        time: new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }).format(new Date(c.sentAt)),
        unreadCount: c.unreadCount,
        isRead: c.readAt !== undefined,
        image: peer?.image || null,
        messageIds: c.messageIds,
      };
    });
  },
});