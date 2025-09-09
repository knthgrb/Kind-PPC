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
   * Get reports made by a specific user
   */
  static async getReportsByUser(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reports")
      .select(
        `
        *,
        reported_user:users!reports_reported_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_image_url
        )
      `
      )
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting user reports:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get all pending reports (admin function)
   */
  static async getPendingReports() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reports")
      .select(
        `
        *,
        reporter:users!reports_reporter_id_fkey(
          id,
          first_name,
          last_name,
          profile_image_url
        ),
        reported_user:users!reports_reported_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_image_url
        )
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting pending reports:", error);
      return [];
    }

    return data || [];
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
