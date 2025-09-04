export type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  profile_image_url: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  helper_profiles?: {
    skills: string[];
    preferred_job_types: string[];
    experience_years: number;
    languages_spoken: string[];
    salary_expectation_min: number | null;
    salary_expectation_max: number | null;
    availability_schedule: {
      [key: string]: {
        available: boolean;
        hours?: [string, string];
      };
    } | null;
    is_available_live_in: boolean;
    preferred_work_radius: number;
    bio: string | null;
    work_experience: Array<{
      employer: string;
      duration: string;
      description: string;
      start_date?: string;
      end_date?: string;
      job_type: string;
      skills_used: string[];
    }> | null;
    educational_background: string | null;
    certifications: string[] | null;
    location_preference: string[] | null;
  } | null;
  helper_experiences?: Array<{
    id: string;
    employer_name: string;
    job_title: string;
    responsibilities: string;
    start_date: string;
    end_date: string | null;
    is_current_job: boolean;
    achievements: string | null;
  }> | null;
  user_verifications?: {
    id: string;
    verification_status: string;
    barangay_clearance_url: string | null;
    clinic_certificate_url: string | null;
    valid_id_url: string | null;
    verified_at: string | null;
  } | null;
  user_documents?: Array<{
    id: string;
    document_type: string;
    file_path: string;
    file_name: string;
    uploaded_at: string;
  }> | null;
};
