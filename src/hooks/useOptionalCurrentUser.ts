"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/utils/convex/client";

/**
 * Safely fetches the current authenticated user.
 * When the user is logged out, skips the Convex query to avoid
 * throwing `Unauthenticated` errors.
 */
export function useOptionalCurrentUser() {
  const auth = useConvexAuth();
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    auth.isAuthenticated ? undefined : "skip"
  );

  return {
    currentUser,
    ...auth,
  };
}

