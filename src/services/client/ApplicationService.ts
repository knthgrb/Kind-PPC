import { createClient } from "@/utils/supabase/client";
import { MatchService } from "./MatchService";
import { NotificationService } from "./NotificationService";

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
  error?: string;
}

export const ApplicationService = {
  /**
   * Apply for a job (client-side)
   */
  async applyForJob(
    jobId: string,
    applicantId: string,
    message?: string
  ): Promise<ApplicationResult> {
    const supabase = createClient();

    try {
      // Check if already applied
      const hasApplied = await this.hasAppliedForJob(jobId, applicantId);
      if (hasApplied) {
        return {
          success: false,
          error: "You have already applied for this job",
        };
      }

      // Create application in database
      const { data, error } = await supabase
        .from("job_applications")
        .insert({
          job_post_id: jobId,
          kindtao_user_id: applicantId,
          status: "pending",
          applied_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating application:", error);
        return {
          success: false,
          error: "Failed to submit application",
        };
      }

      // Send notification to employer
      console.log(`Notification: User ${applicantId} applied to job ${jobId}`);

      return {
        success: true,
        applicationId: data.id,
      };
    } catch (error) {
      console.error("Error applying for job:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  },

  /**
   * Get user's applications (client-side)
   */
  async getUserApplications(userId: string): Promise<JobApplication[]> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("kindtao_user_id", userId)
        .order("applied_at", { ascending: false });

      return (
        data?.map((app) => ({
          id: app.id,
          job_id: app.job_post_id,
          applicant_id: app.kindtao_user_id,
          status: app.status,
          applied_at: app.applied_at,
          reviewed_at: app.updated_at,
          message: app.message,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching applications:", error);
      return [];
    }
  },

  /**
   * Check if user has applied for a specific job
   */
  async hasAppliedForJob(jobId: string, userId: string): Promise<boolean> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_post_id", jobId)
        .eq("kindtao_user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking application status:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking application status:", error);
      return false;
    }
  },

  /**
   * Get application status for a job
   */
  async getApplicationStatus(
    jobId: string,
    userId: string
  ): Promise<JobApplication | null> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_post_id", jobId)
        .eq("kindtao_user_id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        return null; // No application found
      }

      if (error) {
        console.error("Error fetching application status:", error);
        return null;
      }

      return {
        id: data.id,
        job_id: data.job_post_id,
        applicant_id: data.kindtao_user_id,
        status: data.status,
        applied_at: data.applied_at,
        reviewed_at: data.updated_at,
        message: data.message,
      };
    } catch (error) {
      console.error("Error fetching application status:", error);
      return null;
    }
  },

  /**
   * Approve an application and create a match (client-side)
   * This would typically be called by the job poster (kindbossing user)
   */
  async approveApplication(
    applicationId: string,
    jobId: string,
    applicantId: string,
    kindbossingId: string
  ): Promise<ApplicationResult> {
    const supabase = createClient();

    try {
      // Update application status to approved
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) {
        console.error("Error updating application:", updateError);
        return {
          success: false,
          error: "Failed to update application status",
        };
      }

      // Create a match
      console.log("Creating match with parameters:", {
        jobId,
        kindbossingId,
        applicantId,
      });

      const matchResult = await MatchService.createMatch(
        jobId,
        kindbossingId,
        applicantId
      );

      if (!matchResult.success) {
        console.error("Error creating match:", matchResult.error);
        return {
          success: false,
          error: matchResult.error || "Failed to create match",
        };
      }

      return {
        success: true,
        applicationId,
      };
    } catch (error) {
      console.error("Error approving application:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  },

  /**
   * Reject an application (client-side)
   */
  async rejectApplication(
    applicationId: string,
    kindbossingId: string
  ): Promise<ApplicationResult> {
    const supabase = createClient();

    try {
      // Update application status to rejected
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) {
        console.error("Error updating application:", updateError);
        return {
          success: false,
          error: "Failed to update application status",
        };
      }

      return {
        success: true,
        applicationId,
      };
    } catch (error) {
      console.error("Error rejecting application:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  },

  /**
   * Get applications for kindBossing user (with boost priority sorting)
   * Returns applications sorted by: boosted profiles first, then by applied_at
   */
  async getApplicationsForKindBossing(
    kindbossingUserId: string,
    jobId?: string | null
  ): Promise<{
    applications: Application[];
    boostStatus: Record<
      string,
      { isBoosted: boolean; boostExpiresAt: string | null }
    >;
    jobDetails?: any;
  }> {
    const supabase = createClient();

    try {
      // Get job details if specific job ID is provided
      let jobDetails = null;
      if (jobId) {
        const { data: jobData, error: jobError } = await supabase
          .from("job_posts")
          .select("*")
          .eq("id", jobId)
          .eq("kindbossing_user_id", kindbossingUserId)
          .single();

        if (jobError) {
          console.error("Error fetching job details:", jobError);
          throw new Error("Job not found or access denied");
        }

        jobDetails = jobData;
      }

      // Get applications for the specific job or all user's jobs - only pending status
      let query = supabase
        .from("job_applications")
        .select(
          `
          *,
          job_posts!inner(job_title, location, job_description, salary, job_type)
        `
        )
        .eq("status", "pending");

      if (jobId) {
        query = query.eq("job_post_id", jobId);
      } else {
        // Get all job IDs for this user
        const { data: userJobs } = await supabase
          .from("job_posts")
          .select("id")
          .eq("kindbossing_user_id", kindbossingUserId);

        if (userJobs && userJobs.length > 0) {
          const jobIds = userJobs.map((job) => job.id);
          query = query.in("job_post_id", jobIds);
        } else {
          return {
            applications: [],
            boostStatus: {},
            jobDetails: jobDetails || undefined,
          };
        }
      }

      // Get all applications
      const { data: allApplications, error: queryError } = await query;

      if (queryError) {
        console.error("Error fetching applications:", queryError);
        throw new Error("Failed to load applications");
      }

      if (!allApplications || allApplications.length === 0) {
        return {
          applications: [],
          boostStatus: {},
          jobDetails: jobDetails || undefined,
        };
      }

      // Fetch kindTao boost status and user names for each applicant
      const applicantIds = allApplications.map(
        (app: any) => app.kindtao_user_id
      );
      const { data: kindtaoData, error: kindtaoError } = await supabase
        .from("kindtaos")
        .select("user_id, is_boosted, boost_expires_at")
        .in("user_id", applicantIds);

      // Fetch user names for applicants
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", applicantIds);

      // Create a map of user names
      const userNameMap = new Map<string, string>();
      if (userData) {
        userData.forEach((user: any) => {
          const fullName = [user.first_name, user.last_name]
            .filter(Boolean)
            .join(" ");
          userNameMap.set(user.id, fullName || "Applicant");
        });
      }

      // Create a map of boosted applicants and store boost status
      const boostedApplicants = new Map<string, boolean>();
      const boostStatusMap: Record<
        string,
        { isBoosted: boolean; boostExpiresAt: string | null }
      > = {};
      if (kindtaoData) {
        kindtaoData.forEach((kt: any) => {
          const isBoosted =
            kt.is_boosted &&
            kt.boost_expires_at &&
            new Date(kt.boost_expires_at) > new Date();
          boostedApplicants.set(kt.user_id, isBoosted);
          boostStatusMap[kt.user_id] = {
            isBoosted,
            boostExpiresAt: kt.boost_expires_at || null,
          };
        });
      }

      // Sort applications: boosted profiles first, then by applied_at
      const sortedApplications = allApplications.sort((a: any, b: any) => {
        const aBoosted = boostedApplicants.get(a.kindtao_user_id) || false;
        const bBoosted = boostedApplicants.get(b.kindtao_user_id) || false;

        // Boosted profiles come first
        if (aBoosted && !bBoosted) return -1;
        if (!aBoosted && bBoosted) return 1;

        // If both boosted or both not boosted, sort by applied_at (newest first)
        return (
          new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
        );
      });

      // Transform data to match Application interface
      const applications: Application[] = sortedApplications.map((app: any) => ({
        id: app.id,
        job_id: app.job_post_id,
        applicant_id: app.kindtao_user_id,
        status: app.status,
        applied_at: app.applied_at,
        applicant_name: userNameMap.get(app.kindtao_user_id) || "Applicant",
        applicant_phone: "", // Not shown in list
        job_title: app.job_posts?.job_title || "",
        job_location: app.job_posts?.location || "",
        cover_message: app.message,
      }));

      return {
        applications,
        boostStatus: boostStatusMap,
        jobDetails: jobDetails || undefined,
      };
    } catch (error) {
      console.error("Error fetching applications for kindBossing:", error);
      throw error;
    }
  },
};
