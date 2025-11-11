import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  createCreditPaymentLink,
  CreateCreditPaymentRequest,
} from "@/services/server/XenditCreditService";
import { BOOST_PACKAGES } from "@/constants/subscriptionPlans";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId, creditType } = body;

    if (!packageId || !creditType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the package
    const packages = BOOST_PACKAGES[creditType as keyof typeof BOOST_PACKAGES];
    if (!packages) {
      return NextResponse.json(
        { success: false, error: "Invalid credit type" },
        { status: 400 }
      );
    }

    const creditPackage = packages.find((p) => p.id === packageId);
    if (!creditPackage) {
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 }
      );
    }

    // Build success and failure URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/api/credits/success?package_id=${packageId}&credit_type=${creditType}`;
    const failureUrl = `${baseUrl}/api/credits/failure?package_id=${packageId}&credit_type=${creditType}`;

    // Create payment link
    const paymentRequest: CreateCreditPaymentRequest = {
      userId: user.id,
      creditType: creditType as "swipe_credits" | "boost_credits",
      packageId: packageId,
      quantity: creditPackage.quantity,
      price: creditPackage.price,
      successUrl,
      failureUrl,
      description: creditPackage.description,
    };

    const result = await createCreditPaymentLink(paymentRequest);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      invoiceId: result.invoiceId,
    });
  } catch (error: any) {
    console.error("Error in credit purchase API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
