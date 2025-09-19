"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatService } from "@/services/chat/chatService";
import { BlockingService } from "@/services/chat/blockingService";
import {
  RealtimeService,
  type ChatMessage,
} from "@/services/chat/realtimeService";
import { useAuthStore } from "@/stores/useAuthStore";
import type { MessageWithUser } from "@/types/chat";
import { convertToChatMessage } from "@/utils/chatMessageUtils";

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
  sendMessage: (
    content: string,
    messageType?: string,
    fileUrl?: string
  ) => Promise<void>;
  isSending: boolean;
  sendError: Error | null;
}

export function useInfiniteMessages({
  conversationId,
  pageSize = 25,
  onMessage,
}: UseInfiniteMessagesOptions): UseInfiniteMessagesReturn {
  const { user } = useAuthStore();
  const userMetadata = user?.user_metadata;
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
  const messagesContainerRef = useRef<HTMLElement | null>(null);
  const sentinelElementRef = useRef<HTMLDivElement | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Request deduplication to prevent duplicate API calls
  const pendingRequests = useRef<Set<string>>(new Set());
  const requestCache = useRef<
    Map<string, { data: unknown; timestamp: number }>
  >(new Map());
  const CACHE_DURATION = 5000; // 5 seconds cache

  // Call monitoring to track backend usage
  const callCount = useRef(0);
  const callHistory = useRef<
    Array<{ type: string; timestamp: number; conversationId: string }>
  >([]);

  const logCall = useCallback((type: string, conversationId: string) => {
    callCount.current += 1;
    callHistory.current.push({
      type,
      timestamp: Date.now(),
      conversationId,
    });

    // Keep only last 50 calls for monitoring
    if (callHistory.current.length > 50) {
      callHistory.current = callHistory.current.slice(-50);
    }

    // Warn if too many calls in short time
    const recentCalls = callHistory.current.filter(
      (call) =>
        Date.now() - call.timestamp < 10000 &&
        call.conversationId === conversationId
    );
    if (recentCalls.length > 10) {
      // High call frequency detected - could implement rate limiting here
    }
  }, []);

  // Deduplicated request function to prevent duplicate API calls
  const makeDeduplicatedRequest = useCallback(
    async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
      // Check cache first
      const cached = requestCache.current.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data as T;
      }

      // Check if request is already pending
      if (pendingRequests.current.has(key)) {
        // Wait for pending request to complete
        return new Promise((resolve) => {
          const checkPending = () => {
            const cached = requestCache.current.get(key);
            if (cached) {
              resolve(cached.data as T);
            } else {
              setTimeout(checkPending, 100);
            }
          };
          checkPending();
        });
      }

      // Make new request
      pendingRequests.current.add(key);

      try {
        const result = await requestFn();
        requestCache.current.set(key, { data: result, timestamp: Date.now() });

        const conversationId = key.split("-")[1];
        logCall("API_REQUEST", conversationId);

        return result;
      } finally {
        pendingRequests.current.delete(key);
      }
    },
    []
  );

  // Use shared message conversion utility
  const convertMessage = useCallback(
    (message: MessageWithUser): ChatMessage => {
      return convertToChatMessage(message, message.sender);
    },
    []
  );

  // Load initial messages with deduplication
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    currentOffset.current = 0;

    try {
      // Use deduplicated request to prevent duplicate API calls
      const requestKey = `messages-${conversationId}-${pageSize}-0`;
      const dbMessages = await makeDeduplicatedRequest(requestKey, () =>
        ChatService.fetchMessagesWithUsers(conversationId, pageSize, 0)
      );

      const chatMessages = dbMessages.map(convertMessage);
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
  }, [
    conversationId,
    pageSize,
    convertMessage,
    onMessage,
    makeDeduplicatedRequest,
  ]);

  // Load more messages (older ones)
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    // Use the stored container ref or fallback to querySelector
    const messagesContainer =
      messagesContainerRef.current ||
      (document.querySelector(".overflow-y-auto") as HTMLElement);
    if (!messagesContainer) {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
      return;
    }

    const currentScrollTop = messagesContainer.scrollTop;
    const currentScrollHeight = messagesContainer.scrollHeight;
    const clientHeight = messagesContainer.clientHeight;
    const isAtTop = currentScrollTop === 0;

    try {
      // Use deduplicated request to prevent duplicate API calls
      const requestKey = `messages-${conversationId}-${pageSize}-${currentOffset.current}`;
      const dbMessages = await makeDeduplicatedRequest(requestKey, () =>
        ChatService.fetchMessagesWithUsers(
          conversationId,
          pageSize,
          currentOffset.current
        )
      );

      if (dbMessages.length === 0) {
        setHasMore(false);
        return;
      }

      const chatMessages = dbMessages.map(convertMessage);

      chatMessages.reverse();

      setMessages((prev) => {
        const newMessages = [...chatMessages, ...prev];

        // Use requestAnimationFrame for smoother scroll position updates
        requestAnimationFrame(() => {
          if (messagesContainer) {
            const newScrollHeight = messagesContainer.scrollHeight;
            const heightDifference = newScrollHeight - currentScrollHeight;

            let newScrollTop;
            if (isAtTop) {
              newScrollTop = 0;
            } else {
              newScrollTop = currentScrollTop + heightDifference;
            }

            // Smooth scroll to maintain position
            messagesContainer.scrollTo({
              top: newScrollTop,
              behavior: "instant",
            });
          }
        });

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
  }, [conversationId, pageSize, hasMore, convertMessage]);

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

  // Debounced load function to prevent multiple simultaneous loads
  const debouncedLoadMore = useCallback(() => {
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;

    // Prevent loading if already loading or loaded recently (within 1 second)
    if (isLoadingRef.current || timeSinceLastLoad < 1000) {
      return;
    }

    lastLoadTimeRef.current = now;
    loadMoreMessages();
  }, [loadMoreMessages]);

  // Send message function
  const sendMessage = useCallback(
    async (content: string, messageType: string = "text", fileUrl?: string) => {
      if (!conversationId || !user?.id || !content.trim()) {
        return;
      }
      setIsSending(true);
      setSendError(null);

      // Create optimistic message immediately
      const optimisticMessage: ChatMessage = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        user: {
          id: user.id,
          name: `${userMetadata?.first_name || "Unknown"} ${
            userMetadata?.last_name || "User"
          }`,
          avatar:
            (user as { profile_image_url?: string }).profile_image_url ||
            undefined,
        },
        createdAt: new Date().toISOString(),
        conversationId: conversationId,
        messageType: messageType,
        fileUrl: fileUrl || null,
      };

      // Add optimistic message immediately
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, optimisticMessage];
        onMessage?.(newMessages);
        return newMessages;
      });

      try {
        // Check if the other user is blocked before sending
        const otherUserId = await ChatService.getOtherUserId(
          conversationId,
          user.id
        );
        if (otherUserId) {
          const isBlocked = await BlockingService.isUserBlocked(
            user.id,
            otherUserId
          );
          if (isBlocked) {
            setSendError(new Error("Cannot send message to blocked user"));
            // Remove optimistic message on error
            setMessages((prevMessages) =>
              prevMessages.filter((msg) => msg.id !== optimisticMessage.id)
            );
            return;
          }
        }

        // Use server action that includes notification creation
        const { sendMessage: sendMessageAction } = await import(
          "@/actions/chat/send-message"
        );
        const newMessage = await sendMessageAction(
          conversationId,
          user.id,
          content.trim(),
          messageType,
          fileUrl
        );

        // Convert to ChatMessage format
        const chatMessage = RealtimeService.convertToChatMessage(newMessage, {
          id: user.id,
          first_name: userMetadata?.first_name || "Unknown",
          last_name: userMetadata?.last_name || "User",
          profile_image_url:
            (user as { profile_image_url?: string }).profile_image_url || null,
        });

        // Replace optimistic message with real message
        setMessages((prevMessages) => {
          const newMessages = prevMessages.map((msg) =>
            msg.id === optimisticMessage.id ? chatMessage : msg
          );
          onMessage?.(newMessages);
          return newMessages;
        });

        try {
          await RealtimeService.sendMessage(conversationId, chatMessage);
        } catch (broadcastError) {
          // Silent error handling for broadcast failures
        }

        try {
          await ChatService.updateMessageStatus(newMessage.id, "sent");
        } catch (error) {
          // Silent error handling
        }
      } catch (err) {
        setSendError(err as Error);
        // Remove optimistic message on error
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== optimisticMessage.id)
        );
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, user, userMetadata, onMessage]
  );

  // Intersection Observer for infinite loading
  const loadMoreRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      // Store the ref
      loadMoreRef.current = node;
      sentinelElementRef.current = node;

      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (node && hasMore) {
        // Find the messages container (the scrollable parent)
        const messagesContainer = node.closest(
          ".overflow-y-auto"
        ) as HTMLElement;
        messagesContainerRef.current = messagesContainer;

        if (messagesContainer) {
          observerRef.current = new IntersectionObserver(
            (entries) => {
              const entry = entries[0];

              if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
                debouncedLoadMore();
              }
            },
            {
              threshold: 0.1,
              rootMargin: "100px", // Trigger 100px before the element comes into view
              root: messagesContainer, // Use the scrollable container as root
            }
          );
          observerRef.current.observe(node);
        }
      }
    },
    [hasMore, loadMoreMessages]
  );

  // Function to set up observer (stabilized dependencies to prevent loops)
  const setupObserver = useCallback(() => {
    const element = loadMoreRef.current || sentinelElementRef.current;
    if (element && hasMore) {
      loadMoreRefCallback(element);
    }
  }, [hasMore]);

  // Set up observer when the ref is available (removed retry loop)
  useEffect(() => {
    setupObserver();
  }, [setupObserver, hasMore]);

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

  // Re-observe when hasMore changes (removed loadMoreRefCallback dependency to prevent loop)
  useEffect(() => {
    if (loadMoreRef.current && hasMore) {
      loadMoreRefCallback(loadMoreRef.current);
    }
  }, [hasMore]);

  // Fallback: Add scroll event listener as backup (only if intersection observer fails)
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer || !hasMore) return;

    // Only use scroll fallback if intersection observer is not working
    const hasWorkingObserver = observerRef.current !== null;
    if (hasWorkingObserver) {
      return;
    }

    const handleScroll = () => {
      // Clear existing timeout
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }

      // Debounce scroll events
      scrollDebounceRef.current = setTimeout(() => {
        const scrollTop = messagesContainer.scrollTop;
        const sentinel = loadMoreRef.current || sentinelElementRef.current;

        if (sentinel && scrollTop <= 50 && hasMore && !isLoadingRef.current) {
          debouncedLoadMore();
        }
      }, 100); // 100ms debounce
    };

    messagesContainer.addEventListener("scroll", handleScroll);
    return () => {
      messagesContainer.removeEventListener("scroll", handleScroll);
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, [hasMore, debouncedLoadMore]);

  // Simplified realtime subscription to prevent loops
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

    // Only subscribe if this is a new conversation
    if (conversationId === currentConversationIdRef.current) {
      return;
    }

    // Clean up previous subscription
    if (currentConversationIdRef.current && subscriptionRef.current) {
      RealtimeService.unsubscribeFromMessages(currentConversationIdRef.current);
      subscriptionRef.current = false;
    }

    // Set new conversation ID and subscribe
    currentConversationIdRef.current = conversationId;
    subscriptionRef.current = true;

    RealtimeService.subscribeToMessages(
      conversationId,
      handleRealtimeMessage,
      (error) => {
        setError(error);
      }
    )
      .then(() => {})
      .catch((err) => {
        setError(err);
      });

    return () => {
      if (conversationId === currentConversationIdRef.current) {
        RealtimeService.unsubscribeFromMessages(conversationId);
        subscriptionRef.current = false;
        currentConversationIdRef.current = null;
      }
    };
  }, [conversationId]);

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
