"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function getDocuments(): Promise<{
  success: boolean;
  documents?: any[];
  error?: string;
}> {
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

    const documents = await convex.query(api.documents.getKindBossingDocuments, {
      userId,
    });

    return { success: true, documents: documents as any[] };
  } catch (err) {
    logger.error("Failed to get documents:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to get documents",
    };
  }
}

