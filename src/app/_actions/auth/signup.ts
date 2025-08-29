"use server";

import { AuthService } from "@/services/AuthService";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  // Get the raw role from form data
  const rawRole = formData.get("role") as string;
  
  // Map "bossing" to "kindbossing" to match the expected format
  const role = rawRole === "bossing" ? "kindbossing" : rawRole as "kindbossing" | "kindtao";
  
  // Get phone and format it properly with +63 prefix
  const phoneNumber = formData.get("phone") as string;
  const formattedPhone = phoneNumber ? `+63${phoneNumber}` : "";

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    phone: formattedPhone,
    role: role,
    businessName: formData.get("businessName") as string | undefined,
  };

  console.log("Signup data being sent:", data); // Debug log

  const { error } = await AuthService.signup(data);

  if (error) {
    // You might want to handle different types of errors differently
    console.error("Signup error:", error);
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/signup/otp-verification");
}
