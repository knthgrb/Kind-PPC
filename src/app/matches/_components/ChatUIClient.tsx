"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { FaChevronLeft } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import {
  FiMessageCircle,
  FiUsers,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";
import BlockUserModal from "./BlockUserModal";
import ReportUserModal, { ReportData } from "./ReportUserModal";
import FileAttachmentModal from "./FileAttachmentModal";
import FileMessage from "./FileMessage";
import LoadingSpinner from "@/components/loader/LoadingSpinner";
import JobsCarousel from "@/app/(kindtao)/recs/_components/JobsCarousel";
import { JobService } from "@/services/client/JobService";
import { SwipeService } from "@/services/client/SwipeService";
import { useAuthStore } from "@/stores/useAuthStore";
import ChatSkeleton from "@/components/common/ChatSkeleton";
import MessageSkeleton from "@/components/common/MessageSkeleton";
import { FileUploadService } from "@/services/client/FileUploadService";
import { useChatUI } from "@/hooks/chats/useChatUI";
import { useSidebarMonitoring } from "@/hooks/chats/useSidebarMonitoring";
import { useToast } from "@/contexts/ToastContext";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { ChatService } from "@/services/client/ChatService";
import { RealtimeService } from "@/services/client/realtimeService";
import { BlockingService } from "@/services/client/BlockingService";
import { ReportingService } from "@/services/client/reportingService";
import { MatchService } from "@/services/client/MatchService";
import { UserService } from "@/services/client/UserService";
import StartConversationModal from "@/components/modals/StartConversationModal";
import { formatTimestamp, getStatusColor } from "@/utils/chatUtils";
import type {
  ConversationWithDetails,
  User,
  MessageWithUser,
} from "@/types/chat";
import type { SidebarData } from "@/hooks/chats/useSidebarMonitoring";
import { getOtherUser } from "@/utils/chatMessageUtils";
import type { User as AuthUser } from "@/types/user";
import { createClient } from "@/utils/supabase/client";

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
      className={`${className} bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-semibold ${textSize}`}
    >
      {initials}
    </div>
  );
};

// Helper function to normalize snake_case to Title Case
const normalizeString = (str: string) => {
  if (!str) return "";
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Profile Side Panel Component
const ProfileSidePanel = ({
  otherUser,
  onClose,
}: {
  otherUser: User;
  onClose?: () => void;
}) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!otherUser?.id) return;

      // Reset state when user changes to prevent stale data
      setProfileData(null);
      setWorkExperiences([]);
      setShowAllReviews(false);
      setLoading(true);

      try {
        const supabase = createClient();

        // Fetch user location
        const { data: userData } = await supabase
          .from("users")
          .select("barangay, municipality, province, date_of_birth, gender")
          .eq("id", otherUser.id)
          .single();

        if (otherUser?.role === "kindtao") {
          // Fetch KindTao profile
          const { data: kindtaoData } = await supabase
            .from("kindtaos")
            .select("*")
            .eq("user_id", otherUser.id)
            .single();

          // Fetch work experiences
          const { data: experiences } = await supabase
            .from("kindtao_work_experiences")
            .select("*")
            .eq("kindtao_user_id", otherUser.id)
            .order("start_date", { ascending: false });

          if (kindtaoData) {
            setProfileData({
              ...kindtaoData,
              userLocation: userData,
              isKindTao: true,
            });
          }

          if (experiences) {
            setWorkExperiences(experiences);
          }
        } else if (otherUser?.role === "kindbossing") {
          // Fetch KindBossing profile
          const { data: kindbossingData } = await supabase
            .from("kindbossings")
            .select("*")
            .eq("user_id", otherUser.id)
            .single();

          if (kindbossingData) {
            setProfileData({
              ...kindbossingData,
              userLocation: userData,
              isKindBossing: true,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [otherUser?.id, otherUser?.role]); // Only depend on otherUser.id and role, not the whole object

  if (loading) {
    return (
      <div className="h-full flex flex-col animate-pulse">
        {/* Profile header skeleton */}
        <div className="p-4 border-b border-gray-100">
          <div className="w-full flex items-center justify-center mb-3">
            <div className="w-32 h-32 rounded-full bg-gray-200" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>

        {/* Profile info skeleton */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Business Name skeleton (for KindBossing) */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>

          {/* Expected Salary skeleton (for KindTao) */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>

          {/* Educational Attainment skeleton */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>

          {/* Skills skeleton */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="h-6 bg-gray-200 rounded w-20" />
              ))}
            </div>
          </div>

          {/* Languages skeleton */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="flex flex-wrap gap-2">
              {[1, 2].map((idx) => (
                <div key={idx} className="h-6 bg-gray-200 rounded w-24" />
              ))}
            </div>
          </div>

          {/* Work Experience skeleton */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="space-y-3">
              {[1, 2].map((idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* Rating skeleton */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="flex items-center gap-2">
              <div className="h-8 bg-gray-200 rounded w-12" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="w-5 h-5 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="h-10 bg-gray-200 rounded-lg" />
          <div className="h-10 bg-gray-200 rounded-lg" />
          <div className="h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Profile header */}
      <div className="p-4 border-b border-gray-100">
        <div className="w-full flex items-center justify-center mb-3">
          <UserAvatar
            src={otherUser?.profile_image_url}
            alt={`${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`}
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
        </div>
      </div>

      {/* Profile info - scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Business Name (for KindBossing) */}
        {profileData?.isKindBossing && profileData?.business_name && (
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Business Name
            </h3>
            <p className="text-sm text-gray-900">{profileData.business_name}</p>
          </div>
        )}

        {/* Expected Salary (for KindTao) */}
        {profileData?.isKindTao && profileData?.expected_salary_range && (
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Expected Salary
            </h3>
            <p className="text-sm text-gray-900">
              {profileData.expected_salary_range}
            </p>
          </div>
        )}

        {/* Educational Attainment (for KindTao) */}
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

        {/* Skills (for KindTao) */}
        {profileData?.isKindTao &&
          profileData?.skills &&
          profileData.skills.length > 0 && (
            <div className="space-y-2 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.skills
                  .slice(0, 6)
                  .map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                    >
                      {normalizeString(skill)}
                    </span>
                  ))}
              </div>
            </div>
          )}

        {/* Languages (for KindTao) */}
        {profileData?.isKindTao &&
          profileData?.languages &&
          profileData.languages.length > 0 && (
            <div className="space-y-2 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.languages.map((lang: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                  >
                    {normalizeString(lang)}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Work Experience (for KindTao) */}
        {profileData?.isKindTao && workExperiences.length > 0 && (
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Work Experience
            </h3>
            <div className="space-y-3">
              {workExperiences.slice(0, 3).map((exp: any, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900">
                    {exp.job_title}
                  </h4>
                  <p className="text-xs text-gray-600">{exp.employer}</p>
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

        {/* Rating & Reviews (for both KindTao and KindBossing) */}
        {(profileData?.rating !== null && profileData?.rating !== undefined) ||
        (profileData?.reviews && profileData.reviews.length > 0) ? (
          <div className="space-y-3 pt-3">
            {profileData?.rating !== null &&
              profileData?.rating !== undefined && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Rating
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#CC0000]">
                      {profileData.rating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => {
                        const starValue = i + 1;
                        const rating = profileData.rating;
                        const fullStars = Math.floor(rating);
                        const hasHalfStar = rating % 1 >= 0.5;
                        if (starValue <= fullStars) {
                          return (
                            <span key={i} className="text-yellow-500 text-lg">
                              ★
                            </span>
                          );
                        } else if (starValue === fullStars + 1 && hasHalfStar) {
                          return (
                            <span key={i} className="relative inline-block">
                              <span className="text-gray-300 text-lg">☆</span>
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
                        }
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
            {profileData?.reviews && profileData.reviews.length > 0 && (
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
        ) : null}

        {/* Actions - positioned dynamically after content */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <button
            type="button"
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-[#CC0000] text-white hover:bg-red-700 transition-colors"
          >
            Unmatch
          </button>
          <button
            type="button"
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
          >
            Block
          </button>
          <button
            type="button"
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-white text-red-600 hover:bg-gray-50 transition-colors border border-red-200"
          >
            Report
          </button>
        </div>
      </div>
    </div>
  );
};

// Utility functions moved to src/utils/chatUtils.ts

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
    is_verified: false, // Default value
    verification_status: authUser.user_metadata.verification_status,
    subscription_tier: authUser.user_metadata.subscription_tier,
    subscription_expires_at: null, // Default value
    swipe_credits: authUser.user_metadata.swipe_credits,
    boost_credits: authUser.user_metadata.boost_credits,
    last_active: new Date().toISOString(), // Default value
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: authUser.updated_at || new Date().toISOString(),
  };
}

// Memoized conversation item component to prevent unnecessary re-renders
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

function ChatUIClient({
  conversationId: propConversationId,
  showSidebar = true,
}: { conversationId?: string; showSidebar?: boolean } = {}) {
  const { user } = useAuthStore();
  const userMetadata = user?.user_metadata;
  const { showToast } = useToast();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileSidePanel, setShowProfileSidePanel] = useState(false); // For mobile side panel
  const [modalOpen, setModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Block and Report modals
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Emoji picker
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  // File attachment
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Matches
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [userRole, setUserRole] = useState<"kindbossing" | "kindtao" | null>(
    null
  );
  const [swipeJobs, setSwipeJobs] = useState<any[]>([]);
  const [swipeLimitStatus, setSwipeLimitStatus] = useState<{
    remainingSwipes: number;
    dailyLimit: number;
    canSwipe: boolean;
  }>({ remainingSwipes: 0, dailyLimit: 10, canSwipe: false });

  useEffect(() => {
    if (!user?.id || userRole !== "kindtao") return;
    (async () => {
      try {
        const [jobs, limit] = await Promise.all([
          JobService.fetchMatchedJobsClient(user.id, 20, 0),
          SwipeService.getSwipeLimitStatus(user.id),
        ]);
        setSwipeJobs(jobs || []);
        setSwipeLimitStatus(limit);
      } catch {}
    })();
  }, [user?.id, userRole]);
  const [recipientName, setRecipientName] = useState<string>("");

  // Tab state
  const [activeTab, setActiveTab] = useState<"matches" | "messages">("matches");

  // Unread counts
  const { unreadCounts } = useUnreadCounts();

  // Expanded job folders state
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

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

  // Get conversation ID from props or URL params
  const conversationId =
    propConversationId || (params.conversationId as string);
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
    refreshConversations,
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

  // Load user role and matches (guarded to avoid duplicate run on StrictMode initial mount)
  const lastLoadKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      try {
        setMatchesLoading(true);

        // Get user role
        const { role } = await UserService.getCurrentUserRole();
        setUserRole(role === "admin" ? null : role);

        // Get user matches
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

        setMatches(filteredMatches);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setMatchesLoading(false);
      }
    };

    // Build a stable key based on user id and conversation IDs only.
    // This prevents reruns with identical inputs (e.g., StrictMode double-invoke)
    const key = `${user?.id || ""}|${conversations
      .map((c) => c.id)
      .sort()
      .join(",")}`;
    if (lastLoadKeyRef.current === key) {
      return; // skip duplicate run
    }
    lastLoadKeyRef.current = key;
    loadUserData();
  }, [user?.id, conversations]);

  // Separate loading states to prevent flickering
  const isInitialLoading =
    isLoadingConversations || (isLoadingMessages && messages.length === 0);
  // Only show sidebar skeleton on initial load (when no conversations exist yet)
  // When a conversation is selected, don't show skeleton in sidebar - only in chatbox
  const isSidebarLoading = useMemo(() => {
    // Only show skeleton if:
    // 1. Conversations are loading AND we don't have any conversations yet
    // 2. Don't show skeleton when a conversation is selected (switching conversations)
    return isLoadingConversations && conversations.length === 0;
  }, [isLoadingConversations, conversations.length]);

  // Match-related functions
  const handleSendMessage = async (match: any) => {
    setSelectedMatch(match);
    setIsMatchModalOpen(true);

    // Don't fetch recipient name - keep it generic in modal
    setRecipientName("this user");
  };

  const getRecipientName = async (match: any) => {
    if (!userRole) return "Unknown User";

    try {
      // Import the server action
      const { getMultipleUsers } = await import(
        "@/actions/user/get-multiple-users"
      );

      // Determine which user ID to fetch based on current user's role
      const recipientId =
        userRole === "kindtao"
          ? match.kindbossing_user_id
          : match.kindtao_user_id;

      // Fetch user details
      const { data: userResults, error } = await getMultipleUsers([
        recipientId,
      ]);

      if (error || !userResults || userResults.length === 0) {
        return userRole === "kindtao" ? "KindBossing User" : "KindTao User";
      }

      const user = userResults[0].user;
      if (!user) {
        return userRole === "kindtao" ? "KindBossing User" : "KindTao User";
      }

      const firstName = user.user_metadata?.first_name || "";
      const lastName = user.user_metadata?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();

      return (
        fullName ||
        (userRole === "kindtao" ? "KindBossing User" : "KindTao User")
      );
    } catch (error) {
      console.error("Error fetching recipient name:", error);
      return userRole === "kindtao" ? "KindBossing User" : "KindTao User";
    }
  };

  const handleSendFirstMessage = async (message: string) => {
    if (!user?.id || !selectedMatch) return;

    setIsCreatingConversation(true);
    try {
      // Check if conversation already exists for this match
      const existingConversation = conversations.find(
        (conv) =>
          conv.matches &&
          ((conv.matches.kindbossing_user_id ===
            selectedMatch.kindbossing_user_id &&
            conv.matches.kindtao_user_id === selectedMatch.kindtao_user_id) ||
            (conv.matches.kindbossing_user_id ===
              selectedMatch.kindtao_user_id &&
              conv.matches.kindtao_user_id ===
                selectedMatch.kindbossing_user_id))
      );

      let conversationId: string;

      if (existingConversation) {
        // Navigate to existing conversation
        conversationId = existingConversation.id;
      } else {
        // Create new conversation using the match ID
        const conversation = await ChatService.createConversation(
          selectedMatch.id
        );

        if (!conversation) {
          throw new Error("Failed to create conversation");
        }

        conversationId = conversation.id;

        // Send the first message
        const sentMessage = await ChatService.sendMessage(
          conversation.id,
          user.id,
          message,
          "text"
        );

        console.log("Message sent successfully:", sentMessage);

        // Small delay to ensure message is saved
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Mark match as inactive so it doesn't show in the matches list anymore
      await MatchService.markMatchAsInactive(selectedMatch.id);

      // Remove the match from local state to update UI immediately
      setMatches((prev) => prev.filter((m) => m.id !== selectedMatch.id));

      // Switch to messages tab first
      setActiveTab("messages");

      // Navigate to conversation (this will trigger the useEffect to set selectedConversationId)
      router.push(`/kindtao/messages/${conversationId}`);

      // Refresh conversations after navigation
      await refreshConversations();
    } catch (error) {
      console.error("Error creating conversation:", error);
      showToast("Failed to start conversation. Please try again.", "error");
    } finally {
      setIsCreatingConversation(false);
      setIsMatchModalOpen(false);
      setSelectedMatch(null);
    }
  };

  const handleCloseMatchModal = () => {
    setIsMatchModalOpen(false);
    setSelectedMatch(null);
    setRecipientName("");
  };

  // Use sidebar monitoring hook
  const {
    sidebarData,
    refreshSidebar,
    updateSelectedConversationSidebar,
    isInitialDataLoading,
  } = useSidebarMonitoring({
    conversations,
    selectedConversationId,
  });

  // Only show full loading skeleton on initial load, not when switching conversations
  // Use useMemo to prevent unnecessary recalculations
  const shouldShowFullLoading = useMemo(() => {
    // Only show full loading if:
    // 1. Conversations are loading AND we don't have any conversations yet
    // 2. OR initial data is loading (first time)
    // Don't show full loading when switching between conversations
    return (
      (isLoadingConversations && conversations.length === 0) ||
      (isInitialDataLoading && conversations.length === 0)
    );
  }, [isLoadingConversations, conversations.length, isInitialDataLoading]);

  // Memoize sorted conversations to prevent unnecessary re-sorting
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      // Use local timestamp if available, otherwise use database timestamp
      const aTime =
        sidebarData.conversationTimestamps.get(a.id) ||
        new Date(a.last_message_at || a.created_at).getTime();
      const bTime =
        sidebarData.conversationTimestamps.get(b.id) ||
        new Date(b.last_message_at || b.created_at).getTime();
      return bTime - aTime; // Most recent first
    });
  }, [conversations, sidebarData.conversationTimestamps]);

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
          avatar: latestMessage.sender.profile_image_url || undefined,
        },
        createdAt: latestMessage.created_at,
        conversationId: latestMessage.conversation_id,
        messageType: latestMessage.message_type || "text",
        fileUrl: latestMessage.file_url,
      };

      updateSelectedConversationSidebar(selectedConversationId, chatMessage);
    }
  }, [messages, selectedConversationId]); // Remove updateSelectedConversationSidebar from dependencies

  // Reset processed message ref when conversation changes
  useEffect(() => {
    lastProcessedMessageRef.current = null;
  }, [selectedConversationId]);

  // Update selected conversation when URL changes (with ref to prevent double renders)
  const lastConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      conversationId &&
      conversationId !== selectedConversationId &&
      conversationId !== lastConversationIdRef.current
    ) {
      lastConversationIdRef.current = conversationId;
      setSelectedConversationId(conversationId);
      selectConversation(conversationId);
    } else if (!conversationId && selectedConversationId) {
      // Reset when conversationId is cleared
      lastConversationIdRef.current = null;
      setSelectedConversationId(null);
      selectConversation(null);
    }
  }, [conversationId, selectedConversationId, selectConversation]);

  // Removed auto-selection of default conversation - user should select manually
  // This allows the initial state to have no conversation selected

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
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      setShouldAutoScroll(isAtBottom);
    };

    messagesContainer.addEventListener("scroll", handleScroll);
    return () => messagesContainer.removeEventListener("scroll", handleScroll);
  }, []);

  // Cleanup realtime subscriptions on unmount and periodic cleanup
  useEffect(() => {
    // Periodic cleanup of expired subscriptions
    const cleanupInterval = setInterval(() => {
      if (RealtimeService.cleanupExpiredSubscriptions) {
        RealtimeService.cleanupExpiredSubscriptions();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      clearInterval(cleanupInterval);
      // Cleanup all realtime channels when component unmounts
      if (RealtimeService.cleanup) {
        RealtimeService.cleanup();
      }
    };
  }, []);

  // Function to update URL when conversation is selected
  const updateUrlWithConversation = useCallback(
    (conversationId: string) => {
      const basePath =
        userRole === "kindbossing"
          ? "/kindbossing/messages"
          : "/kindtao/messages";
      router.push(`${basePath}/${conversationId}`, { scroll: false });
    },
    [router, userRole]
  );

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || isSending) return;

    try {
      await sendChatMessage(newMessage.trim());
      setNewMessage("");
      setEmojiPickerOpen(false); // Close emoji picker after sending
      // Sidebar will be updated automatically via the useEffect that watches messages
    } catch (error) {
      // Show error notification for blocked user
      if (error instanceof Error && error.message.includes("blocked user")) {
        showToast("Cannot send message to blocked user", "error");
      }
    }
  };

  // Handle emoji selection from the emoji picker
  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setEmojiPickerOpen(false);
  };

  // Handle file selection and upload
  const handleFileSelect = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      if (!selectedConversationId) {
        showToast("Please select a conversation first.", "error");
        return;
      }

      try {
        const uploadedFiles = await FileUploadService.uploadMultipleFiles(
          files,
          selectedConversationId,
          (progress) => {}
        );

        for (let i = 0; i < uploadedFiles.length; i++) {
          const fileMetadata = uploadedFiles[i];
          await sendChatMessage(
            fileMetadata.fileName,
            fileMetadata.mimeType,
            fileMetadata.url
          );
        }

        setSelectedFiles([]);
      } catch (error) {
        showToast("Failed to upload files. Please try again.", "error");
      }
    },
    [selectedConversationId, sendChatMessage, showToast]
  );

  // Block user handler
  const handleBlockUser = async () => {
    if (!user?.id || !otherUser || !selectedConversationId) return;

    setIsBlocking(true);
    try {
      await BlockingService.blockUser({
        blockerId: user.id,
        blockedUserId: otherUser.id,
        conversationId: selectedConversationId,
        blockerName: `${userMetadata?.first_name || ""} ${
          userMetadata?.last_name || ""
        }`.trim(),
        blockedUserName: `${otherUser.first_name || ""} ${
          otherUser.last_name || ""
        }`.trim(),
      });

      // Close modal and redirect to messages list
      setBlockModalOpen(false);
      showToast("User has been blocked successfully", "success");
      router.push("/messages");
    } catch (error) {
      showToast("Failed to block user. Please try again.", "error");
    } finally {
      setIsBlocking(false);
    }
  };

  // Report user handler
  const handleReportUser = async (reportData: ReportData) => {
    if (!user?.id || !otherUser || !selectedConversationId) return;

    setIsReporting(true);
    try {
      await ReportingService.reportUser({
        reporterId: user.id,
        reportedUserId: otherUser.id,
        reportData,
        reporterName: `${userMetadata?.first_name || ""} ${
          userMetadata?.last_name || ""
        }`.trim(),
        reportedUserName: `${otherUser.first_name || ""} ${
          otherUser.last_name || ""
        }`.trim(),
        conversationId: selectedConversationId,
      });

      // Close modal
      setReportModalOpen(false);
      showToast("Your report has been submitted successfully.", "success");
    } catch (error) {
      showToast("Failed to submit report. Please try again.", "error");
    } finally {
      setIsReporting(false);
    }
  };

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

  // Memoize user objects to prevent unnecessary re-renders
  const activeUser = useMemo(() => {
    return (
      otherUser || {
        id: "",
        first_name: "Select a conversation",
        last_name: "",
        profile_image_url: "/people/user-profile.png",
        last_active: new Date().toISOString(),
      }
    );
  }, [otherUser]);

  const currentUser = useMemo(() => {
    return (
      user || {
        id: "",
        first_name: "User",
        last_name: "",
        profile_image_url: "/people/user-profile.png",
      }
    );
  }, [user]);

  return (
    <div className="h-[calc(100vh-8vh)] w-full flex flex-col">
      {/* Show skeleton when both sidebar and chat window are loading */}
      {shouldShowFullLoading ? (
        <ChatSkeleton
          hasSelectedConversation={!!selectedConversationId}
          showSwipeSkeletonWhenEmpty={userRole === "kindtao"}
        />
      ) : (
        <>
          <div className="flex flex-1 h-full overflow-hidden relative">
            {/* Sidebar - can be hidden when used in intercepted overlay */}
            {showSidebar && (
              <div
                className={`absolute inset-0 flex flex-col shadow-[2px_0_3px_-2px_rgba(0,0,0,0.25)] z-20 h-full bg-white
        md:static md:w-80 md:flex
        ${sidebarOpen || !selectedConversationId ? "flex" : "hidden md:flex"}`}
              >
                <div className="flex flex-col h-full">
                  {/* Tabs */}
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
                      /* Matches Tab Content */
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
                        <div className="space-y-2">
                          {Array.from(groupedMatches.entries()).map(
                            ([jobTitle, jobMatches]) => {
                              const isExpanded = expandedJobs.has(jobTitle);
                              return (
                                <div
                                  key={jobTitle}
                                  className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                                >
                                  {/* Job Folder Header */}
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

                                  {/* Job Matches */}
                                  {isExpanded && (
                                    <div className="border-t border-gray-200 bg-gray-50">
                                      {jobMatches.map((match) => (
                                        <div
                                          key={match.id}
                                          onClick={() =>
                                            handleSendMessage(match)
                                          }
                                          className="flex items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                                        >
                                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3 shrink-0">
                                            <FiUsers className="w-4 h-4 text-gray-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-medium text-[#212529] truncate">
                                              {userRole === "kindtao"
                                                ? `KindBossing User`
                                                : "KindTao User"}
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
                    ) : /* Messages Tab Content */
                    isSidebarLoading ? (
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
                              selectedConversationId={selectedConversationId}
                              onSelect={(id) => {
                                setSelectedConversationId(id);
                                selectConversation(id);
                                updateUrlWithConversation(id);
                                setSidebarOpen(false); // close on mobile
                              }}
                            />
                          )
                      )
                    )}
                  </div>
                </div>
                {/* Close sidebar wrapper */}
              </div>
            )}

            {/* Chat Window - Show when there's a selected conversation, otherwise show empty state */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedConversationId && selectedConversation ? (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 shrink-0 bg-white border-b border-gray-200">
                      <div className="flex items-center">
                        {/* Mobile back/hamburger */}
                        <button
                          className="md:hidden mr-3"
                          onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                          <FaChevronLeft className="text-gray-600 w-4 h-4" />
                        </button>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => {
                            if (
                              otherUser?.role === "kindtao" ||
                              otherUser?.role === "kindbossing"
                            ) {
                              setShowProfileSidePanel(true);
                            }
                          }}
                        >
                          <div className="relative">
                            <UserAvatar
                              src={activeUser.profile_image_url}
                              alt={`${activeUser.first_name} ${activeUser.last_name}`}
                              firstName={activeUser.first_name}
                              lastName={activeUser.last_name}
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
                              {`${activeUser.first_name} ${activeUser.last_name}`}
                            </h3>
                            <p className="text-[clamp(0.663rem,0.8rem,0.9rem)] text-[#757589]">
                              Offline // ! is_online not implemented yet
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Close button only */}
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            // Navigate based on user role
                            if (userRole === "kindtao") {
                              router.push("/recs");
                            } else if (userRole === "kindbossing") {
                              // For kindbossing users, navigate to messages page
                              setSelectedConversationId(null);
                              selectConversation(null);
                              router.push("/kindbossing/messages");
                            } else {
                              // For other users, close the chat
                              setSelectedConversationId(null);
                              selectConversation(null);
                            }
                          }}
                          className="p-2 bg-[#f5f6f9] rounded hover:bg-gray-200 cursor-pointer transition-colors"
                          title={
                            userRole === "kindbossing"
                              ? "Close chat"
                              : "Go to find work"
                          }
                        >
                          <IoClose className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f5f6fa]">
                      {isLoadingMessages && messages.length === 0 ? (
                        <LoadingSpinner
                          message="Loading messages..."
                          size="sm"
                          variant="minimal"
                        />
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
                          {/* Load more trigger for infinite scroll - invisible sentinel */}
                          {hasMore && (
                            <div
                              ref={loadMoreRef}
                              data-load-more
                              className="h-1 w-full"
                              style={{ minHeight: "1px" }}
                              onClick={() => {
                                loadMore();
                              }}
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
                                  <UserAvatar
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
                                    <span className="font-bold!">{`${sender.first_name} ${sender.last_name}`}</span>
                                    <span>
                                      {formatTimestamp(msg.created_at, "chat")}
                                    </span>
                                  </p>

                                  {msg.file_url &&
                                  msg.message_type !== "text" ? (
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
                                  <UserAvatar
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
                          {/* Auto-scroll anchor */}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>
                    <hr className="text-gray-200" />
                    {/* Input */}
                    <div className="p-3 flex items-center gap-2 bg-[#f5f6fa] relative shrink-0">
                      {/* Disable overlay when sending */}
                      {isSending && (
                        <div className="absolute inset-0 bg-gray-300/30 backdrop-blur-[1px] z-10 rounded-lg" />
                      )}
                      {/* File attachment button */}
                      <button
                        onClick={() => setFileModalOpen(true)}
                        disabled={isSending}
                        className={`p-2 bg-[#f5f6f9] rounded hover:bg-gray-200 ${
                          isSending
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                        title="Attach files"
                      >
                        <img
                          src="/icons/plus.png"
                          alt="attach"
                          className="w-4 h-4"
                        />
                      </button>

                      {/* message input */}
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
                          onKeyDown={(e) =>
                            e.key === "Enter" && !isSending && sendMessage()
                          }
                          onFocus={() => setEmojiPickerOpen(false)}
                        />
                        <div className="relative emoji-picker-container">
                          <img
                            src="/icons/emoji.png"
                            alt="emoji"
                            className={`w-4 h-4 ${
                              isSending
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer"
                            }`}
                            onClick={() =>
                              !isSending && setEmojiPickerOpen(!emojiPickerOpen)
                            }
                          />
                          {emojiPickerOpen && (
                            <>
                              {/* Dark overlay */}
                              <div
                                className="fixed inset-0 bg-black/20 z-40"
                                onClick={() => setEmojiPickerOpen(false)}
                              />
                              {/* Emoji picker positioned to the left of the emoji icon */}
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

                      {/* send icon */}
                      <div
                        className={`rounded-sm w-[40px] h-[40px] flex items-center justify-center cursor-pointer ${
                          isSending || !newMessage.trim()
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-500"
                        }`}
                        onClick={sendMessage}
                      >
                        <img
                          src="/icons/send.png"
                          alt="send"
                          className="w-3 h-4"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* When no conversation is selected */
                  <>
                    {/* Desktop: show the same swipe UI used in /recs for KindTao */}
                    {userRole === "kindtao" ? (
                      <div className="hidden lg:flex flex-1 flex-col overflow-hidden relative bg-gray-50">
                        <div className="flex-1 flex items-center justify-center p-1 md:p-4">
                          <div className="w-full max-w-sm md:max-w-md h-full flex items-center justify-center">
                            <JobsCarousel
                              jobs={swipeJobs}
                              matchingScores={[]}
                              initialSwipeLimit={swipeLimitStatus}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-gray-400">💬</span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Select a conversation
                          </h3>
                          <p className="text-gray-500">
                            Choose a conversation from the sidebar to start
                            chatting
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Desktop Side Panel - Visible on large screens only */}
              {selectedConversationId &&
                selectedConversation &&
                otherUser &&
                (otherUser.role === "kindtao" ||
                  otherUser.role === "kindbossing") && (
                  <div className="hidden lg:flex w-72 border-l border-gray-200 bg-white flex-col h-full">
                    <ProfileSidePanel
                      otherUser={otherUser}
                      onClose={() => setShowProfileSidePanel(false)}
                    />
                  </div>
                )}
            </div>

            {/* Mobile Side Panel Overlay - Outside the main flex container */}
            {showProfileSidePanel &&
              selectedConversationId &&
              selectedConversation &&
              otherUser &&
              (otherUser.role === "kindtao" ||
                otherUser.role === "kindbossing") && (
                <>
                  {/* Overlay backdrop */}
                  <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setShowProfileSidePanel(false)}
                  />
                  {/* Side Panel */}
                  <div className="fixed inset-y-0 right-0 w-80 bg-white z-50 flex flex-col h-full shadow-xl lg:hidden">
                    {/* Close button for mobile */}
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                      <h2 className="font-semibold text-gray-900">Profile</h2>
                      <button
                        onClick={() => setShowProfileSidePanel(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <FaChevronLeft className="text-gray-600 w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ProfileSidePanel
                        otherUser={otherUser}
                        onClose={() => setShowProfileSidePanel(false)}
                      />
                    </div>
                  </div>
                </>
              )}
          </div>

          {/* Block User Modal */}
          <BlockUserModal
            open={blockModalOpen}
            onClose={() => setBlockModalOpen(false)}
            onConfirm={handleBlockUser}
            userName={
              activeUser
                ? `${activeUser.first_name} ${activeUser.last_name}`.trim()
                : "Unknown User"
            }
            isLoading={isBlocking}
          />

          {/* Report User Modal */}
          <ReportUserModal
            open={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            onSubmit={handleReportUser}
            userName={
              activeUser
                ? `${activeUser.first_name} ${activeUser.last_name}`.trim()
                : "Unknown User"
            }
            isLoading={isReporting}
          />

          {/* File Attachment Modal */}
          <FileAttachmentModal
            open={fileModalOpen}
            onClose={() => setFileModalOpen(false)}
            onFilesSelected={handleFileSelect}
            conversationId={selectedConversationId || ""}
          />

          {/* Start Conversation Modal */}
          <StartConversationModal
            isOpen={isMatchModalOpen}
            onClose={handleCloseMatchModal}
            onSendMessage={handleSendFirstMessage}
            recipientName={recipientName}
            isLoading={isCreatingConversation}
          />
        </>
      )}
    </div>
  );
}

export default memo(ChatUIClient);
