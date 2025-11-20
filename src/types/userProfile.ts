import { WorkExperience, VerificationRequest } from "./workExperience";

export type UserProfile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  profile_image_url: string | null;
  barangay: string | null;
  municipality: string | null;
  province: string | null;
  zip_code: number | null;
  swipe_credits: number | null;
  boost_credits: number | null;
  status: string | null;
  kindtao_profile?: {
    skills: string[] | null;
    languages: string[] | null;
    expected_salary_range: string | null;
    availability_schedule: any | null;
    highest_educational_attainment: string | null;
    rating: number | null;
    reviews: string[] | null;
    is_verified: boolean | null;
    is_boosted?: boolean | null;
    boost_expires_at?: number | null;
  } | null;
  work_experiences?: WorkExperience[];
};
