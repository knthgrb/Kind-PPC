import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export type KindTaoPersonalInfo = {
  day: string;
  month: string;
  year: string;
  gender: string;
  location: string;
  barangay: string;
  municipality: string;
  province: string;
  zipCode?: string;
  lat?: string;
  long?: string;
  phone?: string;
  highestEducationalAttainment?: string;
};

export type KindTaoSkillsAvailability = {
  skills: string[];
  availabilitySchedule: Record<
    string,
    { available: boolean; timeSlot: string; morning: boolean; evening: boolean }
  >;
  languages?: string[];
};

export type KindTaoWorkEntry = {
  jobTitle: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  description?: string;
  isCurrentJob: boolean;
  location?: string;
  skillsUsed?: string[];
  notes?: string;
};

export type KindTaoJobPreferences = {
  desiredJobs: string[];
  desiredLocations: string[];
  desiredJobTypes: string[];
  salaryRange: {
    min: number;
    max: number;
    salaryType: string;
  };
  preferredLanguages: string[];
  preferredWorkRadiusKm: number;
};

export type KindTaoOnboardingData = {
  personalInfo: KindTaoPersonalInfo;
  skillsAvailability: KindTaoSkillsAvailability;
  jobPreferences: KindTaoJobPreferences;
  workHistory: KindTaoWorkEntry[];
};

type MutationOptions = {
  token?: string;
};

export class KindTaoOnboardingService {
  /**
   * Finalize KindTao onboarding by saving all data to the database
   */
  static async finalizeOnboarding(
    convex: ConvexClient,
    userId: string,
    data: KindTaoOnboardingData,
    options?: MutationOptions
  ): Promise<{ success: boolean; error?: string }> {
    logger.info("KindTaoOnboardingService.finalizeOnboarding called with:", {
      userId,
      hasPersonalInfo: !!data.personalInfo,
      hasSkillsAvailability: !!data.skillsAvailability,
      workHistoryLength: data.workHistory?.length || 0,
    });

    try {
      const { personalInfo, skillsAvailability, jobPreferences, workHistory } =
        data;

      // Get coordinates from address for location_coordinates
      let locationCoordinates: { lat: number; lng: number } | undefined =
        undefined;

      try {
        const completeAddressForSearch = `${personalInfo.barangay}, ${personalInfo.municipality}, ${personalInfo.province} ${personalInfo.zipCode}, Philippines`;
        const response = await fetch(
          `https://geocode.maps.co/search?q=${encodeURIComponent(
            completeAddressForSearch
          )}&api_key=${process.env.NEXT_PUBLIC_GEO_CODE_API_KEY}`
        );

        if (response.ok) {
          const geocodeData = await response.json();
          if (Array.isArray(geocodeData) && geocodeData.length > 0) {
            const { lat: fetchedLat, lon: fetchedLon } = geocodeData[0];
            const lat = Number(fetchedLat);
            const lng = Number(fetchedLon);
            locationCoordinates = { lat, lng };
            logger.info("Successfully geocoded address:", {
              lat,
              lng,
            });
          }
        } else {
          logger.warn("Geocoding API request failed:", response.status);
        }
      } catch (geocodeError) {
        logger.error("Error during geocoding:", geocodeError);
        // Continue without coordinates - don't fail the entire onboarding
      }

      // Build date of birth as ISO (YYYY-MM-DD)
      const dobYear = personalInfo.year?.padStart(4, "0");
      const dobMonth = String(
        new Date(`${personalInfo.month} 1, 2000`).getMonth() + 1
      ).padStart(2, "0");
      const dobDay = String(personalInfo.day).padStart(2, "0");
      const dateOfBirth = `${dobYear}-${dobMonth}-${dobDay}`;

      // Update users table
      logger.info("Updating users table for user:", userId);
      await convex.mutation(api.users.updateUser, {
        userId,
        updates: {
          gender: personalInfo.gender,
          date_of_birth: dateOfBirth,
          barangay: personalInfo.barangay,
          municipality: personalInfo.municipality,
          province: personalInfo.province,
          zip_code: personalInfo.zipCode
            ? Number(personalInfo.zipCode)
            : undefined,
          location_coordinates: locationCoordinates,
          phone: personalInfo.phone ?? undefined,
        },
      });
      logger.info("Users table updated successfully");

      // Upsert kindtaos profile
      logger.info("Upserting kindtaos profile for user:", userId);
      await convex.mutation(api.kindtaos.upsertKindTao, {
        user_id: userId,
        skills: skillsAvailability.skills,
        availability_schedule: skillsAvailability.availabilitySchedule,
        languages: skillsAvailability.languages ?? undefined,
        highest_educational_attainment:
          personalInfo.highestEducationalAttainment ?? undefined,
      });
      logger.info("Kindtaos profile upserted successfully");

      // Save job preferences
      if (jobPreferences) {
        logger.info("Saving job preferences for user:", userId);
        await convex.mutation(api.jobPreferences.upsertJobPreferences, {
          kindtao_user_id: userId,
          desired_jobs: jobPreferences.desiredJobs,
          desired_locations: jobPreferences.desiredLocations,
          desired_job_types: jobPreferences.desiredJobTypes,
          salary_range_min: jobPreferences.salaryRange.min || undefined,
          salary_range_max: jobPreferences.salaryRange.max || undefined,
          salary_type: jobPreferences.salaryRange.salaryType || undefined,
          desired_languages: jobPreferences.preferredLanguages || undefined,
          desired_job_location_radius:
            jobPreferences.preferredWorkRadiusKm || undefined,
        });
        logger.info("Job preferences saved successfully");
      } else {
        logger.info("No job preferences provided for user:", userId);
      }

      // Insert work experiences only if meaningful work experience data exists
      if (workHistory && workHistory.length > 0) {
        // Filter out empty or incomplete work entries
        const validWorkHistory = workHistory.filter(
          (e) => e.jobTitle && e.company && e.startYear && e.startMonth
        );

        if (validWorkHistory.length > 0) {
          logger.info(
            `Inserting ${validWorkHistory.length} work experiences for user:`,
            userId
          );

          const toInsert = validWorkHistory.map((e) => {
            const startDate = new Date(
              `${e.startYear}-${String(
                new Date(`${e.startMonth} 1, 2000`).getMonth() + 1
              ).padStart(2, "0")}-01`
            ).getTime();

            const endDate =
              e.endYear && e.endMonth && !e.isCurrentJob
                ? new Date(
                    `${e.endYear}-${String(
                      new Date(`${e.endMonth} 1, 2000`).getMonth() + 1
                    ).padStart(2, "0")}-01`
                  ).getTime()
                : undefined;

            return {
              kindtao_user_id: userId,
              employer: e.company || undefined,
              job_title: e.jobTitle || undefined,
              is_current_job: e.isCurrentJob || false,
              start_date: startDate,
              end_date: endDate,
              location: e.location || undefined,
              skills_used: e.skillsUsed || undefined,
              notes: e.notes || e.description || undefined,
            };
          });

          await convex.mutation(api.workExperiences.createWorkExperiences, {
            experiences: toInsert,
          });

          logger.info("Work experiences inserted successfully");
        } else {
          logger.info("No valid work experiences to insert for user:", userId);
        }
      } else {
        logger.info("No work history provided for user:", userId);
      }

      // Mark onboarding as completed in Convex
      await convex.mutation(api.onboarding.markOnboardingCompleted, {
        userId,
      });

      logger.info(
        "KindTao onboarding finalized successfully for user:",
        userId
      );

      return { success: true };
    } catch (error) {
      logger.error("Unexpected error finalizing KindTao onboarding:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      };
    }
  }
}
