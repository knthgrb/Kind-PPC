import { getServerActionContext } from "@/utils/server-action-context";
import { getMatches } from "@/actions/recs/get-matches";
import { getConversations } from "@/actions/recs/get-conversations";
import ConversationPageClient from "./_components/ConversationPageClient";

export async function getConversationPageData(conversationId: string) {
  const { convex, token, user, error } = await getServerActionContext();

  if (!convex || !user || error) {
    return {
      initialMatches: undefined,
      initialConversations: undefined,
      hasMoreConversations: false,
    };
  }

  const sharedContext = {
    convex,
    token,
    user,
    error,
  };

  const [matchesResult, conversationsResult] = await Promise.all([
    getMatches(sharedContext),
    getConversations(20, 0, sharedContext),
  ]);

  return {
    initialMatches: matchesResult?.matches || [],
    initialConversations: conversationsResult?.conversations || [],
    hasMoreConversations: conversationsResult?.hasMore || false,
  };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const data = await getConversationPageData(conversationId);

  return <ConversationPageClient conversationId={conversationId} {...data} />;
}
