import type { ConvexHttpClient } from "convex/browser";
import { createServerConvexClient, api } from "@/utils/convex/server";
import { getToken } from "@/lib/auth-server";

/**
 * Get the current user on the server
 * Uses Convex query to get the authenticated user
 */
export async function getCurrentUser(
  tokenOverride?: string | null,
  convexOverride?: ConvexHttpClient
) {
  try {
    const token = tokenOverride ?? (await getToken());
    if (!token) {
      return null;
    }

    const convex = convexOverride ?? (await createServerConvexClient(token));

    return await convex.query(api.auth.getCurrentUser, {});
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(
  tokenOverride?: string | null,
  convexOverride?: ConvexHttpClient
) {
  const user = await getCurrentUser(tokenOverride, convexOverride);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
