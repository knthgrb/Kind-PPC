"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserConversations } from "@/hooks/chats/useUserConversations";
import { useAuthStore } from "@/stores/useAuthStore";
import { ChatService } from "@/services/chat/chatService";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ChatsClient() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { conversations, isLoading } = useUserConversations({});

  // Unified loading state
  const isChatLoading = isLoading;

  useEffect(() => {
    const setDefaultConversation = async () => {
      if (!isLoading && conversations.length > 0 && user?.id) {
        try {
          // Get the conversation where user last sent a message
          const lastSentConversation =
            await ChatService.getLastSentConversation(user.id);

          let defaultConversationId: string;

          if (lastSentConversation) {
            // Check if the last sent conversation still exists in current conversations
            const existsInCurrent = conversations.find(
              (c) => c.id === lastSentConversation.conversation_id
            );
            defaultConversationId = existsInCurrent
              ? lastSentConversation.conversation_id
              : conversations[0].id;
          } else {
            // If no messages sent, use the first conversation
            defaultConversationId = conversations[0].id;
          }

          // Redirect to the default conversation
          router.push(`/chats/${defaultConversationId}`);
        } catch (error) {
          // Fallback to first conversation
          router.push(`/chats/${conversations[0].id}`);
        }
      }
    };

    setDefaultConversation();
  }, [conversations, isLoading, router, user?.id]);

  if (isChatLoading) {
    return <LoadingSpinner message="Loading chat..." variant="fullscreen" />;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No conversations yet
          </h2>
          <p className="text-gray-600">
            Start a conversation to begin chatting!
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadingSpinner
      message="Redirecting to conversation..."
      variant="fullscreen"
    />
  );
}
