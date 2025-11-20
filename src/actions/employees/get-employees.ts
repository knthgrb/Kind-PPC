"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function getEmployees(): Promise<{
  success: boolean;
  employees?: any[];
  error?: string;
}> {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!convex) {
      return { success: false, error: "Database connection failed" };
    }

    // Extract user ID
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    const employees = await convex.query(api.employees.getEmployeesByKindBossing, {
      userId,
    });

    // Map to Employee type format
    const mappedEmployees = employees.map((emp: any) => ({
      id: String(emp._id),
      kindbossing_user_id: emp.kindbossing_user_id,
      kindtao_user_id: emp.kindtao_user_id,
      job_post_id: emp.job_post_id,
      status: emp.status as "active" | "inactive",
      created_at: new Date(emp.created_at).toISOString(),
      updated_at: emp.updated_at
        ? new Date(emp.updated_at).toISOString()
        : new Date(emp.created_at).toISOString(),
      job_post: emp.job
        ? {
            id: String(emp.job._id),
            job_title: emp.job.job_title,
            job_type: emp.job.job_type,
            location: emp.job.location,
            salary: emp.job.salary,
            status: emp.job.status,
          }
        : undefined,
      kindtao: emp.kindtao
        ? {
            user_id: emp.kindtao.id,
            skills: emp.kindtao.profile?.skills || [],
            languages: emp.kindtao.profile?.languages || [],
            expected_salary_range: emp.kindtao.profile?.expected_salary_range || null,
            availability_schedule: emp.kindtao.profile?.availability_schedule || {},
            highest_educational_attainment:
              emp.kindtao.profile?.highest_educational_attainment || null,
            rating: emp.kindtao.profile?.rating || null,
            is_verified: emp.kindtao.profile?.is_verified || false,
            user: {
              id: emp.kindtao.id,
              first_name: emp.kindtao.first_name || null,
              last_name: emp.kindtao.last_name || null,
              email: emp.kindtao.email || null,
              profile_image_url: emp.kindtao.profile_image_url || null,
            },
          }
        : undefined,
    }));

    return { success: true, employees: mappedEmployees };
  } catch (err) {
    logger.error("Failed to get employees:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to get employees",
    };
  }
}

