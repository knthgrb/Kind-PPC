"use server";

import { UserVerificationService } from "@/services/UserVerificationService";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function approveDocument(documentId: string, notes?: string) {
  try {
    // Get current admin user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { success, error } = await UserVerificationService.approveDocument(
      documentId, 
      user.id, 
      notes
    );
    
    if (!success) {
      console.error("Error approving document:", error);
      return { success: false, error: error?.message || "Failed to approve document" };
    }

    revalidatePath("/admin/profile-verification");
    return { success: true, error: null };
  } catch (error) {
    console.error("Unexpected error approving document:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function rejectDocument(documentId: string, notes: string = "Document rejected by admin") {
  try {
    // Get current admin user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { success, error } = await UserVerificationService.rejectDocument(
      documentId, 
      user.id, 
      notes
    );
    
    if (!success) {
      console.error("Error rejecting document:", error);
      return { success: false, error: error?.message || "Failed to reject document" };
    }

    revalidatePath("/admin/profile-verification");
    return { success: true, error: null };
  } catch (error) {
    console.error("Unexpected error rejecting document:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
