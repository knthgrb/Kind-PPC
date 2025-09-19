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
import { useAuthStore } from "@/stores/useAuthStore";
import type { MessageWithUser } from "@/types/chat";
import { convertToMessageWithUser } from "@/utils/chatMessageUtils";

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
  const { user } = useAuthStore();

  // Conversation state
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationError, setConversationError] = useState<Error | null>(
    null
  );

  // Use shared message conversion utility
  const convertMessage = useCallback(
    (chatMessage: ChatMessage): MessageWithUser => {
      return convertToMessageWithUser(chatMessage);
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
    () => chatMessages.map(convertMessage),
    [chatMessages, convertMessage]
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
      await sendChatMessage(content, messageType, fileUrl);
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

  // Combined mark as read effects to prevent duplicate calls
  useEffect(() => {
    if (autoMarkAsRead && conversationId && user?.id && messages.length > 0) {
      const timer = setTimeout(() => {
        markAsRead();
      }, 300); // Single delay for both cases

      return () => clearTimeout(timer);
    }
  }, [autoMarkAsRead, conversationId, user?.id, messages.length, markAsRead]);

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
