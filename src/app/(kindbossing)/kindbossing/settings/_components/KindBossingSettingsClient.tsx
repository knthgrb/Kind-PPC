"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getUserSubscription } from "@/actions/subscription/xendit";
import { UserSubscription } from "@/types/subscription";
import { useToastActions } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  IoCardOutline,
  IoShieldCheckmarkOutline,
  IoTrashOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import SubscriptionStatus from "@/components/common/SubscriptionStatus";
import dynamic from "next/dynamic";
import SettingsLayout from "./SettingsLayout";
import { useQuery } from "convex/react";
import { api } from "@/utils/convex/client";
import { FaBolt, FaRocket } from "react-icons/fa";
import { deleteAccount } from "@/actions/account/delete-account";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/AuthService";
import { logger } from "@/utils/logger";

const VerificationTab = dynamic(() => import("./VerificationTab"), {
  ssr: false,
});
const DeleteAccountModal = dynamic(
  () => import("@/components/modals/DeleteAccountModal"),
  {
    ssr: false,
  }
);
const SubscriptionModal = dynamic(
  () => import("@/components/modals/SubscriptionModal"),
  {
    ssr: false,
  }
);

export default function KindBossingSettingsClient() {
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToastActions();
  const { user } = useAuthStore();
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();

  // Get current user data for credits
  const currentUser = useQuery(api.auth.getCurrentUser);
  const userData = useQuery(
    api.users.getUserById,
    currentUser?.userId ? { userId: currentUser.userId } : "skip"
  );

  const settingsTabs = [
    {
      id: "general",
      label: "General",
      icon: IoSettingsOutline,
      description: "Account settings and preferences",
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

  // Load subscription data
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
      } else {
        console.error("Error loading subscription:", result.error);
        showError("Failed to load subscription data");
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
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
        showError(
          result.error || "Failed to delete account. Please try again."
        );
        return;
      }

      // Sign out the user client-side
      await AuthService.signOut();

      // Show success message (though user will be redirected)
      showSuccess("Account deleted successfully");

      // Redirect will happen in the server action, but we can also do it here as a fallback
      router.push("/");
    } catch (error) {
      logger.error("Error deleting account:", error);
      showError("Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralTab();
      case "subscriptions":
        return renderSubscriptionsTab();
      case "verification":
        return <VerificationTab userRole="kindbossing" />;
      default:
        return renderGeneralTab();
    }
  };

  const renderGeneralTab = () => {
    return (
      <div className="p-6">
        <h3 className="mb-4 text-xl sm:text-[1.578rem] font-medium text-black">
          General Settings
        </h3>
        <div className="space-y-6">
          {/* Delete Account Section */}
          <div className="border border-red-200 rounded-lg p-6 bg-red-50">
            <div className="flex items-start gap-4">
              <IoTrashOutline className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-red-900 mb-2">
                  Delete Account
                </h4>
                <p className="text-sm text-red-800 mb-4">
                  Once you delete your account, there is no going back. This
                  will permanently delete your account, job posts, employees,
                  and all associated data.
                </p>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex cursor-pointer items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <IoTrashOutline className="w-4 h-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
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

    const hasActiveSubscription = currentSubscription && currentPlan !== "Free";
    const swipeCredits = userData?.swipe_credits ?? 0;
    const boostCredits = userData?.boost_credits ?? 0;

    return (
      <div className="p-6">
        <h3 className="mb-4 text-xl sm:text-[1.578rem] font-medium text-black">
          Subscription & Credits
        </h3>
        <div className="max-w-5xl space-y-6">
          {/* Credits Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FaBolt className="text-blue-500 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">
                  Swipe Credits
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {swipeCredits >= 999999 ? "Unlimited" : swipeCredits}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {hasActiveSubscription
                  ? currentPlan === "premium"
                    ? "Unlimited daily"
                    : "30 per day"
                  : "1 free per day"}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FaRocket className="text-purple-500 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">
                  Boost Credits
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {boostCredits >= 999999 ? "Unlimited" : boostCredits}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {hasActiveSubscription
                  ? currentPlan === "premium"
                    ? "Unlimited monthly"
                    : "10 per month"
                  : "0 (needs subscription)"}
              </div>
            </div>
          </div>

          <SubscriptionStatus
            userRole="kindbossing"
            onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
          />
        </div>
      </div>
    );
  };

  return (
    <SettingsLayout
      title="Settings"
      description="Manage your account settings, subscriptions, and verification"
      tabs={settingsTabs}
    >
      {renderTabContent()}

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        userRole="kindbossing"
        currentPlan={currentPlan}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
      />
    </SettingsLayout>
  );
}
