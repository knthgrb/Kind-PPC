export type KindTaoExperience = {
  _id?: string;
  employer?: string;
  job_title?: string;
  is_current_job?: boolean;
  start_date?: number;
  end_date?: number;
  location?: string;
  skills_used?: string[];
  description?: string;
  notes?: string;
};

export type PendingApplication = {
  _id?: string;
  id?: string;
  kindtao_user_id?: string;
  job_post_id?: string;
  applied_at?: number;
  status?: string;
  cover_message?: string;
  location?: string | null;
  user?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    location?: string;
  } | null;
  kindtao?: {
    user_id?: string;
    is_boosted?: boolean;
    boost_expires_at?: number;
    preferred_role?: string;
    current_location?: string;
    years_of_experience?: number;
    salary_expectation?: string;
    skills?: string[];
    languages?: string[];
    user?: {
      id?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
  } | null;
  experiences?: KindTaoExperience[];
};

export const getApplicantDisplayName = (
  application?: PendingApplication | null
) => {
  const user = application?.user || application?.kindtao?.user;
  if (!user) return "Unknown Applicant";

  const firstName = user.first_name;
  const lastName = user.last_name;

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return firstName || lastName || user.email || "Unknown Applicant";
};

