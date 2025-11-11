"use server";

import { createClient } from "@/utils/supabase/server";
import { Employee } from "@/types/employee";

export async function getEmployees(): Promise<{
  success: boolean;
  employees: Employee[];
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
        employees: [],
        error: "Not authenticated",
      };
    }

    // Fetch employees with job post information
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        job_posts!inner(id, job_title, job_type, location, salary, status)
      `
      )
      .eq("kindbossing_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      return {
        success: false,
        employees: [],
        error: "Failed to fetch employees",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        employees: [],
      };
    }

    // Fetch KindTao data for all employees
    const kindtaoUserIds = [
      ...new Set(data.map((emp: any) => emp.kindtao_user_id).filter(Boolean)),
    ];

    const { data: kindtaosData } = await supabase
      .from("kindtaos")
      .select(
        "user_id, skills, languages, expected_salary_range, availability_schedule, highest_educational_attainment, rating, is_verified"
      )
      .in("user_id", kindtaoUserIds);

    const { data: usersData } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, profile_image_url")
      .in("id", kindtaoUserIds);

    // Create maps for quick lookup
    const kindtaoMap = new Map<string, any>();
    if (kindtaosData) {
      kindtaosData.forEach((kt: any) => {
        kindtaoMap.set(kt.user_id, kt);
      });
    }

    const userMap = new Map<string, any>();
    if (usersData) {
      usersData.forEach((u: any) => {
        userMap.set(u.id, u);
      });
    }

    // Transform data to match Employee interface
    const employees: Employee[] = data.map((emp: any) => {
      const kindtaoData = kindtaoMap.get(emp.kindtao_user_id);
      const userData = userMap.get(emp.kindtao_user_id);

      return {
        id: emp.id,
        kindbossing_user_id: emp.kindbossing_user_id,
        kindtao_user_id: emp.kindtao_user_id,
        job_post_id: emp.job_post_id,
        status: emp.status,
        created_at: emp.created_at,
        updated_at: emp.updated_at,
        kindtao: kindtaoData
          ? {
              user_id: kindtaoData.user_id,
              skills: kindtaoData.skills || [],
              languages: kindtaoData.languages || [],
              expected_salary_range: kindtaoData.expected_salary_range,
              availability_schedule: kindtaoData.availability_schedule,
              highest_educational_attainment:
                kindtaoData.highest_educational_attainment,
              rating: kindtaoData.rating,
              is_verified: kindtaoData.is_verified || false,
              user: userData
                ? {
                    id: userData.id,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    email: userData.email,
                    profile_image_url: userData.profile_image_url,
                  }
                : undefined,
            }
          : undefined,
        job_post: emp.job_posts
          ? {
              id: emp.job_posts.id,
              job_title: emp.job_posts.job_title,
              job_type: emp.job_posts.job_type,
              location: emp.job_posts.location,
              salary: emp.job_posts.salary,
              status: emp.job_posts.status,
            }
          : undefined,
      };
    });

    return {
      success: true,
      employees,
    };
  } catch (error) {
    console.error("Error in getEmployees:", error);
    return {
      success: false,
      employees: [],
      error: "An unexpected error occurred",
    };
  }
}
