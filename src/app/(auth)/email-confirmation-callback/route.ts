import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get user role from the users table
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        const userRole = userData?.role;

        // Redirect based on user role
        if (userRole === "kindbossing") {
          return NextResponse.redirect(
            `${origin}/kindbossing-onboarding/household-info`
          );
        } else if (userRole === "kindtao") {
          return NextResponse.redirect(
            `${origin}/kindtao-onboarding/personal-info`
          );
        } else {
          // If no role found, redirect to signup
          return NextResponse.redirect(`${origin}/signup`);
        }
      }
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
