"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthService } from "@/services/AuthService";

export async function login(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const { error } = await AuthService.login(data.email, data.password);
  if (error) {
    redirect("/error");
  }
  revalidatePath("/", "layout");
  redirect("/");
}
