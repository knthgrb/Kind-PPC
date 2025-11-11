import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  addCreditsToUser,
  recordCreditPurchase,
} from "@/services/server/XenditCreditService";
import { BOOST_PACKAGES } from "@/constants/subscriptionPlans";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const url = new URL(request.url);
    const packageId = url.searchParams.get("package_id");
    const creditType = url.searchParams.get("credit_type") as
      | "swipe_credits"
      | "boost_credits"
      | null;

    if (!packageId || !creditType) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Find the package
    const packages = BOOST_PACKAGES[creditType as keyof typeof BOOST_PACKAGES];
    if (!packages) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const creditPackage = packages.find((p) => p.id === packageId);
    if (!creditPackage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Add credits to user account
    const addCreditsResult = await addCreditsToUser(
      user.id,
      creditType,
      creditPackage.quantity
    );

    if (!addCreditsResult.success) {
      console.error("Failed to add credits:", addCreditsResult.error);
    }

    // Record the transaction
    const transactionResult = await recordCreditPurchase(
      user.id,
      creditType,
      packageId,
      creditPackage.quantity,
      creditPackage.price,
      "PHP",
      "succeeded"
    );

    if (!transactionResult.success) {
      console.error("Failed to record transaction:", transactionResult.error);
    }

    // Redirect based on user role
    const role = user.user_metadata?.role || "kindtao";
    let redirectUrl = "/";

    if (role === "kindbossing") {
      redirectUrl = "/my-jobs";
    } else if (role === "kindtao") {
      redirectUrl = "/recs";
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error("Error in credit success handler:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
