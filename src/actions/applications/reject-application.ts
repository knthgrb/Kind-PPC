"use server";

import { createClient } from "@/utils/supabase/server";

export async function rejectApplication(
  applicationId: string
): Promise<{
  success: boolean;
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
        error: "Unauthorized to reject this application",
      };
    }

    // Reject application
    const { error: rejectError } = await supabase
      .from("job_applications")
      .update({ status: "rejected" })
      .eq("id", applicationId);

    if (rejectError) {
      console.error("Error rejecting application:", rejectError);
      return {
        success: false,
        error: "Failed to reject application",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error rejecting application:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

