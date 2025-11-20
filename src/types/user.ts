export type Role = "kindbossing" | "kindtao" | "admin";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
  image?: string | null;
  createdAt: number;
  updatedAt: number;
  // Extended user data from Convex
  role?: Role;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  business_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  profile_image_url?: string | null;
  full_address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  verification_status?: string;
  subscription_tier?: string;
  swipe_credits?: number;
  boost_credits?: number;
  has_completed_onboarding?: boolean;
};
