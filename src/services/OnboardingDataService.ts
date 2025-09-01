import { createClient } from "@/utils/supabase/server";

// Types for onboarding data
export interface PersonalInfoData {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
}

export interface SkillsAvailabilityData {
  skills: string[];
  experience_years: number;
  preferred_job_types: string[];
  languages_spoken: string[];
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  availability_schedule: {
    [key: string]: {
      available: boolean;
      hours?: [string, string];
    };
  };
  is_available_live_in: boolean;
  preferred_work_radius: number;
  bio?: string;
}

export interface WorkHistoryData {
  work_experience: Array<{
    employer: string;
    duration: string;
    description: string;
    start_date?: string;
    end_date?: string;
    job_type: string;
    skills_used: string[];
  }>;
  educational_background?: string;
  certifications?: string[];
}

export class OnboardingDataService {
  /**
   * Save personal information to users table
   */
  static async savePersonalInfo(userId: string, data: PersonalInfoData) {
    const supabase = await createClient();
    
    try {
      const { error } = await supabase
        .from("users")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          address: data.address,
          city: data.city,
          province: data.province,
          postal_code: data.postal_code,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) {
        console.error("Error saving personal info:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Unexpected error saving personal info:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Save skills and availability to helper_profiles table
   */
  static async saveSkillsAvailability(userId: string, data: SkillsAvailabilityData) {
    const supabase = await createClient();
    
    try {
      // Check if helper profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("helper_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing profile:", checkError);
        return { success: false, error: checkError.message };
      }

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("helper_profiles")
          .update({
            skills: data.skills,
            experience_years: data.experience_years,
            preferred_job_types: data.preferred_job_types,
            languages_spoken: data.languages_spoken,
            salary_expectation_min: data.salary_expectation_min,
            salary_expectation_max: data.salary_expectation_max,
            availability_schedule: data.availability_schedule,
            is_available_live_in: data.is_available_live_in,
            preferred_work_radius: data.preferred_work_radius,
            bio: data.bio,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Error updating skills availability:", error);
          return { success: false, error: error.message };
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from("helper_profiles")
          .insert({
            user_id: userId,
            skills: data.skills,
            experience_years: data.experience_years,
            preferred_job_types: data.preferred_job_types,
            languages_spoken: data.languages_spoken,
            salary_expectation_min: data.salary_expectation_min,
            salary_expectation_max: data.salary_expectation_max,
            availability_schedule: data.availability_schedule,
            is_available_live_in: data.is_available_live_in,
            preferred_work_radius: data.preferred_work_radius,
            bio: data.bio
          });

        if (error) {
          console.error("Error creating skills availability profile:", error);
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Unexpected error saving skills availability:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Save work history to helper_profiles table
   */
  static async saveWorkHistory(userId: string, data: WorkHistoryData) {
    const supabase = await createClient();
    
    try {
      const { error } = await supabase
        .from("helper_profiles")
        .update({
          work_experience: data.work_experience,
          educational_background: data.educational_background,
          certifications: data.certifications,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Error saving work history:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Unexpected error saving work history:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Save document uploads to user_verifications table
   */
  static async saveDocuments(userId: string, documents: {
    valid_id_url?: string;
    barangay_clearance_url?: string;
    clinic_certificate_url?: string;
    additional_documents?: string[];
  }) {
    const supabase = await createClient();
    
    try {
      // Check if verification record already exists
      const { data: existingVerification, error: checkError } = await supabase
        .from("user_verifications")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing verification:", checkError);
        return { success: false, error: checkError.message };
      }

      if (existingVerification) {
        // Update existing verification
        const { error } = await supabase
          .from("user_verifications")
          .update({
            valid_id_url: documents.valid_id_url,
            barangay_clearance_url: documents.barangay_clearance_url,
            clinic_certificate_url: documents.clinic_certificate_url,
            additional_documents: documents.additional_documents,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Error updating documents:", error);
          return { success: false, error: error.message };
        }
      } else {
        // Create new verification record
        const { error } = await supabase
          .from("user_verifications")
          .insert({
            user_id: userId,
            valid_id_url: documents.valid_id_url,
            barangay_clearance_url: documents.barangay_clearance_url,
            clinic_certificate_url: documents.clinic_certificate_url,
            additional_documents: documents.additional_documents
          });

        if (error) {
          console.error("Error creating verification record:", error);
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Unexpected error saving documents:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Get current onboarding data for a user
   */
  static async getCurrentOnboardingData(userId: string) {
    const supabase = await createClient();
    
    try {
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("first_name, last_name, phone, date_of_birth, gender, address, city, province, postal_code")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error getting user data:", userError);
        return { success: false, error: userError.message };
      }

      // Get helper profile data
      const { data: helperData, error: helperError } = await supabase
        .from("helper_profiles")
        .select("skills, experience_years, preferred_job_types, languages_spoken, salary_expectation_min, salary_expectation_max, availability_schedule, is_available_live_in, preferred_work_radius, bio, work_experience, educational_background, certifications")
        .eq("user_id", userId)
        .single();

      // Get verification data
      const { data: verificationData, error: verificationError } = await supabase
        .from("user_verifications")
        .select("valid_id_url, barangay_clearance_url, clinic_certificate_url, additional_documents")
        .eq("user_id", userId)
        .single();

      return {
        success: true,
        data: {
          personalInfo: userData,
          skillsAvailability: helperData || {},
          workHistory: helperData?.work_experience || [],
          documents: verificationData || {}
        }
      };
    } catch (error) {
      console.error("Unexpected error getting onboarding data:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Validate onboarding data before saving
   */
  static validatePersonalInfo(data: PersonalInfoData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.first_name?.trim()) errors.push("First name is required");
    if (!data.last_name?.trim()) errors.push("Last name is required");
    if (!data.phone?.trim()) errors.push("Phone number is required");
    if (!data.date_of_birth) errors.push("Date of birth is required");
    if (!data.gender?.trim()) errors.push("Gender is required");
    if (!data.address?.trim()) errors.push("Address is required");
    if (!data.city?.trim()) errors.push("City is required");
    if (!data.province?.trim()) errors.push("Province is required");

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateSkillsAvailability(data: SkillsAvailabilityData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.skills || data.skills.length === 0) errors.push("At least one skill is required");
    if (data.experience_years < 0) errors.push("Experience years cannot be negative");
    if (!data.preferred_job_types || data.preferred_job_types.length === 0) errors.push("At least one preferred job type is required");
    if (!data.languages_spoken || data.languages_spoken.length === 0) errors.push("At least one language is required");
    if (data.preferred_work_radius < 1) errors.push("Work radius must be at least 1 km");

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateWorkHistory(data: WorkHistoryData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.work_experience || data.work_experience.length === 0) errors.push("At least one work experience entry is required");

    if (data.work_experience) {
      data.work_experience.forEach((exp, index) => {
        if (!exp.employer?.trim()) errors.push(`Work experience ${index + 1}: Employer is required`);
        if (!exp.duration?.trim()) errors.push(`Work experience ${index + 1}: Duration is required`);
        if (!exp.description?.trim()) errors.push(`Work experience ${index + 1}: Description is required`);
        if (!exp.job_type?.trim()) errors.push(`Work experience ${index + 1}: Job type is required`);
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
