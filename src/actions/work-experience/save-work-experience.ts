"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { WorkExperienceService } from "@/services/WorkExperienceService";
import { logger } from "@/utils/logger";

type SaveWorkExperienceInput = {
  experienceId?: string;
  employer: string;
  job_title: string;
  is_current_job: boolean;
  start_date: string;
  end_date?: string;
  location?: string;
  skills_used?: string[];
  notes?: string;
  description?: string;
};

export async function saveWorkExperience(input: SaveWorkExperienceInput) {
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

    const startDate = new Date(input.start_date);
    if (Number.isNaN(startDate.getTime())) {
      return { success: false, error: "Invalid start date" };
    }

    let endDate: number | undefined;
    if (!input.is_current_job && input.end_date) {
      const parsedEndDate = new Date(input.end_date);
      if (Number.isNaN(parsedEndDate.getTime())) {
        return { success: false, error: "Invalid end date" };
      }
      endDate = parsedEndDate.getTime();
    }

    const payload = {
      employer: input.employer || undefined,
      job_title: input.job_title || undefined,
      is_current_job: input.is_current_job,
      start_date: startDate.getTime(),
      end_date: endDate,
      location: input.location || undefined,
      skills_used: input.skills_used?.length ? input.skills_used : undefined,
      notes: input.notes || undefined,
      description: input.description || undefined,
    };

    let experienceId = input.experienceId;

    if (experienceId) {
      await WorkExperienceService.updateWorkExperience(
        convex,
        experienceId,
        payload
      );
    } else {
      experienceId = await WorkExperienceService.createWorkExperience(
        convex,
        userId,
        payload
      );
    }

    return { success: true, experienceId };
  } catch (err) {
    logger.error("saveWorkExperience failed", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save experience",
    };
  }
}


