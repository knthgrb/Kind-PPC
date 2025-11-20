import ConversationOverlay from "@/app/(kindtao)/kindtao/matches/_components/ConversationOverlay";

interface ConversationInterceptPageProps {
  params: {
    conversationId: string;
  };
}

export default function ConversationInterceptPage({
  params,
}: ConversationInterceptPageProps) {
  return <ConversationOverlay conversationId={params.conversationId} />;
}

