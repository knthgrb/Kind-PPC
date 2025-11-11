"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useUserConversations } from "./useUserConversations";
import { useConversationDetails } from "./useConversationDetails";
import { useChat } from "./useChat";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
  ConversationWithDetails,
  User,
  MessageWithUser,
} from "@/types/chat";

export interface UseChatUIOptions {
  selectedConversationId: string | null;
  autoMarkAsRead?: boolean;
  // Using realtime subscriptions instead of polling
}

export interface UseChatUIReturn {
  // Current user
  currentUser: User | null;

  // Conversations list (for sidebar)
  conversations: ConversationWithDetails[];
  isLoadingConversations: boolean;
  conversationsError: Error | null;
  refreshConversations: () => Promise<void>;

  // Selected conversation details (for header)
  selectedConversation: ConversationWithDetails | null;
  otherUser: User | null;
  isLoadingConversationDetails: boolean;
  conversationDetailsError: Error | null;

  // Messages (for main chat area)
  messages: MessageWithUser[];
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  messagesError: Error | null;
  loadMoreRef: (node: HTMLDivElement | null) => void;
  loadMore: () => void;

  // Message actions
  sendMessage: (
    content: string,
    messageType?: string,
    fileUrl?: string
  ) => Promise<void>;
  markAsRead: () => Promise<void>;

  // UI state
  isSending: boolean;
  sendError: Error | null;

  // Conversation selection
  selectConversation: (conversationId: string | null) => void;
}

export function useChatUI({
  selectedConversationId,
  autoMarkAsRead = true,
}: UseChatUIOptions): UseChatUIReturn {
  const { user } = useAuthStore();
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(selectedConversationId);

  // Get user conversations for sidebar
  const {
    conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
    refreshConversations,
  } = useUserConversations({});

  // Get conversation details for header
  const {
    conversation: selectedConversation,
    otherUser,
    currentUser,
    isLoading: isLoadingConversationDetails,
    error: conversationDetailsError,
  } = useConversationDetails({
    conversationId: currentConversationId,
  });

  // Chat functionality - SINGLE useChat instance with integrated realtime
  const {
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMore,
    messagesError,
    loadMoreRef,
    loadMore,
    sendMessage,
    markAsRead,
    isSending,
    sendError,
  } = useChat({
    conversationId: currentConversationId,
    autoMarkAsRead,
  });

  // Conversation selection
  const selectConversation = useCallback((conversationId: string | null) => {
    setCurrentConversationId(conversationId);
  }, []);

  // Sync selectedConversationId prop with internal state (with ref to prevent double renders)
  const lastSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedConversationId !== currentConversationId && selectedConversationId !== lastSelectedIdRef.current) {
      lastSelectedIdRef.current = selectedConversationId;
      setCurrentConversationId(selectedConversationId);
    } else if (!selectedConversationId && currentConversationId) {
      lastSelectedIdRef.current = null;
      setCurrentConversationId(null);
    }
  }, [selectedConversationId, currentConversationId]);

  return {
    // Current user
    currentUser: user as User | null,

    // Conversations list (for sidebar)
    conversations,
    isLoadingConversations,
    conversationsError,
    refreshConversations,

    // Selected conversation details (for header)
    selectedConversation,
    otherUser,
    isLoadingConversationDetails,
    conversationDetailsError,

    // Messages (for main chat area)
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMore,
    messagesError,
    loadMoreRef,
    loadMore,

    // Message actions
    sendMessage,
    markAsRead,

    // UI state
    isSending,
    sendError,

    // Conversation selection
    selectConversation,
  };
}
