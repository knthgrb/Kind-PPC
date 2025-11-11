"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, lazy, Suspense, useEffect } from "react";
import { IoArrowBack, IoCreateOutline } from "react-icons/io5";
import { FaRocket } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import Card from "@/components/common/Card";
import Chip from "@/components/common/Chip";
import type { UserProfile } from "@/types/userProfile";
import { capitalizeWords } from "@/utils/capitalize";
import SupabaseImage from "@/components/common/SupabaseImage";
import WorkExperienceSection from "./WorkExperienceSection";
import SubscriptionModal from "@/components/modals/SubscriptionModal";
import CreditPurchaseModal from "@/components/modals/CreditPurchaseModal";
import { boostProfile } from "@/actions/profile/boost-profile";
import { getUserSubscription } from "@/actions/subscription/xendit";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastActions } from "@/stores/useToastStore";
import { createClient } from "@/utils/supabase/client";

// Lazy load the EditProfileModal
const EditProfileModal = lazy(() => import("./EditProfileModal"));

interface ProfileClientProps {
  user: UserProfile;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const { user: authUser } = useAuthStore();
  const { showSuccess, showError } = useToastActions();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isCreditPurchaseModalOpen, setIsCreditPurchaseModalOpen] =
    useState(false);
  const [boostCredits, setBoostCredits] = useState<number>(0);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isProfileBoosted, setIsProfileBoosted] = useState(false);
  const [boostExpiresAt, setBoostExpiresAt] = useState<string | null>(null);
  const [isBoostBannerDismissed, setIsBoostBannerDismissed] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      loadBoostCredits();
      loadProfileBoostStatus();
    }
  }, [authUser]);

  const loadBoostCredits = async () => {
    if (!authUser?.id) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("boost_credits")
        .eq("id", authUser.id)
        .single();

      if (!error && data) {
        setBoostCredits(data.boost_credits || 0);
      }
    } catch (error) {
      console.error("Error loading boost credits:", error);
    }
  };

  const loadProfileBoostStatus = async () => {
    if (!authUser?.id) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("kindtaos")
        .select("is_boosted, boost_expires_at")
        .eq("user_id", authUser.id)
        .single();

      if (!error && data) {
        setIsProfileBoosted(data.is_boosted || false);
        setBoostExpiresAt(data.boost_expires_at || null);
      }
    } catch (error) {
      console.error("Error loading profile boost status:", error);
    }
  };

  const handleBoostProfile = async () => {
    if (!authUser?.id) return;

    // Check if profile is already boosted and not expired
    if (isProfileBoosted && boostExpiresAt) {
      const expiryDate = new Date(boostExpiresAt);
      if (expiryDate > new Date()) {
        showError("Your profile is already boosted");
        return;
      }
    }

    // Check boost credits
    if (boostCredits < 1) {
      // Check if user has subscription
      try {
        const subscriptionResult = await getUserSubscription();
        const hasSubscription =
          subscriptionResult.success &&
          subscriptionResult.subscription &&
          subscriptionResult.subscription.status === "active";

        if (!hasSubscription) {
          // Show subscription modal
          setIsSubscriptionModalOpen(true);
        } else {
          // Show credit purchase modal
          setIsCreditPurchaseModalOpen(true);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setIsSubscriptionModalOpen(true);
      }
      return;
    }

    // Boost the profile
    setIsBoosting(true);
    try {
      const result = await boostProfile();
      if (result.success) {
        showSuccess("Profile boosted successfully!");
        loadBoostCredits();
        loadProfileBoostStatus();
      } else {
        showError(result.error || "Failed to boost profile");
      }
    } catch (error) {
      console.error("Error boosting profile:", error);
      showError("An unexpected error occurred");
    } finally {
      setIsBoosting(false);
    }
  };

  const {
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    profile_image_url,
    barangay,
    municipality,
    province,
    zip_code,
    status,
    kindtao_profile,
    work_experiences,
  } = user;

  const fullName = [first_name, last_name].filter(Boolean).join(" ");
  const fullAddress = [barangay, municipality, province, zip_code]
    .filter(Boolean)
    .join(", ");

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatSkill = (skill: string) => {
    return skill
      .replace(/_/g, " ") // Replace underscores with spaces
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleDismissBoostBanner = () => {
    setIsBoostBannerDismissed(true);
  };

  // Show boost banner if:
  // 1. Not dismissed
  // 2. Profile is not currently boosted
  const shouldShowBoostBanner =
    !isBoostBannerDismissed &&
    !(
      isProfileBoosted &&
      boostExpiresAt &&
      new Date(boostExpiresAt) > new Date()
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button and Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/recs"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <IoArrowBack className="w-5 h-5" />
            <span>Find Work</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex cursor-pointer items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <IoCreateOutline className="w-5 h-5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Boost Profile Banner - Top of Page */}
        {shouldShowBoostBanner && (
          <Card className="mb-6 border-2 border-[#CC0000] relative">
            <button
              onClick={handleDismissBoostBanner}
              className="absolute top-3 cursor-pointer right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss boost banner"
            >
              <IoClose className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between pr-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FaRocket className="w-5 h-5 text-[#CC0000]" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Boost Your Profile
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Increase the chance to be seen by employers when they review
                  applications
                </p>
              </div>
              <button
                onClick={handleBoostProfile}
                disabled={isBoosting}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-[#CC0000] text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBoosting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Boosting...</span>
                  </>
                ) : (
                  <>
                    <FaRocket className="w-4 h-4" />
                    <span>Boost Now</span>
                  </>
                )}
              </button>
            </div>
          </Card>
        )}

        {/* Profile Header */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="shrink-0">
              {profile_image_url ? (
                <SupabaseImage
                  filePath={profile_image_url}
                  alt={fullName || "Profile"}
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-red-600 shadow-lg"
                />
              ) : (
                <div className="w-30 h-30 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold text-white">
                    {first_name ? first_name.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {fullName || "No name provided"}
                </h1>
                <div className="flex flex-wrap gap-3 items-center">
                  {kindtao_profile?.is_verified ? (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">
                        Verified
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-yellow-800">
                          Not Verified
                        </span>
                      </div>
                      <a
                        href="/settings?tab=verification"
                        className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                      >
                        Verify Now →
                      </a>
                    </div>
                  )}
                  {isProfileBoosted &&
                    boostExpiresAt &&
                    new Date(boostExpiresAt) > new Date() && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <FaRocket className="w-3 h-3 text-[#CC0000]" />
                        <span className="text-sm font-medium text-red-800">
                          Profile Boosted
                        </span>
                      </div>
                    )}
                  {status && (
                    <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-gray-700">
                        {capitalizeWords(status)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {email && (
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <div className="bg-white rounded-lg px-3 py-2 mt-1">
                      <p className="text-gray-900">{email}</p>
                    </div>
                  </div>
                )}
                {phone && (
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <div className="bg-white rounded-lg px-3 py-2 mt-1">
                      <p className="text-gray-900">{phone}</p>
                    </div>
                  </div>
                )}
                {date_of_birth && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Date of Birth:
                    </span>
                    <div className="bg-white rounded-lg px-3 py-2 mt-1">
                      <p className="text-gray-900">
                        {formatDate(date_of_birth)} ({getAge(date_of_birth)}{" "}
                        years old)
                      </p>
                    </div>
                  </div>
                )}
                {gender && (
                  <div>
                    <span className="font-medium text-gray-700">Gender:</span>
                    <div className="bg-white rounded-lg px-3 py-2 mt-1">
                      <p className="text-gray-900">{capitalizeWords(gender)}</p>
                    </div>
                  </div>
                )}
                {fullAddress && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Address:</span>
                    <div className="bg-white rounded-lg px-3 py-2 mt-1">
                      <p className="text-gray-900">{fullAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* KindTao Profile Information */}
        {kindtao_profile && (
          <div className="space-y-6">
            {/* Skills */}
            {kindtao_profile.skills && kindtao_profile.skills.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {kindtao_profile.skills.map((skill, index) => (
                    <Chip key={index}>{formatSkill(skill)}</Chip>
                  ))}
                </div>
              </Card>
            )}

            {/* Languages */}
            {kindtao_profile.languages &&
              kindtao_profile.languages.length > 0 && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Languages
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {kindtao_profile.languages.map((language, index) => (
                      <Chip key={index}>{capitalizeWords(language)}</Chip>
                    ))}
                  </div>
                </Card>
              )}

            {/* Education & Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kindtao_profile.highest_educational_attainment && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Education
                  </h2>
                  <span className="inline-block bg-white rounded-lg px-3 py-2 text-gray-700">
                    {capitalizeWords(
                      kindtao_profile.highest_educational_attainment
                    )}
                  </span>
                </Card>
              )}

              {kindtao_profile.expected_salary_range && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Expected Salary
                  </h2>
                  <span className="inline-block bg-white rounded-lg px-3 py-2 text-gray-700">
                    {kindtao_profile.expected_salary_range}
                  </span>
                </Card>
              )}
            </div>

            {/* Rating & Reviews */}
            {(kindtao_profile.rating ||
              (kindtao_profile.reviews &&
                kindtao_profile.reviews.length > 0)) && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Rating & Reviews
                </h2>
                {kindtao_profile.rating && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-yellow-500">
                        {kindtao_profile.rating.toFixed(1)}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < Math.floor(kindtao_profile.rating!)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {kindtao_profile.reviews &&
                  kindtao_profile.reviews.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Recent Reviews
                      </h3>
                      <div className="space-y-2">
                        {kindtao_profile.reviews
                          .slice(0, 3)
                          .map((review, index) => (
                            <p
                              key={index}
                              className="text-sm text-gray-600 bg-gray-50 p-3 rounded"
                            >
                              "{review}"
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
              </Card>
            )}

            {/* Availability Schedule */}
            {kindtao_profile.availability_schedule && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Days
                </h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(kindtao_profile.availability_schedule)
                    .filter(([day, schedule]) => {
                      const scheduleData = schedule as {
                        available: boolean;
                        hours?: [string, string];
                      };
                      return scheduleData.available;
                    })
                    .map(([day, schedule]) => {
                      const scheduleData = schedule as {
                        available: boolean;
                        hours?: [string, string];
                      };
                      return (
                        <div
                          key={day}
                          className="bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span className="font-medium text-gray-900 capitalize">
                            {day}
                          </span>
                          {scheduleData.hours && (
                            <span className="text-sm text-gray-600 ml-2">
                              {scheduleData.hours[0]} - {scheduleData.hours[1]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
                {Object.entries(kindtao_profile.availability_schedule).filter(
                  ([day, schedule]) => {
                    const scheduleData = schedule as {
                      available: boolean;
                      hours?: [string, string];
                    };
                    return scheduleData.available;
                  }
                ).length === 0 && (
                  <p className="text-gray-500 text-sm">No available days set</p>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Work Experience Section */}
        {work_experiences && work_experiences.length > 0 && (
          <WorkExperienceSection
            workExperiences={work_experiences}
            onUpdate={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}

        {/* No KindTao Profile Message */}
        {!kindtao_profile && (
          <Card>
            <div className="text-center py-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Complete Your KindTao Profile
              </h2>
              <p className="text-gray-600 mb-4">
                Add your skills, languages, and other information to make your
                profile more attractive to employers.
              </p>
              <Link
                href="/kindtao-onboarding"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Profile Modal - Lazy Loaded */}
      {isEditModalOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          }
        >
          <EditProfileModal
            user={user}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          loadBoostCredits();
        }}
        userRole="kindtao"
      />

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={isCreditPurchaseModalOpen}
        onClose={() => {
          setIsCreditPurchaseModalOpen(false);
          loadBoostCredits();
        }}
        creditType="boost_credits"
        currentCredits={boostCredits}
      />
    </div>
  );
}
