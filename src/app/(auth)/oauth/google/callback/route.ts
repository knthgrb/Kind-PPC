import { getCurrentUser } from "@/utils/auth";
import { createServerConvexClient, api } from "@/utils/convex/server";
import { getToken } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import type { ConvexHttpClient } from "convex/browser";

type UserRole = "kindbossing" | "kindtao";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";
  const role = searchParams.get("role") as UserRole | null;

  try {
    // Get token first
    const token = await getToken();
    if (!token) {
      logger.warn("No authentication token in Google OAuth callback");
      return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
    }

    // Better Auth handles the OAuth exchange automatically
    // At this point, the user should be authenticated
    const convex = await createServerConvexClient(token);
    const user = await getCurrentUser(token, convex);

    if (!user) {
      logger.warn("No authenticated user in Google OAuth callback");
      return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
    }

    // Extract user ID from Better Auth user object
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      logger.error(
        "Cannot extract user ID from Better Auth user in Google OAuth callback",
        {
          userKeys: user && typeof user === "object" ? Object.keys(user) : [],
        }
      );
      return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
    }

    // Handle user creation/update and role assignment in Convex
    const result = await handleUserSetup(convex, token, userId, user, role);
    if (result.error) {
      logger.error("Error setting up user:", result.error);
      return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
    }

    // If we need user to select a role first-time, send to select-role
    if (result.needsRoleSelection) {
      return NextResponse.redirect(`${origin}/select-role`);
    }

    // Check onboarding status for proper redirect
    const existingUser = await convex.query(api.users.getUserById, {
      userId,
    });

    // If user has completed onboarding, redirect to dashboard instead of onboarding
    if (existingUser?.has_completed_onboarding) {
      if (result.role === "kindbossing") {
        return NextResponse.redirect(`${origin}/my-job-posts`);
      } else if (result.role === "kindtao") {
        return NextResponse.redirect(`${origin}/recs`);
      }
    }

    // Redirect based on role (to onboarding if not completed)
    return NextResponse.redirect(getRedirectUrl(origin, result.role, next));
  } catch (error) {
    logger.error("Unexpected error in Google OAuth callback:", error);
    return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
  }
}

async function handleUserSetup(
  convex: ConvexHttpClient,
  token: string,
  userId: string,
  user: any,
  providedRole: UserRole | null
) {
  try {
    // Check if user exists in Convex users table
    const existingUser = await convex.query(api.users.getUserById, {
      userId,
    });

    // Extract user data from Better Auth user object (Better Auth handles profile mapping)
    const userData = extractUserDataFromBetterAuth(user);

    // Determine final role preference (exclude admin from UserRole type)
    const existingRole = existingUser?.role;
    let finalRole: UserRole | null = null;

    if (providedRole) {
      finalRole = providedRole;
    } else if (existingRole === "kindbossing" || existingRole === "kindtao") {
      finalRole = existingRole;
    }

    // If no role determined, force role selection
    if (!finalRole) {
      return { error: null, role: null, needsRoleSelection: true };
    }

    // Extract email from user object
    const email =
      (user as { email?: string })?.email ??
      (user as { user?: { email?: string } })?.user?.email ??
      "";

    // If no users row yet, create it now that we have a role
    if (!existingUser) {
      await convex.mutation(api.users.createUser, {
        id: userId,
        email: email,
        role: finalRole,
        first_name: userData.firstName || undefined,
        last_name: userData.lastName || undefined,
        profile_image_url: userData.profileImageUrl || undefined,
        phone: userData.phone || undefined,
        has_completed_onboarding: false,
      });

      logger.info(
        "User created successfully from Google OAuth with role:",
        finalRole
      );
    } else {
      // Update existing user - sync profile data from Better Auth
      const updates: any = {};

      // Update role if provided and different
      if (providedRole && providedRole !== existingUser.role) {
        updates.role = finalRole;
      }

      // Update profile image if Better Auth has a newer one
      if (
        userData.profileImageUrl &&
        userData.profileImageUrl !== existingUser.profile_image_url
      ) {
        updates.profile_image_url = userData.profileImageUrl;
      }

      // Update name if changed or missing
      if (
        userData.firstName &&
        userData.firstName !== existingUser.first_name
      ) {
        updates.first_name = userData.firstName;
      }
      if (userData.lastName && userData.lastName !== existingUser.last_name) {
        updates.last_name = userData.lastName;
      }

      // Update email if changed
      if (email && email !== existingUser.email) {
        updates.email = email;
      }

      if (Object.keys(updates).length > 0) {
        await convex.mutation(api.users.updateUser, {
          userId,
          updates,
        });

        logger.info(
          "User updated successfully from Google OAuth:",
          Object.keys(updates)
        );
      }
    }

    // Ensure default settings exist
    await convex.mutation(api.userSettings.ensureDefaultSettings, {
      user_id: userId,
      defaultSettings: {},
    });

    return { error: null, role: finalRole, needsRoleSelection: false };
  } catch (error) {
    logger.error("Error in handleUserSetup:", error);
    return { error, role: null, needsRoleSelection: false };
  }
}

function extractUserDataFromBetterAuth(user: any) {
  // Better Auth user object structure - handle different possible structures
  const name =
    (user as { name?: string })?.name ??
    (user as { user?: { name?: string } })?.user?.name ??
    "";
  const nameParts = name.split(" ").filter((part: string) => part.trim());
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Extract image/profile picture
  const profileImageUrl =
    (user as { image?: string | null })?.image ??
    (user as { picture?: string | null })?.picture ??
    (user as { user?: { image?: string | null } })?.user?.image ??
    null;

  // Extract phone (usually not available from Google OAuth)
  const phone =
    (user as { phone?: string | null })?.phone ??
    (user as { user?: { phone?: string | null } })?.user?.phone ??
    null;

  return {
    firstName,
    lastName,
    phone,
    profileImageUrl,
  };
}

function getRedirectUrl(
  origin: string,
  role: UserRole | null,
  next: string
): string {
  // If user has a role and next is not default, use next
  if (role && next !== "/") {
    return `${origin}${next}`;
  }

  // Check if user has completed onboarding
  // Note: This check happens after user setup, so we need to check again
  // For now, redirect to onboarding - the onboarding pages will check completion status

  // Role-based redirects
  switch (role) {
    case "kindbossing":
      // Check onboarding status - if completed, go to dashboard, else onboarding
      return `${origin}/kindbossing-onboarding/business-info`;
    case "kindtao":
      // Check onboarding status - if completed, go to dashboard, else onboarding
      return `${origin}/kindtao-onboarding`;
    default:
      return `${origin}/select-role`;
  }
}
