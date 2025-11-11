import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  // Verify this is a Vercel cron job request
  // Vercel automatically sets the x-vercel-cron header for scheduled cron jobs
  const vercelCronHeader = request.headers.get("x-vercel-cron");

  // Optional: Also check for custom CRON_SECRET if set
  const customSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  // Verify request is from Vercel cron OR has valid custom secret
  const isValidVercelCron = vercelCronHeader === "1";
  const isValidCustomSecret =
    customSecret && authHeader === `Bearer ${customSecret}`;

  if (!isValidVercelCron && !isValidCustomSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Update expired jobs to closed status
    const { data, error } = await supabase
      .from("job_posts")
      .update({
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "active")
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (error) {
      console.error("Error closing expired jobs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      closed: data?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error closing expired jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
