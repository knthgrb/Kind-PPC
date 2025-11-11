"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { logger } from "@/utils/logger";

const BOOST_DURATION_DAYS = 3; // Boost lasts for 3 days

export async function boostProfile(): Promise<{
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

    // Verify user is kindTao
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("role, boost_credits")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      logger.error("Error fetching user data:", userError);
      return {
        success: false,
        error: "Failed to fetch user data",
      };
    }

    if (userData.role !== "kindtao") {
      return {
        success: false,
        error: "Only kindTao users can boost their profile",
      };
    }

    const boostCredits = userData.boost_credits || 0;

    if (boostCredits < 1) {
      return {
        success: false,
        error: "Insufficient boost credits",
      };
    }

    // Check if kindTao profile exists
    const { data: kindtaoData, error: kindtaoError } = await supabase
      .from("kindtaos")
      .select("id, is_boosted, boost_expires_at")
      .eq("user_id", user.id)
      .single();

    if (kindtaoError || !kindtaoData) {
      logger.error("Error fetching kindTao profile:", kindtaoError);
      return {
        success: false,
        error: "Profile not found",
      };
    }

    // Check if profile is already boosted and not expired
    if (kindtaoData.is_boosted && kindtaoData.boost_expires_at) {
      const expiryDate = new Date(kindtaoData.boost_expires_at);
      if (expiryDate > new Date()) {
        return {
          success: false,
          error: "Profile is already boosted",
        };
      }
    }

    // Calculate boost expiry date (3 days from now)
    const boostExpiresAt = new Date();
    boostExpiresAt.setDate(boostExpiresAt.getDate() + BOOST_DURATION_DAYS);

    // Update kindTao profile to be boosted
    const { error: updateError } = await supabase
      .from("kindtaos")
      .update({
        is_boosted: true,
        boost_expires_at: boostExpiresAt.toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      logger.error("Error boosting profile:", updateError);
      return {
        success: false,
        error: "Failed to boost profile",
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
      // Rollback profile boost if credit deduction fails
      await supabase
        .from("kindtaos")
        .update({
          is_boosted: false,
          boost_expires_at: null,
        })
        .eq("user_id", user.id);

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
    logger.error("Error boosting profile:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

