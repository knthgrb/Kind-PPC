import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  status: "sent" | "delivered" | "read";
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  match_id: string;
  last_message_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export const ChatService = {
  /**
   * Send a message to a conversation
   */
  async sendMessage(
    convex: ConvexClient,
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = "text",
    fileUrl?: string
  ) {
    try {
      const messageId = await convex.mutation(api.messages.createMessage, {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        file_url: fileUrl || undefined,
        status: "delivered",
      });

      // Return message-like object for compatibility
      return {
        id: String(messageId),
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        file_url: fileUrl || null,
        status: "delivered",
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch messages for a conversation with pagination
   */
  async fetchMessages(
    convex: ConvexClient,
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const messages = await convex.query(
        api.messages.getMessagesByConversation,
        {
          conversationId,
        }
      );

      // Apply pagination
      const paginatedMessages = messages.slice(offset, offset + limit);

      // Convert to expected format
      return paginatedMessages.map((msg: any) => ({
        id: String(msg._id),
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type || "text",
        file_url: msg.file_url || null,
        status: msg.status || "sent",
        read_at: msg.read_at ? new Date(msg.read_at).toISOString() : null,
        created_at: new Date(msg.created_at).toISOString(),
        sender: msg.sender || null,
      }));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get conversation by ID
   */
  async getConversation(convex: ConvexClient, conversationId: string, userId: string) {
    try {
      const conversation = await convex.query(
        api.conversations.getConversationById,
        {
          conversationId: conversationId as any,
          userId,
        }
      );
      return conversation;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get conversations for a user
   */
  async getUserConversations(convex: ConvexClient, userId: string) {
    try {
      const conversations = await convex.query(
        api.conversations.getConversationsByUser,
        {
          userId,
        }
      );
      return conversations;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new conversation from a match
   * Reuses existing conversation if one already exists between the same users
   */
  async createConversation(
    convex: ConvexClient,
    matchId: string | undefined,
    kindbossingUserId: string,
    kindtaoUserId: string
  ) {
    try {
      // First, check if a conversation already exists between these users
      const existingConversation = await convex.query(
        api.conversations.getConversationByUserIds,
        {
          kindbossingUserId,
          kindtaoUserId,
        }
      );

      if (existingConversation?._id) {
        // Reuse existing conversation
        return String(existingConversation._id);
      }

      // Create new conversation
      const conversationId = await convex.mutation(
        api.conversations.createConversation,
        {
          match_id: matchId || undefined,
          kindbossing_user_id: kindbossingUserId,
          kindtao_user_id: kindtaoUserId,
        }
      );
      return conversationId;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    convex: ConvexClient,
    conversationId: string,
    userId: string
  ) {
    try {
      // Get all unread messages in the conversation
      const messages = await convex.query(
        api.messages.getMessagesByConversation,
        {
          conversationId,
        }
      );

      const unreadMessages = messages.filter(
        (msg: any) => msg.sender_id !== userId && !msg.read_at
      );

      // Mark each as read
      for (const msg of unreadMessages) {
        await convex.mutation(api.messages.markMessageAsRead, {
          messageId: msg._id,
        });
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(
    convex: ConvexClient,
    conversationId: string,
    userId: string
  ) {
    try {
      const messages = await convex.query(
        api.messages.getMessagesByConversation,
        {
          conversationId,
        }
      );

      const unreadCount = messages.filter(
        (msg: any) => msg.sender_id !== userId && !msg.read_at
      ).length;

      return unreadCount;
    } catch (error) {
      return 0;
    }
  },
};
