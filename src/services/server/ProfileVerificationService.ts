import { createClient } from "@/utils/supabase/server";

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  verification_status: string | null;
}

export interface UserWithDocuments {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_image_url: string | null;
  role: string;
  created_at: string;
  user_documents: UserDocument[] | null;
}

export class ProfileVerificationService {
  /**
   * Get all users with their documents for profile verification
   */
  static async getAllUsersWithDocuments(): Promise<{
    data: UserWithDocuments[] | null;
    error: Error | null;
  }> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          email,
          first_name,
          last_name,
          phone,
          profile_image_url,
          role,
          created_at,
          user_documents!left (
            id,
            user_id,
            document_type,
            file_name,
            file_path,
            verification_status
          )
        `
        )
        .in("role", ["kindtao", "kindbossing"]);

      if (error) {
        console.error("Error fetching users with documents:", error);
        return { data: null, error: error as Error };
      }

      // Filter to only include users who have at least one document
      const usersWithDocuments = (data || []).filter(
        (user) => user.user_documents && user.user_documents.length > 0
      ) as UserWithDocuments[];

      return { data: usersWithDocuments, error: null };
    } catch (error) {
      console.error("Unexpected error in getAllUsersWithDocuments:", error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}

