import { use } from "react";
import ConversationPageClient from "./_components/ConversationPageClient";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  return <ConversationPageClient conversationId={conversationId} />;
}
