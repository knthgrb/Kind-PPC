import { createClient } from "@/utils/supabase/server";
import { UserProfile } from "@/types/userProfile";

export class ProfileService {
  /**
   * Fetch user profile
   */
  static async fetchUserProfile(): Promise<UserProfile | null> {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return null;
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return profile as UserProfile;
  }

  /**
   * Get complete KindTao profile with all related data
   */
  static async getCompleteKindTaoProfile(): Promise<UserProfile | null> {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ Auth error:", userError);
      return null;
    }

    try {
      const [
        userDataResult,
        kindtaoResult,
        workExperienceResult,
        verificationResult,
      ] = await Promise.all([
        supabase
          .from("users")
          .select(
            `
              id,
              email,
              first_name,
              last_name,
              phone,
              date_of_birth,
              gender,
              profile_image_url,
              barangay,
              municipality,
              province,
              zip_code,
              swipe_credits,
              boost_credits,
              status
            `
          )
          .eq("id", user.id)
          .single(),
        supabase
          .from("kindtaos")
          .select(
            `
              skills,
              languages,
              expected_salary_range,
              availability_schedule,
              highest_educational_attainment,
              rating,
              reviews,
              is_verified
            `
          )
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("kindtao_work_experiences")
          .select(
            `
              *,
              attachments:kindtao_work_experience_attachments(*)
            `
          )
          .eq("kindtao_user_id", user.id)
          .order("start_date", { ascending: false }),
        supabase
          .from("verification_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      const { data: userData, error: userDataError } = userDataResult;
      if (userDataError) {
        console.error("❌ Error fetching user data:", userDataError);
        return null;
      }

      const { data: kindtaoProfile } = kindtaoResult;
      const { data: workExperiences } = workExperienceResult;
      const { data: verificationRequests } = verificationResult;

      const completeProfile = {
        ...userData,
        kindtao_profile: kindtaoProfile || null,
        work_experiences: workExperiences || [],
        verification_requests: verificationRequests || [],
      };

      return completeProfile as unknown as UserProfile;
    } catch (error) {
      console.error("❌ Error fetching complete profile:", error);
      return null;
    }
  }

  /**
   * Get KindTao profile by user ID (for viewing applicant profiles)
   */
  static async getKindTaoProfileByUserId(
    userId: string
  ): Promise<UserProfile | null> {
    const supabase = await createClient();

    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          `
          id,
          email,
          first_name,
          last_name,
          phone,
          date_of_birth,
          gender,
          profile_image_url,
          barangay,
          municipality,
          province,
          zip_code,
          swipe_credits,
          boost_credits,
          status
        `
        )
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return null;
      }

      // Fetch KindTao profile data
      const { data: kindtaoData, error: kindtaoError } = await supabase
        .from("kindtaos")
        .select(
          `
          skills,
          languages,
          expected_salary_range,
          availability_schedule,
          highest_educational_attainment,
          rating,
          reviews,
          is_verified
        `
        )
        .eq("user_id", userId)
        .single();

      // Fetch work experiences with attachments
      const { data: workExperiences, error: workError } = await supabase
        .from("kindtao_work_experiences")
        .select("*")
        .eq("kindtao_user_id", userId)
        .order("start_date", { ascending: false });

      // Fetch attachments for each work experience
      let experiencesWithAttachments: any[] = [];
      if (workExperiences && workExperiences.length > 0) {
        const experienceIds = workExperiences.map((exp) => exp.id);

        const { data: attachments } = await supabase
          .from("kindtao_work_experience_attachments")
          .select("*")
          .in("kindtao_work_experience_id", experienceIds);

        // Attach attachments to their respective work experiences
        experiencesWithAttachments = workExperiences.map((exp) => ({
          ...exp,
          attachments:
            attachments?.filter(
              (att) => att.kindtao_work_experience_id === exp.id
            ) || [],
        }));
      }

      const profile: UserProfile = {
        ...userData,
        kindtao_profile: kindtaoData
          ? {
              skills: kindtaoData.skills,
              languages: kindtaoData.languages,
              expected_salary_range: kindtaoData.expected_salary_range,
              availability_schedule: kindtaoData.availability_schedule,
              highest_educational_attainment:
                kindtaoData.highest_educational_attainment,
              rating: kindtaoData.rating,
              reviews: kindtaoData.reviews,
              is_verified: kindtaoData.is_verified,
            }
          : null,
        work_experiences: experiencesWithAttachments,
      };

      return profile;
    } catch (error) {
      console.error("Error loading KindTao profile:", error);
      return null;
    }
  }
}
