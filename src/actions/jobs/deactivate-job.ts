"use server";

import { createClient } from "@/utils/supabase/server";

export async function deactivateJobPost(jobId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("job_posts")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    console.error("Error deactivating job:", error);
    return false;
  }

  return true;
}
