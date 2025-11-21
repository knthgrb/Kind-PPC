"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import RecsSidebar from "@/app/(kindtao)/recs/_components/RecsSidebar";
import JobsCarousel from "@/app/(kindtao)/recs/_components/JobsCarousel";
import RecsConversationOverlay from "@/app/(kindtao)/recs/_components/RecsConversationOverlay";
import { MatchedJob } from "@/services/JobMatchingService";
import { convex } from "@/utils/convex/client";
import { api } from "@/utils/convex/client";
import { MatchService } from "@/services/MatchService";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import { conversationCache } from "@/services/ConversationCacheService";
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

const getConversationIdFromLocation = (): string | null => {
  if (typeof window === "undefined") return null;
  return new URL(window.location.href).searchParams.get("conversation");
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
  const pathname = usePathname();
  const { showError } = useToastActions();
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");
  const [conversationId, setConversationId] = useState<string | null>(() => {
    return getConversationIdFromLocation() || activeConversationId || null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlConversationId = getConversationIdFromLocation();
    setConversationId((current) =>
      urlConversationId !== null ? urlConversationId : current
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      setConversationId(getConversationIdFromLocation());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const updateConversationHistory = useCallback(
    (id: string | null, mode: "push" | "replace" = "replace") => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set("conversation", id);
      } else {
        url.searchParams.delete("conversation");
      }
      const href = `${url.pathname}${url.search}${url.hash}`;
      if (mode === "push") {
        window.history.pushState({}, "", href);
      } else {
        window.history.replaceState({}, "", href);
      }
      setConversationId(id);
    },
    []
  );

  const sidebarSelectedConversationId = conversationId;

  // Get current user without throwing when logged out
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

  /**
   * Handle conversation selection with instant navigation
   * Uses cache for instant UI updates
   */
  const handleConversationSelect = (id: string) => {
    const cached = conversationCache.getConversation(id);
    if (cached) {
      logger.debug("Using cached conversation for instant display:", { id });
    }
    setActiveTab("messages");
    updateConversationHistory(id, "push");
  };

  // Load more conversations for pagination
  const handleLoadMoreConversations = () => {
    if (hasMoreConversations && conversationsPage !== undefined) {
      setConversationsOffset((prev) => prev + 20);
    }
  };

  /**
   * Handle match click with caching and progressive loading
   * Implements Tinder-like instant navigation with background data fetching
   */
  const handleMatchClick = async (match: any) => {
    const matchId = String(match._id || match.id || "");
    if (!matchId || !kindtaoUserId) {
      showError("Missing information to start conversation");
      return;
    }

    try {
      // Mark match as opened (non-blocking)
      MatchService.markMatchAsOpened(convex, matchId, "kindtao").catch(
        (error) => {
          logger.warn("Failed to mark match as opened:", error);
        }
      );

      // Get user IDs from match
      const kindbossingUserId = match.kindbossing_user_id;

      // Check cache first for instant UI
      let conversationIdToUse: string | null = null;

      // Check if we have a cached conversation for this match
      const tempConversationId = `new-${matchId}`;
      const cached = conversationCache.getConversation(tempConversationId);
      if (cached?.conversation?.id) {
        conversationIdToUse = cached.conversation.id;
      }

      // Navigate immediately with temporary ID for instant UI
      // This allows the UI to show immediately while we fetch in background
      const tempId = `new-${matchId}`;
      const initialConversationId = conversationIdToUse || tempId;

      // Cache match data for instant display
      if (!cached?.conversation?.id) {
        conversationCache.setConversation(tempId, {
          match,
          isTemporary: true,
        });
      }

      setActiveTab("messages");
      updateConversationHistory(initialConversationId, "push");

      // Background: Check for existing conversation
      // This happens after navigation for instant UI
      Promise.all([
        convex.query(api.conversations.getConversationByUserIds, {
          kindbossingUserId,
          kindtaoUserId,
        }),
        convex.query(api.conversations.getConversationByMatchId, { matchId }),
      ])
        .then(([conversationByUsers, conversationByMatch]) => {
          const conversationIdFromServer = conversationByUsers?._id
            ? String(conversationByUsers._id)
            : conversationByMatch?._id
              ? String(conversationByMatch._id)
              : null;

          if (
            conversationIdFromServer &&
            conversationIdFromServer !== initialConversationId
          ) {
            // Update cache with real conversation
            conversationCache.setConversation(conversationIdFromServer, {
              conversation: conversationByUsers || conversationByMatch,
              match,
            });

            // Update URL to real conversation ID
            updateConversationHistory(conversationIdFromServer, "replace");
          }
        })
        .catch((error) => {
          logger.error("Error fetching conversation in background:", error);
        });
    } catch (error) {
      logger.error("Error handling match click:", error);
      showError("Failed to start conversation");
    }
  };

  const handleOverlayClose = useCallback(() => {
    // Overlay already waits for animation to complete (350ms) + buffer (100ms) = 450ms
    // before calling onClose, so we can update URL immediately
    // The URL update will trigger layout to show header/tabs, which will appear
    // smoothly after the overlay is fully removed
    updateConversationHistory(null, "replace");
  }, [updateConversationHistory]);

  const MOBILE_HEADER_HEIGHT = 64;
  const MOBILE_TAB_HEIGHT = 64;
  const LAYOUT_BOTTOM_PADDING = 64;
  const mobileMinHeight = `calc(100vh - ${
    MOBILE_HEADER_HEIGHT + MOBILE_TAB_HEIGHT + LAYOUT_BOTTOM_PADDING
  }px)`;
  
  // Calculate sidebar height on mobile - account for visible header and tabs
  // This ensures sidebar doesn't expand to full screen when conversation overlay is open
  const sidebarMobileHeight = `calc(100vh - ${MOBILE_HEADER_HEIGHT + MOBILE_TAB_HEIGHT}px)`;

  return (
    <div className="relative w-full h-full flex-1 flex flex-col min-h-0">
      {/* Style tag to apply mobile-only height to sidebar */}
      <style>{`
        @media (max-width: 1023px) {
          .matches-sidebar-container {
            height: ${sidebarMobileHeight} !important;
            max-height: ${sidebarMobileHeight} !important;
          }
          .matches-page-container {
            height: ${sidebarMobileHeight} !important;
            max-height: ${sidebarMobileHeight} !important;
          }
        }
        @media (min-width: 1024px) {
          .matches-sidebar-container {
            height: 100% !important;
            max-height: none !important;
          }
          .matches-page-container {
            height: 100% !important;
            max-height: none !important;
          }
        }
      `}</style>
      <div
        className="matches-page-container w-full h-full flex flex-col lg:flex-row bg-gray-50 flex-1 overflow-x-hidden relative min-h-0"
        style={{ minHeight: mobileMinHeight }}
      >
        {/* Sidebar: Show on mobile for matches/messages view, always show on desktop */}
        {/* Ensure sidebar has solid background and fixed height on mobile */}
        {/* Sidebar accounts for visible header/tabs height on mobile, full height on desktop */}
        <div 
          className="matches-sidebar-container flex w-full lg:w-80 bg-white lg:border-r border-gray-200 flex-col shrink-0 min-h-0 relative z-0 lg:h-full"
        >
          <RecsSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedConversationId={sidebarSelectedConversationId}
            onConversationSelect={handleConversationSelect}
            messagesBasePath={pathname || "/kindtao/matches"}
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

        {/* JobsCarousel: Hide on mobile, show on desktop */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-4 py-6 min-w-0 h-full min-h-0 relative">
          <JobsCarousel
            jobs={initialJobs}
            initialSwipeLimit={initialSwipeLimit}
          />
        </div>

        {conversationId && (
          <RecsConversationOverlay
            conversationId={conversationId}
            closeRedirect={pathname}
            onClose={handleOverlayClose}
            fullScreen={false}
          />
        )}
      </div>
    </div>
  );
}
