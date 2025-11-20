import { getMyJobs } from "@/actions/jobs/get-my-jobs";
import { getServerActionContext } from "@/utils/server-action-context";
import { redirect } from "next/navigation";
import MyJobPostsClient from "./_components/MyJobPostsClient";

export default async function MyJobPostsPage() {
  // Get user context
  const { user, error } = await getServerActionContext({
    requireUser: true,
  });

  if (error || !user) {
    redirect("/login");
  }

  // Extract user ID
  const userId =
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null;

  if (!userId) {
    redirect("/login");
  }

  // Fetch jobs server-side
  const result = await getMyJobs();

  if (!result.success) {
    // If fetch fails, still render with empty array
    return <MyJobPostsClient initialJobs={[]} userId={userId} />;
  }

  const sortedJobs = [...(result.jobs || [])].sort((a, b) =>
    (a.job_title || "").localeCompare(b.job_title || "", undefined, {
      sensitivity: "base",
    })
  );

  return <MyJobPostsClient initialJobs={sortedJobs} userId={userId} />;
}
