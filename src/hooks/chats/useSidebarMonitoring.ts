"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatService } from "@/services/chat/chatService";
import { RealtimeService } from "@/services/chat/realtimeService";
import { useAuth } from "../useAuth";
import type { ConversationWithDetails } from "@/types/chat";

export interface SidebarData {
  lastMessages: Map<string, string>;
  unreadCounts: Map<string, number>;
  conversationTimestamps: Map<string, number>;
}

export interface UseSidebarMonitoringOptions {
  conversations: ConversationWithDetails[];
  selectedConversationId: string | null;
}

export interface UseSidebarMonitoringReturn {
  sidebarData: SidebarData;
  refreshSidebar: () => Promise<void>;
  updateSidebarData: (conversationId: string, message: any) => void;
  updateSelectedConversationSidebar: (
    conversationId: string,
    message: any
  ) => void;
  isInitialDataLoading: boolean;
}

export function useSidebarMonitoring({
  conversations,
  selectedConversationId,
}: UseSidebarMonitoringOptions): UseSidebarMonitoringReturn {
  const { user } = useAuth();
  const [sidebarData, setSidebarData] = useState<SidebarData>({
    lastMessages: new Map(),
    unreadCounts: new Map(),
    conversationTimestamps: new Map(),
  });
  const [isInitialDataLoading, setIsInitialDataLoading] = useState(false);

  // Cache to prevent redundant API calls
  const lastLoadTimeRef = useRef<number>(0);
  const lastConversationIdsRef = useRef<string>("");
  const CACHE_DURATION = 5000; // 5 seconds cache

  // Track active subscriptions
  const subscriptionsRef = useRef<Map<string, any>>(new Map());
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const selectedConversationIdRef = useRef<string | null>(
    selectedConversationId
  );

  // Update ref when selectedConversationId changes
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // Load initial data for all conversations (optimized - batch queries)
  const loadInitialData = useCallback(async () => {
    if (conversations.length === 0 || !user?.id) return;

    const conversationIds = conversations.map((c) => c.id);
    const conversationIdsKey = conversationIds.sort().join(",");
    const now = Date.now();

    // Check cache - skip if same conversations and within cache duration
    if (
      lastConversationIdsRef.current === conversationIdsKey &&
      now - lastLoadTimeRef.current < CACHE_DURATION
    ) {
      return;
    }

    setIsInitialDataLoading(true);
    const lastMessagesMap = new Map<string, string>();
    const timestampsMap = new Map<string, number>();
    const unreadCountsMap = new Map<string, number>();

    try {
      // Batch fetch latest messages and unread counts
      const [latestMessages, unreadCounts] = await Promise.all([
        ChatService.getLatestMessagesForConversations(conversationIds),
        ChatService.getUnreadCountsForConversations(
          conversationIds.filter((id) => id !== selectedConversationId),
          user.id
        ),
      ]);

      // Process the results
      conversations.forEach((conversation) => {
        const latestMessage = latestMessages.get(conversation.id);

        if (latestMessage) {
          const isFromCurrentUser = latestMessage.sender_id === user.id;
          const prefix = isFromCurrentUser ? "You: " : "";
          const messageText = `${prefix}${latestMessage.content}`;
          lastMessagesMap.set(conversation.id, messageText);
          timestampsMap.set(
            conversation.id,
            new Date(latestMessage.created_at).getTime()
          );
        } else {
          lastMessagesMap.set(conversation.id, "No messages yet");
          timestampsMap.set(
            conversation.id,
            new Date(conversation.created_at).getTime()
          );
        }

        // Set unread count (0 for selected conversation, fetched count for others)
        if (conversation.id === selectedConversationId) {
          unreadCountsMap.set(conversation.id, 0);
        } else {
          unreadCountsMap.set(
            conversation.id,
            unreadCounts.get(conversation.id) || 0
          );
        }
      });

      setSidebarData({
        lastMessages: lastMessagesMap,
        unreadCounts: unreadCountsMap,
        conversationTimestamps: timestampsMap,
      });

      // Update cache
      lastLoadTimeRef.current = now;
      lastConversationIdsRef.current = conversationIdsKey;
    } catch (error) {
      console.error("Error loading sidebar data:", error);

      // Fallback to individual conversation data
      conversations.forEach((conversation) => {
        lastMessagesMap.set(conversation.id, "No messages yet");
        timestampsMap.set(
          conversation.id,
          new Date(conversation.created_at).getTime()
        );
        unreadCountsMap.set(conversation.id, 0);
      });

      setSidebarData({
        lastMessages: lastMessagesMap,
        unreadCounts: unreadCountsMap,
        conversationTimestamps: timestampsMap,
      });
    } finally {
      setIsInitialDataLoading(false);
    }
  }, [conversations, user?.id, selectedConversationId]);

  // Subscribe to real-time updates for all conversations
  const subscribeToAllConversations = useCallback(async () => {
    if (conversations.length === 0 || !user?.id) return;

    console.log(
      "🔄 Setting up sidebar subscriptions for conversations:",
      conversations.map((c) => c.id)
    );

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach((subscription) => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    });
    subscriptionsRef.current.clear();

    // Subscribe to all conversations
    const subscriptionPromises = conversations.map(async (conversation) => {
      try {
        console.log(
          `📡 Subscribing sidebar to conversation: ${conversation.id}`
        );
        const channel = await RealtimeService.subscribeToMessages(
          conversation.id,
          (message) => {
            console.log(
              `📨 Sidebar received message for ${conversation.id}:`,
              message
            );

            // Check if we've already processed this message
            if (processedMessagesRef.current.has(message.id)) {
              console.log(
                `⚠️ Message ${message.id} already processed, skipping`
              );
              return;
            }
            processedMessagesRef.current.add(message.id);

            const messageTime = new Date(message.createdAt).getTime();
            const isFromCurrentUser = message.user.id === user.id;

            console.log(`📝 Updating sidebar for ${conversation.id}:`, {
              isFromCurrentUser,
              isSelected: conversation.id === selectedConversationIdRef.current,
            });

            // Update sidebar data
            setSidebarData((prev) => {
              const newLastMessages = new Map(prev.lastMessages);
              const newUnreadCounts = new Map(prev.unreadCounts);
              const newTimestamps = new Map(prev.conversationTimestamps);

              // Update last message
              const prefix = isFromCurrentUser ? "You: " : "";
              const messageText = `${prefix}${message.content}`;
              newLastMessages.set(conversation.id, messageText);

              // Update timestamp
              newTimestamps.set(conversation.id, messageTime);

              // Update unread count (only if from someone else and not currently selected)
              if (
                !isFromCurrentUser &&
                conversation.id !== selectedConversationIdRef.current
              ) {
                const currentCount = newUnreadCounts.get(conversation.id) || 0;
                newUnreadCounts.set(conversation.id, currentCount + 1);
                console.log(
                  `🔢 Updated unread count for ${conversation.id}: ${
                    currentCount + 1
                  }`
                );
              }

              return {
                lastMessages: newLastMessages,
                unreadCounts: newUnreadCounts,
                conversationTimestamps: newTimestamps,
              };
            });
          },
          (error) => {
            console.error(
              `❌ Error in sidebar subscription for conversation ${conversation.id}:`,
              error
            );
          }
        );

        subscriptionsRef.current.set(conversation.id, channel);
        console.log(
          `✅ Sidebar subscription established for ${conversation.id}`
        );
      } catch (error) {
        console.error(
          `❌ Error subscribing sidebar to conversation ${conversation.id}:`,
          error
        );
      }
    });

    await Promise.all(subscriptionPromises);
    console.log("✅ All sidebar subscriptions completed");
  }, [conversations, user?.id]);

  // Update sidebar data from external source (called by main chat hook)
  const updateSidebarData = useCallback(
    (conversationId: string, message: any) => {
      const messageTime = new Date(message.createdAt).getTime();
      const isFromCurrentUser = message.user.id === user?.id;

      setSidebarData((prev) => {
        const newLastMessages = new Map(prev.lastMessages);
        const newUnreadCounts = new Map(prev.unreadCounts);
        const newTimestamps = new Map(prev.conversationTimestamps);

        // Update last message
        const prefix = isFromCurrentUser ? "You: " : "";
        const messageText = `${prefix}${message.content}`;
        newLastMessages.set(conversationId, messageText);

        // Update timestamp
        newTimestamps.set(conversationId, messageTime);

        // Update unread count (only if from someone else and not currently selected)
        if (
          !isFromCurrentUser &&
          conversationId !== selectedConversationIdRef.current
        ) {
          const currentCount = newUnreadCounts.get(conversationId) || 0;
          newUnreadCounts.set(conversationId, currentCount + 1);
        }

        return {
          lastMessages: newLastMessages,
          unreadCounts: newUnreadCounts,
          conversationTimestamps: newTimestamps,
        };
      });
    },
    [user?.id, selectedConversationId]
  );

  // Update sidebar for selected conversation when it changes
  const updateSelectedConversationSidebar = useCallback(
    (conversationId: string, message: any) => {
      const messageTime = new Date(message.createdAt).getTime();
      const isFromCurrentUser = message.user.id === user?.id;

      setSidebarData((prev) => {
        const newLastMessages = new Map(prev.lastMessages);
        const newTimestamps = new Map(prev.conversationTimestamps);

        // Update last message
        const prefix = isFromCurrentUser ? "You: " : "";
        const messageText = `${prefix}${message.content}`;
        newLastMessages.set(conversationId, messageText);

        // Update timestamp
        newTimestamps.set(conversationId, messageTime);

        return {
          ...prev,
          lastMessages: newLastMessages,
          conversationTimestamps: newTimestamps,
        };
      });
    },
    [user?.id]
  );

  // Clear unread count when conversation is selected
  const clearUnreadCount = useCallback(
    async (conversationId: string) => {
      if (!user?.id) return;

      try {
        // Mark messages as read in database
        await ChatService.markMessagesAsRead(conversationId, user.id);

        // Clear unread count in state
        setSidebarData((prev) => {
          const newUnreadCounts = new Map(prev.unreadCounts);
          newUnreadCounts.set(conversationId, 0);
          return {
            ...prev,
            unreadCounts: newUnreadCounts,
          };
        });
      } catch (error) {
        console.error("Error clearing unread count:", error);
      }
    },
    [user?.id]
  );

  // Refresh sidebar data
  const refreshSidebar = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Load initial data when conversations change (optimized dependencies)
  const hasLoadedRef = useRef(false);
  const lastConversationsRef = useRef<string>("");

  useEffect(() => {
    const conversationsKey = conversations
      .map((c) => c.id)
      .sort()
      .join(",");

    // Only load if conversations have actually changed or haven't been loaded yet
    if (
      !hasLoadedRef.current ||
      lastConversationsRef.current !== conversationsKey
    ) {
      hasLoadedRef.current = true;
      lastConversationsRef.current = conversationsKey;
      loadInitialData();
    }
  }, [conversations, loadInitialData]); // Removed user?.id and selectedConversationId from dependencies

  // Subscribe to all conversations when they change
  const lastSubscriptionKeyRef = useRef<string>("");

  useEffect(() => {
    const subscriptionKey = conversations
      .map((c) => c.id)
      .sort()
      .join(",");

    // Only subscribe if conversations have actually changed (not when selected conversation changes)
    if (lastSubscriptionKeyRef.current !== subscriptionKey) {
      lastSubscriptionKeyRef.current = subscriptionKey;
      subscribeToAllConversations();
    }
  }, [conversations, user?.id]);

  // Clear unread count when selected conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      clearUnreadCount(selectedConversationId);
    }
  }, [selectedConversationId, clearUnreadCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((subscription) => {
        if (subscription && typeof subscription.unsubscribe === "function") {
          subscription.unsubscribe();
        }
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    sidebarData,
    refreshSidebar,
    updateSidebarData,
    updateSelectedConversationSidebar,
    isInitialDataLoading,
  };
}
