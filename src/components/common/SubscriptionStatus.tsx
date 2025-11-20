"use client";

import React, { useState, useEffect } from "react";
import { FaCrown, FaStar, FaCheck, FaRocket, FaBolt } from "react-icons/fa";
import { useToastActions } from "@/stores/useToastStore";
import { UserSubscription } from "@/types/subscription";
import {
  getUserSubscription,
  cancelSubscription,
} from "@/actions/subscription/xendit";
import { format } from "date-fns";

interface SubscriptionStatusProps {
  userRole: "kindbossing" | "kindtao";
  onUpgradeClick?: () => void;
}

export default function SubscriptionStatus({
  userRole,
  onUpgradeClick,
}: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useToastActions();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const result = await getUserSubscription();

      if (result.success) {
        setSubscription(result.subscription ?? null);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    const cancelAtPeriodEnd = window.confirm(
      "Would you like to cancel at the end of your billing period? (Recommended)\n\nClick OK to cancel at period end, or Cancel to cancel immediately."
    );

    if (cancelAtPeriodEnd !== null) {
      try {
        setCancelling(true);

        const result = await cancelSubscription();

        if (result.success) {
          showSuccess(
            result.message || "Subscription cancelled successfully",
            5000
          );
          // Reload subscription to update UI
          await loadSubscription();
        } else {
          showError(result.error || "Failed to cancel subscription");
        }
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        showError("An unexpected error occurred");
      } finally {
        setCancelling(false);
      }
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "free":
        return <FaCheck className="text-green-500" />;
      case "basic":
        return <FaStar className="text-blue-500" />;
      case "premium":
        return <FaCrown className="text-purple-500" />;
      case "enterprise":
        return <FaRocket className="text-orange-500" />;
      default:
        return <FaCheck className="text-green-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-100 text-gray-700";
      case "basic":
        return "bg-blue-100 text-blue-700";
      case "premium":
        return "bg-purple-100 text-purple-700";
      case "enterprise":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  // Get tier and name with fallbacks
  const tier =
    subscription?.subscription_plans?.tier ||
    subscription?.subscription_tier ||
    "free";
  const planName =
    subscription?.subscription_plans?.name ||
    (tier === "free"
      ? "Free Plan"
      : tier.charAt(0).toUpperCase() + tier.slice(1) + " Plan");

  const hasActiveSubscription =
    subscription && subscription.status === "active" && tier !== "free";

  return (
    <div className="space-y-6">
      {hasActiveSubscription ? (
        // Active Subscription View
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getTierIcon(tier)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {planName}
                </h3>
                <p className="text-sm text-gray-600">
                  Active subscription - {tier} tier
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(
                tier
              )}`}
            >
              {tier.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Next Billing Date:</span>
              <span className="font-medium">
                {subscription.current_period_end
                  ? formatDate(subscription.current_period_end)
                  : "Unknown"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600">
                {subscription.status?.toUpperCase() || "ACTIVE"}
              </span>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Your subscription will end on{" "}
                  {formatDate(subscription.current_period_end)}.
                </p>
              </div>
            )}
          </div>

          {/* Features List */}
          {subscription?.subscription_plans?.features && (
            <div className="mb-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Plan Features:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subscription.subscription_plans.features.map(
                  (feature: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <FaCheck className="text-green-500 text-xs" />
                      <span>{feature}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!subscription.cancel_at_period_end && (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 py-2 px-4 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            )}

            <button
              onClick={() => {
                if (onUpgradeClick) {
                  onUpgradeClick();
                } else {
                  window.dispatchEvent(
                    new CustomEvent("openSubscriptionModal")
                  );
                }
              }}
              className="flex-1 py-2 px-4 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Change Plan
            </button>
          </div>
        </div>
      ) : (
        // No Active Subscription - Show Upgrade Button
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                Upgrade Your Plan
              </h4>
              <p className="text-sm text-gray-600">
                Unlock more features and credits with a subscription plan.
              </p>
            </div>
            <button
              onClick={() => {
                if (onUpgradeClick) {
                  onUpgradeClick();
                } else {
                  window.dispatchEvent(
                    new CustomEvent("openSubscriptionModal")
                  );
                }
              }}
              className="inline-flex cursor-pointer items-center justify-center px-6 py-3 rounded-lg bg-[#CB0000] text-white text-sm font-semibold hover:bg-[#a10000] transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
