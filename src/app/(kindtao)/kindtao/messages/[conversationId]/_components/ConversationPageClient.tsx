"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import RecsSidebar from "@/app/(kindtao)/recs/_components/RecsSidebar";
import KindTaoConversationWindow from "@/app/(kindtao)/_components/KindTaoConversationWindow";
import { MatchService } from "@/services/MatchService";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import { convex } from "@/utils/convex/client";
import { api } from "@/utils/convex/client";
import { useOptionalCurrentUser } from "@/hooks/useOptionalCurrentUser";

const getUserId = (user: unknown): string | null => {
  if (!user) return null;
  return (
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null
  );
};

interface ConversationPageClientProps {
  conversationId: string;
  initialMatches?: any[];
  initialConversations?: any[];
  hasMoreConversations?: boolean;
}

export default function ConversationPageClient({
  conversationId,
  initialMatches = [],
  initialConversations = [],
  hasMoreConversations: initialHasMore = false,
}: ConversationPageClientProps) {
  const router = useRouter();
  const { showError } = useToastActions();
  const [activeTab, setActiveTab] = useState<"matches" | "messages">(
    "messages"
  );

  // Get current user safely
  const { currentUser } = useOptionalCurrentUser();
  const authUserId = useMemo(() => getUserId(currentUser), [currentUser]);

  // Get user record to get the correct user ID format
  const userRecord = useQuery(
    api.users.getUserById,
    authUserId ? { userId: authUserId } : "skip"
  );

  // Use the user record's id field, or fallback to auth user ID
  const kindtaoUserId = useMemo(() => {
    if (userRecord?.id) return userRecord.id;
    return authUserId;
  }, [userRecord, authUserId]);

  // Get user role
  const userRole = useMemo(() => {
    return (userRecord as any)?.role || (currentUser as any)?.role || "kindtao";
  }, [userRecord, currentUser]);

  // Fetch matches using useQuery for real-time updates
  const allMatches = useQuery(
    api.matches.getMatchesByKindTao,
    kindtaoUserId
      ? { userId: kindtaoUserId, filterOpenedWithConversation: true }
      : "skip"
  );

  // Fetch conversations with pagination using useQuery
  const [conversationsOffset, setConversationsOffset] = useState(0);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const conversationsPage = useQuery(
    api.conversations.getConversationsByUser,
    kindtaoUserId
      ? {
          userId: kindtaoUserId,
          limit: 20,
          offset: conversationsOffset,
        }
      : "skip"
  );

  // Accumulate conversations as we load more pages
  const rawConversations = useMemo(() => {
    if (conversationsPage === undefined)
      return allConversations.length > 0
        ? allConversations
        : initialConversations;
    if (conversationsOffset === 0) {
      // First page - replace all
      return conversationsPage;
    }
    // Subsequent pages - append
    return [...allConversations, ...conversationsPage];
  }, [
    conversationsPage,
    conversationsOffset,
    allConversations,
    initialConversations,
  ]);

  // Update accumulated conversations when new page loads
  useEffect(() => {
    if (rawConversations !== undefined) {
      if (conversationsOffset === 0) {
        setAllConversations(rawConversations);
      } else {
        // For subsequent pages, we need to append only the new items
        // Since rawConversations already includes all previous items, we should replace
        setAllConversations(rawConversations);
      }
    }
  }, [rawConversations, conversationsOffset]);

  // Filter conversations: exclude conversations where match is unopened
  const conversations = useMemo(() => {
    if (!rawConversations || !allMatches || !userRole)
      return rawConversations || initialConversations;

    const matchMap = new Map<string, any>();
    for (const match of allMatches) {
      const matchId = String(match._id || "");
      matchMap.set(matchId, match);
    }

    return rawConversations.filter((conv) => {
      if (!conv.match_id) return true;

      const matchId = String(conv.match_id);
      const match = matchMap.get(matchId);
      if (!match) return true;

      const isOpened =
        userRole === "kindtao"
          ? match.is_opened_by_kindtao === true
          : match.is_opened_by_kindbossing === true;

      return isOpened === true;
    });
  }, [rawConversations, allMatches, userRole, initialConversations]);

  // Check if there are more conversations to load
  const hasMoreConversations =
    conversationsPage && conversationsPage.length === 20;

  const matches = useMemo(() => {
    if (Array.isArray(allMatches)) return allMatches;
    return initialMatches || [];
  }, [allMatches, initialMatches]);

  // Get kindbossing user data for temporary conversation
  const tempMatchId = conversationId?.startsWith("new-")
    ? conversationId.replace("new-", "")
    : null;
  const tempMatch = useMemo(() => {
    if (!tempMatchId) return null;
    const allMatchesToUse = allMatches || initialMatches;
    return allMatchesToUse.find((m) => String(m._id || "") === tempMatchId);
  }, [tempMatchId, allMatches, initialMatches]);

  const kindbossingUserForTemp = useQuery(
    api.users.getUserById,
    tempMatch?.kindbossing_user_id
      ? { userId: tempMatch.kindbossing_user_id }
      : "skip"
  );

  // Create temporary conversations from matches for the messages list
  // Only include temporary conversations that are currently active (selected)
  const conversationsWithTemporary = useMemo(() => {
    const realConversations = conversations || [];

    // Only add temporary conversation if it's currently selected
    const tempConversations = [];
    if (conversationId && conversationId.startsWith("new-") && tempMatch) {
      // Use fetched user data if available, otherwise fallback to match data
      const otherUser =
        kindbossingUserForTemp ||
        tempMatch.kindbossing ||
        tempMatch.kindbossing_user;

      tempConversations.push({
        _id: `new-${tempMatchId}`,
        id: `new-${tempMatchId}`,
        match_id: tempMatchId,
        kindbossing_user_id: tempMatch.kindbossing_user_id,
        kindtao_user_id: kindtaoUserId || "",
        otherUser: otherUser,
        lastMessage: null,
        last_message_at: tempMatch.matched_at,
        status: "active" as const,
        created_at: tempMatch.matched_at,
        updated_at: tempMatch.matched_at,
      });
    }

    // Sort conversations: temporary first, then by last_message_at/updated_at descending
    const allConvs = [...realConversations, ...tempConversations];
    allConvs.sort((a, b) => {
      const aIsTemp = String(a._id || a.id || "").startsWith("new-");
      const bIsTemp = String(b._id || b.id || "").startsWith("new-");

      // Temporary conversations always come first
      if (aIsTemp && !bIsTemp) return -1;
      if (!aIsTemp && bIsTemp) return 1;

      // For same type, sort by date (most recent first)
      const aTime = a.last_message_at || a.updated_at || a.created_at || 0;
      const bTime = b.last_message_at || b.updated_at || b.created_at || 0;
      return bTime - aTime;
    });

    return allConvs;
  }, [
    conversations,
    allMatches,
    initialMatches,
    kindtaoUserId,
    conversationId,
    tempMatch,
    tempMatchId,
    kindbossingUserForTemp,
  ]);

  // Update activeTab based on conversationId
  useEffect(() => {
    if (conversationId) {
      setActiveTab("messages");
    }
  }, [conversationId]);

  // Load more conversations for pagination
  const handleLoadMoreConversations = () => {
    if (hasMoreConversations && conversationsPage !== undefined) {
      setConversationsOffset((prev) => prev + 20);
    }
  };

  const handleConversationSelect = (id: string) => {
    router.push(`/kindtao/messages/${id}`, { scroll: false });
    setActiveTab("messages");
  };

  // Handle match click - create conversation if needed, then navigate
  const handleMatchClick = async (match: any) => {
    const matchId = String(match._id || match.id || "");
    if (!matchId || !kindtaoUserId) {
      showError("Missing information to start conversation");
      return;
    }

    try {
      await MatchService.markMatchAsOpened(convex, matchId, "kindtao");

      // Get user IDs from match
      const kindbossingUserId = match.kindbossing_user_id;

      // First, check if conversation already exists between these users (reuse existing)
      const existingConversationByUsers = await convex.query(
        api.conversations.getConversationByUserIds,
        {
          kindbossingUserId,
          kindtaoUserId,
        }
      );

      let conversationIdToUse: string;

      if (existingConversationByUsers?._id) {
        // Reuse existing conversation between these users
        conversationIdToUse = String(existingConversationByUsers._id);
      } else {
        // Check if conversation exists for this specific match
        const existingConversationByMatch = await convex.query(
          api.conversations.getConversationByMatchId,
          { matchId }
        );

        if (existingConversationByMatch?._id) {
          conversationIdToUse = String(existingConversationByMatch._id);
        } else {
          // No conversation exists yet - create temporary conversation ID
          conversationIdToUse = `new-${matchId}`;
        }
      }

      router.push(`/kindtao/messages/${conversationIdToUse}`, {
        scroll: false,
      });
      setActiveTab("messages");
    } catch (error) {
      logger.error("Error handling match click:", error);
      showError("Failed to start conversation");
    }
  };

  const handleCloseConversation = () => {
    router.replace("/kindtao/matches", { scroll: false });
  };

  return (
    <div className="h-screen lg:h-[calc(100vh-8vh)] w-full flex relative">
      {/* Left Sidebar - Desktop only */}
      <div className="hidden lg:flex w-80 border-r border-gray-200 bg-white shrink-0">
        <RecsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedConversationId={conversationId}
          onConversationSelect={handleConversationSelect}
          messagesBasePath="/kindtao/messages"
          initialMatches={matches}
          initialConversations={conversationsWithTemporary}
          onMatchClick={handleMatchClick}
          onLoadMoreConversations={handleLoadMoreConversations}
          hasMoreConversations={hasMoreConversations}
          isLoadingMoreConversations={
            conversationsPage === undefined && conversationsOffset > 0
          }
        />
      </div>

      {/* Right Side - Conversation Window */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 relative">
        {/* Mobile: Show conversation window if conversationId exists, otherwise show sidebar */}
        {conversationId ? (
          <div className="lg:hidden h-full overflow-hidden">
            <KindTaoConversationWindow
              conversationId={conversationId}
              onClose={handleCloseConversation}
            />
          </div>
        ) : (
          <div className="lg:hidden h-full overflow-hidden">
            <RecsSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedConversationId={conversationId}
              onConversationSelect={handleConversationSelect}
              messagesBasePath="/kindtao/messages"
              initialMatches={matches}
              initialConversations={conversations}
              onMatchClick={handleMatchClick}
              onLoadMoreConversations={handleLoadMoreConversations}
              hasMoreConversations={hasMoreConversations}
              isLoadingMoreConversations={
                conversationsPage === undefined && conversationsOffset > 0
              }
            />
          </div>
        )}

        {/* Desktop: Show conversation window full screen */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <KindTaoConversationWindow
              conversationId={conversationId}
              onClose={handleCloseConversation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
