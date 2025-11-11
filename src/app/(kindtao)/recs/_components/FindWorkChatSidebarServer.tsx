import FindWorkChatSidebar from "./FindWorkChatSidebar";
import { createClient } from "@/utils/supabase/server";
import { UserService } from "@/services/server/UserService";
import { JobService } from "@/services/server/JobService";

export default async function FindWorkChatSidebarServer({
  initialActiveTab = "matches",
}: {
  initialActiveTab?: "matches" | "messages";
}) {
  // Fetch current user server-side
  const { data: authUser } = await UserService.getCurrentUser();
  if (!authUser) {
    // Render empty sidebar if unauthenticated
    return (
      <FindWorkChatSidebar
        variant="desktop"
        prefetched
        initialActiveTab={initialActiveTab}
      />
    );
  }

  const supabase = await createClient();

  // Get matches for user
  const { data: matches } = await supabase
    .from("matches")
    .select("id, job_post_id, is_active, matched_at")
    .or(
      `kindbossing_user_id.eq.${authUser.id},kindtao_user_id.eq.${authUser.id}`
    )
    .order("matched_at", { ascending: false });

  const active = (matches || []).filter((m: any) => m?.is_active !== false);

  // Attach minimal job details for sidebar display
  const withJobs = await Promise.all(
    active.map(async (m: any) => {
      try {
        const job = await JobService.fetchById(m.job_post_id);
        return {
          ...m,
          job_title: job?.title || "Unknown Job",
          job_location: job?.location || "Unknown Location",
        };
      } catch (_) {
        return {
          ...m,
          job_title: "Unknown Job",
          job_location: "Unknown Location",
        };
      }
    })
  );

  // Pass prefetched matches to the existing client sidebar
  return (
    <FindWorkChatSidebar
      variant="desktop"
      initialMatches={withJobs}
      initialActiveTab={initialActiveTab}
      prefetched
    />
  );
}
