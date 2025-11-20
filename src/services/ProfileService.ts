import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserProfile } from "@/types/userProfile";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

type UpdateKindTaoProfileInput = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  profile_image_url?: string | null;
  barangay?: string;
  municipality?: string;
  province?: string;
  zip_code?: number;
  skills?: string[];
  languages?: string[];
  expected_salary_range?: string;
  highest_educational_attainment?: string;
  availability_schedule?: Record<string, unknown>;
};

export const ProfileService = {
  /**
   * Get KindTao profile by user ID (client-side)
   */
  async getKindTaoProfileByUserId(
    userId: string,
    convex?: ConvexClient
  ): Promise<UserProfile | null> {
    try {
      // If convex client is not provided, import the default client
      let client = convex;
      if (!client) {
        const { convex: defaultConvex } = await import("@/utils/convex/client");
        client = defaultConvex;
      }

      const profile = await client.query(
        api.profiles.getCompleteKindTaoProfile,
        {
          userId,
        }
      );

      if (!profile) {
        return null;
      }

      // Map to UserProfile type
      return {
        id: profile.id || userId,
        email: profile.email || "",
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        phone: profile.phone || null,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender || null,
        profile_image_url: profile.profile_image_url || null,
        barangay: profile.barangay || null,
        municipality: profile.municipality || null,
        province: profile.province || null,
        zip_code: profile.zip_code || null,
        swipe_credits: profile.swipe_credits || null,
        boost_credits: profile.boost_credits || null,
        status: profile.status || null,
        kindtao_profile: profile.kindtao_profile || null,
        work_experiences: profile.work_experiences || [],
      } as unknown as UserProfile;
    } catch (error) {
      logger.error("Error fetching KindTao profile:", error);
      return null;
    }
  },

  /**
   * Get complete KindTao profile (server-side)
   */
  async getCompleteKindTaoProfile(
    convex: ConvexClient,
    userId: string
  ): Promise<any | null> {
    try {
      const profile = await convex.query(
        api.profiles.getCompleteKindTaoProfile,
        {
          userId,
        }
      );
      return profile;
    } catch (error) {
      logger.error("Error fetching complete KindTao profile:", error);
      return null;
    }
  },

  /**
   * Update KindTao profile information
   */
  async updateKindTaoProfile(
    convex: ConvexClient,
    userId: string,
    payload: UpdateKindTaoProfileInput
  ): Promise<void> {
    const {
      skills,
      languages,
      expected_salary_range,
      highest_educational_attainment,
      availability_schedule,
      ...userData
    } = payload;

    try {
      if (Object.keys(userData).length > 0) {
        const sanitizedUserData = {
          ...userData,
          profile_image_url:
            userData.profile_image_url === null
              ? undefined
              : userData.profile_image_url,
        };

        await convex.mutation(api.profiles.updateUserProfile, {
          userId,
          profileData: sanitizedUserData,
        });
      }

      const hasKindTaoUpdates =
        skills ||
        languages ||
        expected_salary_range ||
        highest_educational_attainment ||
        availability_schedule;

      if (hasKindTaoUpdates) {
        await convex.mutation(api.kindtaos.upsertKindTao, {
          user_id: userId,
          skills,
          languages,
          expected_salary_range,
          highest_educational_attainment,
          availability_schedule,
        });
      }

      logger.info("Updated KindTao profile", { userId });
    } catch (error) {
      logger.error("Failed to update KindTao profile:", { error, userId });
      throw error;
    }
  },
};
