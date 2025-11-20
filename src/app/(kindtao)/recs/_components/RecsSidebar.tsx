"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiMessageCircle,
  FiUsers,
  FiChevronDown,
  FiChevronRight,
  FiZap,
  FiX,
} from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";
import { convex } from "@/utils/convex/client";
import { api } from "@/utils/convex/client";
import { useQuery } from "convex/react";
import { MatchService } from "@/services/MatchService";
import { ChatService } from "@/services/ChatService";
import LoadingSpinner from "@/components/loader/LoadingSpinner";
import MessageSkeleton from "@/components/common/MessageSkeleton";
import { formatTimestamp } from "@/utils/chatUtils";
import { logger } from "@/utils/logger";

const SubscriptionModal = dynamic(
  () => import("@/components/modals/SubscriptionModal"),
  { ssr: false }
);

type TabKey = "matches" | "messages";

const getInitials = (value?: string | null) => {
  if (!value) return "U";
  const cleaned = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (cleaned.length === 0) return "U";
  if (cleaned.length === 1) {
    return cleaned[0].slice(0, 2).toUpperCase();
  }
  const first = cleaned[0].charAt(0);
  const last = cleaned[cleaned.length - 1].charAt(0);
  return `${first}${last}`.toUpperCase();
};

interface RecsSidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  messagesBasePath?: string;
  initialMatches?: any[];
  initialConversations?: any[];
  disableNavigation?: boolean;
  onMatchClick?: (match: any) => void | Promise<void>;
  onLoadMoreConversations?: () => void;
  hasMoreConversations?: boolean;
  isLoadingMoreConversations?: boolean;
}

export default function RecsSidebar({
  activeTab,
  onTabChange,
  selectedConversationId,
  onConversationSelect,
  messagesBasePath = "/recs",
  initialMatches = [],
  initialConversations = [],
  disableNavigation = false,
  onMatchClick,
  onLoadMoreConversations,
  hasMoreConversations = false,
  isLoadingMoreConversations = false,
}: RecsSidebarProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isSubscriptionBannerDismissed, setIsSubscriptionBannerDismissed] =
    useState(false);
  const [matches, setMatches] = useState<any[]>(initialMatches);
  const [conversations, setConversations] =
    useState<any[]>(initialConversations);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsHasMore, setConversationsHasMore] = useState(true);
  const [conversationsLoadingMore, setConversationsLoadingMore] =
    useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // Get current user ID for unread count query
  const currentUserId = useMemo(() => {
    return user?.id || (user as { userId?: string })?.userId || null;
  }, [user]);

  // Get user record to determine role more reliably
  const userRecord = useQuery(
    api.users.getUserById,
    currentUserId ? { userId: currentUserId } : "skip"
  );

  const subscription = useQuery(
    api.subscriptions.getSubscriptionByUser,
    currentUserId ? { userId: currentUserId } : "skip"
  );

  // Get user role from userRecord or auth store
  const userRole = useMemo(() => {
    if (userRecord?.role) {
      return userRecord.role === "admin"
        ? null
        : (userRecord.role as "kindtao" | "kindbossing" | null);
    }
    if (user?.role) {
      return user.role === "admin"
        ? null
        : (user.role as "kindtao" | "kindbossing" | null);
    }
    return null;
  }, [userRecord, user?.role]);

  const subscriptionLoading =
    Boolean(currentUserId) && subscription === undefined;

  const hasActiveSubscription = useMemo(() => {
    if (!subscription) return false;
    const status = String(subscription.status || "").toLowerCase();
    const activeStatuses = new Set(["active", "upgraded"]);
    const isStatusActive = activeStatuses.has(status);
    if (!isStatusActive) return false;

    const periodEndRaw = subscription.current_period_end;
    if (periodEndRaw) {
      const periodEnd =
        typeof periodEndRaw === "number"
          ? periodEndRaw
          : Date.parse(String(periodEndRaw));
      if (!Number.isNaN(periodEnd) && periodEnd <= Date.now()) {
        return false;
      }
    }

    return true;
  }, [subscription]);

  const shouldShowSubscriptionBanner =
    Boolean(currentUserId) &&
    !subscriptionLoading &&
    !hasActiveSubscription &&
    !isSubscriptionBannerDismissed;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedValue = window.sessionStorage.getItem(
        "recsSubscriptionBannerDismissed"
      );
      if (storedValue === "true") {
        setIsSubscriptionBannerDismissed(true);
      }
    } catch (error) {
      logger.warn("Failed to read subscription banner state", { error });
    }
  }, []);

  // Get count of conversations with unread messages
  type UnreadConversationsMeta = { count: number; conversationIds: string[] };
  const unreadConversationsRaw = useQuery(
    api.messages.getUnreadConversationsCount,
    currentUserId ? { userId: currentUserId } : "skip"
  ) as UnreadConversationsMeta | number | null | undefined;

  const unreadConversationsMeta: UnreadConversationsMeta = useMemo(() => {
    if (
      unreadConversationsRaw &&
      typeof unreadConversationsRaw === "object" &&
      "count" in unreadConversationsRaw &&
      Array.isArray(unreadConversationsRaw.conversationIds)
    ) {
      return unreadConversationsRaw as UnreadConversationsMeta;
    }

    const fallbackCount =
      typeof unreadConversationsRaw === "number" ? unreadConversationsRaw : 0;
    return { count: fallbackCount, conversationIds: [] };
  }, [unreadConversationsRaw]);

  // Filter unread conversation IDs to exclude conversations where the match hasn't been opened
  const unreadConversationIds = useMemo(() => {
    const rawIds = unreadConversationsMeta.conversationIds ?? [];

    // If we don't have matches data or userRole, return raw IDs (server-side filtering should handle it)
    if (!matches || matches.length === 0 || !userRole) {
      return rawIds;
    }

    // Create a map of match IDs to match data for quick lookup
    const matchMap = new Map<string, any>();
    for (const match of matches) {
      const matchId = String(match._id || "");
      matchMap.set(matchId, match);
    }

    // Filter conversation IDs based on whether their associated match has been opened
    const filteredIds = rawIds.filter((conversationId) => {
      // Find the conversation in the conversations list
      const conversation = conversations.find(
        (conv) => String(conv._id || conv.id || "") === conversationId
      );

      // If conversation not found in local state, include it (server-side filtering should handle it)
      if (!conversation) {
        return true;
      }

      // If conversation has no match_id, include it
      if (!conversation.match_id) {
        return true;
      }

      const matchId = String(conversation.match_id);
      const match = matchMap.get(matchId);

      // If match not found, include conversation (server-side filtering should handle it)
      if (!match) {
        return true;
      }

      // Check if match has been opened by the current user
      const isOpened =
        userRole === "kindtao"
          ? match.is_opened_by_kindtao === true
          : userRole === "kindbossing"
            ? match.is_opened_by_kindbossing === true
            : false;

      // Only include if match has been opened
      return isOpened === true;
    });

    return filteredIds;
  }, [
    unreadConversationsMeta.conversationIds,
    matches,
    conversations,
    userRole,
  ]);

  // Update matches and conversations when initial props change
  useEffect(() => {
    setMatches(initialMatches);
    if (initialMatches && initialMatches.length > 0) {
      logger.debug("RecsSidebar received matches:", {
        count: initialMatches.length,
        matchIds: initialMatches.map((m: any) => String(m._id || "")),
        userRole,
      });
    } else {
      logger.debug("RecsSidebar received no matches:", { userRole });
    }
  }, [initialMatches, userRole]);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // Determine if we have more conversations to load
  useEffect(() => {
    // If we have initial conversations, assume there might be more
    // This will be updated when we try to load more
    if (initialConversations.length > 0 && initialConversations.length >= 20) {
      setConversationsHasMore(true);
    } else {
      setConversationsHasMore(false);
    }
  }, [initialConversations.length]);

  // Load more conversations (pagination)
  const loadMoreConversations = async () => {
    if (!user?.id || conversationsLoadingMore || !conversationsHasMore) return;

    try {
      setConversationsLoadingMore(true);
      const { getConversations } = await import(
        "@/actions/recs/get-conversations"
      );
      const result = await getConversations(20, conversations.length);

      if (result.conversations && result.conversations.length > 0) {
        setConversations((prev) => [...prev, ...result.conversations]);
        setConversationsHasMore(result.hasMore || false);
      } else {
        setConversationsHasMore(false);
      }
    } catch (error) {
      logger.error("Error loading more conversations:", error);
      setConversationsHasMore(false);
    } finally {
      setConversationsLoadingMore(false);
    }
  };

  // Handle scroll for infinite loading
  const handleConversationsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;

    // Load more when within 100px of bottom
    const shouldLoadMore = onLoadMoreConversations
      ? hasMoreConversations && !isLoadingMoreConversations
      : conversationsHasMore && !conversationsLoadingMore;

    if (scrollBottom < 100 && shouldLoadMore) {
      if (onLoadMoreConversations) {
        onLoadMoreConversations();
      } else {
        loadMoreConversations();
      }
    }
  };

  // Group matches by job title (for both KindBossing and KindTao users)
  const groupedMatches = useMemo(() => {
    const grouped = new Map<string, any[]>();
    matches.forEach((match) => {
      // Job title might be in match.job.job_title or match.job_title
      const jobTitle = match.job?.job_title || match.job_title || "Unknown Job";
      if (!grouped.has(jobTitle)) {
        grouped.set(jobTitle, []);
      }
      grouped.get(jobTitle)!.push(match);
    });
    return grouped;
  }, [matches]);

  // Toggle job expansion (for kindbossing users)
  const toggleJobExpansion = (jobTitle: string) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobTitle)) {
        newSet.delete(jobTitle);
      } else {
        newSet.add(jobTitle);
      }
      logger.debug("Toggle job expansion:", {
        jobTitle,
        expanded: newSet.has(jobTitle),
        userRole,
      });
      return newSet;
    });
  };

  const handleUpgradeClick = () => {
    if (userRole) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    router.push("/kindtao/settings?tab=subscriptions");
  };

  const handleDismissSubscriptionBanner = () => {
    setIsSubscriptionBannerDismissed(true);
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem("recsSubscriptionBannerDismissed", "true");
    } catch (error) {
      logger.warn("Failed to persist subscription banner state", { error });
    }
  };

  // When job folder is clicked, toggle expansion (for kindbossing) or open chat (for kindtao)
  const handleJobClick = (
    e: React.MouseEvent,
    jobMatches: any[],
    jobTitle: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (jobMatches.length === 0) return;

    logger.debug("Job clicked:", {
      jobTitle,
      userRole,
      jobMatchesCount: jobMatches.length,
    });

    // For kindbossing users, toggle expansion instead of opening chat
    if (userRole === "kindbossing") {
      logger.debug("Toggling expansion for kindbossing user");
      toggleJobExpansion(jobTitle);
      return;
    }

    // For kindtao users, open chat with first match directly
    if (userRole === "kindtao") {
      const firstMatch = jobMatches[0];
      handleMatchClick(firstMatch);
      return;
    }

    // If userRole is not yet determined, default to kindbossing behavior (toggle expansion)
    // This handles the case where userRole might be loading
    logger.debug("UserRole not determined, defaulting to toggle expansion");
    toggleJobExpansion(jobTitle);
  };

  const handleMatchClick = async (match: any) => {
    const matchId = String(match._id || match.id || "");
    if (!matchId) {
      return;
    }

    // If custom handler provided, use it (this handles the new- prefix pattern)
    if (onMatchClick) {
      await onMatchClick(match);
      return;
    }

    // Default behavior - for KindTao, also use new- prefix pattern
    if (userRole === "kindbossing" || userRole === "kindtao") {
      try {
        await MatchService.markMatchAsOpened(convex, matchId, userRole);
        setMatches((prev) =>
          prev.map((item) => {
            const itemId = String(item._id || item.id || "");
            if (itemId !== matchId) return item;
            return {
              ...item,
              is_opened_by_kindbossing:
                userRole === "kindbossing"
                  ? true
                  : item.is_opened_by_kindbossing,
              is_opened_by_kindtao:
                userRole === "kindtao" ? true : item.is_opened_by_kindtao,
            };
          })
        );

        // For KindTao and KindBossing, check for existing conversation and use new- prefix if needed
        if (
          (userRole === "kindtao" || userRole === "kindbossing") &&
          !disableNavigation
        ) {
          try {
            const existingConversation = await convex.query(
              api.conversations.getConversationByMatchId,
              { matchId }
            );

            let conversationIdToUse: string;
            if (existingConversation?._id) {
              conversationIdToUse = String(existingConversation._id);
            } else {
              conversationIdToUse = `new-${matchId}`;
            }

            router.replace(`${messagesBasePath}/${conversationIdToUse}`, {
              scroll: false,
            });
            return;
          } catch (error) {
            logger.error("Error checking conversation:", error);
          }
        }
      } catch (error) {
        logger.error("Failed to mark match as opened:", error);
      }
    }

    if (!disableNavigation) {
      router.replace(`${messagesBasePath}/${matchId}`, {
        scroll: false,
      });
    }
  };

  const handleConversationClick = (conversationId: string) => {
    onConversationSelect(conversationId);
    if (!disableNavigation) {
      router.push(`${messagesBasePath}/${conversationId}`);
    }
  };

  // Calculate unread counts
  const unreadCounts = useMemo(() => {
    let newMatches = 0;

    // Count only unopened matches
    matches.forEach((match) => {
      const isUnopened =
        userRole === "kindbossing"
          ? match.is_opened_by_kindbossing !== true
          : match.is_opened_by_kindtao !== true;
      if (isUnopened) newMatches++;
    });

    // Use filtered unread conversation IDs to get accurate count
    // This ensures we only count conversations where the match has been opened
    const unreadMessages = unreadConversationIds.length;

    return { newMatches, unreadMessages };
  }, [matches, userRole, unreadConversationIds]);

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Tabs */}
      <div className="w-full p-4 shrink-0 border-b border-gray-200">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full">
          <button
            onClick={() => onTabChange("matches")}
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
            onClick={() => onTabChange("messages")}
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

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto min-h-0 w-full"
        onScroll={
          activeTab === "messages" ? handleConversationsScroll : undefined
        }
      >
        {activeTab === "matches" ? (
          matchesLoading ? (
            <LoadingSpinner
              message="Loading matches..."
              size="sm"
              variant="minimal"
            />
          ) : groupedMatches.size === 0 ? (
            <div className="text-center text-sm text-[#757589] py-4 px-2 w-full">
              No matches yet
            </div>
          ) : (
            // Show job folders - expandable for kindbossing, clickable for kindtao
            <div className="space-y-2 p-2 w-full">
              {Array.from(groupedMatches.entries()).map(
                ([jobTitle, jobMatches]) => {
                  // Check if any match in this job category is unopened
                  const hasUnopenedMatch = jobMatches.some((match) => {
                    return userRole === "kindbossing"
                      ? match.is_opened_by_kindbossing !== true
                      : match.is_opened_by_kindtao !== true;
                  });

                  const isExpanded =
                    (userRole === "kindbossing" || userRole === null) &&
                    expandedJobs.has(jobTitle);

                  return (
                    <div
                      key={jobTitle}
                      className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white relative"
                      style={{ pointerEvents: "auto" }}
                    >
                      {/* Job Title Header */}
                      <button
                        type="button"
                        onClick={(e) => {
                          logger.debug("Button clicked directly", {
                            jobTitle,
                            userRole,
                          });
                          handleJobClick(e, jobMatches, jobTitle);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="w-full py-4 px-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left cursor-pointer relative z-10"
                        style={{
                          pointerEvents: "auto",
                          touchAction: "manipulation",
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0 relative">
                          {/* Show chevron for kindbossing users or when role is not determined */}
                          {(userRole === "kindbossing" || userRole === null) &&
                            (isExpanded ? (
                              <FiChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                            ) : (
                              <FiChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                            ))}
                          <span className="text-sm font-semibold text-[#212529] truncate">
                            {jobTitle}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto shrink-0">
                            ({jobMatches.length})
                          </span>
                          {hasUnopenedMatch && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shrink-0"></div>
                          )}
                        </div>
                      </button>

                      {/* Expanded: Show Matched Applicants (only for kindbossing) */}
                      {(userRole === "kindbossing" || userRole === null) &&
                        isExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            {jobMatches.map((match) => {
                              const isUnopened =
                                match.is_opened_by_kindbossing !== true;
                              const kindtaoUser =
                                match.kindtao || match.kindtao_user;

                              // Extract display name from kindtao user data
                              const displayName = (() => {
                                if (!kindtaoUser || isUnopened) {
                                  return "KindTao User";
                                }

                                const firstName = kindtaoUser.first_name || "";
                                const lastName = kindtaoUser.last_name || "";
                                const fullName =
                                  `${firstName} ${lastName}`.trim();

                                if (fullName) return fullName;

                                if (kindtaoUser.email) {
                                  return kindtaoUser.email.split("@")[0];
                                }

                                return "KindTao User";
                              })();

                              const matchId = String(
                                match._id || match.id || ""
                              );

                              return (
                                <div
                                  key={matchId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMatchClick(match);
                                  }}
                                  className="flex items-center py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                                >
                                  <div className="relative w-8 h-8 mr-3 shrink-0">
                                    {kindtaoUser?.profile_image_url &&
                                    !isUnopened ? (
                                      <img
                                        src={kindtaoUser.profile_image_url}
                                        alt={displayName}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-[#FDECEC] text-[#B30000] flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide">
                                        ANON
                                      </div>
                                    )}
                                    {isUnopened && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shrink-0"></div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-medium text-[#212529] truncate">
                                        {displayName}
                                      </h4>
                                      {isUnopened && (
                                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shrink-0">
                                          NEW
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  );
                }
              )}
            </div>
          )
        ) : conversationsLoading ? (
          <MessageSkeleton />
        ) : conversations.length === 0 ? (
          <div className="text-center text-sm text-[#757589] py-4 px-2 w-full">
            No conversations yet
          </div>
        ) : (
          <div className="w-full">
            {conversations.map((conversation) => {
              const otherUser = conversation.otherUser;
              const conversationId = String(
                conversation._id || conversation.id || ""
              );
              const isTemporary = conversationId.startsWith("new-");

              // Extract display name from user data
              const displayName = (() => {
                // For temporary conversations, always try to get the name from otherUser
                if (isTemporary) {
                  if (otherUser) {
                    const firstName = otherUser.first_name || "";
                    const lastName = otherUser.last_name || "";
                    const fullName = `${firstName} ${lastName}`.trim();

                    if (fullName) return fullName;

                    // Fallback to email username
                    if (otherUser.email) {
                      return otherUser.email.split("@")[0];
                    }
                  }

                  // For temporary conversations, use "User" instead of Conversation #
                  return "User";
                }

                // For regular conversations
                if (!otherUser)
                  return `Conversation #${conversationId.slice(-8)}`;

                // Try to get name from first_name and last_name
                const firstName = otherUser.first_name || "";
                const lastName = otherUser.last_name || "";
                const fullName = `${firstName} ${lastName}`.trim();

                if (fullName) return fullName;

                // Fallback to email username
                if (otherUser.email) {
                  return otherUser.email.split("@")[0];
                }

                // Last resort
                return `Conversation #${conversationId.slice(-8)}`;
              })();
              const avatarInitials = getInitials(displayName);

              // Normalize both IDs to strings for comparison
              // Ensure selectedConversationId is a valid string
              const normalizedSelectedId =
                selectedConversationId &&
                typeof selectedConversationId === "string"
                  ? selectedConversationId.trim()
                  : null;
              const normalizedConversationId = String(conversationId).trim();
              const isSelected =
                normalizedSelectedId !== null &&
                normalizedSelectedId === normalizedConversationId;
              const hasUnread =
                !isTemporary &&
                unreadConversationIds.includes(normalizedConversationId);
              const lastMessageContent = isTemporary
                ? null
                : conversation.lastMessage?.content || null;
              const lastMessageSenderId = isTemporary
                ? null
                : conversation.lastMessage?.sender_id || null;
              const formattedPreview =
                lastMessageContent && lastMessageContent.length > 0
                  ? lastMessageSenderId &&
                    currentUserId &&
                    lastMessageSenderId === currentUserId
                    ? `You: ${lastMessageContent}`
                    : lastMessageContent
                  : null;
              return (
                <div
                  key={conversationId}
                  onClick={() => handleConversationClick(conversationId)}
                  className={`w-full flex items-center px-4 py-4 cursor-pointer border-b border-gray-100 ${
                    isSelected
                      ? "bg-gray-100 hover:bg-gray-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    {otherUser?.profile_image_url ? (
                      <img
                        src={otherUser.profile_image_url}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#CC0000] text-white flex items-center justify-center text-sm font-semibold">
                        {avatarInitials}
                      </div>
                    )}
                  </div>
                  <div className="ml-2 flex-1 min-w-0">
                    <h4
                      className={`text-sm ${
                        hasUnread
                          ? "font-semibold text-[#161616]"
                          : "font-medium text-[#212529]"
                      } truncate`}
                    >
                      {displayName}
                    </h4>
                    {!isTemporary && formattedPreview && (
                      <p
                        className={`text-xs truncate ${
                          hasUnread
                            ? "text-[#161616] font-semibold"
                            : "text-[#757589]"
                        }`}
                      >
                        {formattedPreview}
                      </p>
                    )}
                  </div>
                  {!isTemporary && conversation.last_message_at && (
                    <span className="text-xs text-[#757589] ml-1 whitespace-nowrap">
                      {formatTimestamp(conversation.last_message_at, "sidebar")}
                    </span>
                  )}
                </div>
              );
            })}
            {/* Loading more indicator */}
            {conversationsLoadingMore && (
              <div className="flex justify-center py-4">
                <LoadingSpinner
                  message="Loading more..."
                  size="sm"
                  variant="minimal"
                />
              </div>
            )}
          </div>
        )}
      </div>
      {shouldShowSubscriptionBanner && (
        <div className="px-4 pt-2 pb-4">
          <div className="relative rounded-2xl border border-[#FFD9D9] bg-linear-to-r from-[#FFF5F5] to-white p-4 shadow-sm">
            <button
              type="button"
              onClick={handleDismissSubscriptionBanner}
              aria-label="Dismiss upgrade reminder"
              className="absolute cursor-pointer right-3 top-3 rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
            >
              <FiX className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#CC0000] shadow">
                <FiZap className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {userRole === "kindbossing"
                    ? "Upgrade to reach more KindTao talent"
                    : "Upgrade for unlimited swipes & boosts"}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Get premium features like higher swipe limits, boost credits,
                  and priority placement.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUpgradeClick}
              className="mt-3 w-full cursor-pointer rounded-xl bg-[#CC0000] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a10000]"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}
      {userRole && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          userRole={userRole}
        />
      )}
    </div>
  );
}
