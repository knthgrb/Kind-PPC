import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  // Verify cron secret (recommended for security)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
