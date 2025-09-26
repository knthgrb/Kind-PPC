import { createClient } from "@/utils/supabase/server";
import { logger } from "@/utils/logger";

export type SignupData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "kindbossing" | "kindtao";
  businessName?: string; // Optional, only for bossing users
};

export const AuthService = {
  // Create a new user
  async signup(data: SignupData) {
    const supabase = await createClient();

    try {
      // Sign up the user
      const displayName = `${data.firstName} ${data.lastName}`.trim();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: data.role,
            has_completed_onboarding: false,
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: displayName,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/email-confirmation-callback?role=${data.role}`,
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

      // If user was created successfully, insert data into users table
      if (authData.user) {
        const userInsertData: any = {
          id: authData.user.id,
          role: data.role,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
        };

        const { error: insertError } = await supabase
          .from("users")
          .insert(userInsertData);

        if (insertError) {
          logger.error(
            "Error inserting user data into users table:",
            insertError
          );

          // Handle specific database constraint errors
          if ((insertError as any).code === "23505") {
            if (insertError.message.includes("users_email_key")) {
              return {
                data: null,
                error: {
                  message:
                    "An account with this email already exists. Please use a different email or try signing in instead.",
                  code: "EMAIL_EXISTS",
                },
              };
            }
            if (insertError.message.includes("users_phone_key")) {
              return {
                data: null,
                error: {
                  message:
                    "An account with this phone number already exists. Please use a different phone number.",
                  code: "PHONE_EXISTS",
                },
              };
            }
          }

          return { data: null, error: insertError };
        }

        if (data.role === "kindbossing") {
          const { error: familyProfileError } = await supabase
            .from("family_profiles")
            .insert({ user_id: authData.user.id });
          if (familyProfileError) {
            logger.error("Error inserting family profile:", familyProfileError);
          }
        }

        logger.debug("User data inserted successfully into users table");
      }

      return { data: authData, error: null };
    } catch (error) {
      logger.error("Unexpected error signing up:", error);
      return { data: null, error: error as Error };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error("Sign in error:", error);
        return { data: null, error };
      }

      logger.debug("Sign in successful:", data);
      return { data, error: null };
    } catch (error) {
      logger.error("Unexpected error signing in:", error);
      return { data: null, error: error as Error };
    }
  },

  // Sign out
  async signOut() {
    const supabase = await createClient();

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error("Sign out error:", error);
        return { data: null, error };
      }

      logger.debug("Sign out successful");
      return { data: null, error: null };
    } catch (error) {
      logger.error("Unexpected error signing out:", error);
      return { data: null, error: error as Error };
    }
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = await createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });

      if (error) {
        logger.error("Password reset error:", error);
        return { data: null, error };
      }

      logger.debug("Password reset email sent successfully");
      return { data: null, error: null };
    } catch (error) {
      logger.error("Unexpected error resetting password:", error);
      return { data: null, error: error as Error };
    }
  },
};
