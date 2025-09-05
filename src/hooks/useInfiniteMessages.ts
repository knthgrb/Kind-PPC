"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatService } from "@/services/chat/chatService";
import {
  RealtimeService,
  type ChatMessage,
} from "@/services/chat/realtimeService";
import { useAuth } from "./useAuth";

export interface UseInfiniteMessagesOptions {
  conversationId: string | null;
  pageSize?: number;
  onMessage?: (messages: ChatMessage[]) => void;
}

export interface UseInfiniteMessagesReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  loadMoreRef: (node: HTMLDivElement | null) => void;
  sendMessage: (content: string) => Promise<void>;
  isSending: boolean;
  sendError: Error | null;
}

export function useInfiniteMessages({
  conversationId,
  pageSize = 25,
  onMessage,
}: UseInfiniteMessagesOptions): UseInfiniteMessagesReturn {
  const { user, userMetadata } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<Error | null>(null);

  const currentOffset = useRef(0);
  const isLoadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const subscriptionRef = useRef<boolean>(false);
  const subscriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);

  // Convert database message to ChatMessage format
  const convertToChatMessage = useCallback((message: any): ChatMessage => {
    return {
      id: message.id,
      content: message.content,
      user: {
        id: message.sender.id,
        name: `${message.sender.first_name} ${message.sender.last_name}`,
        avatar: message.sender.profile_image_url || undefined,
      },
      createdAt: message.created_at,
      conversationId: message.conversation_id,
    };
  }, []);

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    currentOffset.current = 0;

    try {
      // Load latest messages first (most recent at the bottom)
      const dbMessages = await ChatService.fetchMessagesWithUsers(
        conversationId,
        pageSize,
        0
      );

      const chatMessages = dbMessages.map(convertToChatMessage);

      chatMessages.reverse();

      setMessages(chatMessages);
      setHasMore(dbMessages.length === pageSize);
      currentOffset.current = pageSize;

      onMessage?.(chatMessages);
    } catch (err) {
      setError(err as Error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        isLoadingRef.current = false;
      }, 100);
    }
  }, [conversationId, pageSize, convertToChatMessage, onMessage]);

  // Load more messages (older ones)
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    const messagesContainer = document.querySelector(".overflow-y-auto");
    if (!messagesContainer) {
      return;
    }

    const currentScrollTop = messagesContainer.scrollTop;
    const currentScrollHeight = messagesContainer.scrollHeight;
    const clientHeight = messagesContainer.clientHeight;
    const isAtTop = currentScrollTop === 0;

    try {
      const dbMessages = await ChatService.fetchMessagesWithUsers(
        conversationId,
        pageSize,
        currentOffset.current
      );

      if (dbMessages.length === 0) {
        setHasMore(false);
        return;
      }

      const chatMessages = dbMessages.map(convertToChatMessage);

      chatMessages.reverse();

      setMessages((prev) => {
        const newMessages = [...chatMessages, ...prev];

        setTimeout(() => {
          if (messagesContainer) {
            const newScrollHeight = messagesContainer.scrollHeight;
            const heightDifference = newScrollHeight - currentScrollHeight;

            let newScrollTop;
            if (isAtTop) {
              newScrollTop = 0;
            } else {
              newScrollTop = currentScrollTop + heightDifference;
            }

            messagesContainer.scrollTop = newScrollTop;
          }
        }, 100);

        return newMessages;
      });

      setHasMore(dbMessages.length === pageSize);
      currentOffset.current += pageSize;
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [conversationId, pageSize, hasMore, convertToChatMessage]);

  // Handle realtime message events
  const handleRealtimeMessage = useCallback((message: ChatMessage) => {
    setMessages((prevMessages) => {
      const messageExists = prevMessages.some((msg) => msg.id === message.id);
      if (!messageExists) {
        const newMessages = [...prevMessages, message];
        return newMessages;
      }
      return prevMessages;
    });
  }, []);

  // Send message function
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user?.id || !content.trim()) {
        return;
      }

      setIsSending(true);
      setSendError(null);

      try {
        // First save to database
        const newMessage = await ChatService.sendMessage(
          conversationId,
          user.id,
          content.trim(),
          "text"
        );

        // Convert to ChatMessage format
        const chatMessage = RealtimeService.convertToChatMessage(newMessage, {
          id: user.id,
          first_name: userMetadata?.first_name || "Unknown",
          last_name: userMetadata?.last_name || "User",
          profile_image_url: (user as any).profile_image_url || null,
        });

        setMessages((prevMessages) => {
          const newMessages = [...prevMessages, chatMessage];
          onMessage?.(newMessages);
          return newMessages;
        });

        try {
          await RealtimeService.sendMessage(conversationId, chatMessage);
        } catch (broadcastError) {
          // Silent error handling
        }

        try {
          await ChatService.updateMessageStatus(newMessage.id, "sent");
        } catch (error) {
          // Silent error handling
        }
      } catch (err) {
        setSendError(err as Error);
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, user, userMetadata, onMessage]
  );

  // Intersection Observer for infinite loading
  const loadMoreRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingRef.current) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
              loadMoreMessages();
            }
          },
          {
            threshold: 0.1,
            rootMargin: "50px",
          }
        );
        observerRef.current.observe(node);
      }
    },
    [hasMore, loadMoreMessages]
  );

  // Load initial messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadInitialMessages();
    } else {
      setMessages([]);
      setHasMore(true);
      currentOffset.current = 0;
    }
  }, [conversationId, loadInitialMessages]);

  // Set up realtime subscription with debouncing
  useEffect(() => {
    if (!conversationId) {
      // Clean up previous subscription if conversationId is null
      if (currentConversationIdRef.current) {
        RealtimeService.unsubscribeFromMessages(
          currentConversationIdRef.current
        );
        subscriptionRef.current = false;
        currentConversationIdRef.current = null;
      }
      return;
    }

    // Clear any existing timeout
    if (subscriptionTimeoutRef.current) {
      clearTimeout(subscriptionTimeoutRef.current);
    }

    // Debounce subscription changes to prevent rapid switching
    subscriptionTimeoutRef.current = setTimeout(() => {
      // Only subscribe if this is still the current conversation
      if (conversationId === currentConversationIdRef.current) {
        return;
      }

      // Clean up previous subscription
      if (currentConversationIdRef.current && subscriptionRef.current) {
        RealtimeService.unsubscribeFromMessages(
          currentConversationIdRef.current
        );
        subscriptionRef.current = false;
      }

      // Set new conversation ID
      currentConversationIdRef.current = conversationId;
      subscriptionRef.current = true;

      RealtimeService.subscribeToMessages(
        conversationId,
        handleRealtimeMessage,
        (error) => {
          // Only set error if this is still the current conversation
          if (conversationId === currentConversationIdRef.current) {
            setError(error);
          }
        }
      );
    }, 100); // 100ms debounce

    return () => {
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
      }
      if (conversationId === currentConversationIdRef.current) {
        RealtimeService.unsubscribeFromMessages(conversationId);
        subscriptionRef.current = false;
        currentConversationIdRef.current = null;
      }
    };
  }, [conversationId, handleRealtimeMessage]);

  // Cleanup observer and timeouts on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
      }
      if (currentConversationIdRef.current) {
        RealtimeService.unsubscribeFromMessages(
          currentConversationIdRef.current
        );
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore: loadMoreMessages,
    loadMoreRef: loadMoreRefCallback,
    sendMessage,
    isSending,
    sendError,
  };
}
