import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "@/utils/convex/client";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export type WorkExperiencePayload = {
  employer?: string;
  job_title?: string;
  is_current_job?: boolean;
  start_date: number;
  end_date?: number;
  location?: string;
  skills_used?: string[];
  notes?: string;
  description?: string;
};

export type WorkExperienceAttachmentPayload = {
  kindtao_work_experience_id: string;
  file_url: string;
  title: string;
  size: number;
  content_type: string;
};

export const WorkExperienceService = {
  async createWorkExperience(
    convex: ConvexClient,
    userId: string,
    payload: WorkExperiencePayload
  ): Promise<string> {
    try {
      const experienceId = await convex.mutation(
        api.workExperiences.createWorkExperience,
        {
          kindtao_user_id: userId,
          ...payload,
        }
      );

      return experienceId;
    } catch (error) {
      logger.error("Failed to create work experience", { error, userId });
      throw error;
    }
  },

  async updateWorkExperience(
    convex: ConvexClient,
    experienceId: string,
    payload: WorkExperiencePayload
  ): Promise<void> {
    try {
      await convex.mutation(api.workExperiences.updateWorkExperience, {
        experienceId: experienceId as Id<"kindtao_work_experiences">,
        updates: payload,
      });
    } catch (error) {
      logger.error("Failed to update work experience", {
        error,
        experienceId,
      });
      throw error;
    }
  },

  async createAttachment(
    convex: ConvexClient,
    payload: WorkExperienceAttachmentPayload
  ): Promise<void> {
    try {
      await convex.mutation(api.workExperiences.createWorkExperienceAttachment, {
        ...payload,
      });
    } catch (error) {
      logger.error("Failed to create work experience attachment", {
        error,
        experienceId: payload.kindtao_work_experience_id,
      });
      throw error;
    }
  },
};


