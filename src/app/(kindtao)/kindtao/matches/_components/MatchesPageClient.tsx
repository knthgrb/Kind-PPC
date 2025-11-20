"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelectedLayoutSegments } from "next/navigation";
import { useQuery } from "convex/react";
import RecsSidebar from "@/app/(kindtao)/recs/_components/RecsSidebar";
import { MatchedJob } from "@/services/JobMatchingService";
import { convex } from "@/utils/convex/client";
import { api } from "@/utils/convex/client";
import { MatchService } from "@/services/MatchService";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import JobsCarousel from "@/app/(kindtao)/recs/_components/JobsCarousel";

const getUserId = (user: unknown): string | null => {
  if (!user) return null;
  return (
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null
  );
};

interface MatchesPageClientProps {
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

export default function MatchesPageClient({
  initialJobs,
  initialMatches = [],
  initialConversations = [],
  initialSwipeLimit,
  activeConversationId = null,
}: MatchesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showError } = useToastActions();
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");
  const conversationSegments = useSelectedLayoutSegments("conversation");
  const selectedConversationId =
    activeConversationId ?? conversationSegments?.[0] ?? null;

  // Extract conversationId from URL if present
  const conversationId =
    pathname?.match(/\/kindtao\/messages\/([^\/]+)/)?.[1] || null;

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

  // Fetch matches using useQuery for real-time updates
  const allMatches = useQuery(
    api.matches.getMatchesByKindTao,
    kindtaoUserId
      ? { userId: kindtaoUserId, filterOpenedWithConversation: true }
      : "skip"
  );

  // Fetch conversations to filter out matches that already have conversations
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
      return conversationsPage;
    }
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

  const matches = useMemo(() => {
    if (Array.isArray(allMatches)) return allMatches;
    return initialMatches || [];
  }, [allMatches, initialMatches]);

  // Update activeTab based on URL
  useEffect(() => {
    if (conversationId) {
      setActiveTab("messages");
    }
  }, [conversationId]);

  const MOBILE_HEADER_HEIGHT = 64;
  const MOBILE_TAB_HEIGHT = 64;
  const LAYOUT_BOTTOM_PADDING = 64; // matches KindTaoLayout mobile padding
  const mobileMinHeight = `calc(100vh - ${
    MOBILE_HEADER_HEIGHT + MOBILE_TAB_HEIGHT + LAYOUT_BOTTOM_PADDING
  }px)`;

  const handleConversationSelect = (id: string) => {
    router.push(`/kindtao/messages/${id}`, { scroll: false });
    setActiveTab("messages");
  };

  // Handle match click - create conversation if needed, then navigate
  const handleMatchClick = async (match: any) => {
    const matchId = String(match._id || match.id || "");
    if (!matchId) {
      showError("Missing information to start conversation");
      return;
    }

    try {
      // Mark match as opened
      await MatchService.markMatchAsOpened(convex, matchId, "kindtao");

      // Check if conversation already exists for this match
      const existingConversation = await convex.query(
        api.conversations.getConversationByMatchId,
        { matchId }
      );

      let conversationIdToUse: string;

      if (existingConversation?._id) {
        // Conversation exists (other side already sent a message), use it
        conversationIdToUse = String(existingConversation._id);
      } else {
        // No conversation exists yet - create temporary conversation ID
        conversationIdToUse = `new-${matchId}`;
      }

      // Navigate to conversation
      router.push(`/kindtao/messages/${conversationIdToUse}`, {
        scroll: false,
      });
      setActiveTab("messages");
    } catch (error) {
      logger.error("Error handling match click:", error);
      showError("Failed to start conversation");
    }
  };

  return (
    <div
      className="w-full flex flex-col lg:flex-row bg-gray-50 flex-1 lg:min-h-[calc(100vh-8vh)]"
      style={{ minHeight: mobileMinHeight }}
    >
      <div className="w-full lg:w-80 bg-white lg:border-r border-gray-200 flex flex-col flex-1 lg:flex-none">
        <RecsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedConversationId={selectedConversationId || conversationId}
          onConversationSelect={handleConversationSelect}
          messagesBasePath="/kindtao/messages"
          initialMatches={matches}
          initialConversations={conversations}
          onMatchClick={handleMatchClick}
        />
      </div>

      <div className="hidden lg:flex flex-1 flex-col bg-gray-50">
        <div className="flex-1 flex bg-gray-50">
          <div className="flex flex-1 items-center justify-center px-4 py-6">
            <JobsCarousel
              jobs={initialJobs}
              initialSwipeLimit={initialSwipeLimit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
