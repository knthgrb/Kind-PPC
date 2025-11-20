import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get conversations by user
export const getConversationsByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const offset = args.offset || 0;

    const allConversations = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.eq(q.field("kindbossing_user_id"), args.userId),
          q.eq(q.field("kindtao_user_id"), args.userId)
        )
      )
      .collect();

    // Sort by last_message_at descending (most recent first), then by created_at
    allConversations.sort((a, b) => {
      const aTime = a.last_message_at || a.created_at || 0;
      const bTime = b.last_message_at || b.created_at || 0;
      return bTime - aTime;
    });

    // Apply pagination
    const conversations = allConversations.slice(offset, offset + limit);

    // Get other user and match details
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId =
          conv.kindbossing_user_id === args.userId
            ? conv.kindtao_user_id
            : conv.kindbossing_user_id;

        const otherUser = await ctx.db
          .query("users")
          .withIndex("by_user_id")
          .filter((q) => q.eq(q.field("id"), otherUserId))
          .first();

        // Get match - match_id is stored as Convex _id string
        let match = null;
        if (conv.match_id) {
          try {
            const matchId = conv.match_id as any;
            match = await ctx.db.get(matchId);
          } catch (error) {
            // Match not found - match will remain null
            match = null;
          }
        }

        // Get last message - last_message_id is stored as Convex _id string
        let lastMessage = null;
        if (conv.last_message_id) {
          try {
            const messageId = conv.last_message_id as any;
            lastMessage = await ctx.db.get(messageId);
          } catch (error) {
            // Message not found - lastMessage will remain null
            lastMessage = null;
          }
        }

        return { ...conv, otherUser, match, lastMessage };
      })
    );

    return conversationsWithDetails;
  },
});

// Get conversation by ID
export const getConversationById = query({
  args: { conversationId: v.id("conversations"), userId: v.string() },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    // Get other user details
    const otherUserId =
      conversation.kindbossing_user_id === args.userId
        ? conversation.kindtao_user_id
        : conversation.kindbossing_user_id;

    const otherUser = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), otherUserId))
      .first();

    // Get match - match_id is stored as Convex _id string
    let match = null;
    if (conversation.match_id) {
      try {
        const matchId = conversation.match_id as any;
        match = await ctx.db.get(matchId);
      } catch (error) {
        // Match not found - match will remain null
        match = null;
      }
    }

    // Get last message - last_message_id is stored as Convex _id string
    let lastMessage = null;
    if (conversation.last_message_id) {
      try {
        const messageId = conversation.last_message_id as any;
        lastMessage = await ctx.db.get(messageId);
      } catch (error) {
        // Message not found - lastMessage will remain null
        lastMessage = null;
      }
    }

    return { ...conversation, otherUser, match, lastMessage };
  },
});

// Get conversation by match ID
export const getConversationByMatchId = query({
  args: { matchId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("match_id"), args.matchId))
      .first();
  },
});

// Get conversation by user IDs (to reuse existing conversation for same users)
export const getConversationByUserIds = query({
  args: {
    kindbossingUserId: v.string(),
    kindtaoUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find conversation where both user IDs match (order doesn't matter)
    // Check both possible combinations: (kindbossing, kindtao) and (kindtao, kindbossing)
    const conversation1 = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.and(
          q.eq(q.field("kindbossing_user_id"), args.kindbossingUserId),
          q.eq(q.field("kindtao_user_id"), args.kindtaoUserId)
        )
      )
      .first();

    if (conversation1) return conversation1;

    // Check reverse order
    const conversation2 = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.and(
          q.eq(q.field("kindbossing_user_id"), args.kindtaoUserId),
          q.eq(q.field("kindtao_user_id"), args.kindbossingUserId)
        )
      )
      .first();

    return conversation2 || null;
  },
});

// Create conversation
export const createConversation = mutation({
  args: {
    match_id: v.optional(v.string()),
    kindbossing_user_id: v.string(),
    kindtao_user_id: v.string(),
    status: v.optional(
      v.union(v.literal("active"), v.literal("archived"), v.literal("blocked"))
    ),
  },
  handler: async (ctx, args) => {
    const conversationId = await ctx.db.insert("conversations", {
      ...args,
      status: args.status || "active",
      created_at: Date.now(),
    });
    return conversationId;
  },
});

// Update conversation
export const updateConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    updates: v.object({
      last_message_id: v.optional(v.string()),
      last_message_at: v.optional(v.number()),
      status: v.optional(
        v.union(
          v.literal("active"),
          v.literal("archived"),
          v.literal("blocked")
        )
      ),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      ...args.updates,
      updated_at: Date.now(),
    });
  },
});

// Delete conversation
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // Also delete all messages in this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id")
      .filter((q) =>
        q.eq(q.field("conversation_id"), String(args.conversationId))
      )
      .collect();

    // Delete all messages
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});
