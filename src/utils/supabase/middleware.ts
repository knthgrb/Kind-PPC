import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  "/oauth/google/callback",
  "/select-role",
  "/oauth/google/auth-code-error",
  "/email-confirmation",
  "/email-confirmation-callback",
  "/email-not-confirmed",
  "/forgot-password",
  "/forbidden",
  "/api/webhooks/xendit",
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
  "/recs",
  "/profile",
  "/kindtao",
  "/kindtao-more",
] as const;

const KINDBOSSING_PREFIXES = [
  "/kindbossing-onboarding",
  "/my-employees",
  "/my-profile",
  "/documents",
  "/payslip",
  "/government-benefits",
  "/kindbossing",
  "/kindbossing-more",
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

  // Redirect to role selection if user has no role (regardless of auth method)
  if (user && !user.user_metadata?.role) {
    return NextResponse.redirect(new URL("/select-role", request.url));
  }

  if (user && AUTH_ROUTES.includes(currentPathname as any)) {
    const url = request.nextUrl.clone();
    const role = user.user_metadata?.role;

    if (role === "kindtao") {
      url.pathname = "/recs";
      return NextResponse.redirect(url);
    } else if (role === "kindbossing") {
      url.pathname = "/my-jobs";
      return NextResponse.redirect(url);
    }

    url.pathname = "/";
    return NextResponse.redirect(url);
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

    // If user hasn't completed onboarding, only redirect when they're NOT already
    // within their respective onboarding flow to avoid redirect loops.
    if (user?.user_metadata?.role === "kindtao") {
      const targetPath = "/kindtao-onboarding";
      const alreadyOnOnboarding = currentPathname.startsWith(
        "/kindtao-onboarding"
      );
      if (!alreadyOnOnboarding) {
        url.pathname = targetPath;
        return NextResponse.redirect(url);
      }
    } else if (user?.user_metadata?.role === "kindbossing") {
      const targetPath = "/kindbossing-onboarding/business-info";
      const alreadyOnOnboarding = currentPathname.startsWith(
        "/kindbossing-onboarding"
      );
      if (!alreadyOnOnboarding) {
        url.pathname = targetPath;
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect kindtao users who have completed onboarding away from onboarding pages
  if (
    user &&
    user.user_metadata?.role === "kindtao" &&
    user.user_metadata?.has_completed_onboarding &&
    isKindTaoOnboardingRoute(currentPathname) &&
    currentPathname !== "/recs"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/recs";
    return NextResponse.redirect(url);
  }

  // Redirect kindbossing users who have completed onboarding away from family profile pages
  if (
    user &&
    user.user_metadata?.role === "kindbossing" &&
    user.user_metadata?.has_completed_onboarding &&
    isKindBossingOnboardingRoute(currentPathname) &&
    currentPathname !== "/my-jobs"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/my-jobs";
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
