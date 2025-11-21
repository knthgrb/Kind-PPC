"use client";

import { use } from "react";
import RecsConversationOverlay from "@/app/(kindtao)/recs/_components/RecsConversationOverlay";

interface ConversationInterceptPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default function ConversationInterceptPage({
  params,
}: ConversationInterceptPageProps) {
  const { conversationId } = use(params);
  return (
    <RecsConversationOverlay
      conversationId={conversationId}
      closeRedirect="/kindtao/recs"
    />
  );
}
