"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import {
  IoSettingsOutline,
  IoCardOutline,
  IoShieldCheckmarkOutline,
  IoTrashOutline,
  IoBriefcaseOutline,
} from "react-icons/io5";
import { FaBolt, FaRocket } from "react-icons/fa";
import SubscriptionStatus from "@/components/common/SubscriptionStatus";
import { deleteAccount } from "@/actions/account/delete-account";
import { getUserSubscription } from "@/actions/subscription/xendit";
import type { UserSubscription } from "@/types/subscription";
import { useToastActions } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { AuthService } from "@/services/AuthService";
import { logger } from "@/utils/logger";
import Link from "next/link";
import { api } from "@/utils/convex/client };
import type { JobPreferences } from "@/services/JobPreferencesService";
import { updateKindTaoJobPreferences } from "@/actions/job-preferences/update-kindtao-preferences";
import dynamic from "next/dynamic";
import { useOptionalCurrentUser } from "@/hooks/useOptionalCurrentUser";
const SubscriptionModal = dynamic(
  () => import("@/components/modals/SubscriptionModal"),
  {
    ssr: false,
  }
);
const DeleteAccountModal = dynamic(
  () => import("@/components/modals/DeleteAccountModal"),
  {
    ssr: false,
  }
);
const VerificationTab = dynamic(
  () =>
    import(
      "@/app/(kindbossing)/kindbossing/settings/_components/VerificationTab"
    ),
  {
    ssr: false,
  }
);

const defaultPreferences: JobPreferences = {
  desiredJobs: [],
  desiredLocations: [],
  desiredJobTypes: [],
  salaryRange: {
    min: 0,
    max: 0,
    salaryType: "daily",
  },
  preferredLanguages: [],
  preferredWorkRadiusKm: 10,
};

export default function KindTaoSettingsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showError, showSuccess } = useToastActions();
  const { user } = useAuthStore();

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditingJobPreferences, setIsEditingJobPreferences] = useState(false);
  const [editedPreferences, setEditedPreferences] =
    useState<JobPreferences>(defaultPreferences);
  const [chipInputs, setChipInputs] = useState({
    desiredJobs: "",
    desiredLocations: "",
    preferredLanguages: "",
  });
  const [isSavingJobPreferences, setIsSavingJobPreferences] = useState(false);

  const [currentPlan, setCurrentPlan] = useState("Free");
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const [jobPreferences, setJobPreferences] = useState<JobPreferences | null>(
    null
  );

  const settingsTabs = [
    {
      id: "general",
      label: "General",
      icon: IoSettingsOutline,
      description: "Account settings and preferences",
    },
    {
      id: "job-preferences",
      label: "Job Preferences",
      icon: IoBriefcaseOutline,
      description: "Manage desired jobs and locations",
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: IoCardOutline,
      description: "Manage your subscription and credits",
    },
    {
      id: "verification",
      label: "Verification",
      icon: IoShieldCheckmarkOutline,
      description: "Upload documents for verification",
    },
  ];

  const requestedTab = searchParams.get("tab");
  const activeTab =
    requestedTab && settingsTabs.some((tab) => tab.id === requestedTab)
      ? requestedTab
      : settingsTabs[0]?.id || "general";

  const { currentUser } = useOptionalCurrentUser();
  const kindTaoUserId = currentUser?.userId ?? user?.id ?? null;
  const userIdArg = kindTaoUserId ? { userId: kindTaoUserId } : "skip";
  const userData = useQuery(api.users.getUserById, userIdArg);
  const jobPreferencesRecord = useQuery(
    api.jobPreferences.getJobPreferencesByUser,
    userIdArg
  );
  const isJobPreferencesLoading =
    currentUser === undefined ||
    (currentUser?.userId && jobPreferencesRecord === undefined);

  useEffect(() => {
    if (jobPreferencesRecord === undefined) return;
    if (!jobPreferencesRecord) {
      setJobPreferences(null);
      return;
    }

    setJobPreferences({
      desiredJobs: jobPreferencesRecord.desired_jobs || [],
      desiredLocations: jobPreferencesRecord.desired_locations || [],
      desiredJobTypes: jobPreferencesRecord.desired_job_types || [],
      salaryRange: {
        min: jobPreferencesRecord.salary_range_min || 0,
        max: jobPreferencesRecord.salary_range_max || 0,
        salaryType: (jobPreferencesRecord.salary_type ||
          "daily") as JobPreferences["salaryRange"]["salaryType"],
      },
      preferredLanguages: jobPreferencesRecord.desired_languages || [],
      preferredWorkRadiusKm:
        jobPreferencesRecord.desired_job_location_radius || 10,
    });
  }, [jobPreferencesRecord]);

  useEffect(() => {
    if (!user) return;
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    setLoadingSubscription(true);
    try {
      const result = await getUserSubscription();
      if (result.success) {
        setCurrentSubscription(result.subscription ?? null);
        if (result.subscription?.subscription_tier) {
          setCurrentPlan(result.subscription.subscription_tier);
        }
      } else if (result.error) {
        showError("Failed to load subscription data");
        logger.error("Failed to load subscription data", result.error);
      }
    } catch (error) {
      logger.error("Error loading subscription:", error);
      showError("Failed to load subscription data");
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    setIsDeletingAccount(true);
    try {
      const result = await deleteAccount(password);
      if (!result.success) {
        showError(result.error || "Failed to delete account.");
        return;
      }
      await AuthService.signOut();
      showSuccess("Account deleted successfully");
      router.push("/");
    } catch (error) {
      logger.error("Error deleting account:", error);
      showError("Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const hasJobPreferences = useMemo(() => {
    if (!jobPreferences) return false;
    return (
      jobPreferences.desiredJobs.length > 0 ||
      jobPreferences.desiredLocations.length > 0 ||
      jobPreferences.desiredJobTypes.length > 0 ||
      jobPreferences.preferredLanguages.length > 0 ||
      jobPreferences.salaryRange.min > 0 ||
      jobPreferences.salaryRange.max > 0
    );
  }, [jobPreferences]);

  const handleSaveJobPreferences = async (
    updated: JobPreferences,
    onSuccess?: () => void
  ) => {
    setIsSavingJobPreferences(true);
    try {
      const result = await updateKindTaoJobPreferences(updated);
      if (!result.success) {
        showError(result.error || "Failed to save job preferences");
        return;
      }
      setJobPreferences(updated);
      showSuccess("Job preferences updated");
      onSuccess?.();
    } catch (error) {
      logger.error("Error updating job preferences:", error);
      showError("Failed to save job preferences");
    } finally {
      setIsSavingJobPreferences(false);
    }
  };

  const renderGeneralTab = () => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <h3 className="mb-4 text-xl sm:text-[1.578rem] font-medium text-black">
        General Settings
      </h3>
      <div className="space-y-6">
        <div className="border border-rose-200 rounded-xl p-6 bg-rose-50">
          <div className="flex items-start gap-4">
            <IoTrashOutline className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-rose-900 mb-2">
                Delete Account
              </h4>
              <p className="text-sm text-red-800 mb-4">
                Once you delete your account, there is no going back. This will
                permanently delete your matches, applications, and profile data.
              </p>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex cursor-pointer items-center justify-center px-4 py-2 rounded-xl bg-[#CB0000] text-white text-sm font-medium hover:bg-[#a10000] transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderJobPreferencesTab = () => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-[1.578rem] font-medium text-black">
            Job Preferences
          </h3>
          <p className="text-sm text-gray-600">
            These preferences help us personalize job recommendations for you.
          </p>
        </div>
        {!isJobPreferencesLoading && (
          <>
            {isEditingJobPreferences ? null : (
              <button
                onClick={() => {
                  setEditedPreferences(jobPreferences ?? defaultPreferences);
                  setChipInputs({
                    desiredJobs: "",
                    desiredLocations: "",
                    preferredLanguages: "",
                  });
                  setIsEditingJobPreferences(true);
                }}
                className="inline-flex cursor-pointer items-center justify-center px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 text-gray-900 text-sm font-medium hover:bg-gray-200 transition"
              >
                {hasJobPreferences ? "Edit preferences" : "Add preferences"}
              </button>
            )}
          </>
        )}
      </div>

      {isJobPreferencesLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      ) : isEditingJobPreferences ? (
        renderJobPreferencesEditor()
      ) : (
        renderJobPreferencesSummary()
      )}
    </div>
  );

  const renderJobPreferencesSummary = () => (
    <>
      {!hasJobPreferences ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-2">
            You haven't set your job preferences yet.
          </p>
          <p className="text-sm text-gray-500">
            Add your preferred roles, locations, and salary expectations to get
            more relevant matches.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PreferenceCard
              title="Desired Jobs"
              items={jobPreferences?.desiredJobs}
            />
            <PreferenceCard
              title="Preferred Locations"
              items={jobPreferences?.desiredLocations}
            />
          </div>
          <PreferenceCard
            title="Preferred Job Types"
            items={jobPreferences?.desiredJobTypes}
            emptyText="No job types selected"
            formatItem={(item) => item.replace("-", " ")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PreferenceCard
              title="Preferred Languages"
              items={jobPreferences?.preferredLanguages}
            />
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Expected Salary Range
              </h4>
              {jobPreferences?.salaryRange?.min ||
              jobPreferences?.salaryRange?.max ? (
                <p className="text-gray-900 font-semibold">
                  ₱{jobPreferences?.salaryRange?.min?.toLocaleString()} - ₱
                  {jobPreferences?.salaryRange?.max?.toLocaleString()}{" "}
                  <span className="text-sm text-gray-500 uppercase">
                    / {jobPreferences?.salaryRange?.salaryType}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">Not specified</p>
              )}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Work Radius
                </p>
                <p className="text-gray-900 font-semibold">
                  {jobPreferences?.preferredWorkRadiusKm} km
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const jobTypeOptions = [
    "full-time",
    "part-time",
    "contract",
    "temporary",
    "one-time",
  ];

  const languageOptions = [
    "English",
    "Filipino / Tagalog",
    "Cebuano",
    "Ilocano",
    "Hiligaynon",
    "Bicolano",
    "Waray",
    "Kapampangan",
    "Pangasinan",
    "Tausug",
    "Other",
  ];

  const locationSuggestions = [
    "National Capital Region (NCR)",
    "Central Visayas",
    "CALABARZON",
    "Central Luzon",
    "Davao Region",
    "Any Philippines",
  ];

  const jobSuggestions = [
    "Housekeeping",
    "Laundry",
    "Cook",
    "Driver",
    "Caregiver",
    "Gardener",
  ];

  const handleChipInputChange = (
    field: keyof typeof chipInputs,
    value: string
  ) => {
    setChipInputs((prev) => ({ ...prev, [field]: value }));
  };

  const addChipValue = (
    field: "desiredJobs" | "desiredLocations" | "preferredLanguages"
  ) => {
    const value = chipInputs[field].trim();
    if (!value) return;
    setEditedPreferences((prev) => {
      const currentValues = prev[field];
      if (currentValues.includes(value)) return prev;
      return { ...prev, [field]: [...currentValues, value] };
    });
    setChipInputs((prev) => ({ ...prev, [field]: "" }));
  };

  const addChipSuggestion = (
    field: "desiredJobs" | "desiredLocations",
    suggestion: string
  ) => {
    setEditedPreferences((prev) => {
      const current = prev[field];
      if (current.includes(suggestion)) return prev;
      return { ...prev, [field]: [...current, suggestion] };
    });
  };

  const removeChipValue = (
    field: "desiredJobs" | "desiredLocations" | "preferredLanguages",
    value: string
  ) => {
    setEditedPreferences((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== value),
    }));
  };

  const toggleJobType = (jobType: string) => {
    setEditedPreferences((prev) => ({
      ...prev,
      desiredJobTypes: prev.desiredJobTypes.includes(jobType)
        ? prev.desiredJobTypes.filter((type) => type !== jobType)
        : [...prev.desiredJobTypes, jobType],
    }));
  };

  const toggleLanguageShortcut = (language: string) => {
    if (language === "Other") return;
    setEditedPreferences((prev) => ({
      ...prev,
      preferredLanguages: prev.preferredLanguages.includes(language)
        ? prev.preferredLanguages.filter((lang) => lang !== language)
        : [...prev.preferredLanguages, language],
    }));
  };

  const renderChipList = (
    items: string[],
    field: "desiredJobs" | "desiredLocations" | "preferredLanguages",
    emptyText = "No items added yet."
  ) =>
    items.length === 0 ? (
      <p className="text-sm text-gray-500">{emptyText}</p>
    ) : (
      <div className="flex flex-wrap gap-2 mt-3">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-800"
          >
            {item}
            <button
              type="button"
              onClick={() => removeChipValue(field, item)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    );

  const renderJobPreferencesEditor = () => (
    <div className="space-y-8">
      {/* desired jobs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              Desired Jobs
            </h4>
            <p className="text-sm text-gray-500">
              Add the roles you are actively looking for.
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={chipInputs.desiredJobs}
            onChange={(e) =>
              handleChipInputChange("desiredJobs", e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addChipValue("desiredJobs");
              }
            }}
            placeholder="e.g., Housekeeping"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
          />
          <button
            type="button"
            onClick={() => addChipValue("desiredJobs")}
            className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-[#CB0000] text-white text-sm font-medium hover:bg-[#a10000]"
          >
            Add
          </button>
        </div>
        {renderChipList(editedPreferences.desiredJobs, "desiredJobs")}
        <div className="flex flex-wrap gap-2 mt-3">
          {jobSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addChipSuggestion("desiredJobs", suggestion)}
              className="px-3 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      {/* desired locations */}
      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          Desired Locations
        </h4>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={chipInputs.desiredLocations}
            onChange={(e) =>
              handleChipInputChange("desiredLocations", e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addChipValue("desiredLocations");
              }
            }}
            placeholder="e.g., Cebu City"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
          />
          <button
            type="button"
            onClick={() => addChipValue("desiredLocations")}
            className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-[#CB0000] text-white text-sm font-medium hover:bg-[#a10000]"
          >
            Add
          </button>
        </div>
        {renderChipList(editedPreferences.desiredLocations, "desiredLocations")}
        <div className="flex flex-wrap gap-2 mt-3">
          {locationSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addChipSuggestion("desiredLocations", suggestion)}
              className="px-3 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      {/* job types */}
      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          Preferred Job Types
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {jobTypeOptions.map((jobType) => (
            <label
              key={jobType}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                editedPreferences.desiredJobTypes.includes(jobType)
                  ? "border-[#CB0000] bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={editedPreferences.desiredJobTypes.includes(jobType)}
                onChange={() => toggleJobType(jobType)}
                className="rounded border-gray-300 text-[#CB0000] focus:ring-[#CB0000]"
              />
              <span className="text-sm font-medium capitalize">
                {jobType.replace("-", " ")}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* salary range */}
      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          Expected Salary Range
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum (₱)
            </label>
            <input
              type="number"
              min={0}
              value={editedPreferences.salaryRange.min}
              onChange={(e) =>
                setEditedPreferences((prev) => ({
                  ...prev,
                  salaryRange: {
                    ...prev.salaryRange,
                    min: Number(e.target.value),
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum (₱)
            </label>
            <input
              type="number"
              min={editedPreferences.salaryRange.min}
              value={editedPreferences.salaryRange.max}
              onChange={(e) =>
                setEditedPreferences((prev) => ({
                  ...prev,
                  salaryRange: {
                    ...prev.salaryRange,
                    max: Number(e.target.value),
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary Type
            </label>
            <select
              value={editedPreferences.salaryRange.salaryType}
              onChange={(e) =>
                setEditedPreferences((prev) => ({
                  ...prev,
                  salaryRange: {
                    ...prev.salaryRange,
                    salaryType: e.target
                      .value as JobPreferences["salaryRange"]["salaryType"],
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="hourly">Hourly</option>
              <option value="one-time">One-Time</option>
            </select>
          </div>
        </div>
      </section>

      {/* languages */}
      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          Preferred Languages
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {languageOptions.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => toggleLanguageShortcut(language)}
              className={`px-3 py-2 rounded-lg text-sm border ${
                editedPreferences.preferredLanguages.includes(language)
                  ? "border-[#CB0000] bg-red-50 text-[#CB0000]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {language}
            </button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={chipInputs.preferredLanguages}
            onChange={(e) =>
              handleChipInputChange("preferredLanguages", e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addChipValue("preferredLanguages");
              }
            }}
            placeholder="Add another language"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB0000] focus:border-[#CB0000]"
          />
          <button
            type="button"
            onClick={() => addChipValue("preferredLanguages")}
            className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-[#CB0000] text-white text-sm font-medium hover:bg-[#a10000]"
          >
            Add
          </button>
        </div>
        {renderChipList(
          editedPreferences.preferredLanguages,
          "preferredLanguages"
        )}
      </section>

      {/* work radius */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              Preferred Work Radius
            </h4>
            <p className="text-sm text-gray-500">
              How far are you willing to travel for work? (in kilometers)
            </p>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            {editedPreferences.preferredWorkRadiusKm} km
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={editedPreferences.preferredWorkRadiusKm}
          onChange={(e) =>
            setEditedPreferences((prev) => ({
              ...prev,
              preferredWorkRadiusKm: Number(e.target.value),
            }))
          }
          className="w-full mt-4 accent-[#CB0000]"
        />
      </section>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setIsEditingJobPreferences(false)}
          className="px-4 py-2 rounded-xl cursor-pointer border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            handleSaveJobPreferences(editedPreferences, () =>
              setIsEditingJobPreferences(false)
            )
          }
          disabled={isSavingJobPreferences}
          className="inline-flex cursor-pointer items-center gap-2 px-6 py-2 rounded-xl bg-[#CB0000] text-white text-sm font-semibold hover:bg-[#a10000] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSavingJobPreferences ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </div>
  );

  const renderSubscriptionsTab = () => {
    if (loadingSubscription) {
      return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="space-y-6 animate-pulse">
            <div className="h-6 w-60 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      );
    }

    const hasActiveSubscription = currentSubscription && currentPlan !== "Free";
    const swipeCredits = userData?.swipe_credits ?? 0;
    const boostCredits = userData?.boost_credits ?? 0;

    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h3 className="mb-4 text-xl sm:text-[1.578rem] font-medium text-black">
          Subscription & Credits
        </h3>
        <div className="max-w-5xl space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <CreditCard
              title="Swipe Credits"
              icon={<FaBolt className="text-blue-500 w-4 h-4" />}
              amount={swipeCredits >= 999999 ? "Unlimited" : swipeCredits}
              helperText={
                hasActiveSubscription
                  ? currentPlan === "premium"
                    ? "Unlimited daily"
                    : "30 per day"
                  : "1 free per day"
              }
            />
            <CreditCard
              title="Boost Credits"
              icon={<FaRocket className="text-purple-500 w-4 h-4" />}
              amount={boostCredits >= 999999 ? "Unlimited" : boostCredits}
              helperText={
                hasActiveSubscription
                  ? currentPlan === "premium"
                    ? "Unlimited monthly"
                    : "10 per month"
                  : "Requires subscription"
              }
            />
          </div>

          <SubscriptionStatus
            userRole="kindtao"
            onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
          />
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralTab();
      case "job-preferences":
        return renderJobPreferencesTab();
      case "subscriptions":
        return renderSubscriptionsTab();
      case "verification":
        return <VerificationTab userRole="kindtao" />;
      default:
        return renderGeneralTab();
    }
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", tabId);
    router.push(`/kindtao/settings?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link
          href="/recs"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to jobs
        </Link>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Settings
          </h1>
          <p className="text-sm text-gray-600">
            Manage your account, preferences, and verification
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-60">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full cursor-pointer flex items-start gap-3 px-3 py-3 rounded-xl text-left transition ${
                      isActive
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : "text-gray-700 hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mt-0.5 ${
                        isActive ? "text-red-600" : "text-gray-400"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium">{tab.label}</div>
                      <p className="text-xs text-gray-500">{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex-1">{renderTabContent()}</section>
        </div>
      </div>

      <div className="lg:hidden h-16" />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        userRole="kindtao"
        currentPlan={currentPlan}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
      />
    </div>
  );
}

function PreferenceCard({
  title,
  items,
  emptyText = "No items added",
  formatItem,
}: {
  title: string;
  items?: string[];
  emptyText?: string;
  formatItem?: (item: string) => string;
}) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 h-full">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      {items && items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="px-3 py-1 rounded-full bg-white border border-gray-200 text-sm text-gray-800"
            >
              {formatItem ? formatItem(item) : item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{emptyText}</p>
      )}
    </div>
  );
}

function CreditCard({
  title,
  icon,
  amount,
  helperText,
}: {
  title: string;
  icon: React.ReactNode;
  amount: number | string;
  helperText: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{amount}</div>
      <div className="text-xs text-gray-500 mt-1">{helperText}</div>
    </div>
  );
}
