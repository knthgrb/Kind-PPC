"use server";

import { createClient } from "@/utils/supabase/server";

const BASE_URL = "https://api.xendit.co";
const API_KEY = process.env.XENDIT_SECRET_KEY;

export interface CreateCreditPaymentRequest {
  userId: string;
  creditType: "swipe_credits" | "boost_credits";
  packageId: string;
  quantity: number;
  price: number;
  successUrl: string;
  failureUrl: string;
  description?: string;
}

export interface CreateCreditPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  invoiceId?: string;
  error?: string;
}

/**
 * Create a payment link for credit purchases using Xendit
 */
export async function createCreditPaymentLink(
  request: CreateCreditPaymentRequest
): Promise<CreateCreditPaymentResponse> {
  try {
    if (!API_KEY) {
      throw new Error("Xendit API key not configured");
    }

    const referenceId = `credit_${request.creditType}_${
      request.userId
    }_${Date.now()}`;

    const response = await fetch(`${BASE_URL}/v2/invoices`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(API_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: referenceId,
        amount: request.price,
        currency: "PHP",
        description:
          request.description ||
          `${request.quantity} ${request.creditType.replace("_", " ")}`,
        invoice_duration: 86400, // 24 hours in seconds
        customer: {
          user_id: request.userId,
        },
        success_redirect_url: request.successUrl,
        failure_redirect_url: request.failureUrl,
        metadata: {
          user_id: request.userId,
          credit_type: request.creditType,
          package_id: request.packageId,
          quantity: request.quantity,
          platform: "kind-platform",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Xendit API error:", errorData);
      throw new Error(
        `Xendit API error: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      paymentUrl: data.invoice_url,
      invoiceId: data.id,
    };
  } catch (error: any) {
    console.error("Error creating Xendit credit payment link:", error);
    return {
      success: false,
      error: error.message || "Failed to create payment link",
    };
  }
}

/**
 * Add credits to user account after successful payment
 */
export async function addCreditsToUser(
  userId: string,
  creditType: "swipe_credits" | "boost_credits",
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current credits
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("swipe_credits, boost_credits")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      throw new Error("Failed to fetch user data");
    }

    const currentCredits =
      creditType === "swipe_credits"
        ? user.swipe_credits || 0
        : user.boost_credits || 0;
    const newCredits = currentCredits + quantity;

    // Update user credits
    const updateData: Record<string, number> = {};
    updateData[creditType] = newCredits;

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error adding credits:", error);
    return {
      success: false,
      error: error.message || "Failed to add credits",
    };
  }
}

/**
 * Record a credit purchase transaction
 */
export async function recordCreditPurchase(
  userId: string,
  creditType: "swipe_credits" | "boost_credits",
  packageId: string,
  quantity: number,
  amount: number,
  currency: string = "PHP",
  status: string = "pending",
  invoiceId?: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Insert into payment_transactions
    const { data, error } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId,
        subscription_id: null,
        amount: amount,
        currency: currency,
        status: status as any,
        payment_method: "XENDIT",
        xendit_payment_id: invoiceId,
        metadata: {
          credit_type: creditType,
          package_id: packageId,
          quantity: quantity,
          purchase_type: "credit_purchase",
        },
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      success: true,
      transactionId: data.id,
    };
  } catch (error: any) {
    console.error("Error recording credit purchase:", error);
    return {
      success: false,
      error: error.message || "Failed to record credit purchase",
    };
  }
}
