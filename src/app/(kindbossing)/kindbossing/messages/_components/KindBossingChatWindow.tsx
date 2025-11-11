"use client";

import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatUI } from "@/hooks/chats/useChatUI";
import LoadingSpinner from "@/components/loader/LoadingSpinner";
import { formatTimestamp, getStatusColor } from "@/utils/chatUtils";
import { createClient } from "@/utils/supabase/client";
import FileMessage from "@/app/matches/_components/FileMessage";
import EmojiPicker from "emoji-picker-react";
import { FileUploadService } from "@/services/client/FileUploadService";
import FileAttachmentModal from "@/app/matches/_components/FileAttachmentModal";
import ProfileSidePanel, { ProfileSidePanelSkeleton } from "./ProfileSidePanel";

// Helper function to get initials
const getInitials = (firstName: string = "", lastName: string = "") => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}` || "U";
};

// Avatar Component
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
  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }
  const initials = getInitials(firstName, lastName);
  let textSize = "text-xs";
  if (className.includes("w-40")) textSize = "text-5xl";
  else if (className.includes("w-32")) textSize = "text-4xl";
  else if (className.includes("w-10")) textSize = "text-base";
  else if (className.includes("w-8")) textSize = "text-sm";
  return (
    <div
      className={`${className} bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-semibold ${textSize}`}
    >
      {initials}
    </div>
  );
}

export default function KindBossingChatWindow({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const { user } = useAuthStore();

  const {
    selectedConversation,
    otherUser,
    isLoadingConversationDetails,
    messages,
    isLoadingMessages,
    messagesError,
    isLoadingMore,
    hasMore,
    loadMoreRef,
    loadMore,
    sendMessage: sendChatMessage,
    isSending,
    selectConversation,
  } = useChatUI({
    selectedConversationId: conversationId,
    autoMarkAsRead: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newMessageRef = useRef<HTMLInputElement>(null);
  const hasPrefetchedNextPageRef = useRef(false);
  const [newMessage, setNewMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [showProfileSidePanel, setShowProfileSidePanel] = useState(false);

  const currentUserId = user?.id;

  useEffect(() => {
    if (!conversationId) return;
    selectConversation(conversationId);
  }, [conversationId, selectConversation]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "instant",
        block: "end",
      });
    }
  }, [messages]);

  // Prefetch next page of messages in the background
  useEffect(() => {
    if (
      !isLoadingMessages &&
      messages.length > 0 &&
      hasMore &&
      !hasPrefetchedNextPageRef.current
    ) {
      hasPrefetchedNextPageRef.current = true;
      const t = setTimeout(() => {
        loadMore();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isLoadingMessages, messages.length, hasMore, loadMore]);

  const handleClose = useCallback(() => {
    router.push("/kindbossing/messages");
  }, [router]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || isSending) return;
    const text = newMessage.trim();
    await sendChatMessage(text);
    setNewMessage("");
    setEmojiPickerOpen(false);
  }, [isSending, sendChatMessage, newMessage]);

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setEmojiPickerOpen(false);
  };

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || !conversationId) return;

      try {
        const uploadedFiles = await FileUploadService.uploadMultipleFiles(
          files,
          conversationId,
          () => {}
        );

        for (let i = 0; i < uploadedFiles.length; i++) {
          const fileMetadata = uploadedFiles[i];
          await sendChatMessage(
            fileMetadata.fileName,
            fileMetadata.mimeType,
            fileMetadata.url
          );
        }
      } catch (error) {
        console.error("Error uploading files:", error);
      }
    },
    [conversationId, sendChatMessage]
  );

  const headerUser = useMemo(() => otherUser, [otherUser]);
  const profilePanelUser =
    !isLoadingConversationDetails &&
    otherUser &&
    (otherUser.role === "kindtao" || otherUser.role === "kindbossing")
      ? otherUser
      : null;
  const canShowProfilePanel = !!profilePanelUser;
  const shouldRenderDesktopSidePanel =
    isLoadingConversationDetails || canShowProfilePanel;

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (emojiPickerOpen && !target.closest(".emoji-picker-container")) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiPickerOpen]);

  return (
    <div className="flex-1 flex h-full min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 shrink-0 bg-white border-b border-gray-200">
          <div
            className={`flex items-center ${
              canShowProfilePanel
                ? "cursor-pointer lg:cursor-default"
                : "cursor-default"
            }`}
            onClick={() => {
              if (canShowProfilePanel) {
                setShowProfileSidePanel(true);
              }
            }}
          >
            {isLoadingConversationDetails ? (
              <div className="flex items-center">
                <div className="relative mr-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-gray-300" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Avatar
                    src={headerUser?.profile_image_url}
                    alt={`${headerUser?.first_name || ""} ${
                      headerUser?.last_name || ""
                    }`}
                    firstName={headerUser?.first_name || ""}
                    lastName={headerUser?.last_name || ""}
                    className="w-10 h-10 rounded-full"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                      false
                    )}`}
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-[clamp(0.663rem,0.8rem,0.9rem)] font-medium text-[#212529]">
                    {`${headerUser?.first_name || ""} ${
                      headerUser?.last_name || ""
                    }`}
                  </h3>
                  <p className="text-[clamp(0.663rem,0.8rem,0.9rem)] text-[#757589]">
                    Offline // ! is_online not implemented yet
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-[#f5f6f9] rounded hover:bg-gray-200 cursor-pointer transition-colors"
            title="Close chat"
          >
            <IoClose className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 bg-[#f5f6fa]">
          {isLoadingMessages && messages.length === 0 ? (
            <>
              {/* Chat message skeletons */}
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="bg-white rounded-2xl p-3 max-w-md">
                  <div className="h-3 bg-gray-200 rounded w-40 mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
                </div>
              </div>
              <div className="flex items-end justify-end gap-2">
                <div className="bg-[#f3f4f6] rounded-2xl p-3 max-w-md">
                  <div className="h-3 bg-gray-300 rounded w-48 mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-300 rounded w-72 animate-pulse" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
              </div>
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="bg-white rounded-2xl p-3 max-w-sm">
                  <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
                </div>
              </div>
            </>
          ) : messagesError ? (
            <div className="text-center text-[clamp(0.663rem,0.8rem,0.9rem)] text-red-500 py-4">
              Error loading messages: {messagesError.message}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-[clamp(0.663rem,0.8rem,0.9rem)] text-[#757589] py-4">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <>
              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="h-1 w-full"
                  onClick={() => loadMore()}
                >
                  {isLoadingMore && (
                    <LoadingSpinner
                      message="Loading older messages..."
                      size="sm"
                      variant="minimal"
                    />
                  )}
                </div>
              )}
              {messages.map((msg, index) => {
                const isSent = msg.sender_id === currentUserId;
                const sender = msg.sender;
                return (
                  <div
                    key={`${msg.id}-${index}`}
                    className={`flex items-end ${
                      isSent ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isSent && (
                      <Avatar
                        src={sender.profile_image_url}
                        alt={`${sender.first_name} ${sender.last_name}`}
                        firstName={sender.first_name}
                        lastName={sender.last_name}
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
                        className={`text-[clamp(0.663rem,0.8rem,0.9rem)] mt-1 pb-3 flex items-center justify-between gap-2 ${
                          isSent ? "text-white" : "text-[#757589]"
                        }`}
                      >
                        <span className="font-bold">{`${sender.first_name} ${sender.last_name}`}</span>
                        <span>{formatTimestamp(msg.created_at, "chat")}</span>
                      </p>

                      {msg.file_url && msg.message_type !== "text" ? (
                        <FileMessage
                          fileUrl={msg.file_url}
                          fileName={msg.content}
                          fileSize={0}
                          mimeType={msg.message_type}
                          isSent={isSent}
                        />
                      ) : (
                        <p className="text-[clamp(0.663rem,0.8rem,0.9rem)] whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>
                    {isSent && (
                      <Avatar
                        src={sender.profile_image_url}
                        alt={`${sender.first_name} ${sender.last_name}`}
                        firstName={sender.first_name}
                        lastName={sender.last_name}
                        className="w-8 h-8 rounded-full ml-2"
                      />
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <hr className="text-gray-200" />

        {/* Input */}
        <div className="p-3 flex items-center gap-2 bg-[#f5f6fa] relative shrink-0">
          {isSending && (
            <div className="absolute inset-0 bg-gray-300/30 backdrop-blur-[1px] z-10 rounded-lg" />
          )}
          {/* File attachment button */}
          <button
            onClick={() => setFileModalOpen(true)}
            disabled={isSending}
            className={`p-2 bg-[#f5f6f9] rounded hover:bg-gray-200 ${
              isSending ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            title="Attach files"
          >
            <img src="/icons/plus.png" alt="attach" className="w-4 h-4" />
          </button>

          {/* Message input */}
          <div className="flex-1 flex items-center px-2">
            <input
              type="text"
              placeholder="Type message here..."
              disabled={isSending}
              className={`flex-1 p-2 outline-none text-[clamp(0.663rem,0.8rem,0.9rem)] text-[#757589] ${
                isSending ? "opacity-50 cursor-not-allowed" : ""
              }`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isSending && handleSend()}
              onFocus={() => setEmojiPickerOpen(false)}
            />
            <div className="relative emoji-picker-container">
              <img
                src="/icons/emoji.png"
                alt="emoji"
                className={`w-4 h-4 ${
                  isSending ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
                onClick={() =>
                  !isSending && setEmojiPickerOpen(!emojiPickerOpen)
                }
              />
              {emojiPickerOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setEmojiPickerOpen(false)}
                  />
                  <div className="absolute bottom-8 -left-[300px] z-50 shadow-lg rounded-lg overflow-hidden">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={300}
                      height={400}
                      previewConfig={{
                        showPreview: false,
                      }}
                      skinTonesDisabled={true}
                      searchDisabled={false}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Send button */}
          <div
            className={`rounded-sm w-[40px] h-[40px] flex items-center justify-center cursor-pointer ${
              isSending || !newMessage.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500"
            }`}
            onClick={handleSend}
          >
            <img src="/icons/send.png" alt="send" className="w-3 h-4" />
          </div>
        </div>
      </div>

      {/* Desktop Side Panel - Visible on large screens only */}
      {shouldRenderDesktopSidePanel && (
        <div className="hidden lg:flex w-72 border-l border-gray-200 bg-white flex-col h-full">
          {isLoadingConversationDetails ? (
            <ProfileSidePanelSkeleton />
          ) : profilePanelUser ? (
            <ProfileSidePanel
              otherUser={profilePanelUser}
              onClose={() => setShowProfileSidePanel(false)}
            />
          ) : null}
        </div>
      )}

      {/* Mobile Side Panel Overlay */}
      {showProfileSidePanel && selectedConversation && profilePanelUser && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
            <button
              onClick={() => setShowProfileSidePanel(false)}
              className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Back to chat"
            >
              <IoClose className="text-gray-600 w-5 h-5" />
            </button>
            <h2 className="font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <ProfileSidePanel
              otherUser={profilePanelUser}
              onClose={() => setShowProfileSidePanel(false)}
            />
          </div>
        </div>
      )}

      {/* File Attachment Modal */}
      <FileAttachmentModal
        open={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        onFilesSelected={handleFileSelect}
        conversationId={conversationId}
      />
    </div>
  );
}
