"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { logger } from "@/utils/logger";

const BOOST_DURATION_DAYS = 3; // Boost lasts for 3 days

export async function boostJob(jobId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

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

    // Verify job belongs to user
    const { data: existingJob, error: jobError } = await supabase
      .from("job_posts")
      .select("kindbossing_user_id, status")
      .eq("id", jobId)
      .single();

    if (jobError || !existingJob) {
      return {
        success: false,
        error: "Job not found",
      };
    }

    if (existingJob.kindbossing_user_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized to boost this job",
      };
    }

    // Check if job is active
    if (existingJob.status !== "active") {
      return {
        success: false,
        error: "Only active jobs can be boosted",
      };
    }

    // Get user's boost credits from users table
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("boost_credits")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      logger.error("Error fetching user boost credits:", userError);
      return {
        success: false,
        error: "Failed to fetch boost credits",
      };
    }

    const boostCredits = userData.boost_credits || 0;

    if (boostCredits < 1) {
      return {
        success: false,
        error: "Insufficient boost credits",
      };
    }

    // Calculate boost expiry date (3 days from now)
    const boostExpiresAt = new Date();
    boostExpiresAt.setDate(boostExpiresAt.getDate() + BOOST_DURATION_DAYS);

    // Update job to be boosted
    const { error: updateError } = await supabase
      .from("job_posts")
      .update({
        is_boosted: true,
        boost_expires_at: boostExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) {
      logger.error("Error boosting job:", updateError);
      return {
        success: false,
        error: "Failed to boost job",
      };
    }

    // Deduct boost credit from user
    const { error: creditError } = await adminClient
      .from("users")
      .update({
        boost_credits: boostCredits - 1,
      })
      .eq("id", user.id);

    if (creditError) {
      logger.error("Error deducting boost credit:", creditError);
      // Rollback job boost if credit deduction fails
      await supabase
        .from("job_posts")
        .update({
          is_boosted: false,
          boost_expires_at: null,
        })
        .eq("id", jobId);

      return {
        success: false,
        error: "Failed to deduct boost credit",
      };
    }

    // Update user metadata for real-time updates
    const { data: updatedUser } = await adminClient.auth.admin.getUserById(
      user.id
    );
    if (updatedUser?.user) {
      const currentMetadata = updatedUser.user.user_metadata || {};
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...currentMetadata,
          boost_credits: boostCredits - 1,
        },
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error boosting job:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

