/**
 * Shared utilities for chat message conversion and formatting
 */

import type { ChatMessage } from "@/services/chat/realtimeService";
import type { MessageWithUser, User } from "@/types/chat";

/**
 * Convert database message to ChatMessage format
 */
export function convertToChatMessage(
  message: MessageWithUser,
  user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string | null;
  }
): ChatMessage {
  return {
    id: message.id,
    content: message.content,
    user: {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      avatar: user.profile_image_url || undefined,
    },
    createdAt: message.created_at,
    conversationId: message.conversation_id,
    messageType: message.message_type,
    fileUrl: message.file_url,
  };
}

/**
 * Convert ChatMessage to MessageWithUser format
 */
export function convertToMessageWithUser(
  chatMessage: ChatMessage
): MessageWithUser {
  return {
    id: chatMessage.id,
    conversation_id: chatMessage.conversationId,
    sender_id: chatMessage.user.id,
    content: chatMessage.content,
    message_type: chatMessage.messageType as any,
    file_url: chatMessage.fileUrl,
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
}

/**
 * Get the other user from a conversation
 */
export function getOtherUser(
  conversation: {
    matches: {
      kindbossing_id: string;
      kindtao_id: string;
      kindbossing: User;
      kindtao: User;
    };
  },
  currentUserId: string
): User {
  return conversation.matches.kindbossing_id === currentUserId
    ? conversation.matches.kindtao
    : conversation.matches.kindbossing;
}

/**
 * Check if a message is from the current user
 */
export function isMessageFromCurrentUser(
  message: { sender_id: string },
  currentUserId: string
): boolean {
  return message.sender_id === currentUserId;
}

/**
 * Format message content for sidebar display
 */
export function formatMessageForSidebar(
  content: string,
  isFromCurrentUser: boolean
): string {
  const prefix = isFromCurrentUser ? "You: " : "";
  return `${prefix}${content}`;
}

/**
 * Create fallback user data for error cases
 */
export function createFallbackUser(userId: string): User {
  return {
    id: userId,
    first_name: "Unknown",
    last_name: "User",
    email: "",
    role: "kindtao",
    profile_image_url: null,
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
  };
}
