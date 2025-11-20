import type { ConvexHttpClient } from "convex/browser";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { logger } from "@/utils/logger";

type ConvexClient = ConvexHttpClient | ConvexReactClient;

export type AdminActionPayload = {
  admin_id?: string | null;
  target_user_id: string;
  action_type: string;
  description?: string;
  details?: Record<string, unknown>;
};

export const AdminActionService = {
  async createAction(convex: ConvexClient, payload: AdminActionPayload) {
    try {
      await convex.mutation(api.adminActions.createAdminAction, {
        admin_id: payload.admin_id ?? null,
        target_user_id: payload.target_user_id,
        action_type: payload.action_type,
        description: payload.description ?? undefined,
        details: payload.details ?? undefined,
      });
      return { success: true };
    } catch (error) {
      logger.error("Error creating admin action:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create action",
      };
    }
  },
};

