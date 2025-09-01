"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";

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
      
      // Handle different user roles
      if (userMetadata.role === 'kindtao') {
        console.log("User is kindtao, checking onboarding progress...");
        
        // Check onboarding progress
        const onboardingProgress = await OnboardingService.checkOnboardingProgress(user.id);
        console.log("Onboarding progress:", onboardingProgress);
        
        if (onboardingProgress.isComplete) {
          // Onboarding complete, redirect to profile
          console.log("Onboarding complete, redirecting to profile...");
          revalidatePath("/", "layout");
          redirect("/kindtao/profile");
        } else {
          // Redirect to next incomplete stage
          console.log("Redirecting to next onboarding stage:", onboardingProgress.nextStage);
          revalidatePath("/", "layout");
          redirect(onboardingProgress.nextStage || "/onboarding/personal-info");
        }
        
      } else if (userMetadata.role === 'kindbossing') {
        // KindBossing users go directly to profile (no onboarding required)
        console.log("Redirecting to kindbossing profile...");
        revalidatePath("/", "layout");
        redirect("/kindbossing/kindbossing-profile");
        
      } else if (userMetadata.role === 'admin') {
        // Admin users go to admin dashboard
        console.log("Redirecting to admin dashboard...");
        revalidatePath("/", "layout");
        redirect("/admin/dashboard");
        
      } else {
        // Unknown role, redirect to profile
        console.log("Unknown role, redirecting to profile...");
        revalidatePath("/", "layout");
        redirect("/profile");
      }
    }
  }

  // Fallback redirect
  console.log("Fallback redirect to home...");
  revalidatePath("/", "layout");
  redirect("/");
}
