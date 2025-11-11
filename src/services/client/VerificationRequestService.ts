import { createClient } from "@/utils/supabase/client";
import {
  KindTaoVerificationRequest,
  KindTaoVerificationDocument,
} from "@/types/workExperience";

export interface CreateVerificationRequestData {
  notes?: string; // Admin-only field for rejection reasons or admin notes
}

export class VerificationRequestService {
  /**
   * Create a new verification request
   */
  static async createVerificationRequest(
    requestData: CreateVerificationRequestData = {}
  ) {
    const supabase = createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error("User not authenticated");
    }

    console.log("🔍 Creating verification request with data:", {
      user_id: user.user.id,
      notes: requestData.notes || null,
      user_metadata: user.user.user_metadata,
      role: user.user.user_metadata?.role,
    });

    const { data, error } = await supabase
      .from("verification_requests")
      .insert({
        user_id: user.user.id,
        notes: requestData.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Verification request creation failed:", {
        error: error,
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        error_hint: error.hint,
        user_id: user.user.id,
        user_role: user.user.user_metadata?.role,
      });
      throw error;
    }

    console.log("✅ Verification request created successfully:", data);
    return { data, error: null };
  }

  /**
   * Create or update verification request (upsert logic)
   * If user already has a verification request, update it to pending status
   * If no request exists, create a new one
   */
  static async createOrUpdateVerificationRequest(
    requestData: CreateVerificationRequestData = {}
  ) {
    const supabase = createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error("User not authenticated");
    }

    try {
      // First check if user already has a verification request
      const { data: existingRequest, error: checkError } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error(
          "❌ Error checking existing verification request:",
          checkError
        );
        throw checkError;
      }

      if (existingRequest) {
        // Update existing request to pending status
        console.log(
          "📝 Updating existing verification request:",
          existingRequest.id
        );
        const { data, error } = await supabase
          .from("verification_requests")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRequest.id)
          .select()
          .single();

        if (error) {
          console.error("❌ Verification request update failed:", error);
          throw error;
        }

        console.log("✅ Verification request updated successfully:", data);
        return { data, error: null };
      } else {
        // Create new verification request
        console.log("🆕 Creating new verification request");
        return await this.createVerificationRequest(requestData);
      }
    } catch (error) {
      console.error(
        "💥 Exception in createOrUpdateVerificationRequest:",
        error
      );
      throw error;
    }
  }

  /**
   * Get the verification request for the current user with documents (only one per user)
   */
  static async getVerificationRequest() {
    const supabase = createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error("User not authenticated");
    }

    try {
      // First get the verification request
      const { data: requestData, error: requestError } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (requestError) {
        console.log("🔍 Supabase query error details:", {
          code: requestError.code,
          message: requestError.message,
          details: requestError.details,
          hint: requestError.hint,
          user_id: user.user.id,
        });

        // If no record found, that's okay - user hasn't created a request yet
        if (requestError.code === "PGRST116") {
          console.log(
            "📝 No verification request found for user - this is normal for new users"
          );
          return { data: null, error: null };
        }

        console.error(
          "❌ Error loading KindTao verification request:",
          requestError
        );
        return { data: null, error: null };
      }

      // If we have a request, fetch the associated documents
      if (requestData) {
        const { data: documents, error: documentsError } = await supabase
          .from("verification_documents")
          .select("*")
          .eq("user_id", user.user.id)
          .order("created_at", { ascending: false });

        if (documentsError) {
          console.error(
            "❌ Error loading verification documents:",
            documentsError
          );
          // Return the request without documents if documents fail to load
          return { data: requestData, error: null };
        }

        // Combine request with documents
        const requestWithDocuments: KindTaoVerificationRequest = {
          ...requestData,
          documents: documents || [],
        };

        return { data: requestWithDocuments, error: null };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error("💥 Exception in getVerificationRequest:", {
        error: error,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        user_id: user.user.id,
      });
      return { data: null, error: null };
    }
  }

  /**
   * Update an existing verification request
   */
  static async updateVerificationRequest(
    requestId: string,
    updateData: { status?: string; notes?: string }
  ) {
    const supabase = createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error("User not authenticated");
    }

    console.log("🔍 Updating verification request:", {
      requestId,
      updateData,
      user_id: user.user.id,
      user_role: user.user.user_metadata?.role,
    });

    const { data, error } = await supabase
      .from("verification_requests")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("❌ Verification request update failed:", {
        error: error,
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        error_hint: error.hint,
        requestId,
        user_id: user.user.id,
        user_role: user.user.user_metadata?.role,
      });
      throw error;
    }

    console.log("✅ Verification request updated successfully:", data);
    return { data, error: null };
  }

  /**
   * Save document metadata to the database
   */
  static async saveDocumentMetadata(documentData: {
    title: string;
    file_url: string;
    size: number;
    content_type: string;
    document_type: string;
  }) {
    const supabase = createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error("User not authenticated");
    }

    console.log("🔍 Saving document metadata:", {
      user_id: user.user.id,
      ...documentData,
    });

    const { data, error } = await supabase
      .from("verification_documents")
      .insert({
        user_id: user.user.id,
        title: documentData.title,
        file_url: documentData.file_url,
        size: documentData.size,
        content_type: documentData.content_type,
        document_type: documentData.document_type,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Document metadata save failed:", error);
      throw error;
    }

    console.log("✅ Document metadata saved successfully:", data);
    return { data, error: null };
  }

  /**
   * Check if user has required documents uploaded to storage
   */
  static async hasRequiredDocuments() {
    const supabase = createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error("User not authenticated");
    }

    try {
      // Check documents in the database first
      const { data: dbDocuments, error: dbError } = await supabase
        .from("verification_documents")
        .select("*")
        .eq("user_id", user.user.id);

      if (dbError) {
        console.error("Error checking documents in database:", dbError);
        return {
          hasRequiredDocuments: false,
          hasValidId: false,
          hasBarangayClearance: false,
          documents: [],
        };
      }

      // Check if both required documents are present in database using document_type
      const hasValidId = dbDocuments?.some(
        (doc) => doc.document_type === "id_card"
      );
      const hasBarangayClearance = dbDocuments?.some(
        (doc) => doc.document_type === "barangay_clearance"
      );

      return {
        hasRequiredDocuments: hasValidId && hasBarangayClearance,
        hasValidId: !!hasValidId,
        hasBarangayClearance: !!hasBarangayClearance,
        documents: dbDocuments || [],
      };
    } catch (error) {
      console.error("Error in hasRequiredDocuments:", error);
      return {
        hasRequiredDocuments: false,
        hasValidId: false,
        hasBarangayClearance: false,
        documents: [],
      };
    }
  }
}
