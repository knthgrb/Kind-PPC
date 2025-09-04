import { createClient } from "@/utils/supabase/server";

export async function fetchPaginatedKindBossingPosts(
  userId: string,
  page: number,
  pageSize: number
) {
  const supabase = await createClient();

  const { data: family, error: familyError } = await supabase
    .from("family_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (familyError) {
    console.error("Error fetching family profile:", familyError);
    return { jobs: [], total: 0 };
  }

  if (!family) {
    return { jobs: [], total: 0 };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const {
    data: jobs,
    error: jobsError,
    count,
  } = await supabase
    .from("active_job_posts")
    .select("*", { count: "exact" })
    .eq("family_id", family.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (jobsError) {
    console.error("Error fetching paginated job posts:", jobsError);
    return { jobs: [], total: 0 };
  }

  return { jobs: jobs ?? [], total: count ?? 0 };
}
