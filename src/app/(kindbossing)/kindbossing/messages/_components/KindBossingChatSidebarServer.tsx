import KindBossingChatSidebar from "./KindBossingChatSidebar";
import { createClient } from "@/utils/supabase/server";
import { UserService } from "@/services/server/UserService";
import { JobService } from "@/services/server/JobService";

export default async function KindBossingChatSidebarServer({
  initialActiveTab = "matches",
  variant = "desktop",
}: {
  initialActiveTab?: "matches" | "messages";
  variant?: "mobile" | "desktop";
}) {
  // Fetch current user server-side
  const { data: authUser } = await UserService.getCurrentUser();
  if (!authUser) {
    // Render empty sidebar if unauthenticated
    return (
      <KindBossingChatSidebar
        variant={variant}
        prefetched
        initialActiveTab={initialActiveTab}
      />
    );
  }

  const supabase = await createClient();

  // Get matches for user (kindbossing user)
  const { data: matches } = await supabase
    .from("matches")
    .select("id, job_post_id, is_active, matched_at")
    .eq("kindbossing_user_id", authUser.id)
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
    <KindBossingChatSidebar
      variant={variant}
      initialMatches={withJobs}
      initialActiveTab={initialActiveTab}
      prefetched
    />
  );
}

