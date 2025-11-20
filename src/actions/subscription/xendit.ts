"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";
import { UserSubscription } from "@/types/subscription";

export async function getUserSubscription(): Promise<{
  success: boolean;
  subscription?: UserSubscription | null;
  error?: string;
}> {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!convex) {
      return { success: false, error: "Database connection failed" };
    }

    // Extract user ID
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    // Get subscription from Convex
    const subscription = await convex.query(api.subscriptions.getSubscriptionByUser, {
      userId,
    });

    if (!subscription) {
      return { success: true, subscription: null };
    }

    // Map Convex subscription to UserSubscription type
    const userSubscription: UserSubscription = {
      id: subscription._id,
      user_id: subscription.user_id,
      xendit_plan_id: subscription.xendit_plan_id || "",
      subscription_tier: subscription.subscription_tier,
      status: (subscription.status as any) || "inactive",
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start).toISOString()
        : new Date().toISOString(),
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end).toISOString()
        : new Date().toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      xendit_subscription_id: subscription.xendit_subscription_id,
      xendit_customer_id: subscription.xendit_customer_id,
      daily_swipe_limit: subscription.daily_swipe_limit,
      amount_paid: subscription.amount_paid,
      currency: subscription.currency,
      cancelled_at: subscription.cancelled_at
        ? new Date(subscription.cancelled_at).toISOString()
        : undefined,
      created_at: new Date(subscription.created_at).toISOString(),
      updated_at: subscription.updated_at
        ? new Date(subscription.updated_at).toISOString()
        : new Date().toISOString(),
    };

    return { success: true, subscription: userSubscription };
  } catch (err) {
    logger.error("Failed to get user subscription:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to get subscription",
    };
  }
}

export async function cancelSubscription(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!convex) {
      return { success: false, error: "Database connection failed" };
    }

    // Extract user ID
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    // Get current subscription
    const subscription = await convex.query(api.subscriptions.getSubscriptionByUser, {
      userId,
    });

    if (!subscription) {
      return { success: false, error: "No active subscription found" };
    }

    // Get user details for email
    const userData = await convex.query(api.users.getUserById, { userId });

    // Update subscription to cancel at period end
    await convex.mutation(api.subscriptions.upsertSubscription, {
      user_id: userId,
      subscription_tier: subscription.subscription_tier,
      cancel_at_period_end: true,
      cancelled_at: Date.now(),
      status: "cancelled",
      xendit_plan_id: subscription.xendit_plan_id,
      xendit_subscription_id: subscription.xendit_subscription_id,
      xendit_customer_id: subscription.xendit_customer_id,
    });

    // Send cancellation email
    if (userData) {
      const { EmailService } = await import("@/services/EmailService");
      const endDate = subscription.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

      await EmailService.sendSubscriptionCancelledEmail(
        userData.email,
        userData.first_name || null,
        subscription.subscription_tier === "basic"
          ? "Basic"
          : subscription.subscription_tier === "premium"
            ? "Premium"
            : "Subscription",
        endDate
      );
    }

    logger.info("Subscription cancelled:", { userId, subscriptionId: subscription._id });

    return {
      success: true,
      message: "Subscription will be cancelled at the end of the billing period",
    };
  } catch (err) {
    logger.error("Failed to cancel subscription:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel subscription",
    };
  }
}

export async function createSubscription(
  planId: string,
  nextUrl?: string
): Promise<{
  success: boolean;
  subscriptionUrl?: string;
  error?: string;
}> {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!convex) {
      return { success: false, error: "Database connection failed" };
    }

    // Extract user ID
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    // Get plan details
    const { SUBSCRIPTION_PLANS } = await import("@/constants/subscriptionPlans");
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    if (plan.tier === "free") {
      return { success: false, error: "Cannot subscribe to free plan" };
    }

    // Check for existing subscription
    const existingSubscription = await convex.query(
      api.subscriptions.getSubscriptionByUser,
      { userId }
    );

    // Handle upgrade/downgrade: If user has active subscription and wants different plan
    if (
      existingSubscription &&
      existingSubscription.status === "active" &&
      existingSubscription.xendit_plan_id !== planId
    ) {
      // This is an upgrade/downgrade - cancel current subscription and create new one
      // Cancel the current subscription at period end (Xendit will handle the transition)
      if (existingSubscription.xendit_subscription_id) {
        const { updateXenditRecurringPlan } = await import("@/services/XenditService");
        // Deactivate the old subscription in Xendit
        await updateXenditRecurringPlan(
          existingSubscription.xendit_subscription_id,
          { status: "INACTIVE" }
        );
      }

      // Mark old subscription as cancelled
      await convex.mutation(api.subscriptions.updateSubscription, {
        subscriptionId: existingSubscription._id as any,
        updates: {
          status: "cancelled",
          cancel_at_period_end: true,
          cancelled_at: Date.now(),
        },
      });

      logger.info("Cancelled existing subscription for upgrade/downgrade", {
        userId,
        oldPlanId: existingSubscription.xendit_plan_id,
        newPlanId: planId,
      });
    }

    // Check for existing pending subscription with same plan (idempotency)
    if (
      existingSubscription &&
      existingSubscription.xendit_plan_id === planId &&
      existingSubscription.status === "pending"
    ) {
      logger.info("Found existing pending subscription", {
        userId,
        planId,
        subscriptionId: existingSubscription._id,
      });
      return {
        success: false,
        error: "A pending subscription already exists. Please complete the payment or wait for confirmation.",
      };
    }

    // Get user details for Xendit
    const userData = await convex.query(api.users.getUserById, { userId });
    if (!userData) {
      return { success: false, error: "User not found" };
    }

    // Generate unique reference ID for idempotency
    const referenceId = `sub_${userId}_${planId}_${Date.now()}`;

    // Create pending subscription in database first
    const subscriptionId = await convex.mutation(
      api.subscriptions.upsertSubscription,
      {
        user_id: userId,
        subscription_tier: plan.tier,
        plan_id: planId,
        xendit_plan_id: planId,
        status: "pending",
        amount_paid: plan.priceMonthly,
        currency: plan.currency,
        daily_swipe_limit: plan.metadata?.dailySwipeLimit,
      }
    );

    logger.info("Created pending subscription", {
      subscriptionId,
      userId,
      planId,
    });

    // Prepare return URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = nextUrl
      ? `${baseUrl}${nextUrl}?subscription=success`
      : `${baseUrl}/settings?tab=subscriptions&subscription=success`;
    const failureUrl = nextUrl
      ? `${baseUrl}${nextUrl}?subscription=failed`
      : `${baseUrl}/settings?tab=subscriptions&subscription=failed`;

    // Create Xendit recurring plan
    const { createXenditRecurringPlan } = await import("@/services/XenditService");
    const xenditResult = await createXenditRecurringPlan({
      reference_id: referenceId,
      customer_id: userId, // Use user ID as customer ID
      recurring_action: "PAYMENT",
      currency: plan.currency,
      amount: plan.priceMonthly,
      schedule: {
        interval: "MONTH",
        interval_count: 1,
      },
      payment_methods: ["CREDIT_CARD", "DEBIT_CARD", "EWALLET", "BANK_TRANSFER"],
      description: `${plan.name} Plan - ${plan.description}`,
      metadata: {
        user_id: userId,
        plan_id: planId,
        subscription_id: subscriptionId,
        tier: plan.tier,
      },
      success_return_url: successUrl,
      failure_return_url: failureUrl,
    });

    if (!xenditResult.success || !xenditResult.data) {
      // Update subscription status to failed
      await convex.mutation(api.subscriptions.updateSubscription, {
        subscriptionId: subscriptionId as any,
        updates: { status: "incomplete" },
      });

      return {
        success: false,
        error: xenditResult.error || "Failed to create Xendit subscription",
      };
    }

    const xenditSubscription = xenditResult.data;

    // Update subscription with Xendit IDs
    await convex.mutation(api.subscriptions.updateSubscription, {
      subscriptionId: subscriptionId as any,
      updates: {
        xendit_subscription_id: xenditSubscription.id,
        xendit_customer_id: xenditSubscription.customer_id,
        status: "pending", // Keep as pending until webhook confirms
      },
    });

    // Get checkout URL from actions
    const checkoutUrl =
      xenditSubscription.actions?.find((a: any) => a.action === "PAY")?.url ||
      xenditSubscription.actions?.[0]?.url;

    if (!checkoutUrl) {
      return {
        success: false,
        error: "No checkout URL received from Xendit",
      };
    }

    logger.info("Subscription created successfully", {
      subscriptionId,
      userId,
      planId,
      xenditSubscriptionId: xenditSubscription.id,
    });

    return {
      success: true,
      subscriptionUrl: checkoutUrl,
    };
  } catch (err) {
    logger.error("Failed to create subscription:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create subscription",
    };
  }
}

