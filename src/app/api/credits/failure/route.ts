import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recordCreditPurchase } from "@/services/server/XenditCreditService";
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

    // Record the failed transaction
    const transactionResult = await recordCreditPurchase(
      user.id,
      creditType,
      packageId,
      creditPackage.quantity,
      creditPackage.price,
      "PHP",
      "failed"
    );

    if (!transactionResult.success) {
      console.error(
        "Failed to record failed transaction:",
        transactionResult.error
      );
    }

    // Redirect back to the page with an error message
    const role = user.user_metadata?.role || "kindtao";
    let redirectUrl = "/";

    if (role === "kindbossing") {
      redirectUrl = "/my-jobs";
    } else if (role === "kindtao") {
      redirectUrl = "/recs";
    }

    return NextResponse.redirect(
      new URL(`${redirectUrl}?error=payment_failed`, request.url)
    );
  } catch (error) {
    console.error("Error in credit failure handler:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
