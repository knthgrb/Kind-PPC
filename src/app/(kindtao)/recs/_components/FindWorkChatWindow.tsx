"use client";

import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatUI } from "@/hooks/chats/useChatUI";
import LoadingSpinner from "@/components/loader/LoadingSpinner";
import { formatTimestamp, getStatusColor } from "@/utils/chatUtils";
import { createClient } from "@/utils/supabase/client";

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
  const initials =
    `${(firstName || "").charAt(0).toUpperCase()}${(lastName || "")
      .charAt(0)
      .toUpperCase()}` || "U";
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

export default function FindWorkChatWindow({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const { user } = useAuthStore();

  const {
    selectedConversation,
    otherUser,
    messages,
    isLoadingMessages,
    messagesError,
    isLoadingMore,
    hasMore,
    loadMoreRef,
    loadMore,
    sendMessage,
    isSending,
    selectConversation,
  } = useChatUI({
    selectedConversationId: conversationId,
    autoMarkAsRead: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newMessageRef = useRef<HTMLInputElement>(null);
  const hasPrefetchedNextPageRef = useRef(false);

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

  // Prefetch next page of messages in the background once the first page is loaded
  useEffect(() => {
    if (
      !isLoadingMessages &&
      messages.length > 0 &&
      hasMore &&
      !hasPrefetchedNextPageRef.current
    ) {
      hasPrefetchedNextPageRef.current = true;
      // small delay to avoid competing with initial render work
      const t = setTimeout(() => {
        loadMore();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isLoadingMessages, messages.length, hasMore, loadMore]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleSend = useCallback(async () => {
    const input = newMessageRef.current;
    if (!input || !input.value.trim() || isSending) return;
    const text = input.value.trim();
    await sendMessage(text);
    input.value = "";
  }, [isSending, sendMessage]);

  const headerUser = useMemo(() => otherUser, [otherUser]);

  // Right panel profile data (guided by ChatUIClient)
  const [profileData, setProfileData] = useState<any>(null);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!otherUser?.id) return;
      setIsLoadingProfile(true);
      setProfileData(null);
      setWorkExperiences([]);
      setShowAllReviews(false);
      try {
        const supabase = createClient();
        const { data: userData } = await supabase
          .from("users")
          .select("barangay, municipality, province, date_of_birth, gender")
          .eq("id", otherUser.id)
          .single();

        if (otherUser.role === "kindtao") {
          const { data: kindtaoData } = await supabase
            .from("kindtaos")
            .select("*")
            .eq("user_id", otherUser.id)
            .single();
          const { data: experiences } = await supabase
            .from("kindtao_work_experiences")
            .select("*")
            .eq("kindtao_user_id", otherUser.id)
            .order("start_date", { ascending: false });
          if (kindtaoData)
            setProfileData({
              ...kindtaoData,
              userLocation: userData,
              isKindTao: true,
            });
          if (experiences) setWorkExperiences(experiences);
        } else if (otherUser.role === "kindbossing") {
          const { data: kindbossingData } = await supabase
            .from("kindbossings")
            .select("*")
            .eq("user_id", otherUser.id)
            .single();
          if (kindbossingData)
            setProfileData({
              ...kindbossingData,
              userLocation: userData,
              isKindBossing: true,
            });
        }
      } catch (_) {
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [otherUser?.id, otherUser?.role]);

  const normalizeString = (str?: string) =>
    (str || "")
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  // Mobile-only: show profile details panel when header name is clicked
  const [showProfileSidePanel, setShowProfileSidePanel] = useState(false);

  return (
    <div className="flex-1 flex h-full min-h-0">
      <div className="flex-1 flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between p-4 shrink-0 bg-white border-b border-gray-200">
          <div
            className="flex items-center cursor-pointer lg:cursor-default"
            onClick={() => setShowProfileSidePanel(true)}
          >
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
                Offline
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-[#f5f6f9] rounded hover:bg-gray-200 cursor-pointer transition-colors"
            title="Go to find work"
          >
            <IoClose className="w-4 h-4 text-gray-600" />
          </button>
        </div>

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
                        <span className="!font-bold">{`${sender.first_name} ${sender.last_name}`}</span>
                        <span>{formatTimestamp(msg.created_at, "chat")}</span>
                      </p>
                      <p className="text-[clamp(0.663rem,0.8rem,0.9rem)] whitespace-pre-wrap">
                        {msg.content}
                      </p>
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
        <div className="p-3 flex items-center gap-2 bg-[#f5f6fa] relative shrink-0">
          {isSending && (
            <div className="absolute inset-0 bg-gray-300/30 backdrop-blur-[1px] z-10 rounded-lg" />
          )}
          <div className="flex-1 flex items-center px-2">
            <input
              ref={newMessageRef}
              type="text"
              placeholder="Type message here..."
              disabled={isSending}
              className={`flex-1 p-2 outline-none text-[clamp(0.663rem,0.8rem,0.9rem)] text-[#757589] ${
                isSending ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onKeyDown={(e) => e.key === "Enter" && !isSending && handleSend()}
            />
          </div>
          <div
            className={`rounded-sm w-[40px] h-[40px] flex items-center justify-center cursor-pointer ${
              isSending ? "bg-gray-400 cursor-not-allowed" : "bg-red-500"
            }`}
            onClick={handleSend}
          >
            <img src="/icons/send.png" alt="send" className="w-3 h-4" />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-96 border-l border-gray-200 bg-white flex-col h-full min-h-0">
        <div className="p-4 border-b border-gray-100">
          <div className="w-full flex items-center justify-center mb-3">
            {!otherUser ? (
              <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse" />
            ) : (
              <Avatar
                src={otherUser.profile_image_url}
                alt={`${otherUser.first_name || ""} ${
                  otherUser.last_name || ""
                }`}
                firstName={otherUser.first_name || ""}
                lastName={otherUser.last_name || ""}
                className="w-32 h-32 rounded-full object-cover"
              />
            )}
          </div>
          <div className="mt-3">
            {!otherUser ? (
              <>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-gray-900">
                  {`${otherUser.first_name || ""} ${
                    otherUser.last_name || ""
                  }`.trim() || "User"}
                </h2>
                {profileData?.userLocation?.municipality ||
                profileData?.userLocation?.province ? (
                  <p className="text-sm text-gray-500">
                    {[
                      profileData?.userLocation?.municipality,
                      profileData?.userLocation?.province,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!otherUser || isLoadingMessages || isLoadingProfile ? (
            <>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse" />
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mt-6 mb-3 animate-pulse" />
              <div className="flex gap-2 flex-wrap">
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
            </>
          ) : (
            <>
              {profileData?.isKindBossing && profileData?.business_name && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Business
                  </h3>
                  <p className="text-sm text-gray-900">
                    {profileData.business_name}
                  </p>
                </div>
              )}

              {profileData?.isKindTao && profileData?.expected_salary_range && (
                <div className="space-y-2 border-t pt-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Expected Salary
                  </h3>
                  <p className="text-sm text-gray-900">
                    {profileData.expected_salary_range}
                  </p>
                </div>
              )}

              {profileData?.isKindTao &&
                profileData?.highest_educational_attainment && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Education
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900">
                        {profileData.highest_educational_attainment}
                      </p>
                      {profileData.is_verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                )}

              {profileData?.isKindTao &&
                Array.isArray(profileData?.skills) &&
                profileData.skills.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills
                        .slice(0, 6)
                        .map((s: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                          >
                            {normalizeString(s)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

              {profileData?.isKindTao &&
                Array.isArray(profileData?.languages) &&
                profileData.languages.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.languages.map(
                        (lang: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                          >
                            {normalizeString(lang)}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {profileData?.isKindTao && workExperiences.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Work Experience
                  </h3>
                  <div className="space-y-3">
                    {workExperiences
                      .slice(0, 3)
                      .map((exp: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900">
                            {exp.job_title}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {exp.employer}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(exp.start_date).toLocaleDateString()} -{" "}
                            {exp.is_current_job
                              ? "Present"
                              : exp.end_date
                              ? new Date(exp.end_date).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {((profileData?.rating ?? null) !== null ||
                (Array.isArray(profileData?.reviews) &&
                  profileData.reviews.length > 0)) && (
                <div className="space-y-3 pt-3 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Feedback
                  </h3>
                  {(profileData?.rating ?? null) !== null && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Rating
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-[#CC0000]">
                          {Number(profileData.rating).toFixed(1)}
                        </span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const rating = Number(profileData.rating) || 0;
                            const full = Math.floor(rating);
                            const half = rating % 1 >= 0.5;
                            if (i < full)
                              return (
                                <span
                                  key={i}
                                  className="text-yellow-500 text-lg"
                                >
                                  ★
                                </span>
                              );
                            if (i === full && half)
                              return (
                                <span key={i} className="relative inline-block">
                                  <span className="text-gray-300 text-lg">
                                    ☆
                                  </span>
                                  <span
                                    className="absolute left-0 top-0 text-yellow-500 text-lg overflow-hidden"
                                    style={{
                                      width: "50%",
                                      clipPath: "inset(0 50% 0 0)",
                                    }}
                                  >
                                    ★
                                  </span>
                                </span>
                              );
                            return (
                              <span key={i} className="text-gray-300 text-lg">
                                ☆
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {Array.isArray(profileData?.reviews) &&
                    profileData.reviews.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Reviews ({profileData.reviews.length})
                        </h3>
                        <div className="space-y-2">
                          {(showAllReviews
                            ? profileData.reviews
                            : profileData.reviews.slice(0, 3)
                          ).map((review: string, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700"
                            >
                              {review}
                            </div>
                          ))}
                          {profileData.reviews.length > 3 && (
                            <button
                              onClick={() => setShowAllReviews(!showAllReviews)}
                              className="w-full text-sm text-[#CC0000] hover:underline font-medium py-2"
                            >
                              {showAllReviews
                                ? "See less"
                                : `See all ${profileData.reviews.length} reviews`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Side Panel Overlay - shows profile details when name is tapped */}
      {showProfileSidePanel && otherUser && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[70] lg:hidden"
            onClick={() => setShowProfileSidePanel(false)}
          />
          <div className="fixed inset-y-0 right-0 w-80 bg-white z-[80] flex flex-col h-full shadow-xl lg:hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
              <h2 className="font-semibold text-gray-900">Profile</h2>
              <button
                onClick={() => setShowProfileSidePanel(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <IoClose className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="w-full flex items-center justify-center mb-3">
                  {!otherUser ? (
                    <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse" />
                  ) : (
                    <Avatar
                      src={otherUser.profile_image_url}
                      alt={`${otherUser.first_name || ""} ${
                        otherUser.last_name || ""
                      }`}
                      firstName={otherUser.first_name || ""}
                      lastName={otherUser.last_name || ""}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  )}
                </div>
                <div className="mt-3">
                  {!otherUser ? (
                    <>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <h2 className="text-base font-semibold text-gray-900">
                        {`${otherUser.first_name || ""} ${
                          otherUser.last_name || ""
                        }`.trim() || "User"}
                      </h2>
                      {profileData?.userLocation?.municipality ||
                      profileData?.userLocation?.province ? (
                        <p className="text-sm text-gray-500">
                          {[
                            profileData?.userLocation?.municipality,
                            profileData?.userLocation?.province,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!otherUser || isLoadingMessages || isLoadingProfile ? (
                  <>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse" />
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mt-6 mb-3 animate-pulse" />
                    <div className="flex gap-2 flex-wrap">
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
                      <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
                    {profileData?.isKindBossing &&
                      profileData?.business_name && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Business
                          </h3>
                          <p className="text-sm text-gray-900">
                            {profileData.business_name}
                          </p>
                        </div>
                      )}

                    {profileData?.isKindTao &&
                      profileData?.expected_salary_range && (
                        <div className="space-y-2 border-t pt-3">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                            Expected Salary
                          </h3>
                          <p className="text-sm text-gray-900">
                            {profileData.expected_salary_range}
                          </p>
                        </div>
                      )}

                    {profileData?.isKindTao &&
                      profileData?.highest_educational_attainment && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                            Education
                          </h3>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-900">
                              {profileData.highest_educational_attainment}
                            </p>
                            {profileData.is_verified && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {profileData?.isKindTao &&
                      Array.isArray(profileData?.skills) &&
                      profileData.skills.length > 0 && (
                        <div className="space-y-2 border-t pt-3">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                            Skills
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {profileData.skills
                              .slice(0, 6)
                              .map((s: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                                >
                                  {normalizeString(s)}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                    {profileData?.isKindTao &&
                      Array.isArray(profileData?.languages) &&
                      profileData.languages.length > 0 && (
                        <div className="space-y-2 border-t pt-3">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                            Languages
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {profileData.languages.map(
                              (lang: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                                >
                                  {normalizeString(lang)}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {profileData?.isKindTao && workExperiences.length > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Work Experience
                        </h3>
                        <div className="space-y-3">
                          {workExperiences
                            .slice(0, 3)
                            .map((exp: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-50 rounded-lg"
                              >
                                <h4 className="text-sm font-medium text-gray-900">
                                  {exp.job_title}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {exp.employer}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    exp.start_date
                                  ).toLocaleDateString()}{" "}
                                  - {""}
                                  {exp.is_current_job
                                    ? "Present"
                                    : exp.end_date
                                    ? new Date(
                                        exp.end_date
                                      ).toLocaleDateString()
                                    : ""}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {((profileData?.rating ?? null) !== null ||
                      (Array.isArray(profileData?.reviews) &&
                        profileData.reviews.length > 0)) && (
                      <div className="space-y-3 pt-3 border-t">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Feedback
                        </h3>
                        {(profileData?.rating ?? null) !== null && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                              Rating
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-[#CC0000]">
                                {Number(profileData.rating).toFixed(1)}
                              </span>
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => {
                                  const rating =
                                    Number(profileData.rating) || 0;
                                  const full = Math.floor(rating);
                                  const half = rating % 1 >= 0.5;
                                  if (i < full)
                                    return (
                                      <span
                                        key={i}
                                        className="text-yellow-500 text-lg"
                                      >
                                        ★
                                      </span>
                                    );
                                  if (i === full && half)
                                    return (
                                      <span
                                        key={i}
                                        className="relative inline-block"
                                      >
                                        <span className="text-gray-300 text-lg">
                                          ☆
                                        </span>
                                        <span
                                          className="absolute left-0 top-0 text-yellow-500 text-lg overflow-hidden"
                                          style={{
                                            width: "50%",
                                            clipPath: "inset(0 50% 0 0)",
                                          }}
                                        >
                                          ★
                                        </span>
                                      </span>
                                    );
                                  return (
                                    <span
                                      key={i}
                                      className="text-gray-300 text-lg"
                                    >
                                      ☆
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {Array.isArray(profileData?.reviews) &&
                          profileData.reviews.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                Reviews ({profileData.reviews.length})
                              </h3>
                              <div className="space-y-2">
                                {(showAllReviews
                                  ? profileData.reviews
                                  : profileData.reviews.slice(0, 3)
                                ).map((review: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700"
                                  >
                                    {review}
                                  </div>
                                ))}
                                {profileData.reviews.length > 3 && (
                                  <button
                                    onClick={() =>
                                      setShowAllReviews(!showAllReviews)
                                    }
                                    className="w-full text-sm text-[#CC0000] hover:underline font-medium py-2"
                                  >
                                    {showAllReviews
                                      ? "See less"
                                      : `See all ${profileData.reviews.length} reviews`}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
