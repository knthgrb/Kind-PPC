"use server";

import { getServerActionContext, type ServerActionContext } from "@/utils/server-action-context";
import { MatchService } from "@/services/MatchService";
import { logger } from "@/utils/logger";
import { api } from "@/utils/convex/server";

export async function getMatches(
  context?: ServerActionContext & { error: "NOT_AUTHENTICATED" | null }
) {
  try {
    // Use provided context or fetch new one
    const ctx = context || (await getServerActionContext({ requireUser: true }));
    const { convex, user, error } = ctx;

    if (error || !user || !convex) {
      return { matches: [], error: "NOT_AUTHENTICATED" };
    }

    const userId = user.id || user.userId || user._id;
    if (!userId) {
      logger.error("User ID not found in getMatches:", { user });
      return { matches: [], error: "USER_ID_NOT_FOUND" };
    }

    // Extract role - check multiple possible locations
    let role = (user as any).role || (user as any).userRole || null;
    
    // Debug: Log user object structure to understand what we're working with
    logger.debug("User object in getMatches:", {
      userId,
      role,
      userKeys: Object.keys(user || {}),
      userRole: (user as any).role,
      userUserRole: (user as any).userRole,
    });

    // If role is not in user object, fetch it from database
    if (!role) {
      try {
        const userRecord = await convex.query(api.users.getUserById, { userId });
        role = (userRecord as any)?.role || null;
        logger.debug("Fetched role from database:", { userId, role });
      } catch (error) {
        logger.error("Error fetching user role from database:", error);
      }
    }

    // TEMPORARY: Remove role check to test fetching
    // TODO: Re-enable role check after confirming matches are being fetched
    // if (!role || role === "admin") {
    //   logger.debug("Invalid role in getMatches:", { role, userId });
    //   return { matches: [] };
    // }

    logger.debug("Getting matches for user:", { userId, role });

    // Get all matches - use role if available, otherwise try both
    let matches: any[] = [];
    const filterOptions = { filterOpenedWithConversation: true };
    if (role && (role === "kindtao" || role === "kindbossing")) {
      matches = await MatchService.getUserMatches(
        convex,
        userId,
        role as "kindtao" | "kindbossing",
        filterOptions
      );
    } else {
      logger.debug(
        "No valid role found, trying both kindtao and kindbossing queries"
      );
      const [kindtaoMatches, kindbossingMatches] = await Promise.all([
        MatchService.getUserMatches(convex, userId, "kindtao", filterOptions),
        MatchService.getUserMatches(
          convex,
          userId,
          "kindbossing",
          filterOptions
        ),
      ]);
      matches = [...kindtaoMatches, ...kindbossingMatches];
    }

    if (!matches || matches.length === 0) {
      logger.debug("No matches found for user:", {
        userId,
        role,
      });
      return { matches: [] };
    }

    logger.debug("Filtered matches:", {
      userId,
      role,
      count: matches.length,
      matchIds: matches.map((m) => String(m._id || "")),
    });

    return { matches };
  } catch (error) {
    logger.error("Error in getMatches server action:", error);
    return {
      matches: [],
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    };
  }
}

