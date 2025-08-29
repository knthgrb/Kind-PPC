"use server";

import { AuthService } from "@/services/AuthService";

export async function resendConfirmationEmail(email: string) {
  try {
    const supabase = await AuthService.createClient();
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      console.error("Error resending confirmation email:", error);
      return { 
        success: false, 
        error: error.message || "Failed to resend confirmation email" 
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error resending confirmation email:", error);
    return { 
      success: false, 
      error: "An unexpected error occurred" 
    };
  }
}
