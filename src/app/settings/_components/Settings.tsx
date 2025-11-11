"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useSearchParams } from "next/navigation";
import { JobPreferences } from "@/components/modals/JobPreferencesModal";
import { NotificationService } from "@/services/client/NotificationService";
import { NotificationPreferencesService } from "@/services/client/NotificationPreferencesService";
import { JobPreferencesService } from "@/services/client/JobPreferencesService";
import {
  SubscriptionService,
  SubscriptionData,
} from "@/services/client/SubscriptionService";
import { useToastStore } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import ToggleButton from "../_components/toggleButton";
import VerificationTab from "./VerificationTab";
import SettingsLayout from "./SettingsLayout";
import dynamic from "next/dynamic";
import {
  IoNotificationsOutline,
  IoCardOutline,
  IoShieldCheckmarkOutline,
  IoBriefcaseOutline,
} from "react-icons/io5";
import SubscriptionStatus from "@/components/common/SubscriptionStatus";
import JobPreferencesInlineEditor from "./JobPreferencesInlineEditor";

const SubscriptionModal = dynamic(
  () => import("@/components/modals/SubscriptionModal"),
  { ssr: false }
);
export default function Settings() {
  const searchParams = useSearchParams();

  const [pushToggled, setPushToggled] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isEditingJobPreferences, setIsEditingJobPreferences] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [currentSubscription, setCurrentSubscription] =
    useState<SubscriptionData | null>(null);
  const [jobPreferences, setJobPreferences] = useState<JobPreferences | null>(
    null
  );
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [browserPermission, setBrowserPermission] =
    useState<NotificationPermission>("default");
  const pushPreferenceRef = useRef(pushToggled);

  useEffect(() => {
    pushPreferenceRef.current = pushToggled;
  }, [pushToggled]);
  const { showSuccess, showError, showWarning, showInfo } = useToastStore();
  const { user } = useAuthStore();

  // Check user role - only if user exists
  const userRole = user
    ? (user?.user_metadata as any)?.role || "kindtao"
    : null;
  const isKindtao = userRole === "kindtao";

  const settingsTabs = useMemo(() => {
    const baseTabs = [
      {
        id: "notifications",
        label: "Notifications",
        icon: IoNotificationsOutline,
        description: "Manage your notification preferences",
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

    if (isKindtao) {
      baseTabs.splice(1, 0, {
        id: "job-preferences",
        label: "Job Preferences",
        icon: IoBriefcaseOutline,
        description: "Control your job search preferences",
      });
    }

    return baseTabs;
  }, [isKindtao]);

  const requestedTab = searchParams.get("tab");
  const activeTab =
    requestedTab && settingsTabs.some((tab) => tab.id === requestedTab)
      ? requestedTab
      : settingsTabs[0]?.id || "notifications";

  // Load job preferences (only for kindtao) and subscription data
  useEffect(() => {
    // Only load data if user exists
    if (!user) {
      return;
    }

    if (isKindtao) {
      loadJobPreferences();
    }
    loadSubscription();
  }, [isKindtao, user]);

  const loadJobPreferences = async () => {
    // Don't load if user doesn't exist or is not kindtao
    if (!user || !isKindtao) {
      return;
    }

    setLoadingPreferences(true);
    try {
      const { data, error } = await JobPreferencesService.getJobPreferences();
      if (error) {
        console.error("Error loading job preferences:", error);
        showError("Error", "Failed to load job preferences");
      } else {
        setJobPreferences(data);
      }
    } catch (error) {
      console.error("Error loading job preferences:", error);
      showError("Error", "Failed to load job preferences");
    } finally {
      setLoadingPreferences(false);
    }
  };

  const loadSubscription = async () => {
    // Don't load if user doesn't exist
    if (!user) {
      return;
    }

    setLoadingSubscription(true);
    try {
      const { data, error } = await SubscriptionService.getSubscription();
      if (error) {
        console.error("Error loading subscription:", error);
        showError("Error", "Failed to load subscription data");
      } else {
        setCurrentSubscription(data);
        if (data?.subscription_tier) {
          setCurrentPlan(data.subscription_tier);
        }
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      showError("Error", "Failed to load subscription data");
    } finally {
      setLoadingSubscription(false);
    }
  };

  const loadNotificationPreference = useCallback(async () => {
    setIsNotificationsLoading(true);
    try {
      const permissionStatus = NotificationService.getPermissionStatus();
      setBrowserPermission(permissionStatus);

      const { data, error } =
        await NotificationPreferencesService.getPreference();
      if (error) {
        console.error("Error loading notification preference:", error);
        showError(
          "Error",
          "Failed to load your notification preference. Please try again."
        );
        setPushToggled(false);
        return;
      }

      const wantsNotifications = Boolean(data?.receiveNotification);

      if (wantsNotifications && permissionStatus !== "granted") {
        setPushToggled(false);
        if (permissionStatus === "denied") {
          showWarning(
            "Notifications Blocked",
            "Notifications are blocked by your browser. Enable them in browser settings to receive updates."
          );
        }

        if (data?.receiveNotification) {
          await NotificationPreferencesService.updatePreference(false);
        }
        return;
      }

      setPushToggled(wantsNotifications);
    } catch (error) {
      console.error("Error processing notification preference:", error);
      showError(
        "Error",
        "Failed to load notification settings. Please try again later."
      );
      setPushToggled(false);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [showError, showWarning]);

  // Check browser notification permission on mount
  useEffect(() => {
    void loadNotificationPreference();

    const handlePermissionChange = async () => {
      const status = NotificationService.getPermissionStatus();
      setBrowserPermission(status);

      if (status !== "granted" && pushPreferenceRef.current) {
        setPushToggled(false);
        pushPreferenceRef.current = false;
        const { success, error } =
          await NotificationPreferencesService.updatePreference(false);
        if (!success && error) {
          showError(
            "Error",
            "We couldn't sync your notification preference. Please try again later."
          );
        }
        showWarning(
          "Notifications Blocked",
          "Notifications are blocked by your browser. Enable them in browser settings to receive updates."
        );
      } else if (status === "granted" && !pushPreferenceRef.current) {
        // refresh server-side preference when permission is granted again
        void loadNotificationPreference();
      }
    };

    const handleOpenSubscriptionModal = () => {
      setIsSubscriptionModalOpen(true);
    };

    if (typeof window !== "undefined" && "Notification" in window) {
      window.addEventListener("focus", handlePermissionChange);
      window.addEventListener(
        "openSubscriptionModal",
        handleOpenSubscriptionModal as EventListener
      );

      return () => {
        window.removeEventListener("focus", handlePermissionChange);
        window.removeEventListener(
          "openSubscriptionModal",
          handleOpenSubscriptionModal as EventListener
        );
      };
    }

    return () => undefined;
  }, [loadNotificationPreference, pushPreferenceRef, showError, showWarning]);

  const handlePushToggle = async (newValue: boolean) => {
    if (isLoading) return;

    setIsLoading(true);
    const previousValue = pushPreferenceRef.current;

    try {
      if (newValue) {
        // User wants to enable notifications
        const permission = await NotificationService.requestPermission();

        const status = NotificationService.getPermissionStatus();
        setBrowserPermission(status);

        if (permission) {
          const { success, error } =
            await NotificationPreferencesService.updatePreference(true);

          if (!success) {
            throw new Error(error || "Failed to save notification preference");
          }

          setPushToggled(true);
          pushPreferenceRef.current = true;
          showSuccess(
            "Notifications Enabled",
            "You'll now receive notifications for new messages and updates.",
            { duration: 5000 }
          );
        } else {
          await NotificationPreferencesService.updatePreference(false);
          setPushToggled(false);
          pushPreferenceRef.current = false;
          showWarning(
            "Notifications Blocked",
            "Notifications are blocked by your browser. Please enable them in your browser settings to receive notifications.",
            {
              persistent: true,
              duration: 10000,
              action: {
                label: "Learn More",
                onClick: () => {
                  window.open(
                    "https://support.google.com/chrome/answer/3220216",
                    "_blank"
                  );
                },
              },
            }
          );
        }
      } else {
        const { success, error } =
          await NotificationPreferencesService.updatePreference(false);

        if (!success) {
          throw new Error(error || "Failed to save notification preference");
        }

        setPushToggled(false);
        pushPreferenceRef.current = false;
        showInfo(
          "Notifications Disabled",
          "You won't receive push notifications anymore. You can re-enable them anytime.",
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      setPushToggled(previousValue);
      showError(
        "Error",
        "Failed to update notification settings. Please try again.",
        { duration: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan: any) => {
    if (plan.tier === "Free") {
      showInfo(
        "Already on Free Plan",
        "You are currently using the free plan.",
        {
          duration: 3000,
        }
      );
      return;
    }

    // Here you would typically integrate with your payment system
    showSuccess(
      "Plan Selected",
      `You have selected the ${plan.tier} plan. Payment integration would be implemented here.`,
      { duration: 5000 }
    );

    setCurrentPlan(plan.tier);
    setIsSubscriptionModalOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "verification":
        return <VerificationTab userRole={userRole || "kindtao"} />;
      case "job-preferences":
        return renderJobPreferencesTab();
      case "notifications":
        return renderNotificationsTab();
      case "subscriptions":
        return renderSubscriptionsTab();
      default:
        return renderNotificationsTab();
    }
  };

  const renderNotificationsTab = () => {
    if (isNotificationsLoading) {
      return (
        <div className="p-6">
          <div className="space-y-6 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h3 className="mb-4 text-xl sm:text-[1.578rem] font-medium text-black">
          Notifications
        </h3>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 sm:py-8">
            <div className="flex flex-col">
              <p className="text-sm sm:text-[0.934rem] text-[#12223B] font-medium">
                Push Notifications
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pushToggled
                  ? "You'll receive notifications for new messages and updates."
                  : "Enable notifications to get updates about new messages and activity."}
              </p>
            </div>
            <ToggleButton
              toggled={pushToggled}
              onToggle={handlePushToggle}
              disabled={isLoading}
            />
          </div>

          {browserPermission !== "granted" && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-xs text-yellow-800">
              Notifications are currently blocked by your browser. Enable
              browser notifications to receive updates.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSubscriptionsTab = () => {
    if (loadingSubscription) {
      return (
        <div className="p-6">
          <div className="space-y-6 animate-pulse">
            <div className="h-6 w-60 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h3 className="mb-4 text-xl sm:text-[1.578rem] font-medium text-black">
          Subscription & Credits
        </h3>
        <div className="max-w-5xl space-y-6">
          <SubscriptionStatus
            userRole={(userRole || "kindtao") as "kindbossing" | "kindtao"}
          />
        </div>
      </div>
    );
  };

  const renderPreferenceBadges = (
    items: string[] | undefined | null,
    emptyText: string
  ) => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-gray-500">{emptyText}</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  const formatSalaryType = (type?: string | null) => {
    switch (type) {
      case "daily":
        return "per day";
      case "weekly":
        return "per week";
      case "monthly":
        return "per month";
      case "hourly":
        return "per hour";
      default:
        return "";
    }
  };

  const getSalarySummary = () => {
    if (!jobPreferences?.salaryRange) {
      return "Not specified";
    }

    const { min, max, salaryType } = jobPreferences.salaryRange;
    const formatCurrency = (value?: number | null) => {
      if (!value || value <= 0) return null;
      return `₱${value.toLocaleString()}`;
    };

    const formattedMin = formatCurrency(min);
    const formattedMax = formatCurrency(max);
    const salaryTypeLabel = formatSalaryType(salaryType);
    const suffix = salaryTypeLabel ? ` ${salaryTypeLabel}` : "";

    if (formattedMin && formattedMax) {
      return `${formattedMin} - ${formattedMax}${suffix}`;
    }

    if (formattedMin) {
      return `From ${formattedMin}${suffix}`;
    }

    if (formattedMax) {
      return `Up to ${formattedMax}${suffix}`;
    }

    return "Not specified";
  };

  const getRadiusSummary = () => {
    const radius = jobPreferences?.preferredWorkRadiusKm;
    if (!radius || radius <= 0) {
      return "Not specified";
    }
    return `${radius} km`;
  };

  const renderJobPreferencesTab = () => {
    if (!isKindtao) {
      return (
        <div className="p-6">
          <p className="text-sm text-gray-600">
            Job preferences are only available for Kindtao accounts.
          </p>
        </div>
      );
    }

    if (loadingPreferences) {
      return (
        <div className="p-6">
          <div className="space-y-6 animate-pulse">
            <div className="h-6 w-56 bg-gray-200 rounded" />
            <div className="h-4 w-72 bg-gray-200 rounded" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-28 bg-gray-200 rounded" />
              <div className="h-28 bg-gray-200 rounded" />
              <div className="h-28 bg-gray-200 rounded" />
              <div className="h-28 bg-gray-200 rounded" />
            </div>
            <div className="h-10 w-40 bg-gray-200 rounded" />
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl sm:text-[1.578rem] font-medium text-black">
              Job Preferences
            </h3>
            <p className="text-sm text-gray-600">
              Keep your preferences up to date to get better job matches.
            </p>
          </div>
          {!isEditingJobPreferences && (
            <button
              onClick={() => setIsEditingJobPreferences(true)}
              className="inline-flex cursor-pointer items-center justify-center px-4 py-2 rounded-lg bg-[#CC0000] text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              {jobPreferences ? "Edit Preferences" : "Set Preferences"}
            </button>
          )}
        </div>

        {isEditingJobPreferences ? (
          <JobPreferencesInlineEditor
            initialPreferences={jobPreferences || undefined}
            onCancel={() => setIsEditingJobPreferences(false)}
            onSaved={(updated) => {
              setJobPreferences(updated);
              setIsEditingJobPreferences(false);
            }}
          />
        ) : jobPreferences ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Desired Roles
                </h4>
                {renderPreferenceBadges(
                  jobPreferences.desiredJobs,
                  "No roles selected yet."
                )}
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Preferred Locations
                </h4>
                {renderPreferenceBadges(
                  jobPreferences.desiredLocations,
                  "No preferred locations set."
                )}
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Job Types
                </h4>
                {renderPreferenceBadges(
                  jobPreferences.desiredJobTypes,
                  "No job types selected yet."
                )}
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Languages
                </h4>
                {renderPreferenceBadges(
                  jobPreferences.preferredLanguages,
                  "No preferred languages set."
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Salary Expectation
                </h4>
                <p className="text-sm text-gray-700">{getSalarySummary()}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Preferred Work Radius
                </h4>
                <p className="text-sm text-gray-700">{getRadiusSummary()}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
            <p className="text-gray-600 text-sm sm:text-base mb-2">
              You haven't saved any job preferences yet.
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Set your preferred roles, locations, and job types to improve
              matches.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <SettingsLayout
      title="Settings"
      description="Manage your verification, notifications, subscriptions, and account preferences"
      tabs={settingsTabs}
    >
      {renderTabContent()}

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        userRole={(userRole || "kindtao") as "kindbossing" | "kindtao"}
        currentPlan={currentPlan}
      />
    </SettingsLayout>
  );
}
