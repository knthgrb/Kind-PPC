"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { JobPost } from "@/types/jobPosts";
import JobsCarousel from "./JobsCarousel";
import { JobService } from "@/services/client/JobService";
import { Filters } from "./FilterModal";
import FilterModal from "./FilterModal";
import JobPreferencesModal, {
  JobPreferences,
} from "@/components/modals/JobPreferencesModal";
import {
  FiFilter,
  FiMessageCircle,
  FiUsers,
  FiX,
  FiSettings,
} from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { useChatUI } from "@/hooks/chats/useChatUI";
import { useToastActions } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatTimestamp, getStatusColor } from "@/utils/chatUtils";
import { getOtherUser } from "@/utils/chatMessageUtils";
import type {
  ConversationWithDetails,
  User,
  MessageWithUser,
} from "@/types/chat";
import LoadingSpinner from "@/components/loader/LoadingSpinner";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { MatchToConversationService } from "@/services/client/MatchToConversationService";
import { MatchService } from "@/services/client/MatchService";

type MatchingScore = {
  jobId: string;
  score: number;
  reasons: string[];
  breakdown: {
    jobTypeMatch: number;
    locationMatch: number;
    salaryMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    availabilityMatch: number;
    ratingBonus: number;
    recencyBonus: number;
  };
};

type DesktopLayoutProps = {
  initialJobs: JobPost[];
  initialMatchingScores: MatchingScore[];
  provinces: string[];
  jobTypes: string[];
  initialFilters: Filters;
  initialSwipeLimit: {
    remainingSwipes: number;
    dailyLimit: number;
    canSwipe: boolean;
  };
  currentPlan: string;
  pageSize: number;
};


export default function DesktopLayout({
  initialJobs,
  initialMatchingScores,
  provinces,
  jobTypes,
  initialFilters,
  initialSwipeLimit,
  currentPlan,
  pageSize,
}: DesktopLayoutProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToastActions();
  // Overlay state removed when using parallel route interception
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<JobPost[]>(initialJobs);
  const [matchingScores, setMatchingScores] = useState<MatchingScore[]>(
    initialMatchingScores
  );
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showJobPreferencesModal, setShowJobPreferencesModal] = useState(false);
  const [jobPreferences, setJobPreferences] = useState<JobPreferences | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("matches");

  // Unread counts
  const { unreadCounts, refreshUnreadCounts } = useUnreadCounts();

  // Match-related state
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // KindTao profile state for the other user
  const [kindtaoProfile, setKindtaoProfile] = useState<any>(null);
  const [loadingKindtaoProfile, setLoadingKindtaoProfile] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Chat state
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Chat UI hook
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
  });

  const handleFilterChange = async (newFilters: Filters) => {
    setFilters(newFilters);
    setLoading(true);
    try {
      const filteredJobs = await JobService.fetchJobsClient({
        search: newFilters.search,
        province: newFilters.province,
        radius: newFilters.radius,
        jobType: newFilters.jobType,
        limit: 20,
        offset: 0,
      });
      setJobs(filteredJobs);
      // Reset matching scores for now - in a real app you'd recalculate them
      setMatchingScores([]);
    } catch (error) {
      console.error("Failed to filter jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data based on user role
  const fetchUserProfile = useCallback(
    async (userId: string) => {
      if (!userId) return;

      setLoadingKindtaoProfile(true);
      try {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();

        // First, check if the other user is a kindbossing user
        // Check by comparing with user id in conversation
        const isKindBossing = otherUser?.role === "kindbossing";

        if (isKindBossing) {
          // Fetch KindBossing profile
          const { data: kindbossingData, error: kindbossingError } =
            await supabase
              .from("kindbossings")
              .select("*")
              .eq("user_id", userId)
              .single();

          // Fetch user location info
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("barangay, municipality, province, date_of_birth, gender")
            .eq("id", userId)
            .single();

          if (!kindbossingError && kindbossingData) {
            setKindtaoProfile({
              ...kindbossingData,
              isKindBossing: true,
              userLocation: userData,
            });
          }
        } else {
          // Fetch KindTao profile
          const { data: kindtaoData, error: kindtaoError } = await supabase
            .from("kindtaos")
            .select("*")
            .eq("user_id", userId)
            .single();

          // Fetch job preferences
          const { data: jobPrefs, error: prefError } = await supabase
            .from("kindtao_job_preferences")
            .select("*")
            .eq("kindtao_user_id", userId)
            .single();

          // Fetch user location info
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("barangay, municipality, province, date_of_birth, gender")
            .eq("id", userId)
            .single();

          if (!kindtaoError && kindtaoData) {
            setKindtaoProfile({
              ...kindtaoData,
              jobPreferences: jobPrefs,
              userLocation: userData,
              isKindBossing: false,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setLoadingKindtaoProfile(false);
      }
    },
    [otherUser]
  );

  // Chat functions
  const handleConversationSelect = useCallback(
    (conversationId: string) => {
      router.push(`/messages/${conversationId}`);
      refreshUnreadCounts();
    },
    [router, refreshUnreadCounts]
  );

  const handleCloseChat = useCallback(() => {
    setSelectedConversationId(null);
    selectConversation(null);
    setActiveTab("matches"); // Switch back to matches tab
  }, [selectConversation]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversationId || isSending) return;

    try {
      await sendChatMessage(newMessage.trim());
      setNewMessage("");
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Switch to messages tab after sending
      setActiveTab("messages");

      // Refresh unread counts after sending message
      refreshUnreadCounts();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [
    newMessage,
    selectedConversationId,
    isSending,
    sendChatMessage,
    refreshUnreadCounts,
  ]);

  // Handle match click - open chat (navigate to messages)
  const handleMatchClick = useCallback(
    async (match: any) => {
      try {
        // Mark match as inactive (opened)
        await MatchService.markMatchAsInactive(match.id);

        // Get or create conversation for this match
        const result = await MatchToConversationService.getOrCreateConversation(
          match.id
        );

        if (result.success && result.conversationId) {
          router.push(`/messages/${result.conversationId}`);
          refreshUnreadCounts();
        } else {
          console.error("Failed to create conversation:", result.error);
        }
      } catch (error) {
        console.error("Failed to open match chat:", error);
      }
    },
    [router, refreshUnreadCounts]
  );

  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewMessage(e.target.value);

      // Auto-resize
      const textarea = e.target;
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max height in pixels (about 5-6 lines)

      if (scrollHeight <= maxHeight) {
        textarea.style.height = `${scrollHeight}px`;
      } else {
        textarea.style.height = `${maxHeight}px`;
      }
    },
    []
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load matches when component mounts
  useEffect(() => {
    const loadMatches = async () => {
      if (!user?.id) return;

      setMatchesLoading(true);
      try {
        const userMatches = await MatchService.getUserMatches(user.id);

        // Fetch job details for each match
        const matchesWithJobs = await Promise.all(
          userMatches.map(async (match) => {
            try {
              const jobDetails = await JobService.fetchById(match.job_post_id);
              return {
                ...match,
                job_title: jobDetails?.title || "Unknown Job",
                job_location: jobDetails?.location || "Unknown Location",
              };
            } catch (error) {
              console.error(
                "Failed to fetch job details for match:",
                match.id,
                error
              );
              return {
                ...match,
                job_title: "Unknown Job",
                job_location: "Unknown Location",
              };
            }
          })
        );

        setMatches(matchesWithJobs);

        // Refresh unread counts after loading matches
        refreshUnreadCounts();
      } catch (error) {
        console.error("Failed to load matches:", error);
      } finally {
        setMatchesLoading(false);
      }
    };

    loadMatches();
  }, [user?.id, refreshUnreadCounts]);

  // Fetch profile when other user changes
  useEffect(() => {
    if (otherUser?.id && user?.id && otherUser.id !== user.id) {
      fetchUserProfile(otherUser.id);
    }
  }, [otherUser?.id, user?.id, fetchUserProfile]);

  // Memoize sorted conversations
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aTime = new Date(a.last_message_at || a.created_at).getTime();
      const bTime = new Date(b.last_message_at || b.created_at).getTime();
      return bTime - aTime;
    });
  }, [conversations]);

  // Use real unread counts
  const newMatchesCount = unreadCounts.newMatches;
  const newMessagesCount = unreadCounts.unreadMessages;

  // Helper function to get user initials
  const getInitials = (firstName: string = "", lastName: string = "") => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return `${first}${last}` || "U";
  };

  // Helper component to render avatar with initials fallback
  const Avatar = ({
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
    // Extract base classes and ensure rounded-full is always applied
    const baseClasses = className.includes("w-")
      ? className
          .split(/\s+/)
          .filter(
            (c) =>
              c.startsWith("w-") || c.startsWith("h-") || c === "object-cover"
          )
          .join(" ") + " rounded-full"
      : className;

    if (src) {
      return <img src={src} alt={alt} className={baseClasses} />;
    }
    const initials = getInitials(firstName, lastName);

    // Determine text size based on avatar size
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
        className={`${baseClasses} bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-semibold ${textSize}`}
      >
        {initials}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row overflow-hidden h-[calc(100vh-8vh)] bg-gray-50">
      {/* Sidebar removed in this layout to avoid redundancy. */}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {activeTab === "matches" ? (
          /* Job Cards Area */
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Job Swiper - Full Height */}
            <div className="flex-1 flex items-center justify-center p-1 md:p-4">
              <div className="w-full max-w-sm md:max-w-md h-full flex items-center justify-center">
                <JobsCarousel
                  jobs={jobs}
                  matchingScores={matchingScores}
                  initialSwipeLimit={initialSwipeLimit}
                  onOpenFilters={() => setShowFilterModal(true)}
                  onOpenJobPreferences={() => setShowJobPreferencesModal(true)}
                />
              </div>
            </div>
          </div>
        ) : activeTab === "messages" &&
          selectedConversationId &&
          selectedConversation ? (
          /* Chat Interface */
          <div className="flex-1 flex h-full">
            {/* Left: Chat Column */}
            <div className="flex-1 flex flex-col h-full">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 shrink-0 bg-white border-b border-gray-200">
                <div className="flex items-center">
                  <div className="relative">
                    <Avatar
                      src={otherUser?.profile_image_url}
                      alt={`${otherUser?.first_name} ${otherUser?.last_name}`}
                      firstName={otherUser?.first_name || ""}
                      lastName={otherUser?.last_name || ""}
                      className="w-10 h-10 rounded-full"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                        false
                      )}`}
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {`${otherUser?.first_name} ${otherUser?.last_name}`}
                    </h3>
                    <p className="text-xs text-gray-500">Offline</p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleCloseChat}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Close chat and return to job matches"
                >
                  <IoClose className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f5f6fa]">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="sm" variant="minimal" />
                  </div>
                ) : messagesError ? (
                  <div className="text-center text-red-500 py-4">
                    Error loading messages: {messagesError.message}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FiMessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {/* Load more trigger for infinite scroll */}
                    {hasMore && (
                      <div
                        ref={loadMoreRef}
                        className="h-1 w-full"
                        onClick={() => loadMore()}
                      >
                        {isLoadingMore && (
                          <LoadingSpinner size="sm" variant="minimal" />
                        )}
                      </div>
                    )}

                    {messages.map((msg, index) => {
                      const isSent = msg.sender_id === user?.id;
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
                              firstName={sender.first_name || ""}
                              lastName={sender.last_name || ""}
                              className="w-8 h-8 rounded-full mr-2 object-cover"
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
                              className={`text-sm mt-1 pb-3 flex items-center justify-between gap-2 ${
                                isSent ? "text-white" : "text-[#757589]"
                              }`}
                            >
                              <span className="font-bold">{`${sender.first_name} ${sender.last_name}`}</span>
                              <span>
                                {formatTimestamp(msg.created_at, "chat")}
                              </span>
                            </p>
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                          {isSent && (
                            <Avatar
                              src={sender.profile_image_url}
                              alt={`${sender.first_name} ${sender.last_name}`}
                              firstName={sender.first_name || ""}
                              lastName={sender.last_name || ""}
                              className="w-8 h-8 rounded-full ml-2 object-cover"
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

              {/* Message Input */}
              <div className="p-3 flex items-center gap-2 bg-[#f5f6fa] relative shrink-0">
                {isSending && (
                  <div className="absolute inset-0 bg-gray-300/30 backdrop-blur-[1px] z-10 rounded-lg" />
                )}

                <div className="flex-1 flex items-center bg-white rounded-lg px-3 py-2 border border-gray-200">
                  <textarea
                    ref={textareaRef}
                    placeholder="Type message here... (Shift+Enter for new line)"
                    disabled={isSending}
                    rows={1}
                    className={`flex-1 outline-none text-sm text-[#757589] resize-none overflow-y-auto ${
                      isSending ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{
                      minHeight: "20px",
                      maxHeight: "120px",
                    }}
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={isSending || !newMessage.trim()}
                  className={`rounded-lg w-[40px] h-[40px] flex items-center justify-center ${
                    isSending || !newMessage.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 cursor-pointer"
                  }`}
                >
                  <img src="/icons/send.png" alt="send" className="w-3 h-4" />
                </button>
              </div>
              {/* Close left chat column */}
            </div>

            {/* Right: Profile Panel */}
            <aside className="w-72 border-l border-gray-200 bg-white flex flex-col h-full">
              {/* Profile header */}
              <div className="p-4 border-b border-gray-100">
                <div className="w-full flex items-center justify-center">
                  <Avatar
                    src={otherUser?.profile_image_url}
                    alt={`${otherUser?.first_name || ""} ${
                      otherUser?.last_name || ""
                    }`}
                    firstName={otherUser?.first_name || ""}
                    lastName={otherUser?.last_name || ""}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                </div>
                <div className="mt-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    {`${otherUser?.first_name || ""} ${
                      otherUser?.last_name || ""
                    }`.trim() || "User"}
                  </h2>
                  {otherUser?.city || otherUser?.province ? (
                    <p className="text-sm text-gray-500">
                      {[otherUser?.city, otherUser?.province]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Profile info */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingKindtaoProfile ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]"></div>
                  </div>
                ) : (
                  <>
                    {/* Show KindBossing or KindTao specific content */}
                    {kindtaoProfile?.isKindBossing ? (
                      /* KindBossing Profile */
                      <>
                        {/* Business Name */}
                        {kindtaoProfile?.business_name && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FiUsers className="w-4 h-4 text-gray-500" />
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Business
                              </h3>
                            </div>
                            <p className="text-sm text-gray-800 font-medium">
                              {kindtaoProfile.business_name}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      /* KindTao Profile */
                      <>
                        {/* Looking for */}
                        {kindtaoProfile?.jobPreferences?.desired_jobs &&
                          kindtaoProfile.jobPreferences.desired_jobs.length >
                            0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <FiUsers className="w-4 h-4 text-gray-500" />
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                  Looking for
                                </h3>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {kindtaoProfile.jobPreferences.desired_jobs
                                  .slice(0, 3)
                                  .map((job: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full"
                                    >
                                      {job}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                      </>
                    )}

                    {/* Show KindTao-specific fields only for KindTao users */}
                    {!kindtaoProfile?.isKindBossing && (
                      <>
                        {/* Skills */}
                        {kindtaoProfile?.skills &&
                          kindtaoProfile.skills.length > 0 && (
                            <div className="space-y-2 border-t pt-3">
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                Skills
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {kindtaoProfile.skills
                                  .slice(0, 6)
                                  .map((skill: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}

                        {/* Languages */}
                        {kindtaoProfile?.languages &&
                          kindtaoProfile.languages.length > 0 && (
                            <div className="space-y-2 border-t pt-3">
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                Languages
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {kindtaoProfile.languages.map(
                                  (lang: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                                    >
                                      {lang}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Expected Salary */}
                        {kindtaoProfile?.expected_salary_range && (
                          <div className="space-y-2 border-t pt-3">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                              Expected Salary
                            </h3>
                            <p className="text-sm text-gray-800">
                              {kindtaoProfile.expected_salary_range}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Rating & Reviews */}
                    {(kindtaoProfile?.rating !== null &&
                      kindtaoProfile?.rating !== undefined) ||
                    (kindtaoProfile?.reviews &&
                      kindtaoProfile.reviews.length > 0) ? (
                      <div className="space-y-3 border-t pt-3">
                        {kindtaoProfile?.rating !== null &&
                          kindtaoProfile?.rating !== undefined && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                Rating
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-[#CC0000]">
                                  {kindtaoProfile.rating.toFixed(1)}
                                </span>
                                <div className="flex text-yellow-500">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i}>
                                      {i < Math.round(kindtaoProfile.rating)
                                        ? "★"
                                        : "☆"}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Reviews */}
                        {kindtaoProfile?.reviews &&
                          kindtaoProfile.reviews.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                Reviews ({kindtaoProfile.reviews.length})
                              </h3>
                              <div className="space-y-2">
                                {(showAllReviews
                                  ? kindtaoProfile.reviews
                                  : kindtaoProfile.reviews.slice(0, 3)
                                ).map((review: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700"
                                  >
                                    {review}
                                  </div>
                                ))}
                                {kindtaoProfile.reviews.length > 3 && (
                                  <button
                                    onClick={() =>
                                      setShowAllReviews(!showAllReviews)
                                    }
                                    className="w-full text-sm text-[#CC0000] hover:underline font-medium py-2"
                                  >
                                    {showAllReviews
                                      ? "See less"
                                      : `See all ${kindtaoProfile.reviews.length} reviews`}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : null}
                  </>
                )}

                {/* Actions - Only show if we have user data */}
                {otherUser && (
                  <div className="pt-4 space-y-2">
                    <button
                      type="button"
                      className="w-full py-2.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      onClick={() => console.log("Unmatch clicked")}
                    >
                      Unmatch
                    </button>
                    <button
                      type="button"
                      className="w-full py-2.5 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      onClick={() => console.log("Block clicked")}
                    >
                      Block User
                    </button>
                    <button
                      type="button"
                      className="w-full py-2.5 text-sm font-medium rounded-lg bg-white text-red-600 hover:bg-gray-50 transition-colors border border-red-200"
                      onClick={() => console.log("Report clicked")}
                    >
                      Report User
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        ) : activeTab === "messages" ? (
          /* Show job swipe UI when no conversation is selected in messages tab */
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Job Swiper - Full Height */}
            <div className="flex-1 flex items-center justify-center p-1 md:p-4">
              <div className="w-full max-w-sm md:max-w-md h-full flex items-center justify-center">
                <JobsCarousel
                  jobs={jobs}
                  matchingScores={matchingScores}
                  initialSwipeLimit={initialSwipeLimit}
                  onOpenFilters={() => setShowFilterModal(true)}
                  onOpenJobPreferences={() => setShowJobPreferencesModal(true)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Job Preferences Modal */}
      <JobPreferencesModal
        isOpen={showJobPreferencesModal}
        onClose={() => setShowJobPreferencesModal(false)}
        onSave={(preferences) => {
          setJobPreferences(preferences);
          // TODO: Apply job preferences to filter jobs
          console.log("Job preferences saved:", preferences);
        }}
        initialPreferences={jobPreferences || undefined}
      />

    </div>
  );
}
