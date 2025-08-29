"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthService } from "@/services/AuthService";

export async function login(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  
  console.log("Login attempt for email:", data.email);
  
  const { error } = await AuthService.login(data.email, data.password);
  if (error) {
    console.error("Login error:", error);
    
    // Handle specific email confirmation error
    if (error.message === "Email not confirmed") {
      redirect("/login/email-not-confirmed");
    }
    
    // Handle other specific errors
    if (error.message === "Invalid login credentials") {
      redirect("/login/invalid-credentials");
    }
    
    // Generic error redirect
    redirect("/error");
  }

  console.log("Login successful, getting user data...");

  // Get the current user to check their role and onboarding status
  const supabase = await AuthService.createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error("Error getting user:", userError);
    redirect("/error");
  }
  
  if (user) {
    console.log("User found, ID:", user.id);
    
    // Get user metadata to check role
    const { data: userMetadata, error: metadataError } = await AuthService.getUserMetadata(user.id);
    
    if (metadataError) {
      console.error("Error getting user metadata:", metadataError);
      redirect("/error");
    }
    
    if (userMetadata) {
      console.log("User metadata:", userMetadata);
      console.log("User role:", userMetadata.role);
      
      // Check if user is kindtao and needs to complete onboarding
      if (userMetadata.role === 'kindtao') {
        console.log("User is kindtao, checking onboarding status...");
        const { isComplete, error: onboardingError } = await AuthService.checkOnboardingStatus(user.id);
        
        if (onboardingError) {
          console.error("Error checking onboarding status:", onboardingError);
        }
        
        console.log("Onboarding complete:", isComplete);
        
        if (!onboardingError && !isComplete) {
          // Redirect to onboarding if not complete
          console.log("Redirecting to onboarding...");
          revalidatePath("/", "layout");
          redirect("/kindtao/onboarding");
        }
      }
      
      // For kindbossing users or kindtao users who completed onboarding, redirect to dashboard
      if (userMetadata.role === 'kindbossing') {
        console.log("Redirecting to kindbossing dashboard...");
        revalidatePath("/", "layout");
        redirect("/kindbossing/dashboard");
      } else {
        console.log("Redirecting to kindtao dashboard...");
        revalidatePath("/", "layout");
        redirect("/kindtao/dashboard");
      }
    }
  }

  // Fallback redirect
  console.log("Fallback redirect to home...");
  revalidatePath("/", "layout");
  redirect("/");
}
