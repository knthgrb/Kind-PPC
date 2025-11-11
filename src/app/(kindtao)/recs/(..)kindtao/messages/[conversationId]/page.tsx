import FindWorkChatWindow from "@/app/(kindtao)/recs/_components/FindWorkChatWindow";

export default async function InterceptedConversation({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <FindWorkChatWindow conversationId={conversationId} />;
}
