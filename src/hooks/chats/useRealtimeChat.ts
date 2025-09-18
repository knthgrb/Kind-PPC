"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RealtimeService,
  type ChatMessage,
} from "@/services/chat/realtimeService";
import { ChatService } from "@/services/chat/chatService";
import { useAuth } from "@/hooks/useAuth";

export interface UseRealtimeChatOptions {
  conversationId: string | null;
  onMessage?: (messages: ChatMessage[]) => void;
  messages?: ChatMessage[];
}

export interface UseRealtimeChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  isSending: boolean;
  sendError: Error | null;
}

export function useRealtimeChat({
  conversationId,
  onMessage,
  messages: initialMessages = [],
}: UseRealtimeChatOptions): UseRealtimeChatReturn {
  const { user, userMetadata } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<Error | null>(null);
  const channelRef = useRef<any>(null);

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dbMessages = await ChatService.fetchMessages(conversationId);

      // Convert database messages to ChatMessage format
      const chatMessages: ChatMessage[] = [];

      for (const message of dbMessages) {
        try {
          // Get user details for each message
          const userDetails = await ChatService.getUserDetails(
            message.sender_id
          );
          if (userDetails) {
            const chatMessage = RealtimeService.convertToChatMessage(
              message,
              userDetails
            );
            chatMessages.push(chatMessage);
          }
        } catch (userError) {
          console.error("Error fetching user details for message:", userError);
          // Add message with placeholder user data
          const chatMessage = RealtimeService.convertToChatMessage(message, {
            id: message.sender_id,
            first_name: "Unknown",
            last_name: "User",
            profile_image_url: null,
          });
          chatMessages.push(chatMessage);
        }
      }

      setMessages(chatMessages);
      onMessage?.(chatMessages);
    } catch (err) {
      console.error("Error loading initial messages:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Handle realtime message events
  const handleRealtimeMessage = useCallback(
    (message: ChatMessage) => {
      setMessages((prevMessages) => {
        // Check if message already exists to avoid duplicates
        const messageExists = prevMessages.some((msg) => msg.id === message.id);
        if (!messageExists) {
          const newMessages = [...prevMessages, message];
          onMessage?.(newMessages);
          return newMessages;
        }
        return prevMessages;
      });
    },
    [onMessage] // Add onMessage to dependencies to prevent stale closures
  );

  // Handle realtime errors
  const handleRealtimeError = useCallback((error: Error) => {
    console.error("Realtime error:", error);
    setError(error);
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

        // Add immediately for better UX
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages, chatMessage];
          onMessage?.(newMessages);
          return newMessages;
        });

        // Wait for channel to be ready with a longer timeout
        const isReady = await RealtimeService.ensureChannelReady(
          conversationId
        );
        if (!isReady) {
          console.warn(
            "Channel not ready, attempting to create new subscription..."
          );

          // Try to create a new subscription as fallback
          try {
            await RealtimeService.subscribeToMessages(
              conversationId,
              handleRealtimeMessage,
              handleRealtimeError
            );

            // Wait a bit for the new subscription to be ready
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const retryReady = await RealtimeService.ensureChannelReady(
              conversationId
            );
            if (!retryReady) {
              console.warn(
                "Still not ready after retry, but message saved to database"
              );
              return;
            }
          } catch (retryError) {
            console.warn(
              "Failed to create fallback subscription, but message saved to database:",
              retryError
            );
            return;
          }
        }

        // Broadcast to all connected clients using the existing channel
        await RealtimeService.sendMessage(conversationId, chatMessage);

        // Update message status to "sent" after successful broadcast
        try {
          await ChatService.updateMessageStatus(newMessage.id, "sent");
        } catch (error) {
          console.error("Error updating message status to sent:", error);
        }
      } catch (err) {
        console.error("Error sending message:", err);
        setSendError(err as Error);
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, user, userMetadata] // Add userMetadata to dependencies
  );

  // Set up realtime subscription when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    let currentChannel: any = null;

    const setupSubscription = async () => {
      try {
        // Clean up existing subscription first
        if (channelRef.current) {
          RealtimeService.unsubscribeFromMessages(conversationId);
          channelRef.current = null;
        }

        // Load initial messages
        await loadInitialMessages();

        // Only proceed if component is still mounted
        if (!isMounted) return;

        // Subscribe to realtime messages
        currentChannel = await RealtimeService.subscribeToMessages(
          conversationId,
          handleRealtimeMessage,
          handleRealtimeError
        );

        // Only set channel if component is still mounted
        if (isMounted) {
          channelRef.current = currentChannel;
        }
      } catch (error) {
        if (isMounted) {
          setError(error as Error);
        }
      }
    };

    setupSubscription();

    // Cleanup on unmount or conversationId change
    return () => {
      isMounted = false;
      if (currentChannel) {
        RealtimeService.unsubscribeFromMessages(conversationId);
        currentChannel = null;
      }
      if (channelRef.current) {
        channelRef.current = null;
      }
    };
  }, [conversationId]); // Only depend on conversationId to prevent infinite loops

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    isSending,
    sendError,
  };
}
