import { User as SupabaseUser } from "@supabase/supabase-js";

export type Role = "kindbossing" | "kindtao";

export type User = SupabaseUser & {
  user_metadata: {
    role: Role;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    business_name?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    profile_image_url?: string | null;
    full_address?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    verification_status: string;
    subscription_tier: string;
    swipe_credits: number;
    boost_credits: number;
  };
};
