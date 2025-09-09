"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChatService,
  type Message,
  type Conversation,
} from "@/services/chat/chatService";
import {
  RealtimeService,
  type ChatMessage,
} from "@/services/chat/realtimeService";
import { useInfiniteMessages } from "./useInfiniteMessages";
import { useAuth } from "../useAuth";
import type { MessageWithUser } from "@/types/chat";

export interface UseChatOptions {
  conversationId: string | null;
  autoMarkAsRead?: boolean;
}

export interface UseChatReturn {
  // Messages
  messages: MessageWithUser[];
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  messagesError: Error | null;
  loadMoreRef: (node: HTMLDivElement | null) => void;
  loadMore: () => void;

  // Conversation
  conversation: Conversation | null;
  isLoadingConversation: boolean;
  conversationError: Error | null;

  // Actions
  sendMessage: (
    content: string,
    messageType?: string,
    fileUrl?: string
  ) => Promise<void>;
  markAsRead: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  refreshConversation: () => Promise<void>;

  // State
  isSending: boolean;
  sendError: Error | null;
}

export function useChat({
  conversationId,
  autoMarkAsRead = true,
}: UseChatOptions): UseChatReturn {
  const { user } = useAuth();

  // Conversation state
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationError, setConversationError] = useState<Error | null>(
    null
  );

  // Convert ChatMessage to MessageWithUser format
  const convertToMessageWithUser = useCallback(
    (chatMessage: ChatMessage): MessageWithUser => {
      return {
        id: chatMessage.id,
        conversation_id: chatMessage.conversationId,
        sender_id: chatMessage.user.id,
        content: chatMessage.content,
        message_type: "text" as const,
        file_url: null,
        status: "sent" as const,
        read_at: null,
        created_at: chatMessage.createdAt,
        sender: {
          id: chatMessage.user.id,
          first_name: chatMessage.user.name.split(" ")[0] || "",
          last_name: chatMessage.user.name.split(" ").slice(1).join(" ") || "",
          email: "",
          role: "kindtao" as const,
          profile_image_url: chatMessage.user.avatar || null,
          phone: null,
          date_of_birth: null,
          gender: null,
          address: null,
          city: null,
          province: null,
          postal_code: null,
          is_verified: false,
          verification_status: "pending",
          subscription_tier: "free",
          subscription_expires_at: null,
          swipe_credits: 0,
          boost_credits: 0,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    },
    []
  );

  const {
    messages: chatMessages,
    isLoading: isLoadingMessages,
    isLoadingMore,
    hasMore,
    error: messagesError,
    loadMoreRef,
    loadMore,
    sendMessage: sendChatMessage,
    isSending,
    sendError,
  } = useInfiniteMessages({
    conversationId,
    pageSize: 25,
  });

  // Convert ChatMessages to MessageWithUser format with memoization
  const messages = useMemo(
    () => chatMessages.map(convertToMessageWithUser),
    [chatMessages, convertToMessageWithUser]
  );

  // Load conversation details
  const loadConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      return;
    }

    setIsLoadingConversation(true);
    setConversationError(null);

    try {
      const conversationData = await ChatService.getConversation(
        conversationId
      );
      setConversation(conversationData);
    } catch (error) {
      setConversationError(error as Error);
    } finally {
      setIsLoadingConversation(false);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, messageType: string = "text", fileUrl?: string) => {
      await sendChatMessage(content);
    },
    [sendChatMessage]
  );

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !user?.id) {
      return;
    }

    try {
      await ChatService.markMessagesAsRead(conversationId, user.id);
    } catch (error) {
      // Silent error handling
    }
  }, [conversationId, user?.id]);

  const refreshMessages = useCallback(async () => {
    // Messages are refreshed automatically by realtime subscription
  }, []);

  const refreshConversation = useCallback(async () => {
    await loadConversation();
  }, [loadConversation]);

  // Load conversation when conversationId changes
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Mark as read when conversation is viewed
  useEffect(() => {
    if (autoMarkAsRead && conversationId && user?.id && messages.length > 0) {
      const timer = setTimeout(() => {
        markAsRead();
      }, 500); // Reduced delay for faster read status

      return () => clearTimeout(timer);
    }
  }, [autoMarkAsRead, conversationId, user?.id, markAsRead]);

  // Also mark as read when messages change (new messages arrive)
  useEffect(() => {
    if (autoMarkAsRead && conversationId && user?.id && messages.length > 0) {
      const timer = setTimeout(() => {
        markAsRead();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [messages.length, autoMarkAsRead, conversationId, user?.id, markAsRead]);

  return {
    // Messages
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMore,
    messagesError,
    loadMoreRef,
    loadMore,

    // Conversation
    conversation,
    isLoadingConversation,
    conversationError,

    // Actions
    sendMessage,
    markAsRead,
    refreshMessages,
    refreshConversation,

    // State
    isSending,
    sendError,
  };
}
