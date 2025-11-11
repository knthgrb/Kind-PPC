import { UserSettingsService } from "@/services/server/UserSettingsService";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";

type UserRole = "kindbossing" | "kindtao";

interface GoogleUserMetadata {
  full_name?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  avatar_url?: string;
  picture?: string;
  phone?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const role = searchParams.get("role") as UserRole | null;

  if (!code) {
    return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
  }

  const supabase = await createClient();

  try {
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );
    if (exchangeError) {
      logger.error("Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
    }

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error("Error getting user:", userError);
      return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
    }

    // Handle user creation/update and role assignment
    const result = await handleUserSetup(supabase, user, role);
    if (result.error) {
      logger.error("Error setting up user:", result.error);
      return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
    }

    // If we need user to select a role first-time, send to select-role
    if (result.needsRoleSelection) {
      return NextResponse.redirect(`${origin}/select-role`);
    }

    // Redirect based on role
    return NextResponse.redirect(getRedirectUrl(origin, result.role, next));
  } catch (error) {
    logger.error("Unexpected error in Google OAuth callback:", error);
    return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
  }
}

async function handleUserSetup(
  supabase: any,
  user: any,
  providedRole: UserRole | null
) {
  // Check if user exists in users table
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = no rows returned
    return { error: fetchError, role: null, needsRoleSelection: false };
  }

  // Determine final role preference
  const finalRole: UserRole | null = providedRole || existingUser?.role || null;

  // If no role determined, force role selection
  if (!finalRole) {
    return { error: null, role: null, needsRoleSelection: true };
  }

  // If no users row yet, create it now that we have a role
  if (!existingUser) {
    const userData = extractUserDataFromGoogle(user);
    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      role: finalRole,
      email: user.email || "",
      phone: userData.phone,
      first_name: userData.firstName,
      last_name: userData.lastName,
      profile_image_url: userData.profileImageUrl,
    });

    if (insertError) {
      logger.error("Error inserting user:", insertError);
      return { error: insertError, role: null, needsRoleSelection: false };
    }

    logger.debug("User created successfully with role:", finalRole);

    // Update auth metadata with display name and role
    const displayName = `${userData.firstName} ${userData.lastName}`.trim();
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: {
        role: finalRole,
        has_completed_onboarding: false,
        first_name: userData.firstName,
        last_name: userData.lastName,
        full_name: displayName,
        display_name: displayName,
      },
    });

    if (updateAuthError) {
      logger.error("Error updating auth metadata:", updateAuthError);
      // Don't return error here, just log it
    }
  } else if (providedRole && providedRole !== existingUser.role) {
    // Update existing user with new role
    const { error: updateError } = await supabase
      .from("users")
      .update({ role: finalRole })
      .eq("id", user.id);

    if (updateError) {
      logger.error("Error updating user role:", updateError);
      return { error: updateError, role: null, needsRoleSelection: false };
    }

    logger.debug("User role updated to:", finalRole);

    // Update auth metadata
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: { role: finalRole },
    });

    if (updateAuthError) {
      logger.error("Error updating auth metadata:", updateAuthError);
      // Don't return error here, just log it
    }
  }

  const { error: settingsError } =
    await UserSettingsService.ensureDefaultSettingsForUser(
      user.id,
      finalRole,
      supabase
    );

  if (settingsError) {
    logger.error(
      "Error ensuring default user settings for Google signup:",
      settingsError
    );
  }

  return { error: null, role: finalRole, needsRoleSelection: false };
}

function extractUserDataFromGoogle(user: any) {
  const metadata = (user.user_metadata || {}) as GoogleUserMetadata;
  const fullName = metadata.full_name || metadata.name;

  const firstName =
    metadata.given_name || (fullName ? fullName.split(" ")[0] : "");

  const lastName =
    metadata.family_name ||
    (fullName ? fullName.split(" ").slice(1).join(" ") : "");

  return {
    firstName: firstName || "",
    lastName: lastName || "",
    phone: metadata.phone || null,
    profileImageUrl: metadata.avatar_url || metadata.picture || null,
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

  // Role-based redirects
  switch (role) {
    case "kindbossing":
      return `${origin}/kindbossing-onboarding/business-info`;
    case "kindtao":
      return `${origin}/kindtao-onboarding`;
    default:
      return `${origin}/select-role`;
  }
}
