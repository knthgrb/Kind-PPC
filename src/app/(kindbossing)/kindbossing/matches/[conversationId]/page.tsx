import ConversationWindow from "@/app/(kindtao)/recs/_components/ConversationWindow";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ConversationWindow conversationId={conversationId} />;
}
