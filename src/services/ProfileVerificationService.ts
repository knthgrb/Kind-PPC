import { createClient } from "@/utils/supabase/server";

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_verified: boolean | null;
  verification_status: "pending" | "approved" | "rejected";
  verification_notes: string | null;
  uploaded_at: string | null;
  verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserWithDocuments {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  profile_image_url: string | null;
  role: "kindtao" | "kindbossing" | "admin";
  created_at: string;
  user_documents: UserDocument[];
}

export class ProfileVerificationService {
  /**
   * Get all users with pending document verifications
   */
  static async getPendingVerifications() {
    const supabase = await createClient();

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
        user_documents!inner (
          id,
          user_id,
          document_type,
          file_name,
          file_path,
          file_size,
          mime_type,
          is_verified,
          verification_status,
          verification_notes,
          uploaded_at,
          verified_at,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_documents.verification_status", "pending")
      .order("user_documents.uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending verifications:", error);
      return { data: null, error };
    }

    return { data: data as UserWithDocuments[], error: null };
  }

  /**
   * Get all users with their documents (for admin view)
   */
  static async getAllUsersWithDocuments() {
    const supabase = await createClient();

    // Get users who have documents by joining with user_documents
    const { data: usersWithDocs, error: usersError } = await supabase
      .from("user_documents")
      .select(
        `
        user_id,
        users!inner (
          id,
          email,
          first_name,
          last_name,
          phone,
          profile_image_url,
          role,
          created_at
        )
      `
      )
      .order("uploaded_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users with documents:", usersError);
      return { data: null, error: usersError };
    }

    if (!usersWithDocs || usersWithDocs.length === 0) {
      return { data: [], error: null };
    }

    // Get all documents for these users
    const userIds = usersWithDocs.map((u) => u.user_id);
    const { data: documents, error: docsError } = await supabase
      .from("user_documents")
      .select(
        `
        id,
        user_id,
        document_type,
        file_name,
        file_path,
        file_size,
        mime_type,
        is_verified,
        verification_status,
        verification_notes,
        uploaded_at,
        verified_at,
        created_at,
        updated_at
      `
      )
      .in("user_id", userIds);

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      return { data: null, error: docsError };
    }

    // Combine users with their documents
    const usersWithDocuments = usersWithDocs.map((userDoc) => ({
      ...userDoc.users,
      user_documents:
        documents?.filter((doc) => doc.user_id === userDoc.user_id) || [],
    }));

    return {
      data: usersWithDocuments as unknown as UserWithDocuments[],
      error: null,
    };
  }

  /**
   * Approve a document verification
   */
  static async approveDocument(documentId: string, notes?: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_documents")
      .update({
        is_verified: true,
        verification_status: "approved",
        verification_notes: notes || null,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select();

    if (error) {
      console.error("Error approving document:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Reject a document verification
   */
  static async rejectDocument(documentId: string, notes: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_documents")
      .update({
        is_verified: false,
        verification_status: "rejected",
        verification_notes: notes,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select();

    if (error) {
      console.error("Error rejecting document:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Get user documents by user ID
   */
  static async getUserDocuments(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_documents")
      .select("*")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching user documents:", error);
      return { data: null, error };
    }

    return { data: data as UserDocument[], error: null };
  }
}
