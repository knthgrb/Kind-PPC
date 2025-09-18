import { createClient } from "@/utils/supabase/server";
import { logger } from "@/utils/logger";

export type SignupData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "kindbossing" | "kindtao";
  businessName?: string; // Optional, only for bossing users
};

export const AuthService = {
  // Create a new user
  async signup(data: SignupData) {
    const supabase = await createClient();

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
          data: {
            role: data.role,
            first_name: data.firstName,
            email: data.email,
            last_name: data.lastName,
            phone: data.phone,
            business_name:
              data.role === "kindbossing" ? data.businessName ?? null : null,
            date_of_birth: null,
            gender: null,
            profile_image_url: null,
            full_address: null,
            city: null,
            province: null,
            postal_code: null,
            verification_status: "pending",
            subscription_tier: "free",
            swipe_credits: 10,
            boost_credits: 0,
            has_completed_onboarding: false,
          },
        },
      });

      if (authError) {
        logger.debug("Supabase auth error:", authError);
        logger.debug("Error details:", {
          message: authError.message,

          status: authError.status,
          code: authError.code,
        });
        return { data: null, error: authError };
      }

      logger.debug("Auth signup successful, authData:", authData);

      return { data: authData, error: null };
    } catch (error) {
      logger.error("Unexpected error signing up:", error);
    }
  },

  // Log in with email + password
  async login(email: string, password: string) {
    const supabase = await createClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      logger.debug("Supabase auth error:", authError);
      return { error: authError };
    }

    logger.debug("Auth login successful, data:", authData);

    return { data: authData, error: null };
  },

  async resendConfirmationEmail(email: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      logger.error("Error resending confirmation email:", error);
      return { error: error };
    }

    return { error: null };
  },
};
