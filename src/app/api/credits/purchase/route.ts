import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth-server";
import { createServerConvexClient, api } from "@/utils/convex/server";
import { getCurrentUser } from "@/utils/auth";
import { createXenditCheckoutSession } from "@/services/XenditService";
import { BOOST_PACKAGES } from "@/constants/subscriptionPlans";
import { logger } from "@/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convex = await createServerConvexClient(token);
    const authUser = await getCurrentUser(token, convex);
    const userId =
      (authUser as { userId?: string | null })?.userId ??
      (authUser as { id?: string | null })?.id ??
      (authUser as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { packageId, creditType } = body;

    if (!packageId || !creditType) {
      return NextResponse.json(
        { error: "Missing packageId or creditType" },
        { status: 400 }
      );
    }

    // Get package details
    const packages = BOOST_PACKAGES[creditType as keyof typeof BOOST_PACKAGES];
    if (!packages) {
      return NextResponse.json(
        { error: "Invalid credit type" },
        { status: 400 }
      );
    }

    const packageDetails = packages.find((pkg) => pkg.id === packageId);
    if (!packageDetails) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // Get user details
    const userData = await convex.query(api.users.getUserById, { userId });
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate unique reference ID
    const referenceId = `credit_${userId}_${packageId}_${Date.now()}`;

    // Prepare return URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/settings?tab=subscriptions&credit=success`;
    const failureUrl = `${baseUrl}/settings?tab=subscriptions&credit=failed`;

    // Create Xendit checkout session
    const checkoutResult = await createXenditCheckoutSession({
      reference_id: referenceId,
      currency: packageDetails.currency,
      amount: packageDetails.price,
      items: [
        {
          name: packageDetails.name,
          quantity: 1,
          price: packageDetails.price,
        },
      ],
      customer: {
        given_names: userData.first_name || "User",
        surname: userData.last_name || "",
        email: userData.email,
        phone_number: userData.phone || undefined,
      },
      metadata: {
        purchase_type: "credit_purchase",
        user_id: userId,
        credit_type: creditType,
        package_id: packageId,
        quantity: packageDetails.quantity,
      },
      success_redirect_url: successUrl,
      failure_redirect_url: failureUrl,
    });

    if (!checkoutResult.success || !checkoutResult.data) {
      logger.error("Failed to create checkout session:", checkoutResult.error);
      return NextResponse.json(
        { error: checkoutResult.error || "Failed to create payment link" },
        { status: 500 }
      );
    }

    // Record transaction as pending
    await convex.mutation(api.subscriptions.createPaymentTransaction, {
      user_id: userId,
      amount: packageDetails.price,
      currency: packageDetails.currency,
      status: "pending",
      xendit_payment_id: checkoutResult.data.id,
      metadata: {
        purchase_type: "credit_purchase",
        credit_type: creditType,
        package_id: packageId,
        quantity: packageDetails.quantity,
      },
    });

    logger.info("Credit purchase checkout created", {
      userId,
      packageId,
      creditType,
      checkoutId: checkoutResult.data.id,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: checkoutResult.data.invoice_url || checkoutResult.data.url,
    });
  } catch (error) {
    logger.error("Error creating credit purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

