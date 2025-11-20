import { NextRequest, NextResponse } from "next/server";
import {
  updateSubscriptionStatus,
  verifyWebhookSignature,
  createPaymentTransaction,
} from "@/services/XenditService";
import {
  addCreditsToUser,
  recordCreditPurchase,
} from "@/services/XenditCreditService";
import { EmailService } from "@/services/EmailService";
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

    // Get subscription and user details
    const { createServerConvexClient } = await import("@/utils/convex/server");
    const { api } = await import("@/utils/convex/server");
    const convex = await createServerConvexClient();

    const subscriptions = await convex.query(
      api.subscriptions.getSubscriptionByXenditId,
      {
        xenditSubscriptionId: data.id,
      }
    );

    if (!subscriptions || subscriptions.length === 0) {
      logger.warn("Subscription not found for activation:", data.id);
      return;
    }

    const subscription = subscriptions[0];

    // Update subscription status to active
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await updateSubscriptionStatus(data.id, "active", {
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    });

    // Get user details for email
    const user = await convex.query(api.users.getUserById, {
      userId: subscription.user_id,
    });

    if (user) {
      // Send activation email
      await EmailService.sendSubscriptionActivatedEmail(
        user.email,
        user.first_name || null,
        subscription.subscription_tier === "basic"
          ? "Basic"
          : subscription.subscription_tier === "premium"
            ? "Premium"
            : "Subscription",
        subscription.amount_paid || 0,
        subscription.currency || "PHP"
      );
    }

    logger.log("Subscription activated successfully");
  } catch (error) {
    logger.error("Error handling plan activation:", error);
  }
}

async function handlePlanInactivated(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Plan inactivated:", data.id);

    // Get subscription details before updating
    const { createServerConvexClient } = await import("@/utils/convex/server");
    const { api } = await import("@/utils/convex/server");
    const convex = await createServerConvexClient();

    const subscriptions = await convex.query(
      api.subscriptions.getSubscriptionByXenditId,
      {
        xenditSubscriptionId: data.id,
      }
    );

    if (!subscriptions || subscriptions.length === 0) {
      logger.warn("Subscription not found for inactivation:", data.id);
      return;
    }

    const subscription = subscriptions[0];
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

    // Update subscription status to inactive
    await updateSubscriptionStatus(data.id, "inactive", {
      cancelled_at: new Date().toISOString(),
    });

    // Get user details for email
    const user = await convex.query(api.users.getUserById, {
      userId: subscription.user_id,
    });

    if (user) {
      // Send cancellation email
      await EmailService.sendSubscriptionCancelledEmail(
        user.email,
        user.first_name || null,
        subscription.subscription_tier === "basic"
          ? "Basic"
          : subscription.subscription_tier === "premium"
            ? "Premium"
            : "Subscription",
        endDate
      );
    }

    logger.log("Subscription inactivated successfully");
  } catch (error) {
    logger.error("Error handling plan inactivation:", error);
  }
}

async function handleCycleCreated(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Cycle created:", data.id);

    // Get subscription and user details for upcoming invoice email
    const { createServerConvexClient } = await import("@/utils/convex/server");
    const { api } = await import("@/utils/convex/server");
    const convex = await createServerConvexClient();

    const subscriptions = await convex.query(
      api.subscriptions.getSubscriptionByXenditId,
      {
        xenditSubscriptionId: data.id,
      }
    );

    if (subscriptions && subscriptions.length > 0) {
      const subscription = subscriptions[0];
      const user = await convex.query(api.users.getUserById, {
        userId: subscription.user_id,
      });

      if (user && subscription.current_period_end) {
        // Send upcoming invoice email (7 days before due date)
        const dueDate = new Date(subscription.current_period_end);
        const now = new Date();
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send reminder if within 7 days
        if (daysUntilDue <= 7 && daysUntilDue > 0) {
          await EmailService.sendUpcomingInvoiceEmail(
            user.email,
            user.first_name || null,
            subscription.subscription_tier === "basic"
              ? "Basic"
              : subscription.subscription_tier === "premium"
                ? "Premium"
                : "Subscription",
            subscription.amount_paid || 0,
            subscription.currency || "PHP",
            dueDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          );
        }
      }
    }

    logger.log("New billing cycle created for subscription:", data.id);
  } catch (error) {
    logger.error("Error handling cycle creation:", error);
  }
}

async function handleCycleSucceeded(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Cycle succeeded:", data.id);

    // Update subscription period and ensure it's active
    const now = new Date();
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    const result = await updateSubscriptionStatus(data.id, "active", {
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
    });

    if (result.success) {
      // Get subscription details to create transaction record
      const { createServerConvexClient } = await import(
        "@/utils/convex/server"
      );
      const { api } = await import("@/utils/convex/server");
      const convex = await createServerConvexClient();

      const subscriptions = await convex.query(
        api.subscriptions.getSubscriptionByXenditId,
        {
          xenditSubscriptionId: data.id,
        }
      );

      if (subscriptions && subscriptions.length > 0) {
        const subscription = subscriptions[0];

        // Create payment transaction record
        await createPaymentTransaction({
          user_id: subscription.user_id,
          subscription_id: subscription._id,
          amount: subscription.amount_paid || 0,
          currency: subscription.currency || "PHP",
          status: "succeeded",
          xendit_payment_id: data.id,
          xendit_action_id: data.id,
        });

        // Get user details for email
        const user = await convex.query(api.users.getUserById, {
          userId: subscription.user_id,
        });

        if (user) {
          // Send subscription renewal confirmation email
          await EmailService.sendSubscriptionActivatedEmail(
            user.email,
            user.first_name || null,
            subscription.subscription_tier === "basic"
              ? "Basic"
              : subscription.subscription_tier === "premium"
                ? "Premium"
                : "Subscription",
            subscription.amount_paid || 0,
            subscription.currency || "PHP"
          );
        }

        logger.log("Payment transaction recorded for subscription:", data.id);
      }
    }
  } catch (error) {
    logger.error("Error handling cycle success:", error);
  }
}

async function handleCycleFailed(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Cycle failed:", data.id);

    // Get subscription details before updating
    const { createServerConvexClient } = await import("@/utils/convex/server");
    const { api } = await import("@/utils/convex/server");
    const convex = await createServerConvexClient();

    const subscriptions = await convex.query(
      api.subscriptions.getSubscriptionByXenditId,
      {
        xenditSubscriptionId: data.id,
      }
    );

    if (!subscriptions || subscriptions.length === 0) {
      logger.warn("Subscription not found for failed payment:", data.id);
      return;
    }

    const subscription = subscriptions[0];

    // Update subscription status to past_due
    await updateSubscriptionStatus(data.id, "past_due");

    // Get user details for email
    const user = await convex.query(api.users.getUserById, {
      userId: subscription.user_id,
    });

    if (user) {
      // Send payment failed email
      await EmailService.sendPaymentFailedEmail(
        user.email,
        user.first_name || null,
        subscription.subscription_tier === "basic"
          ? "Basic"
          : subscription.subscription_tier === "premium"
            ? "Premium"
            : "Subscription",
        subscription.amount_paid || 0,
        subscription.currency || "PHP"
      );
    }

    logger.log("Payment failed for subscription:", data.id);
  } catch (error) {
    logger.error("Error handling cycle failure:", error);
  }
}

async function handleCycleRetrying(event: XenditWebhookEvent) {
  try {
    const { data } = event;
    logger.log("Cycle retrying:", data.id);

    // Get subscription details
    const { createServerConvexClient } = await import("@/utils/convex/server");
    const { api } = await import("@/utils/convex/server");
    const convex = await createServerConvexClient();

    const subscriptions = await convex.query(
      api.subscriptions.getSubscriptionByXenditId,
      {
        xenditSubscriptionId: data.id,
      }
    );

    if (subscriptions && subscriptions.length > 0) {
      const subscription = subscriptions[0];
      const user = await convex.query(api.users.getUserById, {
        userId: subscription.user_id,
      });

      if (user) {
        // Send payment failed email with retry information
        // Extract retry date from webhook data if available
        const retryDate = data.schedule?.next_retry_at
          ? new Date(data.schedule.next_retry_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : undefined;

        await EmailService.sendPaymentFailedEmail(
          user.email,
          user.first_name || null,
          subscription.subscription_tier === "basic"
            ? "Basic"
            : subscription.subscription_tier === "premium"
              ? "Premium"
              : "Subscription",
          subscription.amount_paid || 0,
          subscription.currency || "PHP",
          retryDate
        );
      }
    }

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

      // Get user details for email
      const { createServerConvexClient } = await import(
        "@/utils/convex/server"
      );
      const { api } = await import("@/utils/convex/server");
      const convex = await createServerConvexClient();

      const user = await convex.query(api.users.getUserById, {
        userId: user_id,
      });

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

        // Send credit purchase confirmation email
        if (user) {
          await EmailService.sendCreditPurchaseEmail(
            user.email,
            user.first_name || null,
            credit_type,
            quantity,
            data.amount,
            data.currency
          );
        }
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
