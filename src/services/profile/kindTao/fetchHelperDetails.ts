import { createClient } from "@/utils/supabase/server";

export async function fetchHelperDetails(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select(
      `
      helper_profiles!user_id (
        skills,
        experience_years,
        preferred_job_types
      ),
      helper_experiences (
        id, employer_name, job_title, responsibilities,
        start_date, end_date, is_current_job, achievements
      ),
      user_verifications!user_id (
        id, verification_status, barangay_clearance_url,
        clinic_certificate_url, valid_id_url, verified_at
      )
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching helper details:", error);
    return null;
  }

  return data;
}
