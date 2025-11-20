import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  status: "pending" | "approved" | "rejected";
  applied_at: string;
  reviewed_at?: string;
  message?: string;
}

export interface ApplicationResult {
  success: boolean;
  applicationId?: string;
  matchId?: string;
  error?: string;
}

export const ApplicationService = {
  /**
   * Apply for a job
   */
  async applyForJob(
    convex: ConvexClient,
    jobId: string,
    applicantId: string,
    message?: string
  ): Promise<ApplicationResult> {
    try {
      // Check if already applied
      const hasApplied = await convex.query(api.applications.hasAppliedForJob, {
        jobId,
        userId: applicantId,
      });

      if (hasApplied) {
        return {
          success: false,
          error: "You have already applied for this job",
        };
      }

      // Create application
      const applicationId = await convex.mutation(
        api.applications.createApplication,
        {
          kindtao_user_id: applicantId,
          job_post_id: jobId,
          status: "pending",
        }
      );

      return {
        success: true,
        applicationId: String(applicationId),
      };
    } catch (error) {
      logger.error("Error applying for job:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  },

  /**
   * Get user's applications
   */
  async getUserApplications(
    convex: ConvexClient,
    userId: string
  ): Promise<JobApplication[]> {
    try {
      const applications = await convex.query(
        api.applications.getApplicationsByKindTao,
        {
          userId,
        }
      );

      return applications.map((app: any) => ({
        id: String(app._id),
        job_id: app.job_post_id,
        applicant_id: app.kindtao_user_id,
        status: app.status as "pending" | "approved" | "rejected",
        applied_at: new Date(app.applied_at).toISOString(),
        reviewed_at: app.updated_at
          ? new Date(app.updated_at).toISOString()
          : undefined,
        message:
          "message" in app
            ? ((app as { message?: string }).message ?? undefined)
            : undefined,
      }));
    } catch (error) {
      logger.error("Error fetching applications:", error);
      return [];
    }
  },

  /**
   * Check if user has applied for a specific job
   */
  async hasAppliedForJob(
    convex: ConvexClient,
    jobId: string,
    userId: string
  ): Promise<boolean> {
    try {
      return await convex.query(api.applications.hasAppliedForJob, {
        jobId,
        userId,
      });
    } catch (error) {
      logger.error("Error checking application status:", error);
      return false;
    }
  },

  /**
   * Get application status for a job
   */
  async getApplicationStatus(
    convex: ConvexClient,
    jobId: string,
    userId: string
  ): Promise<JobApplication | null> {
    try {
      const application = await convex.query(
        api.applications.getApplicationByJobAndUser,
        {
          jobId,
          userId,
        }
      );

      if (!application) {
        return null;
      }

      return {
        id: String(application._id),
        job_id: application.job_post_id,
        applicant_id: application.kindtao_user_id,
        status: application.status as "pending" | "approved" | "rejected",
        applied_at: new Date(application.applied_at).toISOString(),
        reviewed_at: application.updated_at
          ? new Date(application.updated_at).toISOString()
          : undefined,
        message:
          "message" in application
            ? ((application as { message?: string }).message ?? undefined)
            : undefined,
      };
    } catch (error) {
      logger.error("Error fetching application status:", error);
      return null;
    }
  },

  /**
   * Approve an application and create a match
   */
  async approveApplication(
    convex: ConvexClient,
    applicationId: string,
    jobId: string,
    applicantId: string,
    kindbossingId: string
  ): Promise<ApplicationResult> {
    try {
      // Update application status to approved
      await convex.mutation(api.applications.updateApplicationStatus, {
        applicationId: applicationId as any,
        status: "approved",
      });

      // Create a match
      const { MatchService } = await import("./MatchService");
      const matchResult = await MatchService.createMatch(
        convex,
        jobId,
        kindbossingId,
        applicantId
      );

      if (!matchResult.success) {
        logger.error("Error creating match:", matchResult.error);
        return {
          success: false,
          error: matchResult.error || "Failed to create match",
        };
      }

      return {
        success: true,
        applicationId,
        matchId: matchResult.matchId,
      };
    } catch (error) {
      logger.error("Error approving application:", error);
      return {
        success: false,
        error: "Failed to approve application",
      };
    }
  },

  /**
   * Reject an application
   */
  async rejectApplication(
    convex: ConvexClient,
    applicationId: string
  ): Promise<ApplicationResult> {
    try {
      await convex.mutation(api.applications.updateApplicationStatus, {
        applicationId: applicationId as any,
        status: "rejected",
      });

      return {
        success: true,
        applicationId,
      };
    } catch (error) {
      logger.error("Error rejecting application:", error);
      return {
        success: false,
        error: "Failed to reject application",
      };
    }
  },

  /**
   * Skip an application
   */
  async skipApplication(
    convex: ConvexClient,
    applicationId: string
  ): Promise<ApplicationResult> {
    try {
      await convex.mutation(api.applications.updateApplicationStatus, {
        applicationId: applicationId as any,
        status: "skipped",
      });

      return {
        success: true,
        applicationId,
      };
    } catch (error) {
      logger.error("Error skipping application:", error);
      return {
        success: false,
        error: "Failed to skip application",
      };
    }
  },

  /**
   * Get applications for kindBossing user (pending only)
   */
  async getApplicationsForKindBossing(
    convex: ConvexClient,
    kindbossingUserId: string,
    jobId?: string | null
  ) {
    try {
      const applications = await convex.query(
        api.applications.getPendingApplicationsForKindBossing,
        {
          kindbossingUserId,
          jobId: jobId || undefined,
        }
      );

      return applications;
    } catch (error) {
      logger.error("Error fetching applications for kindBossing:", error);
      throw error;
    }
  },
};
