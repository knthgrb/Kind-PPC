"use client";

import { use } from "react";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/utils/convex/client";
import { convex } from "@/utils/convex/client";
import RecsSidebar from "@/app/(kindtao)/recs/_components/RecsSidebar";
import KindBossingConversationWindow from "@/app/(kindbossing)/_components/KindBossingConversationWindow";
import { MatchService } from "@/services/MatchService";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";

const getUserId = (user: unknown): string | null => {
  if (!user) return null;
  return (
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null
  );
};

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const router = useRouter();
  const { showError } = useToastActions();
  const [activeTab, setActiveTab] = useState<"matches" | "messages">(
    "messages"
  );

  // Get current user
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    isAuthenticated ? undefined : "skip"
  );
  const authUserId = useMemo(() => getUserId(currentUser), [currentUser]);

  // Get user record to get the correct user ID format
  const userRecord = useQuery(
    api.users.getUserById,
    authUserId ? { userId: authUserId } : "skip"
  );

  // Use the user record's id field, or fallback to auth user ID
  const kindbossingUserId = useMemo(() => {
    if (userRecord?.id) return userRecord.id;
    return authUserId;
  }, [userRecord, authUserId]);

  // Get user role
  const userRole = useMemo(() => {
    return (
      (userRecord as any)?.role || (currentUser as any)?.role || "kindbossing"
    );
  }, [userRecord, currentUser]);

  // Fetch matches
  const allMatches = useQuery(
    api.matches.getMatchesByKindBossing,
    kindbossingUserId
      ? { userId: kindbossingUserId, filterOpenedWithConversation: true }
      : "skip"
  );

  // Fetch conversations to filter out matches that already have conversations
  // Start with first page (limit 20)
  const [conversationsOffset, setConversationsOffset] = useState(0);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const conversationsPage = useQuery(
    api.conversations.getConversationsByUser,
    kindbossingUserId
      ? {
          userId: kindbossingUserId,
          limit: 20,
          offset: conversationsOffset,
        }
      : "skip"
  );

  // Accumulate conversations as we load more pages
  const rawConversations = useMemo(() => {
    if (conversationsPage === undefined) return allConversations;
    if (conversationsOffset === 0) {
      // First page - replace all
      return conversationsPage;
    }
    // Subsequent pages - append
    return [...allConversations, ...conversationsPage];
  }, [conversationsPage, conversationsOffset, allConversations]);

  // Filter out conversations where the match is unopened by the current user
  // If a match has a conversation but is unopened, it should stay in matches list, not messages list
  const conversations = useMemo(() => {
    if (!rawConversations || !allMatches || !userRole) return rawConversations;

    // Create a map of match IDs to match data for quick lookup
    const matchMap = new Map<string, any>();
    for (const match of allMatches) {
      const matchId = String(match._id || "");
      matchMap.set(matchId, match);
    }

    return rawConversations.filter((conv) => {
      if (!conv.match_id) {
        // Conversation without match_id should still be shown
        return true;
      }

      const matchId = String(conv.match_id);
      const match = matchMap.get(matchId);

      if (!match) {
        // Match not found, show conversation anyway
        return true;
      }

      // Check if match is opened by current user
      // Use === true to handle undefined/null/false as unopened
      const isOpened =
        userRole === "kindtao"
          ? match.is_opened_by_kindtao === true
          : match.is_opened_by_kindbossing === true;

      // Only include conversation if match is opened by current user
      return isOpened === true;
    });
  }, [rawConversations, allMatches, userRole]);

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

  // Check if there are more conversations to load
  const hasMoreConversations =
    conversationsPage && conversationsPage.length === 20;

  const matches = useMemo(() => {
    if (Array.isArray(allMatches)) return allMatches;
    return [];
  }, [allMatches]);

  // Create temporary conversations from matches for the messages list
  // Only include temporary conversations that are currently active (selected)
  const conversationsWithTemporary = useMemo(() => {
    const realConversations = conversations || [];

    // Only add temporary conversation if it's currently selected
    const tempConversations = [];
    if (conversationId && conversationId.startsWith("new-")) {
      const matchId = conversationId.replace("new-", "");
      const match = matches.find((m) => String(m._id || "") === matchId);
      if (match) {
        const kindtaoUser = match.kindtao || match.kindtao_user;
        tempConversations.push({
          _id: `new-${matchId}`,
          id: `new-${matchId}`,
          match_id: matchId,
          kindbossing_user_id: kindbossingUserId || "",
          kindtao_user_id: match.kindtao_user_id,
          otherUser: kindtaoUser,
          lastMessage: null,
          last_message_at: match.matched_at,
          status: "active" as const,
          created_at: match.matched_at,
          updated_at: match.matched_at,
        });
      }
    }

    return [...realConversations, ...tempConversations];
  }, [conversations, matches, kindbossingUserId, conversationId]);

  const handleConversationSelect = (id: string) => {
    router.push(`/kindbossing/messages/${id}`, { scroll: false });
    setActiveTab("messages");
  };

  // Handle match click - create conversation if needed, then navigate
  const handleMatchClick = async (match: any) => {
    const matchId = String(match._id || "");
    if (!matchId || !kindbossingUserId) {
      showError("Missing information to start conversation");
      return;
    }

    try {
      await MatchService.markMatchAsOpened(convex, matchId, "kindbossing");

      // Get user IDs from match
      const kindtaoUserId = match.kindtao_user_id;

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

      router.push(`/kindbossing/messages/${conversationIdToUse}`, {
        scroll: false,
      });
      setActiveTab("messages");
    } catch (error) {
      logger.error("Error handling match click:", error);
      showError("Failed to start conversation");
    }
  };

  const handleCloseConversation = () => {
    router.push("/kindbossing/matches", { scroll: false });
  };

  // Load more conversations for pagination
  const handleLoadMoreConversations = () => {
    if (hasMoreConversations && conversationsPage !== undefined) {
      setConversationsOffset((prev) => prev + 20);
    }
  };

  const hasConversationSelected = Boolean(conversationId);

  return (
    <div className="h-full lg:h-[calc(100vh-8vh)] w-full flex relative">
      {/* Left Sidebar - Desktop only */}
      <div className="hidden lg:flex w-80 border-r border-gray-200 bg-white shrink-0">
        <RecsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedConversationId={conversationId}
          onConversationSelect={handleConversationSelect}
          messagesBasePath="/kindbossing/messages"
          initialMatches={matches || []}
          initialConversations={conversationsWithTemporary || []}
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
        {/* Mobile: Show matches/messages list when no conversation selected */}
        <div
          className={`${
            hasConversationSelected ? "hidden" : "block"
          } lg:hidden h-full overflow-hidden`}
        >
          <RecsSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedConversationId={conversationId}
            onConversationSelect={handleConversationSelect}
            messagesBasePath="/kindbossing/messages"
            initialMatches={matches || []}
            initialConversations={conversationsWithTemporary || []}
            onMatchClick={handleMatchClick}
            onLoadMoreConversations={handleLoadMoreConversations}
            hasMoreConversations={hasMoreConversations}
            isLoadingMoreConversations={
              conversationsPage === undefined && conversationsOffset > 0
            }
          />
        </div>

        {/* Conversation window */}
        <div
          className={`${
            hasConversationSelected ? "flex" : "hidden"
          } lg:flex flex-1 relative overflow-hidden`}
        >
          {hasConversationSelected && (
            <div className="absolute inset-0 w-full h-full">
              <KindBossingConversationWindow
                conversationId={conversationId}
                onClose={handleCloseConversation}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
