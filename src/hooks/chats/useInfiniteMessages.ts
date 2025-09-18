"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatService } from "@/services/chat/chatService";
import { BlockingService } from "@/services/chat/blockingService";
import {
  RealtimeService,
  type ChatMessage,
} from "@/services/chat/realtimeService";
import { useAuthStore } from "@/stores/useAuthStore";

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

  // ✅ ADDED: Request deduplication to prevent duplicate API calls
  const pendingRequests = useRef<Set<string>>(new Set());
  const requestCache = useRef<Map<string, { data: any; timestamp: number }>>(
    new Map()
  );
  const CACHE_DURATION = 5000; // 5 seconds cache

  // ✅ ADDED: Call monitoring to track backend usage
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

    console.log(
      `📊 Backend Call #${callCount.current}: ${type} for conversation ${conversationId}`
    );

    // Warn if too many calls in short time
    const recentCalls = callHistory.current.filter(
      (call) =>
        Date.now() - call.timestamp < 10000 &&
        call.conversationId === conversationId
    );
    if (recentCalls.length > 10) {
      console.warn(
        `⚠️ HIGH CALL FREQUENCY: ${recentCalls.length} calls in 10s for conversation ${conversationId}`
      );
    }
  }, []);

  // ✅ ADDED: Deduplicated request function to prevent duplicate API calls
  const makeDeduplicatedRequest = useCallback(
    async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
      // Check cache first
      const cached = requestCache.current.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log("📦 Using cached request:", key);
        return cached.data;
      }

      // Check if request is already pending
      if (pendingRequests.current.has(key)) {
        console.log("⏳ Request already pending:", key);
        // Wait for pending request to complete
        return new Promise((resolve) => {
          const checkPending = () => {
            const cached = requestCache.current.get(key);
            if (cached) {
              resolve(cached.data);
            } else {
              setTimeout(checkPending, 100);
            }
          };
          checkPending();
        });
      }

      // Make new request
      pendingRequests.current.add(key);
      console.log("🚀 Making new request:", key);

      try {
        const result = await requestFn();
        requestCache.current.set(key, { data: result, timestamp: Date.now() });

        // ✅ ADDED: Log successful call
        const conversationId = key.split("-")[1];
        logCall("API_REQUEST", conversationId);

        return result;
      } finally {
        pendingRequests.current.delete(key);
      }
    },
    []
  );

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
      messageType: message.message_type,
      fileUrl: message.file_url,
    };
  }, []);

  // Load initial messages with deduplication
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    currentOffset.current = 0;

    try {
      // ✅ FIXED: Use deduplicated request to prevent duplicate API calls
      const requestKey = `messages-${conversationId}-${pageSize}-0`;
      const dbMessages = await makeDeduplicatedRequest(requestKey, () =>
        ChatService.fetchMessagesWithUsers(conversationId, pageSize, 0)
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
  }, [
    conversationId,
    pageSize,
    convertToChatMessage,
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
      // ✅ FIXED: Use deduplicated request to prevent duplicate API calls
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

      const chatMessages = dbMessages.map(convertToChatMessage);

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
  }, [conversationId, pageSize, hasMore, convertToChatMessage]);

  // Handle realtime message events
  const handleRealtimeMessage = useCallback((message: ChatMessage) => {
    console.log("🔥 Realtime message received:", message);
    setMessages((prevMessages) => {
      const messageExists = prevMessages.some((msg) => msg.id === message.id);
      if (!messageExists) {
        console.log("✅ Adding new message to state");
        const newMessages = [...prevMessages, message];
        return newMessages;
      } else {
        console.log("⚠️ Message already exists, skipping");
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
      console.log("Load more blocked - already loading or too recent");
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
            return;
          }
        }

        // First save to database
        const newMessage = await ChatService.sendMessage(
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
          profile_image_url: (user as any).profile_image_url || null,
        });

        console.log("💾 Adding message to local state:", chatMessage);
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages, chatMessage];
          onMessage?.(newMessages);
          return newMessages;
        });

        try {
          console.log("📡 Broadcasting message via realtime:", chatMessage);
          await RealtimeService.sendMessage(conversationId, chatMessage);
          console.log("✅ Message broadcast successful");
        } catch (broadcastError) {
          console.error("❌ Message broadcast failed:", broadcastError);
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
      console.log("loadMoreRefCallback called:", {
        node,
        hasMore,
        isLoading: isLoadingRef.current,
      });

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

        console.log("Setting up observer with container:", messagesContainer);

        if (messagesContainer) {
          observerRef.current = new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              console.log("Intersection Observer callback:", {
                isIntersecting: entry.isIntersecting,
                hasMore,
                isLoading: isLoadingRef.current,
                intersectionRatio: entry.intersectionRatio,
              });

              if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
                console.log(
                  "Intersection Observer triggered - loading more messages"
                );
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
          console.log("Observer set up and observing node");
        } else {
          console.log("No messages container found");
        }
      }
    },
    [hasMore, loadMoreMessages]
  );

  // Function to set up observer (stabilized dependencies to prevent loops)
  const setupObserver = useCallback(() => {
    const element = loadMoreRef.current || sentinelElementRef.current;
    if (element && hasMore) {
      console.log("Setting up observer via setupObserver function");
      loadMoreRefCallback(element);
    }
  }, [hasMore]); // ✅ FIXED: Removed loadMoreRefCallback dependency

  // Set up observer when the ref is available (removed retry loop)
  useEffect(() => {
    setupObserver();
    // ✅ FIXED: Removed retry timeout to prevent loops
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
      console.log("Setting up observer via useEffect");
      loadMoreRefCallback(loadMoreRef.current);
    }
  }, [hasMore]); // ✅ FIXED: Removed loadMoreRefCallback dependency

  // Debug: Log when loadMoreRef changes
  useEffect(() => {
    console.log("loadMoreRef changed:", loadMoreRef.current);
  }, [loadMoreRef.current]);

  // Fallback: Add scroll event listener as backup (only if intersection observer fails)
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer || !hasMore) return;

    // Only use scroll fallback if intersection observer is not working
    const hasWorkingObserver = observerRef.current !== null;
    if (hasWorkingObserver) {
      console.log("Intersection observer is working, skipping scroll fallback");
      return;
    }

    console.log("Setting up scroll fallback");

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
          console.log("Scroll fallback triggered - loading more messages");
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

  // ✅ FIXED: Simplified realtime subscription to prevent loops
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

    console.log(
      "🚀 Setting up realtime subscription for conversation:",
      conversationId
    );

    RealtimeService.subscribeToMessages(
      conversationId,
      handleRealtimeMessage,
      (error) => {
        console.error("❌ Realtime subscription error:", error);
        setError(error);
      }
    )
      .then(() => {
        console.log("✅ Realtime subscription established");
      })
      .catch((err) => {
        console.error("❌ Failed to establish realtime subscription:", err);
      });

    return () => {
      if (conversationId === currentConversationIdRef.current) {
        RealtimeService.unsubscribeFromMessages(conversationId);
        subscriptionRef.current = false;
        currentConversationIdRef.current = null;
      }
    };
  }, [conversationId]); // ✅ FIXED: Removed handleRealtimeMessage dependency to prevent loops

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
