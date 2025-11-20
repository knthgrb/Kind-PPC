"use server";

import { ProfileService } from "@/services/ProfileService";
import { getServerActionContext } from "@/utils/server-action-context";
import { logger } from "@/utils/logger";

type UpdateProfileInput = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  zip_code?: number;
  profile_image_url?: string | null;
  skills?: string[];
  languages?: string[];
  expected_salary_range?: string;
  highest_educational_attainment?: string;
  availability_schedule?: Record<string, unknown>;
};

export async function updateProfile(
  data: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user || !convex) {
      return { success: false, error: "Unauthorized" };
    }

    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "Unable to determine user" };
    }

    await ProfileService.updateKindTaoProfile(convex, userId, data);

    return { success: true };
  } catch (err) {
    logger.error("Failed to update KindTao profile:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}


