import { logger } from "@/utils/logger";
import { api } from "@/utils/convex/server";

const XENDIT_API_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_API_URL = "https://api.xendit.co";

interface XenditRecurringPlan {
  reference_id: string;
  customer_id: string;
  recurring_action: "PAYMENT";
  currency: string;
  amount: number;
  schedule: {
    interval: "DAY" | "WEEK" | "MONTH" | "YEAR";
    interval_count: number;
    total_recurrence?: number;
    anchor_date?: string;
  };
  payment_methods: string[];
  description: string;
  metadata?: Record<string, any>;
  success_return_url?: string;
  failure_return_url?: string;
}

interface XenditCheckoutSession {
  reference_id: string;
  currency: string;
  amount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  customer?: {
    given_names: string;
    surname?: string;
    email: string;
    phone_number?: string;
  };
  metadata?: Record<string, any>;
  success_redirect_url?: string;
  failure_redirect_url?: string;
}

/**
 * Create a Xendit recurring plan (subscription)
 */
export async function createXenditRecurringPlan(
  planData: XenditRecurringPlan
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!XENDIT_API_KEY) {
      throw new Error("Xendit API key not configured");
    }

    const response = await fetch(`${XENDIT_API_URL}/recurring`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_API_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify(planData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error("Xendit API error:", errorData);
      return {
        success: false,
        error: `Xendit API error: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    logger.error("Error creating Xendit recurring plan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update a Xendit recurring plan (for upgrades/downgrades)
 */
export async function updateXenditRecurringPlan(
  subscriptionId: string,
  updates: {
    status?: "ACTIVE" | "INACTIVE";
    amount?: number;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!XENDIT_API_KEY) {
      throw new Error("Xendit API key not configured");
    }

    const response = await fetch(`${XENDIT_API_URL}/recurring/${subscriptionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_API_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error("Xendit API error:", errorData);
      return {
        success: false,
        error: `Xendit API error: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    logger.error("Error updating Xendit recurring plan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a Xendit checkout session (for one-time payments like credits)
 */
export async function createXenditCheckoutSession(
  sessionData: XenditCheckoutSession
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!XENDIT_API_KEY) {
      throw new Error("Xendit API key not configured");
    }

    const response = await fetch(`${XENDIT_API_URL}/payment_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_API_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error("Xendit API error:", errorData);
      return {
        success: false,
        error: `Xendit API error: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    logger.error("Error creating Xendit checkout session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update subscription status in database
 * This is called from webhook handlers, so we need to use server-side Convex client
 */
export async function updateSubscriptionStatus(
  xenditSubscriptionId: string,
  status: string,
  updates?: {
    current_period_start?: string;
    current_period_end?: string;
    cancelled_at?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // For webhook handlers, we need to create a server-side Convex client
    // Since webhooks don't have user tokens, we'll use a system token or direct access
    // For now, we'll use the server action context approach
    const { createServerConvexClient } = await import("@/utils/convex/server");
    
    // Create a system-level Convex client (you may need to adjust this based on your setup)
    // For webhooks, we typically need admin/system access
    const convex = await createServerConvexClient();

    // Find subscription by xendit_subscription_id
    const subscriptions = await convex.query(api.subscriptions.getSubscriptionByXenditId, {
      xenditSubscriptionId,
    });

    if (!subscriptions || subscriptions.length === 0) {
      logger.warn("Subscription not found for Xendit ID:", xenditSubscriptionId);
      return { success: false, error: "Subscription not found" };
    }

    const subscription = subscriptions[0];

    // Cancel any other active subscriptions for this user (ensure only 1 active)
    if (status === "active") {
      await convex.mutation(api.subscriptions.cancelActiveSubscriptions, {
        user_id: subscription.user_id,
      });
    }

    const updateData: any = {
      status,
      updated_at: Date.now(),
    };

    if (updates?.current_period_start) {
      updateData.current_period_start = new Date(updates.current_period_start).getTime();
    }
    if (updates?.current_period_end) {
      updateData.current_period_end = new Date(updates.current_period_end).getTime();
    }
    if (updates?.cancelled_at) {
      updateData.cancelled_at = new Date(updates.cancelled_at).getTime();
    }

    await convex.mutation(api.subscriptions.updateSubscription, {
      subscriptionId: subscription._id,
      updates: updateData,
    });

    logger.info("Subscription status updated:", {
      subscriptionId: subscription._id,
      status,
      xenditSubscriptionId,
    });

    return { success: true };
  } catch (error) {
    logger.error("Error updating subscription status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create payment transaction record
 * This is called from webhook handlers, so we use server-side Convex client
 */
export async function createPaymentTransaction(
  transactionData: {
    user_id: string;
    subscription_id?: string;
    amount: number;
    currency: string;
    status: string;
    payment_method?: string;
    xendit_payment_id?: string;
    xendit_action_id?: string;
    metadata?: any;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // For webhook handlers, create server-side Convex client
    const { createServerConvexClient } = await import("@/utils/convex/server");
    const convex = await createServerConvexClient();

    await convex.mutation(api.subscriptions.createPaymentTransaction, {
      ...transactionData,
    });

    logger.info("Payment transaction created:", transactionData);
    return { success: true };
  } catch (error) {
    logger.error("Error creating payment transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify webhook signature (placeholder - Xendit uses callback token)
 */
export async function verifyWebhookSignature(
  signature: string,
  payload: string
): Promise<boolean> {
  // Xendit uses callback token in header, not signature
  // This is handled in the webhook route
  return true;
}

