import { NextRequest, NextResponse } from "next/server";
import {
  updateSubscriptionStatus,
  verifyWebhookSignature,
  createPaymentTransaction,
} from "@/services/server/XenditService";
import {
  addCreditsToUser,
  recordCreditPurchase,
} from "@/services/server/XenditCreditService";
import { XenditWebhookEvent } from "@/types/subscription";
import { logger } from "@/utils/logger";
import { BOOST_PACKAGES } from "@/constants/subscriptionPlans";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (!webhookToken) {
      logger.error("Xendit webhook token not configured");
      return NextResponse.json(
        { error: "Webhook token not configured" },
        { status: 500 }
      );
    }

    // For Xendit, the signature verification is different
    // The X-CALLBACK-TOKEN header contains the webhook token, not a signature
    const receivedToken = request.headers.get("x-callback-token");
    if (!receivedToken || receivedToken !== webhookToken) {
      logger.error("Invalid webhook token");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: XenditWebhookEvent = JSON.parse(body);
    logger.log("Received Xendit webhook:", event.type, event.data.id);

    // Handle different webhook events
    switch (event.type) {
      case "recurring.plan.activated":
        await handlePlanActivated(event);
        break;

      case "recurring.plan.inactivated":
        await handlePlanInactivated(event);
        break;

      case "recurring.cycle.created":
        await handleCycleCreated(event);
        break;

      case "recurring.cycle.succeeded":
        await handleCycleSucceeded(event);
        break;

      case "recurring.cycle.failed":
        await handleCycleFailed(event);
        break;

      case "recurring.cycle.retrying":
        await handleCycleRetrying(event);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event);
        break;

      case "invoice.cancelled":
        await handleInvoiceCancelled(event);
        break;

      case "invoice.expired":
        await handleInvoiceExpired(event);
        break;

      default:
        logger.log("Unhandled webhook event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Error processing Xendit webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handlePlanActivated(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Plan activated:", data.id);

    // Update subscription status to active
    await updateSubscriptionStatus(data.id, "active", {
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // 30 days from now
    });

    logger.log("Subscription activated successfully");
  } catch (error) {
    logger.error("Error handling plan activation:", error);
  }
}

async function handlePlanInactivated(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Plan inactivated:", data.id);

    // Update subscription status to inactive
    await updateSubscriptionStatus(data.id, "inactive", {
      cancelled_at: new Date().toISOString(),
    });

    logger.log("Subscription inactivated successfully");
  } catch (error) {
    logger.error("Error handling plan inactivation:", error);
  }
}

async function handleCycleCreated(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Cycle created:", data.id);

    // Log cycle creation for monitoring
    logger.log("New billing cycle created for subscription:", data.id);
  } catch (error) {
    logger.error("Error handling cycle creation:", error);
  }
}

async function handleCycleSucceeded(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Cycle succeeded:", data.id);

    // Update subscription period
    const now = new Date();
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    await updateSubscriptionStatus(data.id, "active", {
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
    });

    // Create payment transaction record
    // Note: You might need to extract payment details from the webhook data
    // This is a simplified version - you may need to adjust based on actual webhook payload
    logger.log("Payment succeeded for subscription:", data.id);

    // TODO: Extract actual payment details from webhook data
    // For now, we'll create a basic transaction record
    // You may need to get the subscription details to get user_id and amount
    logger.log("Creating payment transaction for successful payment");
  } catch (error) {
    logger.error("Error handling cycle success:", error);
  }
}

async function handleCycleFailed(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Cycle failed:", data.id);

    // Update subscription status to past_due
    await updateSubscriptionStatus(data.id, "past_due");

    logger.log("Payment failed for subscription:", data.id);
  } catch (error) {
    logger.error("Error handling cycle failure:", error);
  }
}

async function handleCycleRetrying(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Cycle retrying:", data.id);

    // Log retry attempt
    logger.log("Payment retry in progress for subscription:", data.id);
  } catch (error) {
    logger.error("Error handling cycle retry:", error);
  }
}

async function handleInvoicePaid(event: any) {
  try {
    const { data } = event;
    logger.log("Invoice paid:", data.id);

    // Check if this is a credit purchase
    const metadata = data.metadata;
    if (metadata && metadata.purchase_type === "credit_purchase") {
      const { user_id, credit_type, package_id, quantity } = metadata;

      // Add credits to user account
      const addCreditsResult = await addCreditsToUser(
        user_id,
        credit_type,
        quantity
      );

      if (!addCreditsResult.success) {
        logger.error("Failed to add credits:", addCreditsResult.error);
      } else {
        logger.log(`Added ${quantity} ${credit_type} to user ${user_id}`);
      }

      // Update transaction record
      const transactionResult = await recordCreditPurchase(
        user_id,
        credit_type,
        package_id,
        quantity,
        data.amount,
        data.currency,
        "succeeded",
        data.id
      );

      if (!transactionResult.success) {
        logger.error("Failed to record transaction:", transactionResult.error);
      }
    }
  } catch (error) {
    logger.error("Error handling invoice payment:", error);
  }
}

async function handleInvoiceCancelled(event: any) {
  try {
    const { data } = event;
    logger.log("Invoice cancelled:", data.id);

    // Record failed transaction if applicable
    const metadata = data.metadata;
    if (metadata && metadata.purchase_type === "credit_purchase") {
      const { user_id, credit_type, package_id, quantity } = metadata;

      await recordCreditPurchase(
        user_id,
        credit_type,
        package_id,
        quantity,
        data.amount,
        data.currency,
        "failed",
        data.id
      );
    }
  } catch (error) {
    logger.error("Error handling invoice cancellation:", error);
  }
}

async function handleInvoiceExpired(event: any) {
  try {
    const { data } = event;
    logger.log("Invoice expired:", data.id);

    // Record failed transaction if applicable
    const metadata = data.metadata;
    if (metadata && metadata.purchase_type === "credit_purchase") {
      const { user_id, credit_type, package_id, quantity } = metadata;

      await recordCreditPurchase(
        user_id,
        credit_type,
        package_id,
        quantity,
        data.amount,
        data.currency,
        "failed",
        data.id
      );
    }
  } catch (error) {
    logger.error("Error handling invoice expiration:", error);
  }
}
