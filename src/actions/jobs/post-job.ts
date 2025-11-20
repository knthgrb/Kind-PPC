"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";
import { JobPostInput } from "@/types/jobPosts";

export async function postJob(
  jobData: JobPostInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!convex) {
      return { success: false, error: "Database connection failed" };
    }

    // Extract user ID
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    // Verify the job belongs to the user
    if (jobData.kindbossing_user_id !== userId) {
      return { success: false, error: "Unauthorized to post job for this user" };
    }

    // Parse location coordinates if provided
    let locationCoordinates: { lat: number; lng: number } | undefined;
    if (jobData.location_coordinates) {
      try {
        // Handle POINT format: POINT(lng lat)
        const pointMatch = jobData.location_coordinates.match(
          /POINT\(([^ ]+) ([^ ]+)\)/
        );
        if (pointMatch) {
          locationCoordinates = {
            lng: parseFloat(pointMatch[1]),
            lat: parseFloat(pointMatch[2]),
          };
        } else {
          // Try parsing as JSON
          const parsed = JSON.parse(jobData.location_coordinates);
          if (parsed.lat && parsed.lng) {
            locationCoordinates = { lat: parsed.lat, lng: parsed.lng };
          }
        }
      } catch (e) {
        logger.warn("Failed to parse location coordinates:", e);
      }
    }

    // Convert expires_at to timestamp if provided
    const expiresAt = jobData.expires_at
      ? new Date(jobData.expires_at).getTime()
      : undefined;

    const jobId = await convex.mutation(api.jobs.createJob, {
      kindbossing_user_id: jobData.kindbossing_user_id,
      job_title: jobData.job_title,
      job_description: jobData.job_description,
      required_skills: jobData.required_skills || [],
      salary: jobData.salary,
      salary_min: jobData.salary_min,
      salary_max: jobData.salary_max,
      salary_type: jobData.salary_type,
      work_schedule: jobData.work_schedule || {},
      required_years_of_experience: jobData.required_years_of_experience || 0,
      location: jobData.location,
      location_coordinates: locationCoordinates,
      preferred_languages: jobData.preferred_languages || [],
      status: jobData.status || "active",
      job_type: jobData.job_type || "daily",
      province: jobData.province,
      region: jobData.region,
      expires_at: expiresAt,
    });

    logger.info("Job posted successfully:", { jobId, userId });

    return { success: true, id: String(jobId) };
  } catch (err) {
    logger.error("Failed to post job:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to post job",
    };
  }
}

