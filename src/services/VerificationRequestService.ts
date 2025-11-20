import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { getCurrentUser } from "@/utils/auth";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export interface CreateVerificationRequestData {
  notes?: string;
}

export interface KindTaoVerificationRequest {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  created_at: string;
  updated_at?: string;
  documents?: any[];
}

export const VerificationRequestService = {
  /**
   * Create a new verification request (client-side)
   */
  async createVerificationRequest(
    convex: ConvexClient,
    requestData: CreateVerificationRequestData = {}
  ) {
    try {
      // Get current user
      const session = await authClient.getSession();
      const sessionUser = session?.data?.session;
      if (!sessionUser?.userId) {
        throw new Error("User not authenticated");
      }

      const userId = sessionUser.userId;

      const requestId = await convex.mutation(
        api.verification.createVerificationRequest,
        {
          user_id: userId,
          status: "pending",
        }
      );

      return {
        data: { id: String(requestId), user_id: userId, ...requestData },
        error: null,
      };
    } catch (error) {
      logger.error("Error creating verification request:", error);
      throw error;
    }
  },

  /**
   * Create or update verification request (client-side)
   */
  async createOrUpdateVerificationRequest(
    convex: ConvexClient,
    requestData: CreateVerificationRequestData = {}
  ) {
    try {
      const session = await authClient.getSession();
      const sessionUser = session?.data?.session;
      if (!sessionUser?.userId) {
        throw new Error("User not authenticated");
      }

      const userId = sessionUser.userId;

      // Check if request exists
      const existing = await convex.query(
        api.verification.getVerificationRequestByUser,
        {
          userId,
        }
      );

      if (existing) {
        // Update existing request
        await convex.mutation(api.verification.updateVerificationRequest, {
          requestId: existing._id,
          status: "pending",
          notes: requestData.notes,
        });
        return { data: existing, error: null };
      } else {
        // Create new request
        return await this.createVerificationRequest(convex, requestData);
      }
    } catch (error) {
      logger.error("Error in createOrUpdateVerificationRequest:", error);
      throw error;
    }
  },

  /**
   * Get verification request for current user (client-side)
   */
  async getVerificationRequest(convex: ConvexClient) {
    try {
      const session = await authClient.getSession();
      const sessionUser = session?.data?.session;
      if (!sessionUser?.userId) {
        throw new Error("User not authenticated");
      }

      const userId = sessionUser.userId;

      const request = await convex.query(
        api.verification.getVerificationRequestByUser,
        {
          userId,
        }
      );

      if (!request) {
        return { data: null, error: null };
      }

      // Get documents
      const documents = await convex.query(
        api.documents.getVerificationDocuments,
        {
          userId,
        }
      );

      const requestWithDocuments: KindTaoVerificationRequest = {
        id: String(request._id),
        user_id: request.user_id,
        status: request.status,
        notes: request.notes,
        created_at: new Date(request.created_at).toISOString(),
        updated_at: request.updated_at
          ? new Date(request.updated_at).toISOString()
          : undefined,
        documents: documents || [],
      };

      return { data: requestWithDocuments, error: null };
    } catch (error) {
      logger.error("Error getting verification request:", error);
      return { data: null, error: null };
    }
  },

  /**
   * Update verification request (server-side)
   */
  async updateVerificationRequest(
    convex: ConvexClient,
    requestId: string,
    updateData: { status?: "pending" | "approved" | "rejected"; notes?: string }
  ) {
    try {
      await convex.mutation(api.verification.updateVerificationRequest, {
        requestId: requestId as any,
        status: updateData.status || "pending",
        notes: updateData.notes,
      });

      return { data: { id: requestId, ...updateData }, error: null };
    } catch (error) {
      logger.error("Error updating verification request:", error);
      throw error;
    }
  },

  /**
   * Save document metadata (client-side)
   */
  async saveDocumentMetadata(
    convex: ConvexClient,
    documentData: {
      title: string;
      file_url: string;
      size: number;
      content_type: string;
      document_type: string;
    }
  ) {
    try {
      const session = await authClient.getSession();
      const sessionUser = session?.data?.session;
      if (!sessionUser?.userId) {
        throw new Error("User not authenticated");
      }

      const userId = sessionUser.userId;

      const documentId = await convex.mutation(
        api.documents.createVerificationDocument,
        {
          user_id: userId,
          file_url: documentData.file_url,
          size: documentData.size,
          title: documentData.title,
          content_type: documentData.content_type,
          document_type: documentData.document_type,
        }
      );

      return { data: { id: String(documentId), ...documentData }, error: null };
    } catch (error) {
      logger.error("Error saving document metadata:", error);
      throw error;
    }
  },

  /**
   * Check if user has required documents
   */
  async hasRequiredDocuments(convex: ConvexClient) {
    try {
      const session = await authClient.getSession();
      const sessionUser = session?.data?.session;
      if (!sessionUser?.userId) {
        throw new Error("User not authenticated");
      }

      const userId = sessionUser.userId;

      const documents = await convex.query(
        api.documents.getVerificationDocuments,
        {
          userId,
        }
      );

      const hasValidId = documents?.some(
        (doc: any) => doc.document_type === "id_card"
      );
      const hasBarangayClearance = documents?.some(
        (doc: any) => doc.document_type === "barangay_clearance"
      );

      return {
        hasRequiredDocuments: hasValidId && hasBarangayClearance,
        hasValidId: !!hasValidId,
        hasBarangayClearance: !!hasBarangayClearance,
        documents: documents || [],
      };
    } catch (error) {
      logger.error("Error checking required documents:", error);
      return {
        hasRequiredDocuments: false,
        hasValidId: false,
        hasBarangayClearance: false,
        documents: [],
      };
    }
  },
};
