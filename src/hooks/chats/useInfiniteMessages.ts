"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatService } from "@/services/chat/chatService";
import { BlockingService } from "@/services/chat/blockingService";
import {
  RealtimeService,
  type ChatMessage,
} from "@/services/chat/realtimeService";
import { useAuth } from "@/hooks/useAuth";

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
  const messagesContainerRef = useRef<HTMLElement | null>(null);
  const sentinelElementRef = useRef<HTMLDivElement | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);

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
    async (content: string) => {
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
          "text"
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

  // Function to set up observer
  const setupObserver = useCallback(() => {
    const element = loadMoreRef.current || sentinelElementRef.current;
    if (element && hasMore) {
      console.log("Setting up observer via setupObserver function");
      loadMoreRefCallback(element);
    }
  }, [hasMore, loadMoreRefCallback]);

  // Set up observer when the ref is available
  useEffect(() => {
    setupObserver();

    // Retry after a short delay if observer wasn't set up
    const retryTimeout = setTimeout(() => {
      if (!observerRef.current && hasMore) {
        console.log("Retrying observer setup after delay");
        setupObserver();
      }
    }, 500);

    return () => clearTimeout(retryTimeout);
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

  // Re-observe when hasMore changes or when messages change
  useEffect(() => {
    if (loadMoreRef.current && hasMore) {
      console.log("Setting up observer via useEffect");
      loadMoreRefCallback(loadMoreRef.current);
    }
  }, [hasMore, loadMoreRefCallback]);

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

      console.log(
        "🚀 Setting up realtime subscription for conversation:",
        conversationId
      );
      RealtimeService.subscribeToMessages(
        conversationId,
        handleRealtimeMessage,
        (error) => {
          console.error("❌ Realtime subscription error:", error);
          // Only set error if this is still the current conversation
          if (conversationId === currentConversationIdRef.current) {
            setError(error);
          }
        }
      )
        .then(() => {
          console.log("✅ Realtime subscription established");
        })
        .catch((err) => {
          console.error("❌ Failed to establish realtime subscription:", err);
        });
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
