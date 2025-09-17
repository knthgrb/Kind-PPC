import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const role = searchParams.get("role");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Populate baseline metadata for Google sign-ins (non-destructive)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const m = (user.user_metadata || {}) as Record<string, any>;
        const fullName: string | undefined = m.full_name || m.name || undefined;
        const given = m.given_name || (fullName ? fullName.split(" ")[0] : "");
        const family =
          m.family_name ||
          (fullName ? fullName.split(" ").slice(1).join(" ") : "");
        const defaults: Record<string, any> = {
          first_name: given || "",
          last_name: family || "",
          email: user.email || m.email || "",
          phone: m.phone ?? null,
          business_name: m.business_name ?? null,
          date_of_birth: m.date_of_birth ?? null,
          gender: m.gender ?? null,
          profile_image_url: m.avatar_url ?? m.picture ?? null,
          full_address: m.full_address ?? null,
          city: m.city ?? null,
          province: m.province ?? null,
          postal_code: m.postal_code ?? null,
          verification_status: m.verification_status ?? "pending",
          subscription_tier: m.subscription_tier ?? "free",
          swipe_credits: m.swipe_credits ?? 10,
          boost_credits: m.boost_credits ?? 0,
          has_completed_onboarding: m.has_completed_onboarding ?? false,
        };

        const toUpdate: Record<string, any> = {};
        for (const [k, v] of Object.entries(defaults)) {
          if (typeof m[k] === "undefined") {
            toUpdate[k] = v;
          }
        }

        if (role && typeof m.role === "undefined") {
          toUpdate.role = role;
        }

        if (Object.keys(toUpdate).length > 0) {
          await supabase.auth.updateUser({ data: toUpdate });
        }
      }
      const userRole = user?.user_metadata?.role;

      if (!userRole) {
        // If role is provided in URL, redirect to business-info page
        if (role && role === "kindbossing") {
          const { error } = await supabase.auth.updateUser({
            data: { role },
          });
          if (error) throw error;
          return NextResponse.redirect(
            `${origin}/family-profile/business-info`
          );
        } else if (role && role === "kindtao") {
          const { error } = await supabase.auth.updateUser({
            data: { role },
          });
          if (error) throw error;
          return NextResponse.redirect(`${origin}/onboarding/personal-info`);
        }
        return NextResponse.redirect(`${origin}/oauth/google/select-role`);
      }

      // User has role, proceed with normal flow
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/oauth/google/auth-code-error`);
}
