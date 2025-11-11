"use server";

import { createClient } from "@/utils/supabase/server";
import { EmployeeInput } from "@/types/employee";

export async function addEmployee(
  employee: EmployeeInput
): Promise<{
  success: boolean;
  employeeId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Verify the job post belongs to the user
    const { data: jobPost, error: jobError } = await supabase
      .from("job_posts")
      .select("id, kindbossing_user_id")
      .eq("id", employee.job_post_id)
      .single();

    if (jobError || !jobPost) {
      return {
        success: false,
        error: "Job post not found",
      };
    }

    if (jobPost.kindbossing_user_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized to add employee for this job",
      };
    }

    // Verify the KindTao user exists
    const { data: kindtaoUser, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", employee.kindtao_user_id)
      .single();

    if (userError || !kindtaoUser) {
      return {
        success: false,
        error: "KindTao user not found",
      };
    }

    if (kindtaoUser.role !== "kindtao") {
      return {
        success: false,
        error: "User is not a KindTao user",
      };
    }

    // Insert employee
    const { data: newEmployee, error: insertError } = await supabase
      .from("employees")
      .insert({
        kindbossing_user_id: user.id,
        kindtao_user_id: employee.kindtao_user_id,
        job_post_id: employee.job_post_id,
        status: employee.status,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error adding employee:", insertError);
      return {
        success: false,
        error: "Failed to add employee",
      };
    }

    return {
      success: true,
      employeeId: newEmployee.id,
    };
  } catch (error) {
    console.error("Error in addEmployee:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

