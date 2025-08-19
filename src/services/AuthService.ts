import { createClient } from "@/utils/supabase/server";

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "bossing" | "tao";
  businessName?: string; // Optional, only for bossing users
}

export class AuthService {
  static async signup(data: SignupData) {
    const supabase = await createClient();

    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { error: authError };
    }

    if (authData.user) {
      // Prepare metadata object
      const metadata: any = {
        id: authData.user.id,
        role: data.role,
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone,
      };

      // Add business name only for bossing users
      if (data.role === "bossing" && data.businessName) {
        metadata.business_name = data.businessName;
      }

      // Create user metadata
      const { error: metadataError } = await supabase
        .from("user_metadata")
        .insert(metadata);

      if (metadataError) {
        // If metadata creation fails, we should handle this appropriately
        console.error("Failed to create user metadata:", metadataError);
        // You might want to delete the user account here if metadata creation fails
        return { error: metadataError };
      }
    }

    return { data: authData, error: null };
  }

  static async login(email: string, password: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  static async getUserMetadata(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_metadata")
      .select("*")
      .eq("id", userId)
      .single();

    return { data, error };
  }
}
