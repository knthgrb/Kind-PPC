"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/utils/convex/client";
import { convex } from "@/utils/convex/client";
import { ChatService } from "@/services/ChatService";
import { formatTimestamp } from "@/utils/chatUtils";
import LoadingSpinner from "@/components/loader/LoadingSpinner";
import { logger } from "@/utils/logger";
import { ConversationActionsService } from "@/services/ConversationActionsService";
import { useToastActions } from "@/stores/useToastStore";
import { FaStar } from "react-icons/fa";
import { conversationCache } from "@/services/ConversationCacheService";

const getUserId = (user: unknown): string | null => {
  if (!user) return null;
  return (
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null
  );
};

const MESSAGE_GROUP_THRESHOLD_MS = 3 * 60 * 1000;

const getInitials = (text?: string | null): string => {
  if (!text) return "U";
  const parts = text
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

interface KindTaoConversationWindowProps {
  conversationId: string;
  onClose?: () => void;
}

export default function KindTaoConversationWindow({
  conversationId,
  onClose,
}: KindTaoConversationWindowProps) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    isAuthenticated ? undefined : "skip"
  );
  const userId = getUserId(currentUser);
  const [conversation, setConversation] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transitioningConversationIdRef = useRef<string | null>(null);
  const hasScrolledToBottomRef = useRef(false);
  const previousMessagesLengthRef = useRef(0);
  const { showSuccess, showError } = useToastActions();

  // Set user ID in cache service for encryption
  useEffect(() => {
    if (userId) {
      conversationCache.setUserId(userId);
    }
  }, [userId]);

  // Check if this is a temporary conversation
  const isTempConversation = conversationId.startsWith("new-");
  const tempMatchId = isTempConversation
    ? conversationId.replace("new-", "")
    : null;

  // Load match data if temporary conversation
  const matchData = useQuery(
    api.matches.getMatchById,
    tempMatchId && userId ? { matchId: tempMatchId, userId } : "skip"
  );

  useEffect(() => {
    if (isTempConversation) {
      if (currentUser === undefined) {
        setIsLoading(true);
        return;
      }
      if (matchData) {
        setMatch(matchData);
        setIsTemporary(true);
        setIsLoading(false);
        setMessages([]);
      } else if (matchData === null) {
        setIsLoading(false);
      }
    }
  }, [isTempConversation, matchData, currentUser]);

  // Use Convex useQuery for real-time message updates
  const realtimeMessages = useQuery(
    api.messages.getMessagesByConversation,
    !isTempConversation && conversationId ? { conversationId } : "skip"
  );

  useEffect(() => {
    const loadConversation = async () => {
      if (!userId || !conversationId) return;
      if (isTempConversation) return;

      const isTransitioning =
        transitioningConversationIdRef.current === conversationId;

      try {
        let cached = conversationCache.getConversation(conversationId);
        if (!cached) {
          cached = await conversationCache.getConversationFromIndexedDB(
            conversationId
          );
        }

        if (cached?.conversation) {
          logger.debug("Using cached conversation:", { conversationId });
          setConversation(cached.conversation);
          if (cached.messages && cached.messages.length > 0) {
            setMessages(cached.messages);
          }
          setIsLoading(false);
          setIsTemporary(false);
        } else {
          if (!isTransitioning) {
            setIsLoading(true);
          }
        }

        setIsTemporary(false);

        if (userId) {
          const conv = await ChatService.getConversation(
            convex,
            conversationId,
            userId
          );
          setConversation(conv);
          conversationCache.setConversation(conversationId, {
            conversation: conv,
          });
        }

        if (isTransitioning) {
          transitioningConversationIdRef.current = null;
        }
      } catch (error) {
        logger.error("Error loading conversation:", error);
        transitioningConversationIdRef.current = null;
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, userId, isTempConversation]);

  // Update messages from real-time query
  useEffect(() => {
    if (isTempConversation) {
      setMessages([]);
      return;
    }

    if (realtimeMessages !== undefined) {
      const formattedMessages = (realtimeMessages || []).map((msg: any) => ({
        id: String(msg._id),
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type || "text",
        file_url: msg.file_url || null,
        status: msg.status || "sent",
        read_at: msg.read_at ? new Date(msg.read_at).toISOString() : null,
        created_at: new Date(msg.created_at).toISOString(),
        sender: msg.sender || null,
      }));

      setMessages(formattedMessages);
      conversationCache.updateMessages(conversationId, formattedMessages, false);
    }
  }, [realtimeMessages, isTempConversation, conversationId]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length === 0) {
      hasScrolledToBottomRef.current = false;
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    const isInitialLoad = !hasScrolledToBottomRef.current;
    const isNewMessage = messages.length > previousMessagesLengthRef.current;

    if (isInitialLoad || (isNewMessage && isNearBottom)) {
      requestAnimationFrame(() => {
        setTimeout(
          () => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({
                behavior: isInitialLoad ? "auto" : "smooth",
              });
              hasScrolledToBottomRef.current = true;
            } else if (container) {
              container.scrollTop = container.scrollHeight;
              hasScrolledToBottomRef.current = true;
            }
          },
          isInitialLoad ? 100 : 0
        );
      });
    }

    previousMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (isTempConversation || !conversationId || !userId) return;
    if (messages.length === 0) return;

    const hasUnread = messages.some(
      (msg) => msg.sender_id !== userId && !msg.read_at
    );

    if (!hasUnread) return;

    const markAsRead = async () => {
      try {
        await ChatService.markMessagesAsRead(convex, conversationId, userId);
      } catch (error) {
        logger.error("Failed to mark messages as read:", error);
      }
    };

    markAsRead();
  }, [messages, isTempConversation, conversationId, userId]);

  // Reset scroll tracking
  useEffect(() => {
    hasScrolledToBottomRef.current = false;
    previousMessagesLengthRef.current = 0;
  }, [conversationId]);

  // Get other user (kindbossing) with ID fallback for temporary conversations
  const otherUser =
    isTemporary && match
      ? match.kindbossing ||
        match.kindbossing_user ||
        (match.kindbossing_user_id
          ? { id: match.kindbossing_user_id }
          : null)
      : conversation?.otherUser;

  const otherUserId = useMemo(() => {
    if (!otherUser) return null;
    return otherUser.id || otherUser._id || null;
  }, [otherUser]);

  // Always fetch full user data to ensure we have the latest profile_image_url
  const fullOtherUserData = useQuery(
    api.users.getUserById,
    otherUserId ? { userId: otherUserId } : "skip"
  );

  const otherUserWithProfile = useMemo(() => {
    if (fullOtherUserData) {
      const profileImageUrl =
        (fullOtherUserData.profile_image_url &&
          typeof fullOtherUserData.profile_image_url === "string" &&
          fullOtherUserData.profile_image_url.trim()) ||
        (otherUser?.profile_image_url &&
          typeof otherUser.profile_image_url === "string" &&
          otherUser.profile_image_url.trim()) ||
        null;

      return {
        ...otherUser,
        profile_image_url: profileImageUrl,
        first_name: fullOtherUserData.first_name || otherUser?.first_name,
        last_name: fullOtherUserData.last_name || otherUser?.last_name,
        email: fullOtherUserData.email || otherUser?.email,
      };
    }
    if (
      otherUser?.profile_image_url &&
      typeof otherUser.profile_image_url === "string" &&
      !otherUser.profile_image_url.trim()
    ) {
      return {
        ...otherUser,
        profile_image_url: null,
      };
    }
    return otherUser;
  }, [otherUser, fullOtherUserData]);

  // Get kindbossing and kindtao user IDs
  const kindbossingUserId = useMemo(() => {
    if (conversation?.kindbossing_user_id) {
      return conversation.kindbossing_user_id;
    }
    if (match?.kindbossing_user_id) {
      return match.kindbossing_user_id;
    }
    return otherUserId;
  }, [conversation, match, otherUserId]);

  const kindtaoUserId = useMemo(() => {
    if (conversation?.kindtao_user_id) {
      return conversation.kindtao_user_id;
    }
    if (match?.kindtao_user_id) {
      return match.kindtao_user_id;
    }
    return userId;
  }, [conversation, match, userId]);

  // Fetch all matches to show matched job titles
  const allMatches = useQuery(
    api.matches.getMatchesByUserIds,
    kindbossingUserId && kindtaoUserId
      ? {
          kindbossingUserId,
          kindtaoUserId,
        }
      : "skip"
  );

  const matchedJobTitles = useMemo(() => {
    const titles = new Set<string>();

    if (allMatches && allMatches.length > 0) {
      allMatches.forEach((matchItem: any) => {
        if (matchItem.job?.job_title) {
          titles.add(matchItem.job.job_title);
        } else if (matchItem.job?.title) {
          titles.add(matchItem.job.title);
        }
      });
    }

    if (titles.size === 0) {
      if (match?.job?.job_title) {
        titles.add(match.job.job_title);
      } else if (match?.job?.title) {
        titles.add(match.job.title);
      }
      if (conversation?.match?.job?.job_title) {
        titles.add(conversation.match.job.job_title);
      } else if (conversation?.match?.job?.title) {
        titles.add(conversation.match.job.title);
      }
    }

    return Array.from(titles);
  }, [allMatches, match, conversation]);

  // Get kindbossing profile data
  const kindbossingProfile = useQuery(
    api.kindbossings.getKindBossingByUserId,
    otherUserId ? { userId: otherUserId } : "skip"
  );

  const matchId = useMemo(() => {
    if (isTemporary && match) {
      return String(match._id || match.id || "");
    }
    if (conversation?.match_id) {
      return String(conversation.match_id);
    }
    if (isTempConversation && tempMatchId) {
      return tempMatchId;
    }
    return null;
  }, [isTemporary, match, conversation, isTempConversation, tempMatchId]);

  const displayName = useMemo(() => {
    const user = otherUserWithProfile || otherUser;
    if (!user) return "User";

    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) return fullName;
    if (user.email) {
      return user.email.split("@")[0];
    }
    return "User";
  }, [otherUserWithProfile, otherUser]);

  const otherUserInitials = useMemo(() => {
    const user = otherUserWithProfile || otherUser;
    if (!user) return "U";
    return getInitials(displayName);
  }, [displayName, otherUserWithProfile, otherUser]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId || isSending) return;

    try {
      setIsSending(true);
      let actualConversationId = conversationId;
      const messageContent = newMessage.trim();

      if (isTemporary && matchId && match) {
        const kindbossingUserId =
          match.kindbossing_user_id || match.kindbossing?.id || match.kindbossing?._id;
        if (!kindbossingUserId) {
          logger.error("Unable to find kindbossing user ID in match");
          return;
        }

        const kindbossingUserIdString =
          typeof kindbossingUserId === "string"
            ? kindbossingUserId
            : String(kindbossingUserId);

        actualConversationId = await ChatService.createConversation(
          convex,
          matchId,
          kindbossingUserIdString,
          userId
        );

        setIsTemporary(false);
        const newConversation = {
          _id: actualConversationId,
          id: actualConversationId,
          match_id: matchId,
          kindbossing_user_id: kindbossingUserIdString,
          kindtao_user_id: userId,
          otherUser: match.kindbossing || match.kindbossing_user,
        };
        setConversation(newConversation);

        conversationCache.setConversation(actualConversationId, {
          conversation: newConversation,
          match,
          isTemporary: false,
        });

        transitioningConversationIdRef.current = actualConversationId;
      }

      await ChatService.sendMessage(
        convex,
        actualConversationId,
        userId,
        messageContent,
        "text"
      );
      setNewMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }

      hasScrolledToBottomRef.current = false;

      if (isTemporary && actualConversationId !== conversationId) {
        router.replace(`/kindtao/messages/${actualConversationId}`, {
          scroll: false,
        });
      }
    } catch (error) {
      logger.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/kindtao/matches");
    }
  };

  const handleUnmatch = async () => {
    if (!matchId || !userId) {
      showError("Unable to unmatch. Missing information.");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to unmatch? This will delete the match and conversation."
      )
    ) {
      return;
    }

    try {
      let actualMatchId = matchId;
      if (isTemporary || !conversation?.match_id) {
        try {
          const matchData = await convex.query(api.matches.getMatchById, {
            matchId: matchId,
            userId: userId,
          });
          if (matchData?._id) {
            actualMatchId = String(matchData._id);
          }
        } catch (error) {
          logger.warn("Could not fetch match for unmatch:", error);
        }
      }

      const result = await ConversationActionsService.unmatch(
        convex,
        actualMatchId,
        isTemporary ? null : conversationId,
        userId
      );

      if (result.success) {
        showSuccess("Unmatched successfully");
        router.push("/kindtao/matches");
      } else {
        showError(result.error || "Failed to unmatch");
      }
    } catch (error) {
      logger.error("Error unmatching:", error);
      showError("Failed to unmatch");
    }
  };

  const handleBlock = async () => {
    if (!otherUserId || !userId) {
      showError("Unable to block. Missing information.");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to block this user? You won't be able to message them anymore."
      )
    ) {
      return;
    }

    try {
      const result = await ConversationActionsService.blockUser(
        convex,
        userId,
        otherUserId
      );

      if (result.success) {
        showSuccess("User blocked successfully");
        router.push("/kindtao/matches");
      } else {
        showError(result.error || "Failed to block user");
      }
    } catch (error) {
      logger.error("Error blocking user:", error);
      showError("Failed to block user");
    }
  };

  const handleReport = async () => {
    if (!otherUserId || !userId) {
      showError("Unable to report. Missing information.");
      return;
    }

    if (!reportReason.trim()) {
      showError("Please provide a reason for reporting");
      return;
    }

    try {
      const result = await ConversationActionsService.reportUser(
        convex,
        userId,
        otherUserId,
        "inappropriate_behavior",
        reportReason.trim()
      );

      if (result.success) {
        showSuccess("User reported successfully. We'll review your report.");
        setShowReportModal(false);
        setReportReason("");
      } else {
        showError(result.error || "Failed to report user");
      }
    } catch (error) {
      logger.error("Error reporting user:", error);
      showError("Failed to report user");
    }
  };

  return (
    <div className="h-full w-full flex bg-white overflow-hidden max-w-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center">
            {!otherUser ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse mr-3" />
                <div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                </div>
              </>
            ) : (
              <>
                {(otherUserWithProfile || otherUser)?.profile_image_url ? (
                  <img
                    src={(otherUserWithProfile || otherUser)?.profile_image_url}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#CC0000] text-white flex items-center justify-center mr-3 font-semibold text-sm">
                    {otherUserInitials}
                  </div>
                )}
                <div>
                  <h3
                    className="text-sm font-medium text-[#212529] cursor-pointer lg:cursor-default"
                    onClick={() => setShowMobilePanel(true)}
                  >
                    {displayName}
                  </h3>
                  <p className="text-xs text-[#757589]">Offline</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-[#f5f6f9] rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
            title="Close chat"
          >
            <IoClose className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 bg-[#f5f6fa] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner
                message="Loading messages..."
                size="md"
                variant="minimal"
              />
            </div>
          ) : !conversation && !isTemporary ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500">Conversation not found</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <p className="text-sm text-[#757589] mb-4">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <div className="w-full max-w-full">
              {messages.map((msg, index) => {
                const isSent = msg.sender_id === userId;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showContactAvatar =
                  !isSent &&
                  (!prevMessage ||
                    prevMessage.sender_id === userId ||
                    new Date(msg.created_at).getTime() -
                      new Date(prevMessage.created_at).getTime() >
                      MESSAGE_GROUP_THRESHOLD_MS);
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end w-full mb-1 ${isSent ? "justify-end" : "justify-start"}`}
                  >
                    {!isSent &&
                      (showContactAvatar ? (
                        (otherUserWithProfile || otherUser)
                          ?.profile_image_url ? (
                          <img
                            src={
                              (otherUserWithProfile || otherUser)
                                ?.profile_image_url
                            }
                            alt={displayName}
                            className="w-8 h-8 rounded-full object-cover mr-2 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#CC0000] text-white flex items-center justify-center mr-2 shrink-0 text-xs font-semibold">
                            {otherUserInitials}
                          </div>
                        )
                      ) : (
                        <div className="w-8 mr-2 shrink-0" />
                      ))}
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] xl:max-w-[50%] ${
                        isSent
                          ? "bg-[#CC0000] text-white rounded"
                          : "bg-white text-[#757589] rounded"
                      }`}
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      <span className="text-xs opacity-75 mt-1 block">
                        {formatTimestamp(msg.created_at, "chat")}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-4 shrink-0 bg-white border-t border-gray-200 flex item-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 relative items-center flex w-full">
              <textarea
                ref={textareaRef}
                placeholder="Type message here..."
                disabled={isSending || isLoading}
                rows={1}
                className={`w-full px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-2xl resize-none outline-none transition-all duration-200 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 overflow-hidden ${
                  isSending || isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !isSending &&
                    !isLoading
                  ) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{ minHeight: "44px", maxHeight: "120px", overflow: "hidden" }}
              />
            </div>
            <button
              type="button"
              disabled={isSending || isLoading || !newMessage.trim()}
              onClick={handleSendMessage}
              className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                isSending || isLoading || !newMessage.trim()
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-[#CC0000] hover:bg-[#B30000] active:scale-95 cursor-pointer shadow-sm"
              }`}
              aria-label="Send message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={
                  isSending || isLoading || !newMessage.trim()
                    ? "text-gray-400"
                    : "text-white"
                }
              >
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Desktop only - KindBossing Profile Panel */}
      {/* Show skeleton when loading, show content when otherUser is available */}
      {(isLoading || otherUser) && (
        <>
          {/* Desktop Sidebar */}
          <div
            className="hidden lg:flex w-96 border-l border-gray-200 bg-white flex-col overflow-y-auto shrink-0 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="p-4">
              {/* Profile Header */}
              <div className="flex flex-col items-center mb-6">
                {isLoading && !otherUser ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse mb-4" />
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                  </>
                ) : (
                  <>
                    {(otherUserWithProfile || otherUser)?.profile_image_url ? (
                      <img
                        src={(otherUserWithProfile || otherUser)?.profile_image_url}
                        alt={displayName}
                        className="w-24 h-24 rounded-full object-cover mb-4"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#CC0000] text-white flex items-center justify-center mb-4 text-2xl font-semibold">
                        {otherUserInitials}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {displayName}
                    </h3>
                    {kindbossingProfile?.business_name && (
                      <p className="text-sm text-gray-500 mb-4">
                        {kindbossingProfile.business_name}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Loading Skeleton for Right Panel */}
              {isLoading && !otherUser ? (
                <>
                  {/* Matched Job Titles Skeleton */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mb-3" />
                    <div className="flex flex-wrap gap-2">
                      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-24" />
                      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20" />
                    </div>
                  </div>

                  {/* Rating Skeleton */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mx-auto mb-2" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mx-auto" />
                  </div>

                  {/* Reviews Skeleton */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mb-3" />
                    <div className="space-y-3">
                      <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Matched Job Titles */}
                  {matchedJobTitles.length > 0 && (
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Matched
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {matchedJobTitles.map((title, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-200"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* KindBossing Profile Details */}
                  {kindbossingProfile && (
                    <>
                      {/* Rating */}
                      {kindbossingProfile.rating !== undefined && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <FaStar className="w-5 h-5 text-yellow-400" />
                            <span className="text-2xl font-semibold text-gray-900">
                              {kindbossingProfile.rating.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs text-center text-gray-500">
                            Average Rating
                          </p>
                        </div>
                      )}

                      {/* Reviews */}
                      {kindbossingProfile.reviews &&
                        kindbossingProfile.reviews.length > 0 && (
                          <div className="mb-6 pb-6 border-b border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                              Reviews
                            </h4>
                            <div className="space-y-3">
                              {kindbossingProfile.reviews
                                .slice(0, 3)
                                .map((review: string, index: number) => (
                                  <div
                                    key={index}
                                    className="bg-gray-50 p-3 rounded-lg"
                                  >
                                    <p className="text-sm text-gray-700">
                                      "{review}"
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </>
              )}

              {/* Action Buttons */}
              {isLoading && !otherUser ? (
                <div className="space-y-3">
                  <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleUnmatch}
                    className="w-full cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Unmatch
                  </button>
                  <button
                    onClick={handleBlock}
                    className="w-full cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => {
                      setShowMobilePanel(false);
                      setShowReportModal(true);
                    }}
                    className="w-full cursor-pointer px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Panel - Full Screen Overlay */}
          {showMobilePanel && (
            <div
              className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Header with Close Button */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                <button
                  onClick={() => setShowMobilePanel(false)}
                  className="p-2 cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <IoClose className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                {/* Profile Header */}
                <div className="flex flex-col items-center mb-6">
                  {(otherUserWithProfile || otherUser)?.profile_image_url ? (
                    <img
                      src={
                        (otherUserWithProfile || otherUser)?.profile_image_url
                      }
                      alt={displayName}
                      className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#CC0000] text-white flex items-center justify-center mb-4 text-2xl font-semibold">
                      {otherUserInitials}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {displayName}
                  </h3>
                  {kindbossingProfile?.business_name && (
                    <p className="text-sm text-gray-500 mb-4">
                      {kindbossingProfile.business_name}
                    </p>
                  )}
                </div>

                {/* Matched Job Titles */}
                {matchedJobTitles.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Matched
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {matchedJobTitles.map((title, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-200"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* KindBossing Profile Details */}
                {kindbossingProfile && (
                  <>
                    {/* Rating */}
                    {kindbossingProfile.rating !== undefined && (
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <FaStar className="w-5 h-5 text-yellow-400" />
                          <span className="text-2xl font-semibold text-gray-900">
                            {kindbossingProfile.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-center text-gray-500">
                          Average Rating
                        </p>
                      </div>
                    )}

                    {/* Reviews */}
                    {kindbossingProfile.reviews &&
                      kindbossingProfile.reviews.length > 0 && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">
                            Reviews
                          </h4>
                          <div className="space-y-3">
                            {kindbossingProfile.reviews
                              .slice(0, 3)
                              .map((review: string, index: number) => (
                                <div
                                  key={index}
                                  className="bg-gray-50 p-3 rounded-lg"
                                >
                                  <p className="text-sm text-gray-700">
                                    "{review}"
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleUnmatch}
                    className="w-full cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Unmatch
                  </button>
                  <button
                    onClick={handleBlock}
                    className="w-full cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full cursor-pointer px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Report {displayName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for reporting this user. Our team will
              review your report.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-lg resize-none outline-none focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason("");
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

