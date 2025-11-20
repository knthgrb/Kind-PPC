"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { WorkExperienceService } from "@/services/WorkExperienceService";
import { logger } from "@/utils/logger";

type AddAttachmentInput = {
  kindtao_work_experience_id: string;
  file_url: string;
  title: string;
  size: number;
  content_type: string;
};

export async function addWorkExperienceAttachment(input: AddAttachmentInput) {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user || !convex) {
      return { success: false, error: "Unauthorized" };
    }

    await WorkExperienceService.createAttachment(convex, input);

    return { success: true };
  } catch (err) {
    logger.error("addWorkExperienceAttachment failed", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload attachment",
    };
  }
}


