import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get messages by conversation
export const getMessagesByConversation = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id")
      .filter((q) => q.eq(q.field("conversation_id"), args.conversationId))
      .collect();

    // Sort by created_at ascending
    messages.sort((a, b) => a.created_at - b.created_at);

    // Get sender details
    const messagesWithSenders = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db
          .query("users")
          .withIndex("by_email")
          .filter((q) => q.eq(q.field("id"), msg.sender_id))
          .first();
        return { ...msg, sender };
      })
    );

    return messagesWithSenders;
  },
});

// Create message
export const createMessage = mutation({
  args: {
    conversation_id: v.string(),
    sender_id: v.string(),
    content: v.string(),
    message_type: v.optional(v.string()),
    file_url: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("sent"), v.literal("delivered"), v.literal("read"))
    ),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      ...args,
      status: args.status || "sent",
      created_at: Date.now(),
    });

    // Update conversation last message
    // conversation_id is the Convex _id as a string
    let conversation = null;
    try {
      const conversationId = args.conversation_id as any;
      conversation = await ctx.db.get(conversationId);
    } catch (error) {
      // Conversation not found - conversation will remain null
      conversation = null;
    }

    if (conversation) {
      await ctx.db.patch(conversation._id, {
        last_message_id: String(messageId), // Store as string
        last_message_at: Date.now(),
        updated_at: Date.now(),
      });
    }

    return messageId;
  },
});

// Mark message as read
export const markMessageAsRead = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      status: "read",
      read_at: Date.now(),
    });
  },
});

// Get count of conversations with unread messages for a user
export const getUnreadConversationsCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get user role to determine which opened flag to check
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("id"), args.userId))
      .first();
    
    const userRole = user?.role || null;
    const isKindTao = userRole === "kindtao";
    const isKindBossing = userRole === "kindbossing";

    // First, get all conversations where the user is a participant
    const userConversations = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.eq(q.field("kindbossing_user_id"), args.userId),
          q.eq(q.field("kindtao_user_id"), args.userId)
        )
      )
      .collect();

    if (userConversations.length === 0) {
      return {
        count: 0,
        conversationIds: [],
      };
    }

    // Track conversations that have at least one unread message
    const conversationsWithUnreadIds: string[] = [];
    for (const conversation of userConversations) {
      const conversationId = String(conversation._id);
      
      // If conversation has a match_id, check if the match has been opened by the current user
      if (conversation.match_id) {
        try {
          const matchId = conversation.match_id as any;
          const match = await ctx.db.get(matchId);
          
          if (match) {
            // Check if match has been opened by the current user based on their role
            const isOpened = isKindTao
              ? match.is_opened_by_kindtao === true
              : isKindBossing
              ? match.is_opened_by_kindbossing === true
              : false; // If role is unknown, don't count it
            
            // Skip this conversation if the match hasn't been opened by the current user
            if (!isOpened) {
              continue;
            }
          }
        } catch (error) {
          // Match not found - skip this conversation to be safe
          continue;
        }
      }
      
      // If we get here, either there's no match_id or the match has been opened
      // Now check for unread messages
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation_id")
        .filter((q) => q.eq(q.field("conversation_id"), conversationId))
        .collect();

      // Check if there's at least one unread message (sent by others, not read)
      const hasUnread = messages.some((msg) => {
        const isFromOtherUser = msg.sender_id !== args.userId;
        const isUnread = !msg.read_at;
        return isFromOtherUser && isUnread;
      });

      if (hasUnread) {
        conversationsWithUnreadIds.push(conversationId);
      }
    }

    return {
      count: conversationsWithUnreadIds.length,
      conversationIds: conversationsWithUnreadIds,
    };
  },
});
