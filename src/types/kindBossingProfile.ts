import { JobPost } from "./jobPosts";

export interface KindBossingProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_image_url: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;

  // Relations
  job_posts?: JobPost[];
}
