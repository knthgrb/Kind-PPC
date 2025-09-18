import { createClient } from "@/utils/supabase/client";
import { ReportData } from "@/app/chats/_components/ReportUserModal";

export interface ReportUserData {
  reporterId: string;
  reportedUserId: string;
  reportData: ReportData;
  reporterName: string;
  reportedUserName: string;
  conversationId?: string;
}

export class ReportingService {
  /**
   * Report a user for abuse
   */
  static async reportUser(data: ReportUserData) {
    const supabase = createClient();

    try {
      // 1. Create report record for admin review
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .insert({
          reporter_id: data.reporterId,
          reported_user_id: data.reportedUserId,
          report_type: data.reportData.reportType,
          description: data.reportData.description,
          evidence_urls: data.reportData.evidenceUrls || [],
          status: "pending", // Needs admin review
        })
        .select()
        .single();

      if (reportError) {
        throw new Error(`Failed to create report: ${reportError.message}`);
      }

      // 2. Create admin action record for audit trail
      const { error: adminActionError } = await supabase
        .from("admin_actions")
        .insert({
          admin_id: null, // User-initiated action
          target_user_id: data.reportedUserId,
          action_type: "user_reported",
          description: `Reported for ${data.reportData.reportType} by ${data.reporterName}`,
          details: {
            reporter_id: data.reporterId,
            reporter_name: data.reporterName,
            reported_user_name: data.reportedUserName,
            report_type: data.reportData.reportType,
            report_id: report.id,
            conversation_id: data.conversationId,
            timestamp: new Date().toISOString(),
          },
        });

      if (adminActionError) {
        throw new Error(
          `Failed to create admin action record: ${adminActionError.message}`
        );
      }

      return {
        success: true,
        message: "Report submitted successfully.",
        reportId: report.id,
      };
    } catch (error) {
      console.error("Error reporting user:", error);
      throw error;
    }
  }

  /**
   * Get reports made by a specific user using server actions
   */
  static async getReportsByUser(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting user reports:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get user details for reported users using server action
    const reportedUserIds = [
      ...new Set(data.map((report) => report.reported_user_id)),
    ];

    const { getMultipleUsers } = await import(
      "@/actions/user/get-multiple-users"
    );
    const { data: userResults, error: userError } = await getMultipleUsers(
      reportedUserIds
    );

    if (userError) {
      console.error("Error fetching user details:", userError);
      return data.map((report) => ({
        ...report,
        reported_user: null,
      }));
    }

    // Create user map
    const userMap = new Map();
    userResults.forEach(({ id, user }) => {
      if (user) {
        userMap.set(id, {
          id: user.id,
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          profile_image_url: user.user_metadata?.profile_image_url || null,
        });
      }
    });

    // Combine reports with user data
    return data.map((report) => ({
      ...report,
      reported_user: userMap.get(report.reported_user_id) || null,
    }));
  }

  /**
   * Get all pending reports (admin function) using server actions
   */
  static async getPendingReports() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting pending reports:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get user details for both reporters and reported users using server action
    const allUserIds = new Set<string>();

    data.forEach((report) => {
      allUserIds.add(report.reporter_id);
      allUserIds.add(report.reported_user_id);
    });

    const { getMultipleUsers } = await import(
      "@/actions/user/get-multiple-users"
    );
    const { data: userResults, error: userError } = await getMultipleUsers(
      Array.from(allUserIds)
    );

    if (userError) {
      console.error("Error fetching user details:", userError);
      return data.map((report) => ({
        ...report,
        reporter: null,
        reported_user: null,
      }));
    }

    // Create user map
    const userMap = new Map();
    userResults.forEach(({ id, user }) => {
      if (user) {
        userMap.set(id, {
          id: user.id,
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          profile_image_url: user.user_metadata?.profile_image_url || null,
        });
      }
    });

    // Combine reports with user data
    return data.map((report) => ({
      ...report,
      reporter: userMap.get(report.reporter_id) || null,
      reported_user: userMap.get(report.reported_user_id) || null,
    }));
  }

  /**
   * Resolve a report (admin function)
   */
  static async resolveReport(
    reportId: string,
    adminId: string,
    resolution: "resolved" | "dismissed",
    adminNotes?: string
  ) {
    const supabase = createClient();

    try {
      // Update report status
      const { error: reportError } = await supabase
        .from("reports")
        .update({
          status: resolution,
          handled_by: adminId,
          handled_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", reportId);

      if (reportError) {
        throw new Error(`Failed to resolve report: ${reportError.message}`);
      }

      // Create admin action record
      const { error: adminActionError } = await supabase
        .from("admin_actions")
        .insert({
          admin_id: adminId,
          target_user_id: null, // Will be filled based on report
          action_type: "report_resolved",
          description: `Report ${resolution} by admin`,
          details: {
            report_id: reportId,
            resolution,
            admin_notes: adminNotes,
            timestamp: new Date().toISOString(),
          },
        });

      if (adminActionError) {
        throw new Error(
          `Failed to create admin action record: ${adminActionError.message}`
        );
      }

      return {
        success: true,
        message: `Report ${resolution} successfully`,
      };
    } catch (error) {
      console.error("Error resolving report:", error);
      throw error;
    }
  }
}
