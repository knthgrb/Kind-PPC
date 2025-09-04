import { createClient } from "@/utils/supabase/server";
import { UserProfile } from "@/types/userProfile";

export async function getCompleteKindTaoProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Auth error:", userError);
    return null;
  }

  // Fetch complete user profile with all related data
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      first_name,
      last_name,
      phone,
      profile_image_url,
      address,
      city,
      province,
      postal_code,
      helper_profiles!user_id (
        skills,
        preferred_job_types,
        experience_years,
        languages_spoken,
        salary_expectation_min,
        salary_expectation_max,
        availability_schedule,
        is_available_live_in,
        preferred_work_radius,
        bio,
        work_experience,
        educational_background,
        certifications,
        location_preference
      ),
      helper_experiences (
        id,
        employer_name,
        job_title,
        responsibilities,
        start_date,
        end_date,
        is_current_job,
        achievements
      ),
      user_verifications!user_id (
        id,
        verification_status,
        barangay_clearance_url,
        clinic_certificate_url,
        valid_id_url,
        verified_at
      ),
             user_documents (
         id,
         document_type,
         file_path,
         file_name,
         uploaded_at
       )
    `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching complete profile:", error);
    return null;
  }

  if (!data) {
    console.error("No profile data found");
    return null;
  }

  return data as UserProfile;
}
