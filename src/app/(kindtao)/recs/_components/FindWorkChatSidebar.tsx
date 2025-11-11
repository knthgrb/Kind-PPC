"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiMessageCircle, FiUsers } from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatUI } from "@/hooks/chats/useChatUI";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import MessageSkeleton from "@/components/common/MessageSkeleton";
import MatchSkeleton from "@/components/common/MatchSkeleton";
import { MatchService } from "@/services/client/MatchService";
import { JobService } from "@/services/client/JobService";
import { MatchToConversationService } from "@/services/client/MatchToConversationService";
import { getOtherUser } from "@/utils/chatMessageUtils";
import { formatTimestamp, getStatusColor } from "@/utils/chatUtils";

function Avatar({
  src,
  alt,
  firstName,
  lastName,
  className = "w-10 h-10 rounded-full",
}: {
  src?: string | null;
  alt: string;
  firstName: string;
  lastName: string;
  className?: string;
}) {
  if (src) return <img src={src} alt={alt} className={className} />;
  const initials =
    `${(firstName || "").charAt(0).toUpperCase()}${(lastName || "")
      .charAt(0)
      .toUpperCase()}` || "U";
  return (
    <div
      className={`${className} bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-semibold text-base`}
    >
      {initials}
    </div>
  );
}

type SidebarVariant = "mobile" | "desktop";

export default function FindWorkChatSidebar({
  variant = "mobile",
  initialMatches,
  initialActiveTab,
  prefetched = false,
}: {
  variant?: SidebarVariant;
  initialMatches?: any[];
  initialActiveTab?: "matches" | "messages";
  prefetched?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"matches" | "messages">(
    initialActiveTab || "matches"
  );
  const { unreadCounts, refreshUnreadCounts } = useUnreadCounts();

  const [matches, setMatches] = useState<any[]>(initialMatches || []);
  const [matchesLoading, setMatchesLoading] = useState(!initialMatches);

  const { conversations, isLoadingConversations, conversationsError } =
    useChatUI({ selectedConversationId: null });

  // Determine currently active conversation from the URL when in messages route
  const params = useParams() as { conversationId?: string } | null;
  const activeConversationId = params?.conversationId;

  // If a conversation is open (URL has conversationId), force tab to messages
  useEffect(() => {
    if (activeConversationId) {
      setActiveTab("messages");
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (prefetched) {
      setMatchesLoading(false);
      return;
    }
    const loadMatches = async () => {
      if (!user?.id) return;
      setMatchesLoading(true);
      try {
        const userMatches = await MatchService.getUserMatches(user.id);
        const active = userMatches.filter((m: any) => m?.is_active !== false);
        const withJobs = await Promise.all(
          active.map(async (m) => {
            try {
              const job = await JobService.fetchById(m.job_post_id);
              return {
                ...m,
                job_title: job?.title || "Unknown Job",
                job_location: job?.location || "Unknown Location",
              };
            } catch (e) {
              return {
                ...m,
                job_title: "Unknown Job",
                job_location: "Unknown Location",
              };
            }
          })
        );
        setMatches(withJobs);
        refreshUnreadCounts();
      } finally {
        setMatchesLoading(false);
      }
    };
    loadMatches();
  }, [user?.id, refreshUnreadCounts, prefetched]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aTime = new Date(a.last_message_at || a.created_at).getTime();
      const bTime = new Date(b.last_message_at || b.created_at).getTime();
      return bTime - aTime;
    });
  }, [conversations]);

  const handleMatchClick = useCallback(
    async (match: any) => {
      try {
        await MatchService.markMatchAsInactive(match.id);
        const result = await MatchToConversationService.getOrCreateConversation(
          match.id
        );
        if (result.success && result.conversationId) {
          router.push(`/kindtao/messages/${result.conversationId}`);
          refreshUnreadCounts();
        }
      } catch (e) {}
    },
    [router, refreshUnreadCounts]
  );

  const isMobile = variant === "mobile";
  const containerClass = isMobile
    ? "flex md:hidden w-full bg-white border-b border-gray-200 flex-col"
    : "hidden md:flex w-80 bg-white border-r border-gray-200 flex-col h-full";

  return (
    <div className={containerClass}>
      <div className="px-4 py-3">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded relative ${
              activeTab === "matches"
                ? "text-[#CC0000] bg-white"
                : "text-gray-600"
            }`}
          >
            <FiUsers className="w-4 h-4 shrink-0" />
            <span className="truncate">Matches</span>
            {unreadCounts.newMatches > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#CC0000] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0">
                {unreadCounts.newMatches}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded relative ${
              activeTab === "messages"
                ? "text-[#CC0000] bg-white"
                : "text-gray-600"
            }`}
          >
            <FiMessageCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">Messages</span>
            {unreadCounts.unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#CC0000] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0">
                {unreadCounts.unreadMessages}
              </span>
            )}
          </button>
        </div>
      </div>
      <div
        className={
          isMobile
            ? "max-h-64 overflow-y-auto"
            : "flex-1 overflow-y-auto min-h-0"
        }
      >
        {activeTab === "matches" ? (
          matchesLoading ? (
            <MatchSkeleton />
          ) : matches.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No matches yet</div>
          ) : (
            <div className="space-y-0">
              {matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => handleMatchClick(match)}
                  className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors border-t border-gray-100"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <FiUsers className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {match.job_title || `Match #${match.id.slice(0, 8)}`}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {match.job_location || "Unknown Location"}
                    </p>
                  </div>
                  {match.is_active && (
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          )
        ) : isLoadingConversations ? (
          <MessageSkeleton />
        ) : conversationsError ? (
          <div className="text-center text-red-500 py-4">
            {conversationsError.message}
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-0">
            {sortedConversations.map((conversation) => {
              if (!user) return null;
              const other = getOtherUser(conversation, user.id);
              const isActive = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  onClick={() =>
                    router.push(`/kindtao/messages/${conversation.id}`)
                  }
                  className={`flex items-center px-4 py-2 cursor-pointer transition-colors border-t border-gray-100 ${
                    isActive ? "bg-gray-100" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      src={other.profile_image_url}
                      alt={`${other.first_name} ${other.last_name}`}
                      firstName={other.first_name || ""}
                      lastName={other.last_name || ""}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                        false
                      )}`}
                    />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{`${other.first_name} ${other.last_name}`}</h4>
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.last_message_at
                        ? "Last message"
                        : "No messages yet"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 ml-1 whitespace-nowrap">
                    {conversation.last_message_at
                      ? formatTimestamp(conversation.last_message_at, "sidebar")
                      : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
