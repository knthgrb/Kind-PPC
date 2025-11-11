import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const url = new URL(request.url);
    const packageId = url.searchParams.get("package");
    const cancelled = url.searchParams.get("cancelled");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 1) Prefer an active subscription created recently and/or matching the plan
    const { data: recentActiveSubs } = await supabase
      .from("subscriptions")
      .select("id, xendit_plan_id, status, current_period_start")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("current_period_start", { ascending: false })
      .limit(1);

    let verified = false;

    if (recentActiveSubs && recentActiveSubs.length > 0) {
      const sub = recentActiveSubs[0];
      // If packageId provided, ensure it matches; else accept any recent active
      if (!packageId || sub.xendit_plan_id === packageId) {
        verified = true;
      }
    }

    // 2) Fallback: successful payment in the last 30 minutes
    if (!verified) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("id, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "succeeded")
        .gte("created_at", thirtyMinAgo)
        .order("created_at", { ascending: false })
        .limit(1);

      if (tx && tx.length > 0) {
        verified = true;
      }
    }

    // Decide redirect based on user's role or plan
    const role = user.user_metadata?.role || "kindtao";
    let nextUrl = "/";

    // If they just subscribed, a sensible destination is subscription settings
    if (verified) {
      nextUrl = "/settings";
      // Optional: role-based dashboard landing
      if (role === "kindbossing") {
        nextUrl = "/my-jobs"; // adjust if you have a specific bossing dashboard
      } else if (role === "kindtao") {
        nextUrl = "/recs"; // adjust if you have a specific tao dashboard
      }
    }

    // Redirect to the appropriate page with success or cancel message
    const redirectUrl = new URL(nextUrl, request.url);
    if (cancelled === "true") {
      redirectUrl.searchParams.set("subscription", "cancelled");
    } else {
      redirectUrl.searchParams.set("subscription", "success");
    }
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("/api/checkout/verify error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    const body = await request.json().catch(() => ({}));
    const { packageId } = body || {};

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { verified: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1) Prefer an active subscription created recently and/or matching the plan
    const { data: recentActiveSubs } = await supabase
      .from("subscriptions")
      .select("id, xendit_plan_id, status, current_period_start")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("current_period_start", { ascending: false })
      .limit(1);

    let verified = false;

    if (recentActiveSubs && recentActiveSubs.length > 0) {
      const sub = recentActiveSubs[0];
      // If packageId provided, ensure it matches; else accept any recent active
      if (!packageId || sub.xendit_plan_id === packageId) {
        verified = true;
      }
    }

    // 2) Fallback: successful payment in the last 30 minutes
    if (!verified) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("id, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "succeeded")
        .gte("created_at", thirtyMinAgo)
        .order("created_at", { ascending: false })
        .limit(1);

      if (tx && tx.length > 0) {
        verified = true;
      }
    }

    // Decide redirect based on user's role or plan
    const role = user.user_metadata?.role || "kindtao";
    let nextUrl = "/";

    // If they just subscribed, a sensible destination is subscription settings
    if (verified) {
      nextUrl = "/settings";
      // Optional: role-based dashboard landing
      if (role === "kindbossing") {
        nextUrl = "/my-jobs"; // adjust if you have a specific bossing dashboard
      } else if (role === "kindtao") {
        nextUrl = "/recs"; // adjust if you have a specific tao dashboard
      }
    }

    return NextResponse.json({ verified, nextUrl });
  } catch (error) {
    console.error("/api/checkout/verify error:", error);
    return NextResponse.json(
      { verified: false, error: "Server error" },
      { status: 500 }
    );
  }
}
