"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiMessageCircle, FiUsers, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatUI } from "@/hooks/chats/useChatUI";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useSidebarMonitoring } from "@/hooks/chats/useSidebarMonitoring";
import MessageSkeleton from "@/components/common/MessageSkeleton";
import LoadingSpinner from "@/components/loader/LoadingSpinner";
import { MatchService } from "@/services/client/MatchService";
import { JobService } from "@/services/client/JobService";
import { MatchToConversationService } from "@/services/client/MatchToConversationService";
import { getOtherUser } from "@/utils/chatMessageUtils";
import { formatTimestamp, getStatusColor } from "@/utils/chatUtils";
import type { ConversationWithDetails, User } from "@/types/chat";
import type { SidebarData } from "@/hooks/chats/useSidebarMonitoring";
import { memo } from "react";
import type { User as AuthUser } from "@/types/user";

// Helper function to get initials
const getInitials = (firstName: string = "", lastName: string = "") => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}` || "U";
};

// Reusable Avatar Component
const UserAvatar = ({
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
}) => {
  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }
  const initials = getInitials(firstName, lastName);
  let textSize = "text-xs";
  if (className.includes("w-40")) {
    textSize = "text-5xl";
  } else if (className.includes("w-32")) {
    textSize = "text-4xl";
  } else if (className.includes("w-10")) {
    textSize = "text-base";
  } else if (className.includes("w-8")) {
    textSize = "text-sm";
  }

  return (
    <div
      className={`${className} bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-semibold ${textSize}`}
    >
      {initials}
    </div>
  );
};

// Convert auth user to chat user
function convertAuthUserToChatUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    role: authUser.user_metadata.role,
    email: authUser.user_metadata.email,
    phone: authUser.user_metadata.phone || null,
    first_name: authUser.user_metadata.first_name,
    last_name: authUser.user_metadata.last_name,
    date_of_birth: authUser.user_metadata.date_of_birth || null,
    gender: authUser.user_metadata.gender || null,
    profile_image_url: authUser.user_metadata.profile_image_url || null,
    address: authUser.user_metadata.full_address || null,
    city: authUser.user_metadata.city || null,
    province: authUser.user_metadata.province || null,
    postal_code: authUser.user_metadata.postal_code || null,
    is_verified: false,
    verification_status: authUser.user_metadata.verification_status,
    subscription_tier: authUser.user_metadata.subscription_tier,
    subscription_expires_at: null,
    swipe_credits: authUser.user_metadata.swipe_credits,
    boost_credits: authUser.user_metadata.boost_credits,
    last_active: new Date().toISOString(),
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: authUser.updated_at || new Date().toISOString(),
  };
}

// Memoized conversation item component
const ConversationItem = memo(
  ({
    conversation,
    currentUser,
    sidebarData,
    selectedConversationId,
    onSelect,
  }: {
    conversation: ConversationWithDetails;
    currentUser: User;
    sidebarData: SidebarData;
    selectedConversationId: string | null;
    onSelect: (id: string) => void;
  }) => {
    const otherUser = useMemo(() => {
      return getOtherUser(conversation, currentUser.id);
    }, [conversation, currentUser.id]);

    const isActive = selectedConversationId === conversation.id;
    const unreadCount = sidebarData.unreadCounts.get(conversation.id) || 0;
    const hasUnread = unreadCount > 0 && !isActive;
    const lastMessageText =
      sidebarData.lastMessages.get(conversation.id) || "No messages yet";
    const lastMessageTimestamp = sidebarData.conversationTimestamps.get(
      conversation.id
    )
      ? new Date(
          sidebarData.conversationTimestamps.get(conversation.id)!
        ).toISOString()
      : conversation.last_message_at;

    return (
      <div
        onClick={() => onSelect(conversation.id)}
        className={`flex items-center px-4 py-2 cursor-pointer border-b border-gray-100 hover:bg-gray-200 ${
          isActive ? "bg-[#f0e7f2]" : ""
        }`}
      >
        <div className="relative">
          <UserAvatar
            src={otherUser.profile_image_url}
            alt={`${otherUser.first_name} ${otherUser.last_name}`}
            firstName={otherUser.first_name}
            lastName={otherUser.last_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
              false
            )}`}
          />
          {hasUnread && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </div>
          )}
        </div>
        <div className="ml-2 flex-1 min-w-0">
          <h4
            className={`text-[clamp(0.663rem,0.8rem,0.9rem)] font-medium text-[#212529] truncate ${
              hasUnread ? "font-bold" : ""
            }`}
          >
            {`${otherUser.first_name} ${otherUser.last_name}`}
          </h4>
          <p
            className={`text-[clamp(0.663rem,0.8rem,0.9rem)] text-[#757589] truncate ${
              hasUnread ? "font-bold" : ""
            }`}
          >
            {lastMessageText}
          </p>
        </div>
        <span className="text-[clamp(0.663rem,0.8rem,0.9rem)] text-[#757589] ml-1 whitespace-nowrap">
          {lastMessageTimestamp
            ? formatTimestamp(lastMessageTimestamp, "sidebar")
            : ""}
        </span>
      </div>
    );
  }
);

ConversationItem.displayName = "ConversationItem";

type SidebarVariant = "mobile" | "desktop";

export default function KindBossingChatSidebar({
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
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const { conversations, isLoadingConversations, conversationsError } =
    useChatUI({ selectedConversationId: null });

  // Use sidebar monitoring hook
  const { sidebarData, isInitialDataLoading } = useSidebarMonitoring({
    conversations,
    selectedConversationId: null,
  });

  // Determine currently active conversation from the URL
  const params = useParams() as { conversationId?: string } | null;
  const activeConversationId = params?.conversationId;

  // If a conversation is open (URL has conversationId), force tab to messages
  useEffect(() => {
    if (activeConversationId) {
      setActiveTab("messages");
    }
  }, [activeConversationId]);

  // Group matches by job title
  const groupedMatches = useMemo(() => {
    const grouped = new Map<string, any[]>();
    matches.forEach((match) => {
      const jobTitle = match.job_title || "Unknown Job";
      if (!grouped.has(jobTitle)) {
        grouped.set(jobTitle, []);
      }
      grouped.get(jobTitle)!.push(match);
    });
    return grouped;
  }, [matches]);

  // Toggle job folder expansion
  const toggleJobFolder = useCallback((jobTitle: string) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobTitle)) {
        newSet.delete(jobTitle);
      } else {
        newSet.add(jobTitle);
      }
      return newSet;
    });
  }, []);

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
      const aTime =
        sidebarData.conversationTimestamps.get(a.id) ||
        new Date(a.last_message_at || a.created_at).getTime();
      const bTime =
        sidebarData.conversationTimestamps.get(b.id) ||
        new Date(b.last_message_at || b.created_at).getTime();
      return bTime - aTime;
    });
  }, [conversations, sidebarData.conversationTimestamps]);

  const handleMatchClick = useCallback(
    async (match: any) => {
      try {
        await MatchService.markMatchAsInactive(match.id);
        const result = await MatchToConversationService.getOrCreateConversation(
          match.id
        );
        if (result.success && result.conversationId) {
          router.push(`/kindbossing/messages/${result.conversationId}`);
          refreshUnreadCounts();
        }
      } catch (e) {
        console.error("Error handling match click:", e);
      }
    },
    [router, refreshUnreadCounts]
  );

  const handleConversationSelect = useCallback(
    (conversationId: string) => {
      router.push(`/kindbossing/messages/${conversationId}`);
      refreshUnreadCounts();
    },
    [router, refreshUnreadCounts]
  );

  const isMobile = variant === "mobile";
  const containerClass = isMobile
    ? "flex md:hidden w-full bg-white border-b border-gray-200 flex-col"
    : "hidden md:flex w-80 bg-white border-r border-gray-200 flex-col h-full";

  const isSidebarLoading = useMemo(() => {
    return isLoadingConversations && conversations.length === 0;
  }, [isLoadingConversations, conversations.length]);

  return (
    <div className={containerClass}>
      <div className="px-4 py-4 border-b border-gray-200 shrink-0">
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

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "matches" ? (
          matchesLoading ? (
            <LoadingSpinner
              message="Loading matches..."
              size="sm"
              variant="minimal"
            />
          ) : groupedMatches.size === 0 ? (
            <div className="text-center text-sm text-[#757589] py-4 px-2">
              No matches yet
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {Array.from(groupedMatches.entries()).map(
                ([jobTitle, jobMatches]) => {
                  const isExpanded = expandedJobs.has(jobTitle);
                  return (
                    <div
                      key={jobTitle}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                    >
                      <button
                        onClick={() => toggleJobFolder(jobTitle)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm font-semibold text-[#212529] truncate">
                            {jobTitle}
                          </span>
                          <span className="text-xs text-[#757589] bg-gray-100 px-2 py-0.5 rounded-full">
                            {jobMatches.length}
                          </span>
                        </div>
                        {isExpanded ? (
                          <FiChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                        ) : (
                          <FiChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          {jobMatches.map((match) => (
                            <div
                              key={match.id}
                              onClick={() => handleMatchClick(match)}
                              className="flex items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                            >
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3 shrink-0">
                                <FiUsers className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-medium text-[#212529] truncate">
                                  KindTao User
                                </h4>
                                <p className="text-xs text-[#757589] truncate">
                                  ID: {match.id.slice(0, 8)}
                                </p>
                              </div>
                              {match.is_active && (
                                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )
        ) : isSidebarLoading ? (
          <MessageSkeleton />
        ) : conversationsError ? (
          <div className="text-center text-sm text-red-500 py-4 px-2">
            <p className="wrap-break-word">
              {conversationsError.message}
            </p>
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="text-center text-sm text-[#757589] py-4 px-2">
            No conversations yet
          </div>
        ) : (
          sortedConversations.map(
            (conversation) =>
              user && (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  currentUser={convertAuthUserToChatUser(user)}
                  sidebarData={sidebarData}
                  selectedConversationId={activeConversationId || null}
                  onSelect={handleConversationSelect}
                />
              )
          )
        )}
      </div>
    </div>
  );
}

