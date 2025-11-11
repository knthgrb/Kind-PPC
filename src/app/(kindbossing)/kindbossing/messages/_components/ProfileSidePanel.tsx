"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@/types/chat";

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

// Helper function to normalize snake_case to Title Case
const normalizeString = (str: string) => {
  if (!str) return "";
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function ProfileSidePanel({
  otherUser,
  onClose,
}: {
  otherUser: User;
  onClose?: () => void;
}) {
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
  }, [otherUser?.id, otherUser?.role]);

  if (loading) {
    return <ProfileSidePanelSkeleton />;
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

        {/* Rating & Reviews */}
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

        {/* Actions */}
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
}

export const ProfileSidePanelSkeleton = () => (
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
      <div className="space-y-2 border-t border-gray-200 pt-3">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-full" />
      </div>
    </div>
  </div>
);

