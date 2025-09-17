import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/utils/logger";
import { OnboardingService } from "@/services/server/OnboardingService";
import { FamilyOnboardingService } from "@/services/client/FamilyOnboardingService";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/error",
  "/home",
  "/about",
  "/pricing",
  "/contact-us",
  "/find-help",
  "/find-work",
  "/oauth/google/callback",
  "/oauth/google/select-role",
  "/oauth/google/auth-code-error",
  "/email-confirmation",
  "/email-not-confirmed",
] as const;

// Admin routes that require admin role
const ADMIN_ROUTES = ["/admin"] as const;

// Helper function to check if a path matches any route pattern
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// Helper function to check if a path is an admin route
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

// Helper function to check if a path is an onboarding route
function isKindTaoOnboardingRoute(pathname: string): boolean {
  return pathname.startsWith("/onboarding");
}

// Helper function to check if a path is a family profile route
function isKindBossingOnboardingRoute(pathname: string): boolean {
  return pathname.startsWith("/family-profile");
}

export async function updateSession(request: NextRequest) {
  console.log("updateSession");
  console.log("hostname", request.headers.get("host"));
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

  console.log("reached here");
  console.log(user);

  if (!user?.user_metadata?.has_completed_onboarding) {
    const url = request.nextUrl.clone();
    if (user?.user_metadata?.role === "kindtao") {
      console.log("Kindtao user trying to access onboarding page");
      try {
        const onboardingProgress =
          await OnboardingService.checkOnboardingProgress(user);
        const requiredPath =
          onboardingProgress.nextStage || "/onboarding/personal-info";
        if (isKindTaoOnboardingRoute(request.nextUrl.pathname)) {
          url.pathname = requiredPath;
          return NextResponse.redirect(url);
        }
      } catch (error) {
        logger.error("Error checking onboarding progress:", error);
        if (isKindTaoOnboardingRoute(request.nextUrl.pathname)) {
          url.pathname = "/onboarding/personal-info";
          return NextResponse.redirect(url);
        }
        return NextResponse.redirect(url);
      }
    } else if (user?.user_metadata?.role === "kindbossing") {
      try {
        const familyOnboardingProgress =
          await FamilyOnboardingService.checkFamilyOnboardingProgress(user.id);
        const requiredPath =
          familyOnboardingProgress.nextStage ||
          "/family-profile/household-info";
        if (isKindBossingOnboardingRoute(request.nextUrl.pathname)) {
          url.pathname = requiredPath;
          return NextResponse.redirect(url);
        }
        familyOnboardingProgress.nextStage || "/family-profile/household-info";
      } catch (error) {
        logger.error("Error checking family onboarding progress:", error);
        if (isKindBossingOnboardingRoute(request.nextUrl.pathname)) {
          url.pathname = "/family-profile/household-info";
          return NextResponse.redirect(url);
        }
      }
    } else {
      url.pathname = "/family-profile/household-info";
    }
    return NextResponse.redirect(url);
  }

  // Redirect kindtao users who have completed onboarding away from onboarding pages
  if (
    user &&
    user.user_metadata?.role === "kindtao" &&
    user.user_metadata?.has_completed_onboarding &&
    isKindTaoOnboardingRoute(request.nextUrl.pathname)
  ) {
    logger.info(
      "Kindtao user with completed onboarding trying to access onboarding page, redirecting to jobs"
    );
    const url = request.nextUrl.clone();
    url.pathname = "/jobs";
    return NextResponse.redirect(url);
  }

  // Redirect kindbossing users who have completed family profile away from family profile pages
  if (
    user &&
    user.user_metadata?.role === "kindbossing" &&
    user.user_metadata?.has_completed_onboarding &&
    isKindBossingOnboardingRoute(request.nextUrl.pathname)
  ) {
    logger.info(
      "Kindbossing user with completed family profile trying to access family profile page, redirecting to dashboard"
    );
    const url = request.nextUrl.clone();
    url.pathname = "/kindbossing-dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to login for private routes
  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin route protection
  if (user && isAdminRoute(request.nextUrl.pathname)) {
    const role = user.user_metadata?.role;
    if (role !== "admin") {
      logger.info(
        "Middleware - Non-admin user trying to access admin route, redirecting to home"
      );
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
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
