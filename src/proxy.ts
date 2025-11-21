import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/auth";
import { createServerConvexClient, api } from "@/utils/convex/server";
import { getToken } from "@/lib/auth-server";
import { logger } from "@/utils/logger";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/error",
  "/about",
  "/pricing",
  "/support",
  "/find-help",
  "/api/auth",
  "/select-role",
  "/email-confirmation",
  "/email-confirmation-callback",
  "/email-not-confirmed",
  "/forgot-password",
  "/reset-password",
  "/forbidden",
  "/api/webhooks/xendit",
  "/oauth/google/callback",
  "/oauth/google/auth-code-error",
] as const;

const AUTH_ROUTES = ["/login", "/signup"] as const;

// Admin routes that require admin role
const ADMIN_ROUTES = [
  "/admin",
  "/bulk-partner-account",
  "/fraud",
  "/platform-usage-pipeline",
  "/profile-verification",
  "/revenue",
  "/support",
  "/verified-badge",
  "/verified-badge-upload",
] as const;

// Role-specific route prefixes
const KINDTAO_PREFIXES = [
  "/kindtao-onboarding",
  "/recs",
  "/profile",
  "/kindtao",
  "/kindtao-more",
  "/kindtao/matches",
  "/kindtao/messages/:conversationId",
  "/recs-copy",
] as const;

const KINDBOSSING_PREFIXES = [
  "/kindbossing-onboarding",
  "/employees",
  "/documents",
  "/info",
  "/kindbossing-more",
  "/my-job-posts",
  "/kindbossing/matches",
  "/kindbossing/settings",
  "/kindbossing/messages/:conversationId",
] as const;

function matchesAnyPrefix(
  pathname: string,
  prefixes: readonly string[]
): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isKindTaoOnboardingRoute(pathname: string): boolean {
  return pathname.startsWith("/kindtao-onboarding");
}

function isKindBossingOnboardingRoute(pathname: string): boolean {
  return pathname.startsWith("/kindbossing-onboarding");
}

export async function proxy(request: NextRequest) {
  const currentPathname = request.nextUrl.pathname;

  // Skip middleware logic for public routes
  if (
    isPublicRoute(currentPathname) &&
    !AUTH_ROUTES.includes(currentPathname as any)
  ) {
    return NextResponse.next();
  }

  // Get current user from Better Auth
  const user = await getCurrentUser();

  // Redirect to login if not authenticated and trying to access protected route
  if (!user) {
    if (AUTH_ROUTES.includes(currentPathname as any)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", currentPathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get user role from Convex
  let userRole: string | null = null;
  let hasCompletedOnboarding = false;
  try {
    // Extract user ID matching the API route logic
    const authUserId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (authUserId) {
      // Get token and use it for authenticated queries
      const token = await getToken();
      const convexClient = await createServerConvexClient(token || undefined);
      const userData = await convexClient.query(api.users.getUserById, {
        userId: authUserId,
      });
      userRole = userData?.role || null;
      hasCompletedOnboarding = userData?.has_completed_onboarding || false;

      if (!userRole) {
        logger.warn("User has no role in Convex", {
          authUserId,
          currentPathname,
        });
      }
    } else {
      logger.warn("Could not extract user ID from Better Auth user", {
        userKeys: Object.keys(user || {}),
        currentPathname,
      });
    }
  } catch (error) {
    // Log the error for debugging but continue without role check
    logger.error("Error fetching user role in middleware", {
      error,
      currentPathname,
    });
    // This allows the middleware to still work even if Convex is unavailable
  }

  // Redirect to role selection if user has no role
  if (!userRole) {
    if (currentPathname !== "/select-role") {
      return NextResponse.redirect(new URL("/select-role", request.url));
    }
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth routes
  // Always redirect based on role, ignoring any redirect parameter
  if (AUTH_ROUTES.includes(currentPathname as any)) {
    // Determine redirect based on role and onboarding status
    let redirectUrl = "/";

    if (userRole === "kindtao") {
      redirectUrl = hasCompletedOnboarding ? "/recs" : "/kindtao-onboarding";
    } else if (userRole === "kindbossing") {
      redirectUrl = hasCompletedOnboarding
        ? "/my-job-posts"
        : "/kindbossing-onboarding/business-info";
    } else if (userRole === "admin") {
      redirectUrl = "/admin-dashboard";
    }

    // Create clean URL without any redirect parameters
    const cleanUrl = new URL(redirectUrl, request.url);
    return NextResponse.redirect(cleanUrl);
  }

  // Check admin routes
  if (ADMIN_ROUTES.some((route) => currentPathname.startsWith(route))) {
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
  }

  // Check role-specific routes
  if (matchesAnyPrefix(currentPathname, KINDTAO_PREFIXES)) {
    if (userRole !== "kindtao") {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
  }

  if (matchesAnyPrefix(currentPathname, KINDBOSSING_PREFIXES)) {
    if (userRole !== "kindbossing") {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
  }

  // Handle onboarding redirects
  if (userRole && !hasCompletedOnboarding) {
    // Redirect to onboarding if not completed
    if (userRole === "kindtao" && !isKindTaoOnboardingRoute(currentPathname)) {
      return NextResponse.redirect(new URL("/kindtao-onboarding", request.url));
    } else if (
      userRole === "kindbossing" &&
      !isKindBossingOnboardingRoute(currentPathname)
    ) {
      return NextResponse.redirect(
        new URL("/kindbossing-onboarding/business-info", request.url)
      );
    }
  }

  // Redirect away from onboarding if completed
  if (userRole && hasCompletedOnboarding) {
    if (isKindTaoOnboardingRoute(currentPathname)) {
      return NextResponse.redirect(new URL("/recs", request.url));
    } else if (isKindBossingOnboardingRoute(currentPathname)) {
      return NextResponse.redirect(new URL("/my-job-posts", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks/paymongo (PayMongo webhooks must bypass auth)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks/paymongo|api/webhooks/xendit|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
