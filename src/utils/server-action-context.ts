import type { ConvexHttpClient } from "convex/browser";
import { createServerConvexClient } from "@/utils/convex/server";
import { getToken } from "@/lib/auth-server";
import { getCurrentUser } from "@/utils/auth";

export type ServerActionContext = {
  convex: ConvexHttpClient | null;
  token: string | null;
  user: any | null;
};

export async function getServerActionContext(options?: {
  requireUser?: boolean;
}): Promise<
  ServerActionContext & {
    error: "NOT_AUTHENTICATED" | null;
  }
> {
  const token = (await getToken()) ?? null;

  const convex = await createServerConvexClient(token || undefined);
  const user = token ? await getCurrentUser(token, convex) : null;

  if (options?.requireUser && !user) {
    return {
      convex,
      token,
      user: null,
      error: "NOT_AUTHENTICATED",
    };
  }

  return {
    convex,
    token,
    user,
    error: null,
  };
}
