"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";
import { Id } from "@/convex/_generated/dataModel";

export async function deleteDocument(
  documentId: string
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

    await convex.mutation(api.documents.deleteKindBossingDocument, {
      documentId: documentId as Id<"kindbossing_documents">,
    });

    logger.info("Document deleted successfully:", { documentId });

    return { success: true };
  } catch (err) {
    logger.error("Failed to delete document:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete document",
    };
  }
}

