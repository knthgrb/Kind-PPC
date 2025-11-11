import ChatUIClient from "../_components/ChatUIClient";

export default function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  return <ChatUIClient conversationId={params.conversationId} />;
}
