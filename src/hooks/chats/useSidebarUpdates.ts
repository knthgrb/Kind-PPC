"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatService } from "@/services/chat/chatService";
import {
  RealtimeService,
  type ChatMessage,
} from "@/services/chat/realtimeService";
import { useAuth } from "../useAuth";
import type { ConversationWithDetails } from "@/types/chat";

export interface UseSidebarUpdatesOptions {
  conversations: ConversationWithDetails[];
  selectedConversationId: string | null;
  conversationTimestamps?: Map<string, number>;
}

export interface UseSidebarUpdatesReturn {
  sortedConversations: ConversationWithDetails[];
  refreshSidebar: () => Promise<void>;
}

export function useSidebarUpdates({
  conversations,
  selectedConversationId,
  conversationTimestamps,
}: UseSidebarUpdatesOptions): UseSidebarUpdatesReturn {
  const { user } = useAuth();

  // Refresh sidebar data (simplified - just for initial load)
  const refreshSidebar = useCallback(async () => {
    // This is now handled by the parent component
    // We just provide the function for compatibility
  }, []);

  // Sort conversations by last message timestamp, with selected conversation at top
  const sortedConversations = [...conversations].sort((a, b) => {
    // Selected conversation always goes to top
    if (a.id === selectedConversationId) return -1;
    if (b.id === selectedConversationId) return 1;

    // Use local timestamp if available, otherwise use database timestamp
    const aTime =
      conversationTimestamps?.get(a.id) ||
      new Date(a.last_message_at || a.created_at).getTime();
    const bTime =
      conversationTimestamps?.get(b.id) ||
      new Date(b.last_message_at || b.created_at).getTime();
    return bTime - aTime; // Most recent first
  });

  return {
    sortedConversations,
    refreshSidebar,
  };
}
