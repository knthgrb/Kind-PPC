import { createClient } from "@/utils/supabase/client";

export interface BlockUserData {
  blockerId: string;
  blockedUserId: string;
  conversationId: string;
  blockerName: string;
  blockedUserName: string;
}

export class BlockingService {
  /**
   * Block a user and create necessary database records
   */
  static async blockUser(data: BlockUserData) {
    const supabase = createClient();

    try {
      // 1. Check if user is already blocked
      const isAlreadyBlocked = await this.isUserBlocked(
        data.blockerId,
        data.blockedUserId
      );
      if (isAlreadyBlocked) {
        return {
          success: true,
          message: "User is already blocked",
        };
      }

      // 2. Create a report record for tracking
      const { error: reportError } = await supabase.from("reports").insert({
        reporter_id: data.blockerId,
        reported_user_id: data.blockedUserId,
        report_type: "block_user",
        description: `User blocked by ${data.blockerName}`,
        status: "resolved", // Blocking is immediate, so resolved
      });

      if (reportError) {
        throw new Error(
          `Failed to create report record: ${reportError.message}`
        );
      }

      // 3. Create admin action record for audit trail
      const { error: adminActionError } = await supabase
        .from("admin_actions")
        .insert({
          admin_id: null, // User-initiated action
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

  /**
   * Check if a user is blocked by another user
   */
  static async isUserBlocked(userId: string, otherUserId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("admin_actions")
      .select("id")
      .eq("target_user_id", otherUserId)
      .eq("action_type", "user_blocked")
      .contains("details", { blocker_id: userId })
      .limit(1);

    if (error) {
      console.error("Error checking if user is blocked:", error);
      return false;
    }

    return data && data.length > 0;
  }

  /**
   * Get all users blocked by a specific user
   */
  static async getBlockedUsers(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("admin_actions")
      .select("target_user_id, created_at, details")
      .eq("action_type", "user_blocked")
      .contains("details", { blocker_id: userId })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting blocked users:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get all blocked user IDs for a specific user (for filtering)
   */
  static async getBlockedUserIds(userId: string): Promise<string[]> {
    const blockedUsers = await this.getBlockedUsers(userId);
    return blockedUsers.map((user) => user.target_user_id);
  }

  /**
   * Unblock a user (admin action)
   */
  static async unblockUser(
    adminId: string,
    blockedUserId: string,
    blockerId: string
  ) {
    const supabase = createClient();

    try {
      // Create admin action record for unblocking
      const { error } = await supabase.from("admin_actions").insert({
        admin_id: adminId,
        target_user_id: blockedUserId,
        action_type: "user_unblocked",
        description: `User unblocked by admin`,
        details: {
          original_blocker_id: blockerId,
          unblocked_by: adminId,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) {
        throw new Error(`Failed to unblock user: ${error.message}`);
      }

      return {
        success: true,
        message: "User unblocked successfully",
      };
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  }
}
