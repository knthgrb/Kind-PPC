import { User } from "@/types/user";
import { logger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";

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
};
