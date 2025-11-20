"use client";

import { use } from "react";
import ConversationOverlay from "@/app/(kindtao)/kindtao/matches/_components/ConversationOverlay";

interface ConversationInterceptPageProps {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationInterceptPage({
  params,
}: ConversationInterceptPageProps) {
  const { conversationId } = use(params);
  return (
    <ConversationOverlay
      conversationId={conversationId}
    />
  );
}

