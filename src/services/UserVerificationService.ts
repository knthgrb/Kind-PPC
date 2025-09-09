import { createClient } from "@/utils/supabase/server";

export interface UserVerification {
  id: string;
  user_id: string;
  barangay_clearance_url: string | null;
  clinic_certificate_url: string | null;
  valid_id_url: string | null;
  additional_documents: any | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminAction {
  id: string;
  admin_id: string | null;
  target_user_id: string | null;
  action_type: string;
  description: string | null;
  details: any | null;
  created_at: string | null;
}

export class UserVerificationService {
  /**
   * Approve a document and update verification status
   */
  static async approveDocument(documentId: string, adminId: string, notes?: string) {
    const supabase = await createClient();
    
    try {
      // Start a transaction
      const { data: document, error: docError } = await supabase
        .from('user_documents')
        .select('user_id, document_type, file_path')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error('Document not found');
      }

      // Update the document status
      const { error: updateError } = await supabase
        .from('user_documents')
        .update({
          is_verified: true,
          verification_status: 'approved',
          verification_notes: notes || null,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        throw updateError;
      }

      // Update or create user verification record
      const { data: existingVerification } = await supabase
        .from('user_verifications')
        .select('id')
        .eq('user_id', document.user_id)
        .single();

      const verificationData = {
        user_id: document.user_id,
        verification_status: 'approved' as const,
        admin_notes: notes || null,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update the specific document URL based on document type
      if (document.document_type === 'barangay_clearance') {
        verificationData.barangay_clearance_url = document.file_path;
      } else if (document.document_type === 'clinic_certificate') {
        verificationData.clinic_certificate_url = document.file_path;
      } else if (document.document_type === 'valid_id') {
        verificationData.valid_id_url = document.file_path;
      } else {
        // For additional documents, add to jsonb field
        const { data: currentVerification } = await supabase
          .from('user_verifications')
          .select('additional_documents')
          .eq('user_id', document.user_id)
          .single();

        const additionalDocs = currentVerification?.additional_documents || [];
        additionalDocs.push({
          type: document.document_type,
          url: document.file_path,
          verified_at: new Date().toISOString()
        });
        verificationData.additional_documents = additionalDocs;
      }

      if (existingVerification) {
        const { error: verificationError } = await supabase
          .from('user_verifications')
          .update(verificationData)
          .eq('id', existingVerification.id);

        if (verificationError) {
          throw verificationError;
        }
      } else {
        const { error: verificationError } = await supabase
          .from('user_verifications')
          .insert(verificationData);

        if (verificationError) {
          throw verificationError;
        }
      }

      // Log admin action
      await this.logAdminAction(adminId, document.user_id, 'document_approved', 
        `Approved ${document.document_type} document`, {
          document_id: documentId,
          document_type: document.document_type,
          notes: notes || null
        });

      return { success: true, error: null };
    } catch (error) {
      console.error('Error approving document:', error);
      return { success: false, error };
    }
  }

  /**
   * Reject a document and update verification status
   */
  static async rejectDocument(documentId: string, adminId: string, notes: string) {
    const supabase = await createClient();
    
    try {
      // Get document info
      const { data: document, error: docError } = await supabase
        .from('user_documents')
        .select('user_id, document_type')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error('Document not found');
      }

      // Update the document status
      const { error: updateError } = await supabase
        .from('user_documents')
        .update({
          is_verified: false,
          verification_status: 'rejected',
          verification_notes: notes,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        throw updateError;
      }

      // Update user verification status to rejected
      const { error: verificationError } = await supabase
        .from('user_verifications')
        .upsert({
          user_id: document.user_id,
          verification_status: 'rejected',
          admin_notes: notes,
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (verificationError) {
        throw verificationError;
      }

      // Log admin action
      await this.logAdminAction(adminId, document.user_id, 'document_rejected', 
        `Rejected ${document.document_type} document`, {
          document_id: documentId,
          document_type: document.document_type,
          notes: notes
        });

      return { success: true, error: null };
    } catch (error) {
      console.error('Error rejecting document:', error);
      return { success: false, error };
    }
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(
    adminId: string, 
    targetUserId: string, 
    actionType: string, 
    description: string, 
    details?: any
  ) {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: targetUserId,
        action_type: actionType,
        description,
        details: details || null
      });

    if (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Get user verification status
   */
  static async getUserVerification(userId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user verification:', error);
      return { data: null, error };
    }

    return { data: data as UserVerification | null, error: null };
  }

  /**
   * Get admin actions for a user
   */
  static async getUserAdminActions(userId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('admin_actions')
      .select(`
        *,
        admin:admin_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin actions:', error);
      return { data: null, error };
    }

    return { data: data as (AdminAction & { admin: any })[] | null, error: null };
  }
}
