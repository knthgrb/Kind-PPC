"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useRouter,
  usePathname,
  useSelectedLayoutSegments,
} from "next/navigation";
import { useQuery } from "convex/react";
import RecsSidebar from "./RecsSidebar";
import JobsCarousel from "./JobsCarousel";
import RecsConversationOverlay from "./RecsConversationOverlay";
import { MatchedJob } from "@/services/JobMatchingService";
import { convex } from "@/utils/convex/client";
import { api } from "@/utils/convex/client";
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

interface RecsPageClientProps {
  initialJobs?: MatchedJob[];
  initialMatches?: any[];
  initialConversations?: any[];
  initialSwipeLimit?: {
    remainingSwipes: number;
    dailyLimit: number;
    canSwipe: boolean;
  };
  activeConversationId?: string | null;
}

export default function RecsPageClient({
  initialJobs,
  initialMatches = [],
  initialConversations = [],
  initialSwipeLimit,
  activeConversationId = null,
}: RecsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showError } = useToastActions();
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");

  // Extract conversationId from URL - this is the single source of truth
  const conversationIdFromUrl =
    pathname?.match(/\/kindtao\/messages\/([^\/]+)/)?.[1] || null;

  // Use URL as single source of truth, fallback to prop for initial load
  const conversationId = conversationIdFromUrl || activeConversationId || null;

  const conversationSegments = useSelectedLayoutSegments("conversation");
  const selectedConversationIdFromSegments =
    conversationSegments && conversationSegments.length > 0
      ? conversationSegments[0]
      : null;
  const sidebarSelectedConversationId =
    selectedConversationIdFromSegments || conversationId;

  // Get current user
  const currentUser = useQuery(api.auth.getCurrentUser);
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

  // Fetch matches and conversations to filter properly
  const allMatches = useQuery(
    api.matches.getMatchesByKindTao,
    kindtaoUserId
      ? { userId: kindtaoUserId, filterOpenedWithConversation: true }
      : "skip"
  );

  // Fetch conversations with pagination
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
    if (conversationsPage === undefined) return allConversations;
    if (conversationsOffset === 0) {
      return conversationsPage;
    }
    return [...allConversations, ...conversationsPage];
  }, [conversationsPage, conversationsOffset, allConversations]);

  // Update accumulated conversations when new page loads
  useEffect(() => {
    if (rawConversations !== undefined) {
      setAllConversations(rawConversations);
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

  // Filter matches:
  // 1. Always show unopened matches (even if they have a conversation) - with red dot
  // 2. Hide opened matches that have a conversation between the users
  // 3. Show opened matches that don't have a conversation yet
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
    return matches.find((m) => String(m._id || "") === tempMatchId);
  }, [tempMatchId, matches]);

  const kindbossingUserForTemp = useQuery(
    api.users.getUserById,
    tempMatch?.kindbossing_user_id
      ? { userId: tempMatch.kindbossing_user_id }
      : "skip"
  );

  // Create temporary conversations from matches for the messages list
  const conversationsWithTemporary = useMemo(() => {
    const realConversations = conversations || [];

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
    matches,
    kindtaoUserId,
    conversationId,
    tempMatch,
    tempMatchId,
    kindbossingUserForTemp,
  ]);

  // Update activeTab based on URL
  useEffect(() => {
    if (conversationId) {
      setActiveTab("messages");
    }
  }, [conversationId]);

  // Check if there are more conversations to load
  const hasMoreConversations =
    conversationsPage && conversationsPage.length === 20;

  const handleConversationSelect = (id: string) => {
    // Update URL immediately - this will trigger the parallel route to render
    router.push(`/kindtao/messages/${id}`, { scroll: false });
    setActiveTab("messages");
  };

  // Load more conversations for pagination
  const handleLoadMoreConversations = () => {
    if (hasMoreConversations && conversationsPage !== undefined) {
      setConversationsOffset((prev) => prev + 20);
    }
  };

  // Handle match click - create conversation if needed, then navigate
  const handleMatchClick = async (match: any) => {
    const matchId = String(match._id || match.id || "");
    if (!matchId || !kindtaoUserId) {
      showError("Missing information to start conversation");
      return;
    }

    try {
      // Mark match as opened
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

      // Update URL immediately - this will trigger the parallel route to render
      router.push(`/kindtao/messages/${conversationIdToUse}`, {
        scroll: false,
      });
      setActiveTab("messages");
    } catch (error) {
      logger.error("Error handling match click:", error);
      showError("Failed to start conversation");
    }
  };

  const MOBILE_HEADER_HEIGHT = 64;
  const MOBILE_TAB_HEIGHT = 64;
  const LAYOUT_BOTTOM_PADDING = 64;
  const mobileMinHeight = `calc(100vh - ${
    MOBILE_HEADER_HEIGHT + MOBILE_TAB_HEIGHT + LAYOUT_BOTTOM_PADDING
  }px)`;

  return (
    <>
      <div
        className="w-full flex flex-col lg:flex-row bg-gray-50 flex-1 lg:min-h-[calc(100vh-8vh)]"
        style={{ minHeight: mobileMinHeight }}
      >
        <div className="hidden lg:flex lg:w-80 bg-white lg:border-r border-gray-200 flex-col shrink-0">
          <RecsSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedConversationId={sidebarSelectedConversationId}
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

        <div className="flex flex-1 items-center justify-center px-4 py-6 min-w-0">
          <JobsCarousel
            jobs={initialJobs}
            initialSwipeLimit={initialSwipeLimit}
          />
        </div>
      </div>

      {conversationId && (
        <RecsConversationOverlay
          conversationId={conversationId}
          closeRedirect="/kindtao/matches"
          onClose={() => {
            router.replace("/kindtao/matches", { scroll: false });
          }}
        />
      )}
    </>
  );
}
