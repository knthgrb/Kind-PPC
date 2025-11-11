"use server";

import { createClient } from "@/utils/supabase/server";
import {
  XenditSubscriptionPlan,
  UserSubscription,
  PaymentTransaction,
} from "@/types/subscription";
import { SUBSCRIPTION_PLANS } from "@/constants/subscriptionPlans";

const BASE_URL = "https://api.xendit.co";
const API_KEY = process.env.XENDIT_SECRET_KEY;

/**
 * Helper function to get subscription tier from plan ID
 */
function getSubscriptionTierFromPlanId(planId: string): string {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  return plan?.tier || "free";
}

/**
 * Get customer by reference ID
 */
export async function getCustomerByReferenceId(
  referenceId: string
): Promise<{ success: boolean; customer?: any; error?: string }> {
  try {
    if (!API_KEY) {
      throw new Error("Xendit API key not configured");
    }

    const response = await fetch(
      `${BASE_URL}/customers?reference_id=${referenceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(API_KEY + ":").toString(
            "base64"
          )}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, customer: null };
      }
      const errorData = await response.json();
      throw new Error(
        `Xendit API error: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      customer: data.data && data.data.length > 0 ? data.data[0] : null,
    };
  } catch (error: any) {
    console.error("Error fetching Xendit customer:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch customer",
    };
  }
}

/**
 * Create a customer in Xendit
 */
export async function createCustomer(
  userId: string,
  email: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    if (!API_KEY) {
      throw new Error("Xendit API key not configured");
    }

    const referenceId = `customer_${userId}`;

    // Check if customer already exists
    const existingCustomer = await getCustomerByReferenceId(referenceId);
    if (existingCustomer.success && existingCustomer.customer) {
      return {
        success: true,
        customerId: existingCustomer.customer.id,
      };
    }

    const response = await fetch(`${BASE_URL}/customers`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(API_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference_id: referenceId,
        type: "INDIVIDUAL",
        individual_detail: {
          given_names: firstName,
          surname: lastName,
          nationality: "PH",
        },
        email: email,
        addresses: [],
        kyc_documents: [],
        description: `Customer for user ${userId}`,
        date_of_registration: new Date().toISOString().split("T")[0],
        domicile_of_registration: "PH",
        metadata: {
          user_id: userId,
          platform: "kind-platform",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Xendit API error details:", errorData);

      // Handle duplicate reference_id error
      if (errorData.error_code === "DUPLICATE_ERROR") {
        // Try to get the existing customer
        const existingCustomer = await getCustomerByReferenceId(referenceId);
        if (existingCustomer.success && existingCustomer.customer) {
          return {
            success: true,
            customerId: existingCustomer.customer.id,
          };
        }
      }

      throw new Error(
        `Xendit API error: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      customerId: data.id,
    };
  } catch (error: any) {
    console.error("Error creating Xendit customer:", error);
    return {
      success: false,
      error: error.message || "Failed to create customer",
    };
  }
}

/**
 * Create a subscription plan in Xendit
 */
export async function createSubscriptionPlan(
  userId: string,
  customerId: string,
  planId: string,
  amount: number,
  currency: string = "PHP",
  description: string,
  successUrl: string,
  failureUrl: string
): Promise<{
  success: boolean;
  subscription?: XenditSubscriptionPlan;
  error?: string;
}> {
  try {
    if (!API_KEY) {
      throw new Error("Xendit API key not configured");
    }

    const response = await fetch(`${BASE_URL}/recurring/plans`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(API_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference_id: `plan_${planId}_${userId}_${Date.now()}`,
        customer_id: customerId,
        recurring_action: "PAYMENT",
        currency: currency,
        amount: amount,
        schedule: {
          reference_id: `schedule_${planId}_${userId}_${Date.now()}`,
          interval: "MONTH",
          interval_count: 1,
          total_recurrence: 12, // 12 months
          anchor_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          retry_interval: "DAY",
          retry_interval_count: 1,
          total_retry: 3,
          failed_attempt_notifications: [1, 3],
        },
        notification_config: {
          locale: "en",
          recurring_created: ["EMAIL"],
          recurring_succeeded: ["EMAIL"],
          recurring_failed: ["EMAIL"],
        },
        failed_cycle_action: "STOP",
        immediate_action_type: "FULL_AMOUNT",
        payment_link_for_failed_attempt: true,
        metadata: {
          plan_id: planId,
          user_id: userId,
          platform: "kind-platform",
        },
        description: description,
        success_return_url: successUrl,
        failure_return_url: failureUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Xendit API error response:",
        JSON.stringify(errorData, null, 2)
      );
      throw new Error(
        `Xendit API error: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      subscription: data,
    };
  } catch (error: any) {
    console.error("Error creating Xendit subscription plan:", error);
    return {
      success: false,
      error: error.message || "Failed to create subscription plan",
    };
  }
}

/**
 * Get subscription plan details from Xendit
 */
export async function getSubscriptionPlan(subscriptionId: string): Promise<{
  success: boolean;
  subscription?: XenditSubscriptionPlan;
  error?: string;
}> {
  try {
    if (!API_KEY) {
      throw new Error("Xendit API key not configured");
    }

    const response = await fetch(
      `${BASE_URL}/recurring/plans/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(API_KEY + ":").toString(
            "base64"
          )}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Xendit API error: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      subscription: data,
    };
  } catch (error: any) {
    console.error("Error fetching Xendit subscription plan:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch subscription plan",
    };
  }
}

/**
 * Cancel a subscription plan in Xendit
 */
export async function cancelSubscriptionPlan(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!API_KEY) {
      throw new Error("Xendit API key not configured");
    }

    const response = await fetch(
      `${BASE_URL}/recurring/plans/${subscriptionId}/deactivate`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(API_KEY + ":").toString(
            "base64"
          )}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Xendit API error: ${errorData.message || response.statusText}`
      );
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error cancelling Xendit subscription plan:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel subscription plan",
    };
  }
}

/**
 * Get user's subscription from database
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error || !data) {
      return null;
    }

    // Populate subscription_plans from SUBSCRIPTION_PLANS based on xendit_plan_id or subscription_tier
    const subscription = data as UserSubscription;
    const planId = subscription.xendit_plan_id;
    const tier = subscription.subscription_tier;

    // Find matching plan from SUBSCRIPTION_PLANS
    let matchedPlan = null;
    if (planId) {
      matchedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    }
    
    // If no match by planId, try matching by tier
    if (!matchedPlan && tier) {
      // Get user role to match the correct plan
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();
      
      const userRole = userData?.role;
      if (userRole) {
        matchedPlan = SUBSCRIPTION_PLANS.find(
          (p) => p.tier === tier && p.userRole === userRole
        );
      }
    }

    // Populate subscription_plans if we found a match
    if (matchedPlan) {
      subscription.subscription_plans = {
        name: matchedPlan.name,
        tier: matchedPlan.tier,
        price_monthly: matchedPlan.priceMonthly,
        features: matchedPlan.features,
        swipe_credits_monthly: matchedPlan.swipeCreditsMonthly,
        boost_credits_monthly: matchedPlan.boostCreditsMonthly,
      };
    }

    return subscription;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
}

/**
 * Create or update user subscription in database
 */
export async function createUserSubscription(
  userId: string,
  planId: string,
  xenditSubscriptionId: string,
  xenditCustomerId: string,
  amount: number,
  currency: string = "PHP"
): Promise<{
  success: boolean;
  subscription?: UserSubscription;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Calculate period dates
    const now = new Date();
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    // First, check if a subscription already exists for this user and plan
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("xendit_plan_id", planId)
      .single();

    let data, error;

    if (existingSubscription) {
      // Update existing subscription
      const { data: updateData, error: updateError } = await supabase
        .from("subscriptions")
        .update({
          xendit_subscription_id: xenditSubscriptionId,
          xendit_customer_id: xenditCustomerId,
          subscription_tier: getSubscriptionTierFromPlanId(planId),
          status: "pending",
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          amount_paid: amount,
          currency: currency,
          cancel_at_period_end: false,
        })
        .eq("id", existingSubscription.id)
        .select("*")
        .single();

      data = updateData;
      error = updateError;
    } else {
      // Create new subscription
      const { data: insertData, error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          xendit_plan_id: planId,
          xendit_subscription_id: xenditSubscriptionId,
          xendit_customer_id: xenditCustomerId,
          subscription_tier: getSubscriptionTierFromPlanId(planId),
          status: "pending",
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          amount_paid: amount,
          currency: currency,
          cancel_at_period_end: false,
        })
        .select("*")
        .single();

      data = insertData;
      error = insertError;
    }

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Create a payment transaction record for the subscription
    const transactionResult = await createPaymentTransaction(
      userId,
      data.id, // subscription ID
      amount,
      currency,
      "pending", // Initial status
      undefined, // payment_method (will be set when payment is completed)
      undefined, // xendit_payment_id
      xenditSubscriptionId // xendit_action_id
    );

    if (!transactionResult.success) {
      console.warn(
        "Failed to create payment transaction:",
        transactionResult.error
      );
      // Don't fail the subscription creation if transaction creation fails
    }

    return {
      success: true,
      subscription: data as UserSubscription,
    };
  } catch (error: any) {
    console.error("Error creating user subscription:", error);
    return {
      success: false,
      error: error.message || "Failed to create subscription",
    };
  }
}

/**
 * Create a payment transaction record
 */
export async function createPaymentTransaction(
  userId: string,
  subscriptionId: string,
  amount: number,
  currency: string,
  status: string,
  paymentMethod?: string,
  xenditPaymentId?: string,
  xenditActionId?: string
): Promise<{
  success: boolean;
  transaction?: PaymentTransaction;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        amount: amount,
        currency: currency,
        status: status,
        payment_method: paymentMethod,
        xendit_payment_id: xenditPaymentId,
        xendit_action_id: xenditActionId,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      success: true,
      transaction: data as PaymentTransaction,
    };
  } catch (error: any) {
    console.error("Error creating payment transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to create payment transaction",
    };
  }
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  xenditSubscriptionId: string,
  status: string,
  additionalData?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const updateData: Record<string, any> = {
      status: status.toLowerCase(),
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    const { error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("xendit_subscription_id", xenditSubscriptionId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error updating subscription status:", error);
    return {
      success: false,
      error: error.message || "Failed to update subscription status",
    };
  }
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookToken: string
): Promise<boolean> {
  try {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", webhookToken)
      .update(payload)
      .digest("hex");

    return signature === expectedSignature;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}
