"use server";

import { createClient } from "@/utils/supabase/server";

export interface ReportUserData {
  reporterId: string;
  reportedUserId: string;
  reportType: string;
  description: string;
  evidenceUrls?: string[];
  reporterName: string;
  reportedUserName: string;
  conversationId?: string;
}

export async function reportUser(data: ReportUserData) {
  const supabase = await createClient();

  try {
    // 1. Create report record for admin review
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        reporter_id: data.reporterId,
        reported_user_id: data.reportedUserId,
        report_type: data.reportType,
        description: data.description,
        evidence_urls: data.evidenceUrls || [],
        status: "pending",
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
        admin_id: null,
        target_user_id: data.reportedUserId,
        action_type: "user_reported",
        description: `Reported for ${data.reportType} by ${data.reporterName}`,
        details: {
          reporter_id: data.reporterId,
          reporter_name: data.reporterName,
          reported_user_name: data.reportedUserName,
          report_type: data.reportType,
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
