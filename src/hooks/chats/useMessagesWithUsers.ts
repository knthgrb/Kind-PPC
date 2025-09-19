"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatService } from "@/services/chat/chatService";
import { type ChatMessage } from "@/services/chat/realtimeService";
import type { Message, User } from "@/types/chat";

export interface MessageWithUser extends Message {
  sender: User;
}

export interface UseMessagesWithUsersOptions {
  conversationId: string | null;
  chatMessages: ChatMessage[]; // Receive messages from parent hook
  isLoading: boolean;
  error: Error | null;
  onError?: (error: Error) => void;
}

export interface UseMessagesWithUsersReturn {
  messages: MessageWithUser[];
  isLoading: boolean;
  error: Error | null;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  clearMessages: () => void;
}

export function useMessagesWithUsers({
  conversationId,
  chatMessages,
  isLoading,
  error,
  onError,
}: UseMessagesWithUsersOptions): UseMessagesWithUsersReturn {
  const [userCache, setUserCache] = useState<Map<string, User>>(new Map());
  const [messagesWithUsers, setMessagesWithUsers] = useState<MessageWithUser[]>(
    []
  );

  // Fetch user details for a message sender
  const fetchUserDetails = useCallback(
    async (userId: string): Promise<User | null> => {
      // Check cache first
      if (userCache.has(userId)) {
        return userCache.get(userId)!;
      }

      try {
        const userData = await ChatService.getUserDetails(userId);
        if (!userData) {
          return null;
        }

        // Cache the user
        setUserCache((prev) => new Map(prev).set(userId, userData));
        return userData;
      } catch (error) {
        return null;
      }
    },
    [userCache]
  );

  // Convert ChatMessages to MessageWithUser format
  const convertChatMessageToMessageWithUser = useCallback(
    (chatMessage: ChatMessage): MessageWithUser => {
      return {
        id: chatMessage.id,
        conversation_id: chatMessage.conversationId,
        sender_id: chatMessage.user.id,
        content: chatMessage.content,
        message_type: "text" as const,
        file_url: null,
        status: "sent" as const,
        read_at: null,
        created_at: chatMessage.createdAt,
        sender: {
          id: chatMessage.user.id,
          first_name: chatMessage.user.name.split(" ")[0] || "",
          last_name: chatMessage.user.name.split(" ").slice(1).join(" ") || "",
          email: "",
          role: "kindtao" as const,
          profile_image_url: chatMessage.user.avatar || null,
          phone: null,
          date_of_birth: null,
          gender: null,
          address: null,
          city: null,
          province: null,
          postal_code: null,
          is_verified: false,
          verification_status: "pending",
          subscription_tier: "free",
          subscription_expires_at: null,
          swipe_credits: 0,
          boost_credits: 0,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    },
    []
  );

  // Update messages when realtime messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      const convertedMessages = chatMessages.map(
        convertChatMessageToMessageWithUser
      );
      setMessagesWithUsers(convertedMessages);
    } else {
      setMessagesWithUsers([]);
    }
  }, [chatMessages, convertChatMessageToMessageWithUser]);

  // Wrapper functions that maintain the same interface
  const addMessage = useCallback((message: Message) => {
    // Messages are now handled by the realtime system
  }, []);

  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      // Messages are now handled by the realtime system
    },
    []
  );

  const removeMessage = useCallback((messageId: string) => {
    // Messages are now handled by the realtime system
  }, []);

  const clearMessages = useCallback(() => {
    setMessagesWithUsers([]);
  }, []);

  return {
    messages: messagesWithUsers,
    isLoading,
    error,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
  };
}
