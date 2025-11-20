import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth-server";
import { getCurrentUser } from "@/utils/auth";
import { createServerConvexClient, api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

type UserRole = "kindbossing" | "kindtao";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const errorCode = searchParams.get("error");

  if (errorCode) {
    const errorUrl = new URL("/email-not-confirmed", origin);
    errorUrl.searchParams.set("error", errorCode);
    return NextResponse.redirect(errorUrl);
  }

  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.redirect(`${origin}/login`);
    }

    const convex = await createServerConvexClient(token);
    const user = await getCurrentUser(token, convex);

    if (!user?.id) {
      return NextResponse.redirect(`${origin}/login`);
    }

    let userData = await convex.query(api.users.getUserById, {
      userId: user.id,
    });

    const pendingRoleRecord =
      user.email &&
      (await convex.query(api.pendingUserRoles.getByEmail, {
        email: user.email.toLowerCase(),
      }));

    if (!userData) {
      const resolvedRole =
        (resolveRole(searchParams.get("role")) as UserRole | null) ||
        (pendingRoleRecord?.role === "admin"
          ? null
          : (pendingRoleRecord?.role as UserRole | null));

      if (!resolvedRole) {
        return NextResponse.redirect(`${origin}/select-role`);
      }

      const { firstName, lastName } = deriveNames(
        pendingRoleRecord?.first_name,
        pendingRoleRecord?.last_name,
        user.name
      );

      await convex.mutation(api.users.createUser, {
        id: user.id,
        email: user.email || "",
        role: resolvedRole,
        first_name: firstName,
        last_name: lastName,
        profile_image_url: user.image || null,
        swipe_credits: 10,
        boost_credits: 5,
        has_completed_onboarding: false,
      });

      await convex.mutation(api.userSettings.ensureDefaultSettings, {
        user_id: user.id,
        defaultSettings: {},
      });

      if (user.email) {
        await convex.mutation(api.pendingUserRoles.deleteByEmail, {
          email: user.email,
        });
      }

      userData = await convex.query(api.users.getUserById, {
        userId: user.id,
      });
    }

    if (!userData?.role) {
      return NextResponse.redirect(`${origin}/select-role`);
    }

    if (userData.role === "kindbossing") {
      const destination = userData.has_completed_onboarding
        ? "/my-job-posts"
        : "/kindbossing-onboarding/business-info";
      return NextResponse.redirect(`${origin}${destination}`);
    }

    if (userData.role === "kindtao") {
      const destination = userData.has_completed_onboarding
        ? "/recs"
        : "/kindtao-onboarding";
      return NextResponse.redirect(`${origin}${destination}`);
    }

    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    logger.error("Error in email confirmation callback:", error);
    return NextResponse.redirect(`${origin}/login`);
  }
}

function resolveRole(roleParam: string | null): UserRole | null {
  if (roleParam === "kindbossing" || roleParam === "kindtao") {
    return roleParam;
  }
  return null;
}

function deriveNames(
  pendingFirstName?: string | null,
  pendingLastName?: string | null,
  fallbackName?: string | null
) {
  if (pendingFirstName || pendingLastName) {
    return {
      firstName: pendingFirstName ?? "",
      lastName: pendingLastName ?? "",
    };
  }

  const parts = (fallbackName || "").trim().split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

  return { firstName, lastName };
}
