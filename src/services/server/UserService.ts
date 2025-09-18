import { User } from "@/types/user";
import { logger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const UserService = {
  async getCurrentUser(): Promise<{ data: User | null; error: Error | null }> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      logger.error("Error getting current user:", error);
      return { data: null, error: error || null };
    }
    return { data: data.user as unknown as User | null, error: error || null };
  },

  async getCurrentUserRole(): Promise<{
    role: "kindtao" | "kindbossing" | "admin" | null;
  }> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      logger.error("Error getting current user role:", error);
      return { role: null };
    }
    return {
      role: data.user?.user_metadata.role as
        | "kindtao"
        | "kindbossing"
        | "admin"
        | null,
    };
  },

  async updateUserMetadata(data: any) {
    const supabase = await createClient();
    const { data: user, error } = await supabase.auth.updateUser({
      data: data,
    });
    if (error) {
      logger.error("Error updating user metadata:", error);
      return { data: null, error: error || null };
    }
    return { data: user || null, error: error || null };
  },

  /**
   * Get user details by ID from auth system using admin client
   */
  async getUserDetailsById(
    userId: string
  ): Promise<{ data: User | null; error: Error | null }> {
    try {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient.auth.admin.getUserById(userId);

      if (error) {
        logger.error("Error getting user details by ID:", error);
        return { data: null, error: error || null };
      }

      if (!data.user) {
        logger.warn("User not found:", userId);
        return { data: null, error: new Error("User not found") };
      }

      // Extract user details from user_metadata
      const metadata = data.user.user_metadata || {};

      const userDetails: User = {
        ...data.user,
        user_metadata: {
          role: metadata.role || "kindtao",
          first_name: metadata.first_name || "",
          last_name: metadata.last_name || "",
          email: data.user.email || "",
          phone: metadata.phone || "",
          business_name: metadata.business_name || null,
          date_of_birth: metadata.date_of_birth || null,
          gender: metadata.gender || null,
          profile_image_url: metadata.profile_image_url || null,
          full_address: metadata.address || null,
          city: metadata.city || null,
          province: metadata.province || null,
          postal_code: metadata.postal_code || null,
          verification_status: metadata.email_verified ? "approved" : "pending",
          subscription_tier: metadata.subscription_tier || "free",
          swipe_credits: metadata.swipe_credits || 0,
          boost_credits: metadata.boost_credits || 0,
        },
      };

      return { data: userDetails, error: null };
    } catch (error) {
      logger.error("Error fetching user details by ID:", error);
      return { data: null, error: error as Error };
    }
  },
};
