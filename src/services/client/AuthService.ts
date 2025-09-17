import { createClient } from "@/utils/supabase/client";

export const AuthService = {
  async getCurrentUser() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    return { data: data || null, error: error || null };
  },

  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    return { error: error || null };
  },

  async signInWithGoogle(redirectTo: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo,
      },
    });
    return { error: error || null };
  },
};
