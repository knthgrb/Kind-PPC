"use server";

import { UserService } from "@/services/server/UserService";

export async function getConversationUsers(
  kindbossingId: string,
  kindtaoId: string
) {
  try {
    const [kindbossingResult, kindtaoResult] = await Promise.all([
      UserService.getUserDetailsById(kindbossingId),
      UserService.getUserDetailsById(kindtaoId),
    ]);

    // Transform user data to match expected format
    const transformUser = (userData: any) => {
      if (!userData) return null;
      return {
        id: userData.id,
        first_name: userData.user_metadata?.first_name || "",
        last_name: userData.user_metadata?.last_name || "",
        profile_image_url: userData.user_metadata?.profile_image_url || null,
        role: userData.user_metadata?.role || "kindtao",
        email: userData.email || "",
        phone: userData.user_metadata?.phone || null,
        date_of_birth: userData.user_metadata?.date_of_birth || null,
        gender: userData.user_metadata?.gender || null,
        address: userData.user_metadata?.full_address || null,
        city: userData.user_metadata?.city || null,
        province: userData.user_metadata?.province || null,
        postal_code: userData.user_metadata?.postal_code || null,
        is_verified: userData.user_metadata?.verification_status === "approved",
        verification_status:
          userData.user_metadata?.verification_status || "pending",
        subscription_tier: userData.user_metadata?.subscription_tier || "free",
        subscription_expires_at: null,
        swipe_credits: userData.user_metadata?.swipe_credits || 0,
        boost_credits: userData.user_metadata?.boost_credits || 0,
        last_active: userData.updated_at || new Date().toISOString(),
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString(),
      };
    };

    return {
      data: {
        kindbossing: transformUser(kindbossingResult.data),
        kindtao: transformUser(kindtaoResult.data),
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
