"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";
import { extractStorageIdFromResponse } from "@/utils/convex/storage";

export async function uploadDocument(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!convex) {
      return { success: false, error: "Database connection failed" };
    }

    // Extract user ID
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    // Extract form data
    const title = formData.get("title") as string;
    const documentType = formData.get("type") as string;
    const file = formData.get("file") as File;

    if (!title || !documentType || !file) {
      return { success: false, error: "Missing required fields" };
    }

    // Generate upload URL from Convex
    const uploadUrl = await convex.mutation(api.storage.generateUploadUrl);

    // Upload file to Convex storage
    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadResult.ok) {
      throw new Error(`Upload failed: ${uploadResult.statusText}`);
    }

    // Get storage ID (Convex returns it as text)
    const storageId = await extractStorageIdFromResponse(uploadResult);

    // Get file URL from storage ID
    const fileUrl = await convex.query(api.storage.getFileUrl, {
      storageId: storageId as any,
    });

    if (!fileUrl) {
      throw new Error("Failed to get file URL");
    }

    // Save document metadata to verification_documents table
    await convex.mutation(api.documents.createVerificationDocument, {
      user_id: userId,
      file_url: fileUrl,
      title: title,
      size: file.size,
      content_type: file.type,
      document_type: documentType,
    });

    logger.info("Verification document uploaded successfully:", {
      userId,
      title,
      documentType,
    });

    return { success: true };
  } catch (err) {
    logger.error("Failed to upload verification document:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload document",
    };
  }
}

