"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { LuSearch } from "react-icons/lu";
import { FaChevronLeft } from "react-icons/fa";
import LimitAlertModal from "@/components/LimitAlertModal";
import { useChatUI } from "@/hooks/useChatUI";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarMonitoring } from "@/hooks/useSidebarMonitoring";
import { ChatService } from "@/services/chat/chatService";
import { RealtimeService } from "@/services/chat/realtimeService";
import type {
  ConversationWithDetails,
  User,
  MessageWithUser,
} from "@/types/chat";

const formatSidebarTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffHours < 24) return `${diffHours} hrs ago`;
  return `${diffDays} days ago`;
};

// Utility: Format chat timestamp
const formatChatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(
    2,
    "0"
  )} ${date.getHours() >= 12 ? "PM" : "AM"}`;
};

const getStatusColor = (isOnline: boolean): string => {
  return isOnline ? "bg-green-500" : "bg-gray-400";
};

export default function ChatUI() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Get conversation ID from URL params
  const conversationId = params.conversationId as string;
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(conversationId || null);

  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the chat UI hook
  const {
    conversations,
    isLoadingConversations,
    conversationsError,
    selectedConversation,
    otherUser,
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMore,
    messagesError,
    loadMoreRef,
    loadMore,
    sendMessage: sendChatMessage,
    isSending,
    sendError,
    selectConversation,
  } = useChatUI({
    selectedConversationId,
    autoMarkAsRead: true,
    autoRefreshConversations: false, // Disable auto-refresh to prevent auth spikes
  });

  // Debug: Log what we're getting from useChatUI

  // Separate loading states to prevent flickering
  const isInitialLoading =
    isLoadingConversations || (isLoadingMessages && messages.length === 0);
  const isSidebarLoading = isLoadingConversations;

  // Use sidebar monitoring hook
  const { sidebarData, refreshSidebar, updateSelectedConversationSidebar } =
    useSidebarMonitoring({
      conversations,
      selectedConversationId,
    });

  // Sort conversations by latest message timestamp only
  const sortedConversations = [...conversations].sort((a, b) => {
    // Use local timestamp if available, otherwise use database timestamp
    const aTime =
      sidebarData.conversationTimestamps.get(a.id) ||
      new Date(a.last_message_at || a.created_at).getTime();
    const bTime =
      sidebarData.conversationTimestamps.get(b.id) ||
      new Date(b.last_message_at || b.created_at).getTime();
    return bTime - aTime; // Most recent first
  });

  // Ref to track last processed message to prevent infinite loops
  const lastProcessedMessageRef = useRef<string | null>(null);

  // Update sidebar when messages change in the selected conversation
  useEffect(() => {
    if (messages.length > 0 && selectedConversationId) {
      const latestMessage = messages[messages.length - 1];

      // Check if we've already processed this message
      if (lastProcessedMessageRef.current === latestMessage.id) {
        return; // Already processed, skip
      }

      // Mark this message as processed
      lastProcessedMessageRef.current = latestMessage.id;

      // Convert MessageWithUser to ChatMessage format for sidebar update
      const chatMessage = {
        id: latestMessage.id,
        content: latestMessage.content,
        user: {
          id: latestMessage.sender_id,
          name: `${latestMessage.sender.first_name} ${latestMessage.sender.last_name}`,
          avatar: latestMessage.sender.profile_image_url,
        },
        createdAt: latestMessage.created_at,
        conversationId: latestMessage.conversation_id,
      };

      updateSelectedConversationSidebar(selectedConversationId, chatMessage);
    }
  }, [messages, selectedConversationId]); // Remove updateSelectedConversationSidebar from dependencies

  // Reset processed message ref when conversation changes
  useEffect(() => {
    lastProcessedMessageRef.current = null;
  }, [selectedConversationId]);

  // Update selected conversation when URL changes
  useEffect(() => {
    if (conversationId && conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
      selectConversation(conversationId);
    }
  }, [conversationId, selectedConversationId, selectConversation]);

  // Set default conversation based on last sent message
  useEffect(() => {
    const setDefaultConversation = async () => {
      if (
        !conversationId &&
        !selectedConversationId &&
        conversations.length > 0 &&
        user?.id
      ) {
        try {
          // Get the conversation where user last sent a message
          const lastSentConversation =
            await ChatService.getLastSentConversation(user.id);

          let defaultConversationId: string;

          if (lastSentConversation) {
            // Check if the last sent conversation still exists in current conversations
            const existsInCurrent = conversations.find(
              (c) => c.id === lastSentConversation.conversation_id
            );
            defaultConversationId = existsInCurrent
              ? lastSentConversation.conversation_id
              : conversations[0].id;
          } else {
            // If no messages sent, use the first conversation
            defaultConversationId = conversations[0].id;
          }

          setSelectedConversationId(defaultConversationId);
          selectConversation(defaultConversationId);
          // Redirect to the default conversation
          router.push(`/chats/${defaultConversationId}`);
        } catch (error) {
          console.error("Error getting last sent conversation:", error);
          // Fallback to first conversation
          const firstConversationId = conversations[0].id;
          setSelectedConversationId(firstConversationId);
          selectConversation(firstConversationId);
          router.push(`/chats/${firstConversationId}`);
        }
      }
    };

    setDefaultConversation();
  }, [
    conversations,
    selectedConversationId,
    selectConversation,
    conversationId,
    router,
    user?.id,
  ]);

  // Auto-scroll to bottom when new messages arrive (not when loading older messages)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const isLoadingOlderMessagesRef = useRef(false);

  // Track when we're loading older messages to prevent auto-scroll
  useEffect(() => {
    if (isLoadingMore) {
      isLoadingOlderMessagesRef.current = true;
    } else {
      // Reset the flag after loading is complete
      const timer = setTimeout(() => {
        isLoadingOlderMessagesRef.current = false;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMore]);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. We should auto-scroll (user hasn't scrolled up)
    // 2. New messages were added (not loading older ones)
    // 3. Not currently loading more messages
    // 4. Not in the process of loading older messages
    const shouldAutoScrollNow =
      shouldAutoScroll &&
      messages.length > lastMessageCount &&
      !isLoadingMore &&
      !isLoadingOlderMessagesRef.current &&
      messagesEndRef.current;

    if (shouldAutoScrollNow && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "instant",
        block: "end",
      });
    }
    setLastMessageCount(messages.length);
  }, [messages, shouldAutoScroll, isLoadingMore, lastMessageCount]);

  // Track if user has scrolled up to disable auto-scroll when loading older messages
  useEffect(() => {
    const messagesContainer = document.querySelector(".overflow-y-auto");
    if (!messagesContainer) {
      console.warn("Messages container not found for scroll detection");
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      setShouldAutoScroll(isAtBottom);
      console.log(
        "Scroll detected - isAtBottom:",
        isAtBottom,
        "shouldAutoScroll:",
        isAtBottom
      );
    };

    messagesContainer.addEventListener("scroll", handleScroll);
    return () => messagesContainer.removeEventListener("scroll", handleScroll);
  }, []);

  // Cleanup realtime subscriptions on unmount
  useEffect(() => {
    return () => {
      // Cleanup all realtime channels when component unmounts
      RealtimeService.cleanup();
    };
  }, []);

  // Function to update URL when conversation is selected
  const updateUrlWithConversation = useCallback(
    (conversationId: string) => {
      router.push(`/chats/${conversationId}`, { scroll: false });
    },
    [router]
  );

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || isSending) return;

    try {
      await sendChatMessage(newMessage.trim());
      setNewMessage("");
      // Refresh conversations to update ordering
      refreshSidebar();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Get the active user (other user in the conversation)
  const activeUser = otherUser || {
    id: "",
    first_name: "Select a conversation",
    last_name: "",
    profile_image_url: "/people/user-profile.png",
    last_active: new Date().toISOString(),
  };

  // Get current user
  const currentUser = user || {
    id: "",
    first_name: "User",
    last_name: "",
    profile_image_url: "/people/user-profile.png",
  };

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-5xl xl:max-w-7xl shadow-xl/20 rounded-xl relative">
      {/* Loading overlay - only show for initial load */}
      {isInitialLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      )}

      <div className="flex h-[85vh]">
        {/* Sidebar */}
        <div
          className={`w-64 p-3 flex-col shadow-[2px_0_3px_-2px_rgba(0,0,0,0.25)] z-20
        ${sidebarOpen ? "flex" : "hidden"} md:flex`}
        >
          {/* Search */}
          <div className="flex items-center gap-2 mb-3 bg-[#eeeef1] px-3 py-2 rounded-lg border border-dashed border-gray-300">
            <LuSearch className="text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search here..."
              className="flex-1 bg-transparent text-[0.669rem] text-[#55585b] outline-none"
            />
          </div>
          <p className="text-[0.663rem] text-[#8D8D8D] mb-2">Recent Chats</p>

          <div className="overflow-y-auto">
            {isSidebarLoading ? (
              <div className="text-center text-[0.663rem] text-[#757589] py-4">
                Loading...
              </div>
            ) : conversationsError ? (
              <div className="text-center text-[0.663rem] text-red-500 py-4">
                Error loading conversations: {conversationsError.message}
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="text-center text-[0.663rem] text-[#757589] py-4">
                No conversations yet
              </div>
            ) : (
              sortedConversations.map((conversation) => {
                const otherUser =
                  conversation.matches.kindbossing_id === currentUser.id
                    ? conversation.matches.kindtao
                    : conversation.matches.kindbossing;

                const isActive = selectedConversationId === conversation.id;
                const unreadCount =
                  sidebarData.unreadCounts.get(conversation.id) || 0;
                const hasUnread = unreadCount > 0 && !isActive; // Don't show unread for active conversation
                const lastMessageText =
                  sidebarData.lastMessages.get(conversation.id) ||
                  "No messages yet";

                // Get timestamp from our monitoring data or fallback to conversation data
                const lastMessageTimestamp =
                  sidebarData.conversationTimestamps.get(conversation.id)
                    ? new Date(
                        sidebarData.conversationTimestamps.get(conversation.id)!
                      ).toISOString()
                    : conversation.last_message_at;

                return (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      // Allow conversation change even while loading
                      setSelectedConversationId(conversation.id);
                      selectConversation(conversation.id);
                      updateUrlWithConversation(conversation.id);
                      setSidebarOpen(false); // close on mobile
                    }}
                    className={`flex items-center p-2 mb-2 cursor-pointer border-b border-[#DCDCE2] hover:bg-gray-200 ${
                      isActive ? "bg-[#f0e7f2]" : ""
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={
                          otherUser.profile_image_url ||
                          "/people/user-profile.png"
                        }
                        alt={`${otherUser.first_name} ${otherUser.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                          false // TODO: Implement online status
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
                        className={`text-[0.663rem] font-medium text-[#212529] truncate ${
                          hasUnread ? "font-bold" : ""
                        }`}
                      >
                        {`${otherUser.first_name} ${otherUser.last_name}`}
                      </h4>
                      <p
                        className={`text-[0.663rem] text-[#757589] truncate ${
                          hasUnread ? "font-bold" : ""
                        }`}
                      >
                        {lastMessageText}
                      </p>
                    </div>
                    <span className="text-[0.663rem] text-[#757589] ml-1 whitespace-nowrap">
                      {lastMessageTimestamp
                        ? formatSidebarTime(lastMessageTimestamp)
                        : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 flex-shrink-0">
            <div className="flex items-center">
              {/* Mobile back/hamburger */}
              <button
                className="md:hidden mr-3"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <FaChevronLeft className="text-gray-600 w-4 h-4" />
              </button>
              <div className="relative">
                <img
                  src={
                    activeUser.profile_image_url || "/people/user-profile.png"
                  }
                  alt={`${activeUser.first_name} ${activeUser.last_name}`}
                  className="w-10 h-10 rounded-full"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                    false // TODO: Implement online status
                  )}`}
                />
              </div>
              <div className="ml-3">
                <h3 className="text-[0.663rem] font-medium text-[#212529]">
                  {`${activeUser.first_name} ${activeUser.last_name}`}
                </h3>
                <p className="text-[0.663rem] text-[#757589]">Offline</p>
              </div>
            </div>

            {/* Right action icons */}
            <div className="flex items-center gap-2">
              <div
                className="p-2 bg-[#f5f6f9] rounded hover:bg-gray-200 cursor-pointer"
                onClick={() => setModalOpen(true)}
              >
                <img src="/icons/info.png" alt="info" className="w-4 h-4" />
              </div>
              <div
                className="p-2 bg-[#f5f6f9] rounded hover:bg-gray-200 cursor-pointer"
                onClick={() => setModalOpen(true)}
              >
                <img src="/icons/menubar.png" alt="menu" className="w-4 h-4" />
              </div>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f5f6fa] mr-1 mb-2 min-h-0">
            {isLoadingMessages && messages.length === 0 ? (
              <div className="text-center text-[0.663rem] text-[#757589] py-4">
                Loading messages...
              </div>
            ) : messagesError ? (
              <div className="text-center text-[0.663rem] text-red-500 py-4">
                Error loading messages: {messagesError.message}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-[0.663rem] text-[#757589] py-4">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <>
                {/* Load more trigger for infinite scroll */}
                {hasMore && (
                  <div
                    ref={loadMoreRef}
                    data-load-more
                    className="text-center py-2"
                  >
                    {isLoadingMore ? (
                      <div className="text-[0.663rem] text-[#757589]">
                        Loading older messages...
                      </div>
                    ) : (
                      <div className="text-[0.663rem] text-[#757589]">
                        <button
                          onClick={loadMore}
                          className="text-blue-500 hover:text-blue-700 underline"
                        >
                          Load older messages
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((msg, index) => {
                  const isSent = msg.sender_id === currentUser.id;
                  const sender = msg.sender;

                  return (
                    <div
                      key={`${msg.id}-${index}`}
                      className={`flex items-end ${
                        isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isSent && (
                        <img
                          src={
                            sender.profile_image_url ||
                            "/people/user-profile.png"
                          }
                          alt={`${sender.first_name} ${sender.last_name}`}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      <div
                        className={`p-3 rounded-2xl max-w-3xl ${
                          isSent
                            ? "bg-[#CC0000] text-white rounded"
                            : "bg-white text-[#757589] rounded"
                        }`}
                      >
                        <p
                          className={`text-[0.663rem] mt-1 pb-3 flex items-center justify-between gap-2 ${
                            isSent ? "text-white" : "text-[#757589]"
                          }`}
                        >
                          <span className="!font-bold">{`${sender.first_name} ${sender.last_name}`}</span>
                          <span>{formatChatTime(msg.created_at)}</span>
                        </p>

                        <p className="text-[0.663rem]">{msg.content}</p>
                      </div>
                      {isSent && (
                        <img
                          src={
                            sender.profile_image_url ||
                            "/people/user-profile.png"
                          }
                          alt={`${sender.first_name} ${sender.last_name}`}
                          className="w-8 h-8 rounded-full ml-2"
                        />
                      )}
                    </div>
                  );
                })}
                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          <hr className="text-gray-200" />
          {/* Input */}
          <div className="p-3 flex items-center gap-2 bg-[#f5f6fa]">
            {/* plus icon */}
            <img
              src="/icons/plus.png"
              alt="plus"
              className="ml-2 w-4 h-4 cursor-pointer"
            />

            {/* message input */}
            <div className="flex-1 flex items-center px-2">
              <input
                type="text"
                placeholder="Type message here..."
                className="flex-1 p-2 outline-none text-[0.663rem] text-[#757589]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <img
                src="/icons/emoji.png"
                alt="emoji"
                className="w-4 h-4 cursor-pointer"
              />
            </div>

            {/* send icon */}
            <div
              className={`rounded-sm w-[40px] h-[40px] flex items-center justify-center cursor-pointer ${
                isSending || !newMessage.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500"
              }`}
              onClick={sendMessage}
            >
              <img src="/icons/send.png" alt="send" className="w-3 h-4" />
            </div>
          </div>
        </div>
      </div>

      <LimitAlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAction={() => {
          setModalOpen(false);
        }}
        plan="Silver Plan"
      />
    </div>
  );
}
