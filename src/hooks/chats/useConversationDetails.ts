"use client"; //

import { useState, useEffect, useCallback } from "react";
import { ChatService } from "@/services/chat/chatService";
import { useAuthStore } from "../../stores/useAuthStore";
import type { ConversationWithDetails, User } from "@/types/chat";

export interface UseConversationDetailsOptions {
  conversationId: string | null;
}

export interface UseConversationDetailsReturn {
  conversation: ConversationWithDetails | null;
  otherUser: User | null;
  currentUser: User | null;
  isLoading: boolean;
  error: Error | null;
  refreshConversation: () => Promise<void>;
}

export function useConversationDetails({
  conversationId,
}: UseConversationDetailsOptions): UseConversationDetailsReturn {
  const { user } = useAuthStore();
  const [conversation, setConversation] =
    useState<ConversationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadConversation = useCallback(async () => {
    if (!conversationId || !user?.id) {
      setConversation(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const conversationData = await ChatService.getConversation(
        conversationId
      );
      setConversation(conversationData);
    } catch (error) {
      console.error("Error loading conversation details:", error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user?.id]);

  const refreshConversation = useCallback(async () => {
    await loadConversation();
  }, [loadConversation]);

  // Load conversation when conversationId changes
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Get other user and current user
  const otherUser = conversation?.matches
    ? conversation.matches.kindbossing_id === user?.id
      ? conversation.matches.kindtao
      : conversation.matches.kindbossing
    : null;

  const currentUser = conversation?.matches
    ? conversation.matches.kindbossing_id === user?.id
      ? conversation.matches.kindbossing
      : conversation.matches.kindtao
    : null;

  return {
    conversation,
    otherUser,
    currentUser,
    isLoading,
    error,
    refreshConversation,
  };
}
