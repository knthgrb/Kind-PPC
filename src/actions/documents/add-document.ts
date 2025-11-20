"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function addDocument(data: {
  file_url: string;
  title: string;
  size: number;
  content_type?: string;
}): Promise<{ success: boolean; error?: string }> {
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

    await convex.mutation(api.documents.createKindBossingDocument, {
      kindbossing_user_id: userId,
      file_url: data.file_url,
      title: data.title,
      size: data.size,
      content_type: data.content_type,
    });

    logger.info("Document added successfully:", {
      userId,
      title: data.title,
    });

    return { success: true };
  } catch (err) {
    logger.error("Failed to add document:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add document",
    };
  }
}

