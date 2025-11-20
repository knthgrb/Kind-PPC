import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export type JobPreferences = {
  desiredJobs: string[];
  desiredLocations: string[];
  desiredJobTypes: string[];
  salaryRange: {
    min: number;
    max: number;
    salaryType: "daily" | "monthly" | "hourly" | "one-time";
  };
  preferredLanguages: string[];
  preferredWorkRadiusKm: number;
};

export const JobPreferencesService = {
  /**
   * Get job preferences for a user
   */
  async getJobPreferences(
    convex: ConvexClient,
    userId: string
  ): Promise<{ data: JobPreferences | null; error?: string }> {
    try {
      const data = await convex.query(
        api.jobPreferences.getJobPreferencesByUser,
        {
          userId,
        }
      );

      if (!data) {
        return { data: null };
      }

      // Transform database data to our interface
      const preferences: JobPreferences = {
        desiredJobs: data.desired_jobs || [],
        desiredLocations: data.desired_locations || [],
        desiredJobTypes: data.desired_job_types || [],
        salaryRange: {
          min: data.salary_range_min || 0,
          max: data.salary_range_max || 0,
          salaryType: (data.salary_type || "daily") as
            | "daily"
            | "monthly"
            | "hourly"
            | "one-time",
        },
        preferredLanguages: data.desired_languages || [],
        preferredWorkRadiusKm: data.desired_job_location_radius || 10,
      };

      return { data: preferences };
    } catch (error) {
      logger.error("Error fetching job preferences:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      };
    }
  },

  /**
   * Update job preferences for a user
   */
  async updateJobPreferences(
    convex: ConvexClient,
    userId: string,
    preferences: JobPreferences
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await convex.mutation(api.jobPreferences.upsertJobPreferences, {
        kindtao_user_id: userId,
        desired_jobs: preferences.desiredJobs,
        desired_locations: preferences.desiredLocations,
        desired_job_types: preferences.desiredJobTypes,
        salary_range_min: preferences.salaryRange.min || undefined,
        salary_range_max: preferences.salaryRange.max || undefined,
        salary_type: preferences.salaryRange.salaryType || undefined,
        desired_languages: preferences.preferredLanguages,
        desired_job_location_radius:
          preferences.preferredWorkRadiusKm || undefined,
      });

      logger.info("Job preferences updated successfully for user:", userId);
      return { success: true };
    } catch (error) {
      logger.error("Error updating job preferences:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      };
    }
  },
};
