import { createClient } from "@/utils/supabase/server";

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "kindbossing" | "kindtao";
  businessName?: string; // Optional, only for bossing users
}

export class AuthService {
  /**
   * Create a Supabase client instance
   */
  static async createClient() {
    return createClient();
  }

  /**
   * Sign up a new user.
   * - Creates an auth.users account
   * - Passes metadata (role, names, phone, business_name)
   * - A DB trigger (handle_new_auth_user) copies metadata into public.users
   */
  static async signup(data: SignupData) {
    const supabase = await createClient();

    console.log("AuthService.signup called with data:", data);

    // Sign up the user + pass metadata (used by trigger in DB)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: data.role,                 // must be 'kindtao' | 'kindbossing' | 'admin'
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          business_name:
            data.role === "kindbossing" ? data.businessName ?? null : null,
        },
      },
    });

    if (authError) {
      console.error("Supabase auth error:", authError);
      return { error: authError };
    }

    console.log("Auth signup successful, authData:", authData);

    // ⚠️ Do NOT manually insert into public.users.
    // The DB trigger handles this automatically.

    return { data: authData, error: null };
  }

  /**
   * Log in with email + password
   */
  static async login(email: string, password: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  /**
   * Fetch the row from public.users (joined automatically via trigger at signup)
   */
  static async getUserMetadata(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    return { data, error };
  }

  /**
   * Check if a kindtao user has completed onboarding
   */
  static async checkOnboardingStatus(userId: string) {
    const supabase = await createClient();
    
    // Check if user has a helper_profile (indicates onboarding is complete)
    const { data: helperProfile, error } = await supabase
      .from("helper_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { error, isComplete: false };
    }

    return { isComplete: !!helperProfile, error: null };
  }
}
