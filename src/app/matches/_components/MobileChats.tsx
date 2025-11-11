"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserConversations } from "@/hooks/chats/useUserConversations";
import { MatchService } from "@/services/client/MatchService";
import { UserService } from "@/services/client/UserService";
import { FiMessageCircle, FiUsers } from "react-icons/fi";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import MessageSkeleton from "@/components/common/MessageSkeleton";
import MatchSkeleton from "@/components/common/MatchSkeleton";
import { useSidebarMonitoring } from "@/hooks/chats/useSidebarMonitoring";

type TabKey = "messages" | "matches";

export default function MobileChats() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { conversations, isLoading } = useUserConversations({});
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("matches");

  // Unread counts
  const { unreadCounts } = useUnreadCounts();

  // Sidebar data for last messages (no selected conversation on this page)
  const { sidebarData } = useSidebarMonitoring({
    conversations,
    selectedConversationId: null,
  });

  // Load user matches
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        setMatchesLoading(true);
        const { role } = await UserService.getCurrentUserRole();
        if (role === "admin") {
          setMatches([]);
          return;
        }

        // Get all matches
        const allMatches = await MatchService.getUserMatches(user.id);

        // Filter out matches that already have conversations
        // Create a set of match IDs that have conversations
        const matchIdsWithConversations = new Set<string>();

        for (const conv of conversations) {
          // Only add match_id if it exists and is a valid string
          if (
            conv.match_id &&
            typeof conv.match_id === "string" &&
            conv.match_id.length > 0
          ) {
            matchIdsWithConversations.add(conv.match_id);
          }
        }

        // Filter out matches that already have conversations
        const filteredMatches = allMatches.filter(
          (match) => !matchIdsWithConversations.has(match.id)
        );

        setMatches(filteredMatches || []);
      } finally {
        setMatchesLoading(false);
      }
    };
    load();
  }, [user?.id, conversations]);

  // Container height: full viewport minus header (8vh) and bottom tabs (4rem)
  // Use 100svh to better handle mobile browser UI
  const containerHeight = "calc(100svh - 8vh - 4rem)";

  return (
    <div className="lg:hidden">
      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex px-4 py-2 bg-gray-100 gap-1">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors rounded relative ${
              activeTab === "matches"
                ? "text-red-600 bg-white"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("matches")}
          >
            <FiUsers className="w-4 h-4" />
            Matches
            {unreadCounts.newMatches > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#CC0000] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCounts.newMatches}
              </span>
            )}
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors rounded relative ${
              activeTab === "messages"
                ? "text-red-600 bg-white"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("messages")}
          >
            <FiMessageCircle className="w-4 h-4" />
            Messages
            {unreadCounts.unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#CC0000] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCounts.unreadMessages}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content area with controlled height to avoid body scroll */}
      <div
        style={{ height: containerHeight }}
        className="overflow-auto bg-gray-50"
      >
        {/* Matches Tab */}
        {activeTab === "matches" && (
          <div className="p-4 space-y-3">
            {matchesLoading ? (
              <MatchSkeleton />
            ) : matches.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No matches yet
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Match #{match.id}
                    </div>
                    <div className="text-xs text-gray-500">
                      Matched {new Date(match.matched_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="px-3 py-2 text-xs rounded-lg bg-red-600 text-white"
                    onClick={() => router.push("/chats")}
                  >
                    Message
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div>
            {isLoading ? (
              <MessageSkeleton />
            ) : conversations.length === 0 ? (
              <div className="py-8 text-center text-gray-500 px-4">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => {
                // Get the other user (not the current user)
                const otherUser =
                  conv.matches?.kindbossing?.id === user?.id
                    ? conv.matches?.kindtao
                    : conv.matches?.kindbossing;

                const displayName = otherUser
                  ? `${otherUser.first_name} ${otherUser.last_name}`.trim()
                  : `Conversation #${conv.id.slice(-8)}`;

                // Get last message text from sidebar data
                const lastMessageText =
                  sidebarData.lastMessages.get(conv.id) || "No messages yet";

                return (
                  <button
                    key={conv.id}
                    className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/kindtao/messages/${conv.id}`)}
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {lastMessageText}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
