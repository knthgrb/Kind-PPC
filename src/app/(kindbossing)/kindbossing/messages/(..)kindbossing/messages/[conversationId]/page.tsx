import KindBossingChatWindow from "../../_components/KindBossingChatWindow";

export default async function InterceptedConversation({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <KindBossingChatWindow conversationId={conversationId} />;
}

