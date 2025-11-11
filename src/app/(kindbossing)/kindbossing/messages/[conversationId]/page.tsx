import ChatUIClient from "@/app/matches/_components/ChatUIClient";

export default function KindBossingConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const { conversationId } = params;
  return <ChatUIClient conversationId={conversationId} />;
}
