import { createClient } from "@/utils/supabase/client";
import { UserProfile } from "@/types/userProfile";

export const ProfileService = {
  /**
   * Get KindTao profile by user ID (client-side)
   */
  async getKindTaoProfileByUserId(
    userId: string
  ): Promise<UserProfile | null> {
    const supabase = createClient();

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
  },
};

