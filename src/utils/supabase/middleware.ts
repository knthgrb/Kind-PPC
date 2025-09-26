import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/utils/logger";
import { OnboardingService } from "@/services/server/OnboardingService";
import { FamilyOnboardingService } from "@/services/server/FamilyOnboardingService";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/error",
  "/about",
  "/pricing",
  "/contact-us",
  "/find-help",
  "/email-confirmation-callback",
  "/oauth/google/callback",
  "/oauth/google/select-role",
  "/oauth/google/auth-code-error",
  "/email-confirmation",
  "/email-not-confirmed",
  "/forbidden",
] as const;

const AUTH_ROUTES = ["/login", "/signup"] as const;

// Admin routes that require admin role (route group (admin) is not part of URL)
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
  "/find-work",
  "/profile",
] as const;

const KINDBOSSING_PREFIXES = [
  "/kindbossing-onboarding",
  "/my-employees",
  "/my-profile",
  "/documents",
  "/payslip",
  "/post-job",
  "/government-benefits",
  "/kindbossing-profile",
] as const;

function matchesAnyPrefix(
  pathname: string,
  prefixes: readonly string[]
): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

// Helper function to check if a path matches any route pattern
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// Helper function to check if a path is an onboarding route
function isKindTaoOnboardingRoute(pathname: string): boolean {
  return pathname.startsWith("/kindtao-onboarding");
}

// Helper function to check if a path is a family profile route
function isKindBossingOnboardingRoute(pathname: string): boolean {
  return pathname.startsWith("/kindbossing-onboarding");
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Avoid redirect loops: only redirect when the destination differs
  const currentPathname = request.nextUrl.pathname;

  // Skip middleware logic for public routes to prevent unnecessary redirects
  if (
    isPublicRoute(currentPathname) &&
    !AUTH_ROUTES.includes(currentPathname as any)
  ) {
    return supabaseResponse;
  }

  if (user && AUTH_ROUTES.includes(currentPathname as any)) {
    const url = request.nextUrl.clone();
    const role = user.user_metadata?.role;

    if (role === "kindtao") {
      url.pathname = "/find-work";
      return NextResponse.redirect(url);
    } else if (role === "kindbossing") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Redirect to role selection if google login and has no role
  if (
    user &&
    user?.app_metadata?.provider === "google" &&
    !user.user_metadata?.role
  ) {
    return NextResponse.redirect(
      new URL("/oauth/google/select-role", request.url)
    );
  }

  // Role-specific route protection (only for authenticated users)
  if (user) {
    const role = user.user_metadata?.role;
    const url = request.nextUrl.clone();

    // Admin routes protection
    if (matchesAnyPrefix(currentPathname, ADMIN_ROUTES) && role !== "admin") {
      url.pathname = "/forbidden";
      return NextResponse.redirect(url);
    }

    // Kindtao routes protection
    if (
      matchesAnyPrefix(currentPathname, KINDTAO_PREFIXES) &&
      role !== "kindtao"
    ) {
      url.pathname = "/forbidden";
      return NextResponse.redirect(url);
    }

    // Kindbossing routes protection
    if (
      matchesAnyPrefix(currentPathname, KINDBOSSING_PREFIXES) &&
      role !== "kindbossing"
    ) {
      url.pathname = "/forbidden";
      return NextResponse.redirect(url);
    }
  }

  if (user && !user.user_metadata?.has_completed_onboarding) {
    const url = request.nextUrl.clone();

    if (user?.user_metadata?.role === "kindtao") {
      try {
        const onboardingProgress =
          await OnboardingService.checkOnboardingProgress(user);
        const requiredPath =
          onboardingProgress.nextStage || "/kindtao-onboarding/personal-info";

        // Only redirect if user is not already on the correct path
        if (currentPathname !== requiredPath) {
          // If user is on an onboarding route but wrong stage, redirect to correct stage
          if (isKindTaoOnboardingRoute(currentPathname)) {
            url.pathname = requiredPath;
            return NextResponse.redirect(url);
          }

          // If user is NOT on an onboarding route, redirect them to onboarding
          if (!isKindTaoOnboardingRoute(currentPathname)) {
            url.pathname = requiredPath;
            return NextResponse.redirect(url);
          }
        }
      } catch (error) {
        logger.error("Error checking onboarding progress:", error);
        const fallbackPath = "/kindtao-onboarding/personal-info";

        // Only redirect to fallback if user is not already on the fallback path
        if (currentPathname !== fallbackPath) {
          // If user is on an onboarding route but wrong stage, redirect to fallback
          if (isKindTaoOnboardingRoute(currentPathname)) {
            url.pathname = fallbackPath;
            return NextResponse.redirect(url);
          }

          // If user is NOT on an onboarding route, redirect them to fallback
          if (!isKindTaoOnboardingRoute(currentPathname)) {
            url.pathname = fallbackPath;
            return NextResponse.redirect(url);
          }
        }
      }
    } else if (user?.user_metadata?.role === "kindbossing") {
      try {
        const familyOnboardingProgress =
          await FamilyOnboardingService.checkFamilyOnboardingProgress(user.id);
        const requiredPath =
          familyOnboardingProgress.nextStage ||
          "/kindbossing-onboarding/business-info";

        console.log("familyOnboardingProgress", familyOnboardingProgress);
        console.log("requiredPath", requiredPath);
        console.log("currentPathname", currentPathname);

        // Only redirect if user is not already on the correct path
        if (currentPathname !== requiredPath) {
          // If user is on a family profile route but wrong stage, redirect to correct stage
          if (isKindBossingOnboardingRoute(currentPathname)) {
            url.pathname = requiredPath;
            return NextResponse.redirect(url);
          }

          // If user is NOT on a family profile route, redirect them to family profile
          if (!isKindBossingOnboardingRoute(currentPathname)) {
            url.pathname = requiredPath;
            return NextResponse.redirect(url);
          }
        }
      } catch (error) {
        logger.error("Error checking family onboarding progress:", error);
        const fallbackPath = "/kindbossing-onboarding/business-info";

        // Only redirect to fallback if user is not already on the fallback path
        if (currentPathname !== fallbackPath) {
          // If user is on a family profile route but wrong stage, redirect to fallback
          if (isKindBossingOnboardingRoute(currentPathname)) {
            url.pathname = fallbackPath;
            return NextResponse.redirect(url);
          }

          // If user is NOT on a family profile route, redirect them to fallback
          if (!isKindBossingOnboardingRoute(currentPathname)) {
            url.pathname = fallbackPath;
            return NextResponse.redirect(url);
          }
        }
      }
    }
  }

  // Redirect kindtao users who have completed onboarding away from onboarding pages
  if (
    user &&
    user.user_metadata?.role === "kindtao" &&
    user.user_metadata?.has_completed_onboarding &&
    isKindTaoOnboardingRoute(currentPathname) &&
    currentPathname !== "/find-work"
  ) {
    logger.info(
      "Kindtao user with completed onboarding trying to access onboarding page, redirecting to find-work"
    );
    const url = request.nextUrl.clone();
    url.pathname = "/find-work";
    return NextResponse.redirect(url);
  }

  // Redirect kindbossing users who have completed onboarding away from family profile pages
  if (
    user &&
    user.user_metadata?.role === "kindbossing" &&
    user.user_metadata?.has_completed_onboarding &&
    isKindBossingOnboardingRoute(currentPathname) &&
    currentPathname !== "/dashboard"
  ) {
    logger.info(
      "Kindbossing user with completed onboarding trying to access onboarding page, redirecting to dashboard"
    );
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to login for private routes
  if (!user && !isPublicRoute(currentPathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
