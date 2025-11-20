"use client";

import React, { useState, useEffect } from "react";
import {
  FaCheck,
  FaTimes,
  FaCrown,
  FaStar,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { SUBSCRIPTION_PLANS } from "@/constants/subscriptionPlans";
import { useToastActions } from "@/stores/useToastStore";
import { UserSubscription } from "@/types/subscription";
import {
  getUserSubscription,
  createSubscription,
} from "@/actions/subscription/xendit";
import PaymentMethodDisplay from "@/components/common/PaymentMethodDisplay";
import Image from "next/image";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "kindbossing" | "kindtao";
  currentPlan?: string;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  userRole,
  currentPlan = "Free",
}: SubscriptionModalProps) {
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const { showSuccess, showError, showWarning, showInfo } = useToastActions();

  // Get subscription plans excluding free (only paid plans for upgrade/downgrade)
  const availablePlans = SUBSCRIPTION_PLANS.filter(
    (plan) => plan.userRole === userRole && plan.tier !== "free"
  );

  // Load current subscription when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCurrentSubscription();
    }
  }, [isOpen]);

  // Listen for subscription updates (e.g., after successful payment)
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      if (isOpen) {
        loadCurrentSubscription();
      }
    };

    window.addEventListener("subscriptionUpdated", handleSubscriptionUpdate);
    return () => {
      window.removeEventListener(
        "subscriptionUpdated",
        handleSubscriptionUpdate
      );
    };
  }, [isOpen]);

  const loadCurrentSubscription = async () => {
    try {
      setLoading(true);
      const result = await getUserSubscription();

      if (result.success) {
        setCurrentSubscription(result.subscription ?? null);
      }
    } catch (error) {
      console.error("Error loading current subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePlanSelect = async (plan: any) => {
    if (plan.priceMonthly === 0 || plan.tier === "free") {
      // Free plan - no payment needed, just show info
      showInfo("You're already on the free plan or this is the free plan.");
      return;
    }

    // Check if user already has this plan
    if (
      currentSubscription &&
      currentSubscription.xendit_plan_id === plan.id &&
      currentSubscription.status === "active"
    ) {
      showInfo("You are already subscribed to this plan.");
      return;
    }

    setProcessingPlanId(plan.id);
    setErrorMessage("");

    try {
      // Create subscription with Xendit, passing current page as next URL
      // This will handle upgrades/downgrades automatically
      const currentUrl = window.location.pathname + window.location.search;
      const result = await createSubscription(plan.id, currentUrl);

      if (result.success && result.subscriptionUrl) {
        // Redirect to Xendit payment page
        window.location.href = result.subscriptionUrl;
      } else {
        setProcessingPlanId(null);
        setErrorMessage(result.error || "Payment processing failed");
        showError(result.error || "Payment processing failed");
      }
    } catch (error: any) {
      setProcessingPlanId(null);
      setErrorMessage(error.message || "An unexpected error occurred");
      showError(error.message || "An unexpected error occurred");
    }
  };

  const handleClose = () => {
    onClose();
    setProcessingPlanId(null);
    setErrorMessage("");
  };

  const getPlanComparison = (plan: any) => {
    if (!currentSubscription) return null;

    const currentPlan = currentSubscription.subscription_plans;
    if (!currentPlan) return null;

    const currentPrice = currentPlan.price_monthly || 0;
    const newPrice = plan.priceMonthly;

    if (newPrice > currentPrice) {
      return { type: "upgrade", difference: newPrice - currentPrice };
    } else if (newPrice < currentPrice) {
      return { type: "downgrade", difference: currentPrice - newPrice };
    }

    return null;
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "basic":
        return <FaStar className="text-blue-500" />;
      case "premium":
        return <FaCrown className="text-purple-500" />;
      default:
        return <FaCheck className="text-green-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get plan features from the plan object
  const getPlanFeatures = (plan: any) => {
    return plan.features || [];
  };

  return (
    <div className="fixed inset-0 z-100 bg-white">
      <div className="h-full w-full overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/kindLogo.png"
              alt="Kind Logo"
              width={100}
              height={100}
            />
          </div>
          <button
            onClick={handleClose}
            className="p-3 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="text-gray-500 text-lg" />
          </button>
        </div>

        {/* Swipe Credits Selection */}
        <div className="p-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-[#12223B] mb-2">
              Choose Your Plan
            </h3>
            <p className="text-gray-600 mb-4">
              Select a monthly subscription plan with daily swipe credits
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto px-4">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative rounded-xl border-2 border-gray-200 bg-white p-6 w-80 animate-pulse"
                >
                  <div className="h-6 bg-gray-200 rounded w-24 mx-auto mb-4"></div>
                  <div className="text-center mb-6">
                    <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-40 mx-auto mb-4"></div>
                  </div>
                  <div className="space-y-3 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-4 h-4 bg-gray-200 rounded mt-0.5"></div>
                        <div className="h-3 bg-gray-200 rounded flex-1"></div>
                      </div>
                    ))}
                  </div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Plans */}
          {!loading && (
            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto px-4">
              {availablePlans.map((plan) => {
                const comparison = getPlanComparison(plan);
                const currentPlanRecord =
                  currentSubscription?.subscription_plans || null;
                const planId = plan.id ?? `${plan.tier}-${plan.userRole}`;

                const sanitize = (value: string) =>
                  value
                    .toLowerCase()
                    .replace(/plan/g, "")
                    .replace(/[^a-z0-9]+/g, "");

                const knownIdentifiers = [
                  currentSubscription?.xendit_plan_id,
                  currentSubscription?.subscription_tier,
                  currentPlanRecord?.tier,
                  currentPlanRecord?.name,
                ].filter(Boolean) as string[];

                const normalizedIdentifiers = knownIdentifiers.map((value) =>
                  sanitize(value)
                );
                const planComparators = [
                  plan.id,
                  plan.tier,
                  plan.name,
                  `${plan.tier}-${plan.userRole}`,
                ]
                  .filter(Boolean)
                  .map((value) => sanitize(value));

                const isCurrentPlan = planComparators.some((value) =>
                  normalizedIdentifiers.includes(value)
                );

                return (
                  <div
                    key={planId}
                    className={`relative rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 w-80 flex flex-col ${
                      isCurrentPlan
                        ? "border-green-500 bg-green-50"
                        : plan.tier === "premium"
                          ? "border-[#CC0000] bg-white"
                          : "border-gray-200 bg-white"
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Current Plan
                        </span>
                      </div>
                    )}

                    {!isCurrentPlan && plan.tier === "premium" && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-[#CC0000] text-white px-4 py-1 rounded-full text-sm font-medium">
                          Best Value
                        </span>
                      </div>
                    )}

                    {comparison && !isCurrentPlan && (
                      <div className="absolute -top-3 right-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            comparison.type === "upgrade"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {comparison.type === "upgrade" ? (
                            <>
                              <FaArrowUp className="text-xs" />
                              Upgrade (+₱{comparison.difference})
                            </>
                          ) : (
                            <>
                              <FaArrowDown className="text-xs" />
                              Downgrade (-₱{comparison.difference})
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-[#12223B] mb-2">
                        {plan.name}
                      </h3>
                      <div className="mb-3">
                        {plan.priceMonthly === 0 ? (
                          <span className="text-3xl font-bold text-gray-700">
                            Free
                          </span>
                        ) : (
                          <>
                            <span className="text-3xl font-bold text-[#CC0000]">
                              ₱{plan.priceMonthly.toLocaleString()}
                            </span>
                            <span className="text-gray-500 text-sm ml-1">
                              /month
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {plan.description}
                      </p>
                    </div>

                    <div className="space-y-3 mb-6 grow">
                      {getPlanFeatures(plan).map(
                        (feature: string, featureIndex: number) => (
                          <div
                            key={featureIndex}
                            className="flex items-start gap-3"
                          >
                            <FaCheck className="text-green-500 text-sm mt-0.5 shrink-0" />
                            <span className="text-sm text-gray-700">
                              {feature}
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    <div className="text-center mt-auto">
                      <button
                        onClick={() => handlePlanSelect(plan)}
                        disabled={
                          processingPlanId === planId || !!isCurrentPlan
                        }
                        className={`w-full cursor-pointer py-3 px-4 rounded-lg font-medium transition-colors ${
                          isCurrentPlan
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-[#CC0000] text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                      >
                        {processingPlanId === planId ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : comparison ? (
                          comparison.type === "upgrade" ? (
                            "Upgrade Now"
                          ) : (
                            "Downgrade Now"
                          )
                        ) : (
                          "Subscribe Now"
                        )}
                      </button>
                      {isCurrentPlan && (
                        <p className="mt-2 text-xs font-medium text-green-700">
                          You're already subscribed to this plan.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
