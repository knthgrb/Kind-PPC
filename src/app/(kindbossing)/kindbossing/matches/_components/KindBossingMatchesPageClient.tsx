"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/utils/convex/client";
import { convex } from "@/utils/convex/client";
import RecsSidebar from "@/app/(kindtao)/recs/_components/RecsSidebar";
import { MatchService } from "@/services/MatchService";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import { HiOutlineChat } from "react-icons/hi";

const getUserId = (user: unknown): string | null => {
  if (!user) return null;
  return (
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null
  );
};

export default function KindBossingMatchesPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const { showError } = useToastActions();
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");

  // Get current user
  const currentUser = useQuery(api.auth.getCurrentUser);
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
  const rawConversations = useQuery(
    api.conversations.getConversationsByUser,
    kindbossingUserId ? { userId: kindbossingUserId } : "skip"
  );

  // Filter out conversations where the match is unopened by the current user
  // If a match has a conversation but is unopened, it should stay in matches list, not messages list
  const conversations = useMemo(() => {
    if (!rawConversations || !allMatches) return rawConversations;

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

  const matches = useMemo(() => {
    if (Array.isArray(allMatches)) return allMatches;
    return [];
  }, [allMatches]);

  // Extract conversationId from URL if present
  const conversationId = useMemo(() => {
    if (!pathname) return null;
    // Check if URL contains /kindbossing/messages/[conversationId]
    const messagesMatch = pathname.match(/\/kindbossing\/messages\/([^\/]+)/);
    if (messagesMatch && messagesMatch[1]) {
      return messagesMatch[1];
    }
    return null;
  }, [pathname]);

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
    // Update URL without page reload using router.push
    router.push(`/kindbossing/messages/${id}`, { scroll: false });
    setActiveTab("messages");
  };

  // Handle match click - create conversation if needed, then navigate
  const handleMatchClick = async (match: any) => {
    const matchId = String(match._id || match.id || "");
    if (!matchId || !kindbossingUserId) {
      showError("Missing information to start conversation");
      return;
    }

    try {
      // Mark match as opened
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

      // Navigate to conversation
      router.push(`/kindbossing/messages/${conversationIdToUse}`, {
        scroll: false,
      });
      setActiveTab("messages");
    } catch (error) {
      logger.error("Error handling match click:", error);
      showError("Failed to start conversation");
    }
  };

  // Update activeTab based on URL
  useEffect(() => {
    if (conversationId) {
      setActiveTab("messages");
    }
  }, [conversationId]);

  return (
    <div className="h-[calc(100vh-8vh)] w-full flex relative">
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
        />
      </div>

      {/* Right Side - Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 relative">
        {/* Mobile: Show sidebar content (matches/messages list) */}
        <div className="lg:hidden h-full overflow-hidden">
          <RecsSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedConversationId={conversationId}
            onConversationSelect={handleConversationSelect}
            messagesBasePath="/kindbossing/messages"
            initialMatches={matches || []}
            initialConversations={conversations || []}
            onMatchClick={handleMatchClick}
          />
        </div>

        {/* Desktop: Show "select a conversation" empty state */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          {!conversationId && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                  <HiOutlineChat className="w-7 h-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a match or conversation
                </h3>
                <p className="text-gray-500">
                  Choose a match from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
