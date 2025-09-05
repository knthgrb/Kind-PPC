// Legacy types removed - using database schema types only

// New types matching database schema
export type MessageStatus = "sent" | "delivered" | "read";
export type MessageType = "text" | "image" | "file" | "audio" | "video";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  file_url: string | null;
  status: MessageStatus;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  match_id: string;
  last_message_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  kindbossing_id: string;
  kindtao_id: string;
  job_post_id: string;
  matched_at: string;
  is_active: boolean;
  last_message_at: string | null;
}

export interface JobPost {
  id: string;
  family_id: string;
  title: string;
  description: string;
  job_type: string;
  required_skills: string[];
  salary_min: number;
  salary_max: number;
  work_schedule: any;
  is_live_in: boolean;
  location: string;
  preferred_radius: number;
  preferred_age_min: number | null;
  preferred_age_max: number | null;
  preferred_gender: string | null;
  required_experience_years: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  salary_rate: string;
}

export interface User {
  id: string;
  role: "kindtao" | "kindbossing" | "admin";
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  profile_image_url: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  is_verified: boolean;
  verification_status: string;
  subscription_tier: string;
  subscription_expires_at: string | null;
  swipe_credits: number;
  boost_credits: number;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
  matches: Match & {
    job_posts: JobPost;
    kindbossing: User;
    kindtao: User;
  };
}

export interface ChatParticipant {
  id: string;
  name: string;
  image: string | null;
  role: "kindtao" | "kindbossing" | "admin";
  isOnline?: boolean;
  lastActive?: string;
}

export interface MessageWithUser extends Message {
  sender: User;
}
