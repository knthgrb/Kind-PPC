export interface WorkExperience {
  id: string;
  created_at: string;
  kindtao_user_id: string;
  employer: string | null;
  job_title: string | null;
  is_current_job: boolean | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  skills_used: string[] | null;
  notes: string | null;
  description: string | null;
  attachments?: WorkExperienceAttachment[];
}

export interface WorkExperienceAttachment {
  id: string;
  created_at: string;
  kindtao_work_experience_id: string;
  file_url: string;
  title: string;
  size: number;
  content_type: string;
}

export interface VerificationRequest {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  document_type: string;
  document_url: string;
  document_title: string;
  document_size: number;
  document_content_type: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export interface KindTaoVerificationRequest {
  id: string;
  created_at: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  updated_at: string | null;
  notes: string | null;
  documents?: KindTaoVerificationDocument[];
}

export interface KindTaoVerificationDocument {
  id: string;
  created_at: string;
  user_id: string;
  file_url: string;
  size: number;
  title: string;
  content_type: string;
  document_type: string | null;
}

export interface WorkExperienceFormData {
  employer: string;
  job_title: string;
  is_current_job: boolean;
  start_date: string;
  end_date?: string;
  location: string;
  skills_used: string[];
  notes?: string;
  description?: string;
  attachments?: File[];
}
