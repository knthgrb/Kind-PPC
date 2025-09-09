import ChatUIClient from "../_components/ChatUIClient";

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const awaitedParams = await params;
  return <ChatUIClient conversationId={awaitedParams.conversationId} />;
}
