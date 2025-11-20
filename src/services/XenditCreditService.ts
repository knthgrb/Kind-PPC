import { logger } from "@/utils/logger";
import { api } from "@/utils/convex/server";

/**
 * Add credits to user account
 * This is called from webhook handlers, so we use server-side Convex client
 */
export async function addCreditsToUser(
  userId: string,
  creditType: "swipe_credits" | "boost_credits",
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // For webhook handlers, create server-side Convex client
    const { createServerConvexClient } = await import("@/utils/convex/server");
    const convex = await createServerConvexClient();

    // Get current user
    const user = await convex.query(api.users.getUserById, { userId });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Calculate new credit amount
    const currentCredits = creditType === "swipe_credits" 
      ? (user.swipe_credits || 0)
      : (user.boost_credits || 0);

    // Handle unlimited credits (999999+)
    const newCredits = quantity === -1 
      ? 999999 
      : currentCredits + quantity;

    // Update user credits
    const updates: any = {};
    if (creditType === "swipe_credits") {
      updates.swipe_credits = newCredits;
    } else {
      updates.boost_credits = newCredits;
    }

    await convex.mutation(api.users.updateUser, {
      userId,
      updates,
    });

    logger.info("Credits added to user:", {
      userId,
      creditType,
      quantity,
      newTotal: newCredits,
    });

    return { success: true };
  } catch (error) {
    logger.error("Error adding credits to user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Record credit purchase transaction
 * This is called from webhook handlers, so we use server-side Convex client
 */
export async function recordCreditPurchase(
  userId: string,
  creditType: "swipe_credits" | "boost_credits",
  packageId: string,
  quantity: number,
  amount: number,
  currency: string,
  status: string,
  xenditInvoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // For webhook handlers, create server-side Convex client
    const { createServerConvexClient } = await import("@/utils/convex/server");
    const convex = await createServerConvexClient();

    await convex.mutation(api.subscriptions.createPaymentTransaction, {
      user_id: userId,
      amount,
      currency,
      status,
      xendit_payment_id: xenditInvoiceId,
      metadata: {
        purchase_type: "credit_purchase",
        credit_type: creditType,
        package_id: packageId,
        quantity,
      },
    });

    logger.info("Credit purchase recorded:", {
      userId,
      creditType,
      packageId,
      quantity,
      amount,
      status,
    });

    return { success: true };
  } catch (error) {
    logger.error("Error recording credit purchase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

