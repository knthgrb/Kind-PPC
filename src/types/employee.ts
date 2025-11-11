export interface Employee {
  id: string;
  kindbossing_user_id: string;
  kindtao_user_id: string;
  job_post_id: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  // Joined data from foreign keys
  kindtao?: {
    user_id: string;
    skills: string[];
    languages: string[];
    expected_salary_range: string | null;
    availability_schedule: any;
    highest_educational_attainment: string | null;
    rating: number | null;
    is_verified: boolean;
    user?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      profile_image_url: string | null;
    };
  };
  job_post?: {
    id: string;
    job_title: string;
    job_type: string | null;
    location: string;
    salary: string;
    status: string;
  };
}

export interface EmployeeInput {
  kindbossing_user_id: string;
  kindtao_user_id: string;
  job_post_id: string;
  status: "active" | "inactive";
}
