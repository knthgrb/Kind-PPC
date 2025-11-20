import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth-server";
import { getCurrentUser } from "@/utils/auth";
import { createServerConvexClient, api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function GET() {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const convex = await createServerConvexClient(token);
    const authUser = await getCurrentUser(token, convex);
    const authUserId =
      (authUser as { userId?: string | null })?.userId ??
      (authUser as { id?: string | null })?.id ??
      (authUser as { _id?: string | null })?._id ??
      null;

    if (!authUserId) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const userRecord = await convex.query(api.users.getUserById, {
      userId: authUserId,
    });

    if (!userRecord) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ user: userRecord });
  } catch (error) {
    logger.error("Failed to fetch current user profile", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
