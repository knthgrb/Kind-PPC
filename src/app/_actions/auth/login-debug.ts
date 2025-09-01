"use server";

import { AuthService } from "@/services/AuthService";

export async function loginDebug(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  
  console.log("=== LOGIN DEBUG START ===");
  console.log("Login attempt for email:", data.email);
  
  try {
    // Step 1: Try to login
    const { error } = await AuthService.login(data.email, data.password);
    if (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed", details: error };
    }

    console.log("Login successful, getting user data...");

    // Step 2: Get the current user
    const supabase = await AuthService.createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      return { success: false, error: "Failed to get user", details: userError };
    }
    
    if (!user) {
      console.error("No user found after login");
      return { success: false, error: "No user found after login" };
    }
    
    console.log("User found, ID:", user.id);
    
    // Step 3: Get user metadata
    const { data: userMetadata, error: metadataError } = await AuthService.getUserMetadata(user.id);
    
    if (metadataError) {
      console.error("Error getting user metadata:", metadataError);
      return { success: false, error: "Failed to get user metadata", details: metadataError };
    }
    
    if (!userMetadata) {
      console.error("No user metadata found");
      return { success: false, error: "No user metadata found" };
    }
    
    console.log("User metadata:", userMetadata);
    console.log("User role:", userMetadata.role);
    
    // Step 4: Check onboarding status for kindtao users
    let onboardingStatus = null;
    if (userMetadata.role === 'kindtao') {
      console.log("User is kindtao, checking onboarding status...");
      const { isComplete, error: onboardingError } = await AuthService.checkOnboardingStatus(user.id);
      
      if (onboardingError) {
        console.error("Error checking onboarding status:", onboardingError);
      }
      
      onboardingStatus = { isComplete, error: onboardingError };
      console.log("Onboarding complete:", isComplete);
    }
    
    // Step 5: Determine redirect path
    let redirectPath = "";
    if (userMetadata.role === 'kindbossing') {
      redirectPath = "/kindbossing/dashboard";
    } else if (userMetadata.role === 'kindtao') {
      if (onboardingStatus && !onboardingStatus.error && !onboardingStatus.isComplete) {
        redirectPath = "/kindtao/onboarding";
      } else {
        redirectPath = "/kindtao/dashboard";
      }
    }
    
    console.log("Redirect path:", redirectPath);
    console.log("=== LOGIN DEBUG END ===");
    
    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        role: userMetadata.role,
        firstName: userMetadata.first_name,
        lastName: userMetadata.last_name
      },
      redirectPath,
      onboardingStatus
    };
    
  } catch (error) {
    console.error("Unexpected error in login:", error);
    return { success: false, error: "Unexpected error", details: error };
  }
}
