"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatService } from "@/services/chat/chatService";
import { BlockingService } from "@/services/chat/blockingService";
import { useAuth } from "../useAuth";
import type { ConversationWithDetails } from "@/types/chat";
export interface UseUserConversationsOptions {
  // Using realtime subscriptions instead of polling
}

export interface UseUserConversationsReturn {
  conversations: ConversationWithDetails[];
  isLoading: boolean;
  error: Error | null;
  refreshConversations: () => Promise<void>;
}

export function useUserConversations({}: UseUserConversationsOptions = {}): UseUserConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get all conversations
      const conversationsData = await ChatService.getUserConversations(user.id);

      // Get blocked user IDs
      const blockedUserIds = await BlockingService.getBlockedUserIds(user.id);

      // Filter out conversations with blocked users
      const filteredConversations = conversationsData.filter((conversation) => {
        const otherUserId =
          conversation.matches.kindbossing_id === user.id
            ? conversation.matches.kindtao_id
            : conversation.matches.kindbossing_id;

        return !blockedUserIds.includes(otherUserId);
      });

      setConversations(filteredConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  // Load conversations when user changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto-refresh removed - using realtime subscriptions instead

  return {
    conversations,
    isLoading,
    error,
    refreshConversations,
  };
}
