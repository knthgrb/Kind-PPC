"use server";

import { createClient } from "@/utils/supabase/server";

export async function approveApplication(
  applicationId: string,
  jobId: string,
  applicantId: string
): Promise<{
  success: boolean;
  matchId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Verify application exists and belongs to user's job
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .select(
        `
        *,
        job_posts!inner(kindbossing_user_id)
      `
      )
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Error fetching application:", appError);
      return {
        success: false,
        error: "Application not found",
      };
    }

    // Verify job belongs to user
    if (application.job_posts?.kindbossing_user_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized to approve this application",
      };
    }

    // Create a match
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .insert({
        kindbossing_user_id: user.id,
        kindtao_user_id: applicantId,
        job_post_id: jobId,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (matchError) {
      console.error("Error creating match:", matchError);
      return {
        success: false,
        error: "Failed to create match",
      };
    }

    // Update application status to approved
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({ status: "approved" })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Error updating application:", updateError);
      // Rollback match creation if application update fails
      await supabase.from("matches").delete().eq("id", matchData.id);
      return {
        success: false,
        error: "Failed to update application status",
      };
    }

    return {
      success: true,
      matchId: matchData?.id,
    };
  } catch (error) {
    console.error("Error approving application:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

