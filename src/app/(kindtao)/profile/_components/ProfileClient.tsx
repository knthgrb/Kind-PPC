"use client";

import Link from "next/link";
import { useMemo, useState, lazy, Suspense } from "react";
import { IoArrowBack, IoCreateOutline } from "react-icons/io5";
import Card from "@/components/common/Card";
import Chip from "@/components/common/Chip";
import type { UserProfile } from "@/types/userProfile";
import { capitalizeWords } from "@/utils/capitalize";
import SupabaseImage from "@/components/common/SupabaseImage";
import WorkExperienceSection from "./WorkExperienceSection";
import { useRouter } from "next/navigation";

import dynamic from "next/dynamic";
const EditProfileModal = dynamic(() => import("./EditProfileModal"), {
  ssr: false,
});

interface ProfileClientProps {
  user: UserProfile;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const boostExpiryTimestamp = (() => {
    if (!kindtao_profile?.boost_expires_at) return null;
    if (typeof kindtao_profile.boost_expires_at === "number") {
      return kindtao_profile.boost_expires_at;
    }
    const parsed = new Date(kindtao_profile.boost_expires_at as any).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  })();

  const isBoostActive =
    Boolean(kindtao_profile?.is_boosted) &&
    boostExpiryTimestamp !== null &&
    boostExpiryTimestamp > Date.now();

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

  const availabilityBadges = useMemo(() => {
    if (!kindtao_profile?.availability_schedule) return [];
    return Object.entries(kindtao_profile.availability_schedule)
      .map(([day, schedule]) => {
        const scheduleData = schedule as {
          available: boolean;
          hours?: [string, string];
        };
        if (!scheduleData.available) return null;
        return {
          day,
          hours: Array.isArray(scheduleData.hours)
            ? scheduleData.hours.filter(Boolean).join(" – ")
            : null,
        };
      })
      .filter(Boolean) as { day: string; hours: string | null }[];
  }, [kindtao_profile?.availability_schedule]);

  const primaryDetails = [
    { label: "Email", value: email },
    { label: "Phone", value: phone },
    {
      label: "Date of Birth",
      value:
        date_of_birth &&
        `${formatDate(date_of_birth)}${
          getAge(date_of_birth) ? ` (${getAge(date_of_birth)} yrs)` : ""
        }`,
    },
    { label: "Gender", value: gender ? capitalizeWords(gender) : null },
    { label: "Address", value: fullAddress },
  ].filter((detail) => Boolean(detail.value));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/recs"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <IoArrowBack className="w-4 h-4" />
            Back to jobs
          </Link>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 text-gray-900 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <IoCreateOutline className="w-4 h-4" />
            Edit profile
          </button>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex flex-col items-center text-center md:text-left md:items-start gap-4">
              {profile_image_url ? (
                <SupabaseImage
                  filePath={profile_image_url}
                  alt={fullName || "Profile photo"}
                  width={136}
                  height={136}
                  className="rounded-2xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gray-200 flex items-center justify-center text-4xl font-semibold text-gray-600">
                  {first_name ? first_name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {fullName || "No name provided"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {kindtao_profile?.is_verified ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-800 border border-green-100">
                      Verified
                    </span>
                  ) : (
                    <Link
                      href="/settings?tab=verification"
                      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      Complete verification
                    </Link>
                  )}
                  {isBoostActive ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-800 border border-rose-100">
                      Boosted
                    </span>
                  ) : (
                    <Link
                      href="/settings?tab=subscription"
                      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      Boost profile
                    </Link>
                  )}
                  {status && status !== "active" && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 border border-gray-200">
                      {capitalizeWords(status)}
                    </span>
                  )}
                </div>
              </div>

              {primaryDetails.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {primaryDetails.map((detail) => (
                    <div key={detail.label}>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {detail.label}
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {kindtao_profile && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {kindtao_profile.highest_educational_attainment && (
                <Card className="p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Education
                  </p>
                  <p className="text-lg font-medium text-gray-900">
                    {capitalizeWords(
                      kindtao_profile.highest_educational_attainment
                    )}
                  </p>
                </Card>
              )}

              {kindtao_profile.expected_salary_range && (
                <Card className="p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Expected salary
                  </p>
                  <p className="text-lg font-medium text-gray-900">
                    {kindtao_profile.expected_salary_range}
                  </p>
                </Card>
              )}
            </div>

            {(kindtao_profile.skills?.length ||
              kindtao_profile.languages?.length) && (
              <div className="grid gap-6 md:grid-cols-2">
                {kindtao_profile.skills &&
                  kindtao_profile.skills.length > 0 && (
                    <Card className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Skills
                        </h2>
                        <span className="text-sm text-gray-500">
                          {kindtao_profile.skills.length} listed
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {kindtao_profile.skills.map((skill, index) => (
                          <Chip key={index}>{formatSkill(skill)}</Chip>
                        ))}
                      </div>
                    </Card>
                  )}

                {kindtao_profile.languages &&
                  kindtao_profile.languages.length > 0 && (
                    <Card className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Languages
                        </h2>
                        <span className="text-sm text-gray-500">
                          {kindtao_profile.languages.length} listed
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {kindtao_profile.languages.map((language, index) => (
                          <Chip key={index}>{capitalizeWords(language)}</Chip>
                        ))}
                      </div>
                    </Card>
                  )}
              </div>
            )}

            {(kindtao_profile.rating ||
              (kindtao_profile.reviews &&
                kindtao_profile.reviews.length > 0)) && (
              <Card className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {kindtao_profile.rating && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Average rating
                      </p>
                      <p className="text-3xl font-semibold text-gray-900">
                        {kindtao_profile.rating.toFixed(1)}
                      </p>
                    </div>
                  )}
                  {kindtao_profile.reviews &&
                    kindtao_profile.reviews.length > 0 && (
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-3">
                          Recent reviews
                        </p>
                        <div className="space-y-2">
                          {kindtao_profile.reviews.slice(0, 3).map((review) => (
                            <p
                              key={review}
                              className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg"
                            >
                              “{review}”
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </Card>
            )}

            {availabilityBadges.length > 0 && (
              <Card className="p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Availability
                </h2>
                <div className="flex flex-wrap gap-2">
                  {availabilityBadges.map((slot) => (
                    <div
                      key={slot.day}
                      className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700"
                    >
                      <span className="capitalize">{slot.day}</span>
                      {slot.hours && (
                        <span className="text-gray-500 ml-2">{slot.hours}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {work_experiences && work_experiences.length > 0 && (
          <WorkExperienceSection
            workExperiences={work_experiences}
            onUpdate={() => router.refresh()}
          />
        )}

        {!kindtao_profile && (
          <Card className="p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Complete your KindTao profile
            </h2>
            <p className="text-gray-600">
              Add your skills, languages, salary expectations, and availability
              so employers can understand your experience.
            </p>
            <Link
              href="/kindtao-onboarding"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Go to onboarding
            </Link>
          </Card>
        )}
      </div>

      {isEditModalOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
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
    </div>
  );
}
