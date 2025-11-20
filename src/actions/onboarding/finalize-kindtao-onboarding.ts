"use server";

import { KindTaoOnboardingService } from "@/services/KindTaoOnboardingService";
import type {
  KindTaoOnboardingData,
  KindTaoPersonalInfo,
  KindTaoSkillsAvailability,
  KindTaoJobPreferences,
  KindTaoWorkEntry,
} from "@/services/KindTaoOnboardingService";
import { logger } from "@/utils/logger";
import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";

export async function finalizeKindTaoOnboarding(data: {
  personalInfo: KindTaoPersonalInfo;
  skillsAvailability: KindTaoSkillsAvailability;
  jobPreferences: KindTaoJobPreferences;
  workHistory: KindTaoWorkEntry[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { convex, token, user } = await getServerActionContext({ requireUser: true });

    if (!convex) {
      logger.error("Cannot finalize onboarding without Convex client");
      return {
        success: false,
        error: "Unable to save onboarding data right now. Please try again.",
      };
    }

    if (!user) {
      logger.error("Cannot finalize onboarding without authenticated user");
      return {
        success: false,
        error: "You must be logged in to complete onboarding.",
      };
    }

    // Try multiple ways to extract user ID
    let userId: string | null = null;
    
    // Method 1: Check common user ID fields (including nested)
    if (typeof user === "object" && user !== null) {
      const userObj = user as Record<string, any>;
      
      // Check top-level fields
      userId =
        userObj.userId ??
        userObj.id ??
        userObj._id ??
        userObj.user?.id ??
        userObj.user?.userId ??
        userObj.user?._id ??
        userObj.data?.id ??
        userObj.data?.userId ??
        userObj.session?.userId ??
        userObj.session?.user?.id ??
        null;
    }

    // Method 2: If still no user ID, try to get it from the token
    if (!userId && token) {
      try {
        // Try to decode JWT token to get user ID
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(tokenParts[1], "base64").toString("utf-8")
          );
          userId = payload?.userId ?? payload?.id ?? payload?.sub ?? payload?.user?.id ?? null;
        }
      } catch (tokenError) {
        logger.debug("Could not extract user ID from token", tokenError);
      }
    }

    // Method 3: If still no user ID, try querying Convex users table by email
    if (!userId && user && typeof user === "object") {
      try {
        const userObj = user as Record<string, any>;
        const email = userObj.email ?? userObj.user?.email ?? userObj.data?.email;
        
        if (email) {
          // Query users table by email to get user ID
          const userRecord = await convex.query(api.users.getUserByEmail, {
            email: email,
          });
          if (userRecord?.id) {
            userId = userRecord.id;
            logger.debug("Extracted user ID from Convex users table by email");
          }
        }
      } catch (queryError) {
        logger.debug("Could not query user by email", queryError);
      }
    }

    // Method 4: Log user object structure for debugging if still no user ID
    if (!userId) {
      logger.error("Cannot extract user ID from authenticated user", {
        userType: typeof user,
        userKeys: user && typeof user === "object" ? Object.keys(user) : [],
        userString: JSON.stringify(user).substring(0, 500),
        hasToken: !!token,
      });
      return {
        success: false,
        error: "Unable to identify user. Please try logging in again.",
      };
    }

    // Call the service to finalize onboarding
    const onboardingData: KindTaoOnboardingData = {
      personalInfo: data.personalInfo,
      skillsAvailability: data.skillsAvailability,
      jobPreferences: data.jobPreferences,
      workHistory: data.workHistory,
    };

    const result = await KindTaoOnboardingService.finalizeOnboarding(
      convex,
      userId,
      onboardingData,
      { token: token || undefined }
    );

    return result;
  } catch (error) {
    logger.error("Unexpected error in finalizeKindTaoOnboarding action:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.",
    };
  }
}
