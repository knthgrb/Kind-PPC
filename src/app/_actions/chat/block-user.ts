"use server";

import { createClient } from "@/utils/supabase/server";

export interface BlockUserData {
  blockerId: string;
  blockedUserId: string;
  conversationId: string;
  blockerName: string;
  blockedUserName: string;
}

export async function blockUser(data: BlockUserData) {
  const supabase = await createClient();

  try {
    // 1. Create a report record for tracking
    const { error: reportError } = await supabase.from("reports").insert({
      reporter_id: data.blockerId,
      reported_user_id: data.blockedUserId,
      report_type: "block_user",
      description: `User blocked by ${data.blockerName}`,
      status: "resolved",
    });

    if (reportError) {
      throw new Error(`Failed to create report record: ${reportError.message}`);
    }

    // 2. Create admin action record for audit trail
    const { error: adminActionError } = await supabase
      .from("admin_actions")
      .insert({
        admin_id: null,
        target_user_id: data.blockedUserId,
        action_type: "user_blocked",
        description: `Blocked by user ${data.blockerName}`,
        details: {
          blocker_id: data.blockerId,
          blocker_name: data.blockerName,
          blocked_user_name: data.blockedUserName,
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
      message: "User blocked successfully",
    };
  } catch (error) {
    console.error("Error blocking user:", error);
    throw error;
  }
}
